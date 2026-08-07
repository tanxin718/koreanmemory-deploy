/**
 * KoreanMemory - 数据库层
 * sql.js + IndexedDB：SQLite 在浏览器中运行，数据持久化在 IndexedDB
 */
const DB_NAME = 'korean-memory-db';
const DB_STORE = 'sqlite';
const DB_VERSION = 5;  // 版本号变更时强制重新加载预置词库 (v5: 3582词扩充)

let db = null;  // sql.js Database 实例
let SQL = null; // initSqlJs 返回的 SQL 模块

// ========== IndexedDB 操作 ==========

function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      // 版本升级时，清除旧数据重新创建（确保加载新词库）
      if (e.oldVersion < DB_VERSION) {
        if (db.objectStoreNames.contains(DB_STORE)) {
          db.deleteObjectStore(DB_STORE);
        }
        db.createObjectStore(DB_STORE);
      } else if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function loadFromIDB() {
  try {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(DB_STORE, 'readonly');
      const store = tx.objectStore(DB_STORE);
      const request = store.get('korean');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('无法访问 IndexedDB:', e);
    return null;
  }
}

async function saveToIDB(data) {
  try {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(DB_STORE, 'readwrite');
      const store = tx.objectStore(DB_STORE);
      store.put(data, 'korean');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('无法保存到 IndexedDB:', e);
  }
}

// 版本号存取（用于检测词库更新）
async function loadFromIDBVersion() {
  try {
    const idb = await openIDB();
    return new Promise((resolve) => {
      const tx = idb.transaction(DB_STORE, 'readonly');
      const store = tx.objectStore(DB_STORE);
      const request = store.get('version');
      request.onsuccess = () => resolve(request.result || 0);
      request.onerror = () => resolve(0);
    });
  } catch (e) {
    return 0;
  }
}

async function saveToIDBVersion(version) {
  try {
    const idb = await openIDB();
    return new Promise((resolve) => {
      const tx = idb.transaction(DB_STORE, 'readwrite');
      const store = tx.objectStore(DB_STORE);
      store.put(version, 'version');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.warn('无法保存版本号:', e);
  }
}

// ========== 数据库初始化 ==========

async function initDatabase() {
  // 加载 sql.js（本地文件，不依赖 CDN）
  try {
    console.log('[DB] 1/3 加载 sql.js...');
    SQL = await initSqlJs({
      locateFile: file => `./${file}`
    });
    console.log('[DB] 1/3 sql.js 加载成功');
  } catch (e) {
    showLoading(false);
    throw new Error('sql.js 加载失败：' + e.message);
  }

  // 检查版本号，决定是否需要重新加载预置词库
  console.log('[DB] 2/3 检查 IndexedDB...');
  const savedVersion = await loadFromIDBVersion();
  const saved = await loadFromIDB();

  if (saved && savedVersion === DB_VERSION) {
    try {
      db = new SQL.Database(saved);
      console.log('[DB] 2/3 从 IndexedDB 恢复成功 (v' + savedVersion + ')');
      return db;
    } catch (e) {
      console.warn('IndexedDB 数据损坏，重新加载');
    }
  } else if (saved) {
    console.log('[DB] 版本变更: ' + savedVersion + ' → ' + DB_VERSION + '，重新加载词库');
  }

  // 首次使用或版本更新：从预置 korean.db 加载
  try {
    console.log('[DB] 3/3 加载 korean.db...');
    const response = await fetch('./data/korean.db');
    if (!response.ok) throw new Error('词库文件不存在 (HTTP ' + response.status + ')');
    const buffer = new Uint8Array(await response.arrayBuffer());
    db = new SQL.Database(buffer);
    await persistDatabase();
    await saveToIDBVersion(DB_VERSION);
    console.log('[DB] 3/3 korean.db 加载成功 (v' + DB_VERSION + ')');
    return db;
  } catch (e) {
    showLoading(false);
    throw new Error('词库加载失败：' + e.message);
  }
}

// ========== 持久化 ==========

let saveTimer = null;

async function persistDatabase() {
  if (!db) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      const data = db.export();
      await saveToIDB(data);
    } catch (e) {
      console.warn('数据库持久化失败:', e);
    }
  }, 200);
}

// 立即持久化（用于导出/关闭等场景）
async function persistNow() {
  if (!db) return;
  try {
    const data = db.export();
    await saveToIDB(data);
  } catch (e) {
    console.warn('数据库持久化失败:', e);
  }
}

// ========== 数据查询 API ==========

function query(sql, params = []) {
  if (!db) return [];
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (e) {
    console.error('SQL 查询失败:', e);
    return [];
  }
}

