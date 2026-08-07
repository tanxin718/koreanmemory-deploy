-- KoreanMemory Database Schema v2.0
-- SQLite → 通过 sql.js 在浏览器中运行 → 持久化到 IndexedDB

-- ========== 核心词库 ==========

CREATE TABLE words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL UNIQUE,
    romanization TEXT,
    pronunciation TEXT,
    pos TEXT,
    pos_kr TEXT,
    lemma TEXT,
    topik_level INTEGER,
    frequency INTEGER DEFAULT 9999,
    is_hanja_word INTEGER DEFAULT 0,
    is_native_word INTEGER DEFAULT 0,
    is_loanword INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_topik ON words(topik_level);
CREATE INDEX idx_frequency ON words(frequency);
CREATE INDEX idx_lemma ON words(lemma);

CREATE TABLE meanings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL,
    language TEXT DEFAULT 'zh',
    meaning TEXT NOT NULL,
    order_index INTEGER DEFAULT 1,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE INDEX idx_meanings_word ON meanings(word_id);

CREATE TABLE examples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL,
    korean TEXT NOT NULL,
    translation TEXT NOT NULL,
    source TEXT,
    order_index INTEGER DEFAULT 1,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE TABLE conjugations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL,
    form TEXT NOT NULL,
    label TEXT,
    form_type TEXT,
    honorification TEXT,
    tense TEXT,
    romanization TEXT,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE INDEX idx_conj_word ON conjugations(word_id);

CREATE TABLE relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL,
    related_word_id INTEGER,
    related_word TEXT NOT NULL,
    relation_type TEXT,
    note TEXT,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE INDEX idx_rel_word ON relations(word_id);

CREATE TABLE hanja (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL,
    hanja_char TEXT NOT NULL,
    hanja_reading TEXT,
    hanja_meaning TEXT,
    position INTEGER DEFAULT 0,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE TABLE hanja_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hanja_char TEXT NOT NULL,
    word TEXT NOT NULL,
    meaning TEXT
);

CREATE INDEX idx_hanja_char ON hanja_words(hanja_char);

-- ========== 场景分类 ==========

CREATE TABLE topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_zh TEXT NOT NULL,
    name_ko TEXT,
    icon TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE word_topics (
    word_id INTEGER NOT NULL,
    topic_id INTEGER NOT NULL,
    PRIMARY KEY (word_id, topic_id),
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- ========== 用户与复习 ==========

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    daily_goal INTEGER DEFAULT 20,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    word_id INTEGER NOT NULL,
    ease_factor REAL DEFAULT 2.5,
    interval INTEGER DEFAULT 1,
    repetitions INTEGER DEFAULT 0,
    next_review TEXT DEFAULT (date('now')),
    last_review TEXT,
    quality INTEGER,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_review_user ON reviews(user_id);
CREATE INDEX idx_review_next ON reviews(next_review);
CREATE UNIQUE INDEX idx_review_user_word ON reviews(user_id, word_id);

CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    word_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
    UNIQUE(user_id, word_id)
);

CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    word_id INTEGER NOT NULL,
    content TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
    UNIQUE(user_id, word_id)
);

CREATE TABLE study_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER DEFAULT 1,
    word_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    result INTEGER,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE INDEX idx_history_user ON study_history(user_id);
CREATE INDEX idx_history_ts ON study_history(timestamp);

-- ========== AI 生成数据 ==========

CREATE TABLE ai_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL UNIQUE,
    memory_tip TEXT,
    cultural_note TEXT,
    usage_tip TEXT,
    collocations TEXT,
    confusable TEXT,
    generated_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

-- ========== 音频 ==========

CREATE TABLE audio_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

-- ========== 默认用户 ==========
INSERT INTO users (id, username, display_name, daily_goal) VALUES (1, 'default', '学习者', 20);