function execute(sql, params = []) {
  if (!db) return;
  try {
    db.run(sql, params);
    persistDatabase();
  } catch (e) {
    console.error('SQL 执行失败:', e);
  }
}

function getWords({ topik_level, topic_id, page = 1, per_page = 20 } = {}) {
  let sql = 'SELECT * FROM words WHERE 1=1';
  const params = [];
  
  if (topik_level) {
    sql += ' AND topik_level = ?';
    params.push(topik_level);
  }
  if (topic_id) {
    sql += ' AND id IN (SELECT word_id FROM word_topics WHERE topic_id = ?)';
    params.push(topic_id);
  }
  
  // 获取总数
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const total = query(countSql, params)[0]?.total || 0;
  
  sql += ' ORDER BY frequency LIMIT ? OFFSET ?';
  params.push(per_page, (page - 1) * per_page);
  
  return { words: query(sql, params), total, page, per_page };
}

function getWordDetail(id) {
  const word = query('SELECT * FROM words WHERE id = ?', [id])[0];
  if (!word) return null;
  
  const meanings = query('SELECT * FROM meanings WHERE word_id = ? ORDER BY order_index', [id]);
  const examples = query('SELECT * FROM examples WHERE word_id = ? ORDER BY order_index', [id]);
  const conjugations = query('SELECT * FROM conjugations WHERE word_id = ?', [id]);
  const hanja = query('SELECT * FROM hanja WHERE word_id = ? ORDER BY position', [id]);
  const relations = query('SELECT * FROM relations WHERE word_id = ?', [id]);
  const review = query('SELECT * FROM reviews WHERE word_id = ? AND user_id = 1', [id])[0];
  const isFavorite = query('SELECT * FROM favorites WHERE word_id = ? AND user_id = 1', [id]).length > 0;
  const note = query('SELECT * FROM notes WHERE word_id = ? AND user_id = 1', [id])[0];
  
  return { word, meanings, examples, conjugations, hanja, relations, review, isFavorite, note };
}

function searchWords(queryStr) {
  if (!queryStr || queryStr.trim().length === 0) return [];
  const param = `%${queryStr.trim()}%`;
  return query(`
    SELECT DISTINCT w.* FROM words w
    LEFT JOIN meanings m ON w.id = m.word_id
    WHERE w.word LIKE ? OR m.meaning LIKE ? OR w.romanization LIKE ?
    ORDER BY w.frequency LIMIT 50
  `, [param, param, param]);
}

function getStudyStats() {
  const today = new Date().toISOString().split('T')[0];
  
  const studied = query(
    "SELECT COUNT(DISTINCT word_id) as cnt FROM study_history WHERE date(timestamp) = ? AND user_id = 1",
    [today]
  )[0]?.cnt || 0;
  
  const pendingReviews = query(
    "SELECT COUNT(*) as cnt FROM reviews WHERE user_id = 1 AND next_review <= ?",
    [today]
  )[0]?.cnt || 0;
  
  const totalWords = query("SELECT COUNT(*) as cnt FROM words")[0]?.cnt || 0;
  const learnedWords = query(
    "SELECT COUNT(*) as cnt FROM reviews WHERE user_id = 1 AND repetitions > 0"
  )[0]?.cnt || 0;
  
  // 连续天数
  const streak = calculateStreak();
  
  return { studied, pendingReviews, totalWords, learnedWords, streak };
}

function calculateStreak() {
  const history = query(
    "SELECT DISTINCT date(timestamp) as day FROM study_history WHERE user_id = 1 ORDER BY day DESC LIMIT 365"
  );
  
  if (history.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < history.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    const expectedStr = expectedDate.toISOString().split('T')[0];
    
    if (history[i].day === expectedStr) {
      streak++;
    } else if (i === 0) {
      // 今天还没学习，检查昨天
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (history[i].day === yesterday.toISOString().split('T')[0]) {
        streak++;
        continue;
      }
      break;
    } else {
      break;
    }
  }
  
  return streak;
}

// ========== 复习操作 ==========

function getPendingReviews() {
  const today = new Date().toISOString().split('T')[0];
  return query(`
    SELECT w.*, r.ease_factor, r.interval, r.repetitions, r.next_review
    FROM words w
    INNER JOIN reviews r ON w.id = r.word_id AND r.user_id = 1
    WHERE r.next_review <= ?
    ORDER BY r.next_review
    LIMIT 50
  `, [today]);
}

function updateReview(wordId, quality) {
  // 获取现有记录
  const records = query(
    'SELECT ease_factor, interval, repetitions FROM reviews WHERE word_id = ? AND user_id = 1',
    [wordId]
  );
  
  let record = { ease_factor: 2.5, interval: 1, repetitions: 0 };
  if (records.length > 0) {
    record = records[0];
  }
  
  const sm2Result = sm2Calc(record, quality);
  
  execute(`
    INSERT INTO reviews (user_id, word_id, ease_factor, interval, repetitions, next_review, last_review, quality)
    VALUES (1, ?, ?, ?, ?, ?, date('now'), ?)
    ON CONFLICT(user_id, word_id) DO UPDATE SET
      ease_factor = excluded.ease_factor,
      interval = excluded.interval,
      repetitions = excluded.repetitions,
      next_review = excluded.next_review,
      last_review = excluded.last_review,
      quality = excluded.quality
  `, [wordId, sm2Result.ease_factor, sm2Result.interval, sm2Result.repetitions, sm2Result.next_review, quality]);
  
  // 记录学习历史
  execute(
    "INSERT INTO study_history (user_id, word_id, action, result) VALUES (1, ?, 'review', ?)",
    [wordId, quality]
  );
}

// ========== 收藏/笔记 ==========

function toggleFavorite(wordId) {
  const isFav = query('SELECT id FROM favorites WHERE word_id = ? AND user_id = 1', [wordId]).length > 0;
  if (isFav) {
    execute('DELETE FROM favorites WHERE word_id = ? AND user_id = 1', [wordId]);
  } else {
    execute("INSERT INTO favorites (user_id, word_id, created_at) VALUES (1, ?, datetime('now'))", [wordId]);
  }
  return !isFav;
}

function getFavorites() {
  return query(`
    SELECT w.*, f.created_at as fav_time FROM words w
    INNER JOIN favorites f ON w.id = f.word_id AND f.user_id = 1
    ORDER BY f.created_at DESC
  `);
}

function saveNote(wordId, content) {
  execute(`
    INSERT INTO notes (user_id, word_id, content, updated_at)
    VALUES (1, ?, ?, datetime('now'))
    ON CONFLICT(user_id, word_id) DO UPDATE SET
      content = excluded.content,
      updated_at = excluded.updated_at
  `, [wordId, content]);
}

// ========== 导入导出 ==========

async function exportDatabase() {
  await persistNow();
  const data = await loadFromIDB();
  if (!data) {
    showToast('导出失败，没有可用的数据');
    return;
  }
  
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `korean_backup_${new Date().toISOString().split('T')[0]}.db`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('数据导出成功');
}

async function importDatabase(file) {
  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    db = new SQL.Database(buffer);
    await persistDatabase();
    showToast('数据导入成功，请刷新页面');
    setTimeout(() => location.reload(), 1000);
  } catch (e) {
    showToast('导入失败：文件格式不正确');
  }
}

// ========== CSV 导入 ==========

// 解析 CSV 一行（支持引号包裹、逗号转义）
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(s => s.trim());
}

// 从 CSV 文本导入词库（合并模式：保留原有学习数据）
async function importCSVFromText(csvText) {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) {
    return { success: 0, error: 'CSV 文件为空或只有表头' };
  }

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const required = ['word', 'meaning'];
  for (const field of required) {
    if (!headers.includes(field)) {
      return { success: 0, error: `缺少必填字段: ${field}` };
    }
  }

  // 获取/创建 topic id 映射
  const topicMap = {};
  query('SELECT id, name_zh FROM topics').forEach(t => { topicMap[t.name_zh] = t.id; });

  // 获取现有词表，避免重复
  const existingWords = {};
  query('SELECT id, word FROM words').forEach(w => { existingWords[w.word] = w.id; });

  let success = 0;
  let skipped = 0;
  const errors = [];
  const stmts = [];

  db.run('BEGIN TRANSACTION');
  try {
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => { row[h] = cols[idx] || ''; });

      const word = (row.word || '').trim();
      const meaning = (row.meaning || '').trim();
      if (!word || !meaning) {
        skipped++;
        continue;
      }

      // 处理 topic
      let topicIds = [];
      if (row.topic) {
        const topics = row.topic.split('|').map(t => t.trim()).filter(Boolean);
        for (const tName of topics) {
          if (!topicMap[tName]) {
            // 创建新 topic
            db.run("INSERT INTO topics (name_zh, sort_order) VALUES (?, ?)", [tName, 999]);
            const newId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
            topicMap[tName] = newId;
          }
          topicIds.push(topicMap[tName]);
        }
      }

      // 插入或更新 word
      let wordId;
      if (existingWords[word]) {
        wordId = existingWords[word];
        // 更新现有词
        db.run(`UPDATE words SET
          pronunciation = ?,
          romanization = ?,
          pos = ?,
          topik_level = ?,
          frequency = ?,
          is_hanja_word = ?,
          is_native_word = ?,
          is_loanword = ?,
          updated_at = datetime('now')
          WHERE id = ?`, [
          row.pronunciation || null,
          row.romanization || null,
          row.pos || null,
          row.topik_level ? parseInt(row.topik_level) : null,
          row.frequency ? parseInt(row.frequency) : 9999,
          row.is_hanja_word ? parseInt(row.is_hanja_word) : 0,
          row.is_native_word ? parseInt(row.is_native_word) : 0,
          row.is_loanword ? parseInt(row.is_loanword) : 0,
          wordId
        ]);
      } else {
        db.run(`INSERT INTO words (word, pronunciation, romanization, pos, topik_level, frequency, is_hanja_word, is_native_word, is_loanword)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          word,
          row.pronunciation || null,
          row.romanization || null,
          row.pos || null,
          row.topik_level ? parseInt(row.topik_level) : null,
          row.frequency ? parseInt(row.frequency) : 9999,
          row.is_hanja_word ? parseInt(row.is_hanja_word) : 0,
          row.is_native_word ? parseInt(row.is_native_word) : 0,
          row.is_loanword ? parseInt(row.is_loanword) : 0
        ]);
        wordId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
        existingWords[word] = wordId;
      }

      // meanings（多个用 | 分隔）
      const meanings = meaning.split('|').map(m => m.trim()).filter(Boolean);
      db.run('DELETE FROM meanings WHERE word_id = ?', [wordId]);
      meanings.forEach((m, idx) => {
        db.run("INSERT INTO meanings (word_id, language, meaning, order_index) VALUES (?, 'zh', ?, ?)", [wordId, m, idx + 1]);
      });

      // examples
      if (row.example_ko) {
        const koArr = row.example_ko.split('|').map(s => s.trim()).filter(Boolean);
        const zhArr = (row.example_zh || '').split('|').map(s => s.trim()).filter(Boolean);
        db.run('DELETE FROM examples WHERE word_id = ?', [wordId]);
        koArr.forEach((ko, idx) => {
          db.run("INSERT INTO examples (word_id, korean, translation, order_index) VALUES (?, ?, ?, ?)", [wordId, ko, zhArr[idx] || '', idx + 1]);
        });
      }

      // conjugations
      if (row.conjugation_form) {
        const forms = row.conjugation_form.split('|').map(s => s.trim()).filter(Boolean);
        const labels = (row.conjugation_label || '').split('|').map(s => s.trim()).filter(Boolean);
        db.run('DELETE FROM conjugations WHERE word_id = ?', [wordId]);
        forms.forEach((f, idx) => {
          db.run("INSERT INTO conjugations (word_id, form, label) VALUES (?, ?, ?)", [wordId, f, labels[idx] || null]);
        });
      }

      // hanja
      if (row.hanja_char) {
        const chars = row.hanja_char.split('|').map(s => s.trim()).filter(Boolean);
        const reads = (row.hanja_reading || '').split('|').map(s => s.trim()).filter(Boolean);
        const means = (row.hanja_meaning || '').split('|').map(s => s.trim()).filter(Boolean);
        db.run('DELETE FROM hanja WHERE word_id = ?', [wordId]);
        chars.forEach((c, idx) => {
          db.run("INSERT INTO hanja (word_id, hanja_char, hanja_reading, hanja_meaning, position) VALUES (?, ?, ?, ?, ?)", [wordId, c, reads[idx] || null, means[idx] || null, idx]);
        });
      }

      // word_topics
      if (topicIds.length > 0) {
        db.run('DELETE FROM word_topics WHERE word_id = ?', [wordId]);
        topicIds.forEach(tid => {
          db.run("INSERT OR IGNORE INTO word_topics (word_id, topic_id) VALUES (?, ?)", [wordId, tid]);
        });
      }

      success++;
    }
    db.run('COMMIT');
    await persistDatabase();
  } catch (e) {
    db.run('ROLLBACK');
    return { success: 0, error: '导入失败：' + e.message };
  }

  return { success, skipped, errors };
}

// ========== 加载状态 ==========

function showLoading(show) {
  const el = document.getElementById('loading');
  if (show) {
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

function showToast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.remove('hidden');
  el.classList.add('show');
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.classList.add('hidden'), 300);
  }, 2000);
}