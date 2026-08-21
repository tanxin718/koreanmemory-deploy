/**
 * KoreanMemory - 设置页
 */
const SettingsPage = {
  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('app-content');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const dailyGoal = this.getDailyGoal();

    const llm = LLM.getConfig();
    const llmReady = llm.enabled && llm.key;
    const local = LLM.isLocal();

    container.innerHTML = `
      <div class="settings-section">
        <div class="settings-section__title">学习</div>
        <div class="settings-item" onclick="SettingsPage.setDailyGoal()">
          <span class="settings-item__label">每日目标</span>
          <span class="settings-item__value">${dailyGoal} 个单词 <i class="fa-solid fa-chevron-right settings-item__icon"></i></span>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section__title">AI 助手（GLM-4-Flash 免费）</div>
        <div class="settings-item" onclick="SettingsPage.editAI()" style="${llmReady ? '' : 'background: #FEF3C7;'}">
          <span class="settings-item__label">
            ${llmReady ? '🤖 已开启' : '🤖 点击配置'}
            ${local ? '<div style="font-size:11px;color:var(--color-text-tertiary);">本地模式 · 零配置代理</div>' : ''}
          </span>
          <span class="settings-item__value">
            ${llmReady ? `<span style="color:var(--color-success);">已连接</span>` : `<span style="color:var(--color-warning);">未配置</span>`}
            <i class="fa-solid fa-chevron-right settings-item__icon"></i>
          </span>
        </div>
        ${!local && !llm.workerUrl ? `
          <div style="padding: var(--space-sm) var(--space-md); font-size: var(--text-xs); color: var(--color-warning);">
            手机端需要填 Cloudflare Worker 地址，详见 <code>worker-zhipu.js</code> 顶部教程
          </div>
        ` : ''}
        ${llmReady ? `
          <div class="settings-item" onclick="SettingsPage.testAI()">
            <span class="settings-item__label">测试连接</span>
            <span class="settings-item__value"><i class="fa-solid fa-vial" style="color:var(--color-primary);"></i></span>
          </div>
        ` : ''}
        <div class="settings-item" onclick="SettingsPage.manageFixes()">
          <span class="settings-item__label">AI 已纠错的词</span>
          <span class="settings-item__value">${getFixedWordIds().length} 个 <i class="fa-solid fa-chevron-right settings-item__icon"></i></span>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section__title">外观</div>
        <div class="settings-item" onclick="SettingsPage.toggleTheme()">
          <span class="settings-item__label">深色模式</span>
          <span class="settings-item__value">
            <i class="fa-solid ${isDark ? 'fa-toggle-on' : 'fa-toggle-off'}" style="color: ${isDark ? 'var(--color-primary)' : 'var(--color-text-tertiary)'}; font-size: 20px;"></i>
          </span>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section__title">数据</div>
        <div class="settings-item" onclick="SettingsPage.exportData()">
          <span class="settings-item__label">导出数据库</span>
          <span class="settings-item__value">
            <i class="fa-solid fa-download" style="color: var(--color-primary);"></i>
          </span>
        </div>
        <div class="settings-item" onclick="document.getElementById('import-file').click()">
          <span class="settings-item__label">导入数据库 (.db)</span>
          <span class="settings-item__value">
            <i class="fa-solid fa-upload" style="color: var(--color-accent);"></i>
          </span>
        </div>
        <input type="file" id="import-file" accept=".db" style="display:none" onchange="SettingsPage.importData(event)">
        <div class="settings-item" onclick="document.getElementById('csv-file').click()">
          <span class="settings-item__label">从 CSV 导入词库</span>
          <span class="settings-item__value">
            <i class="fa-solid fa-file-csv" style="color: var(--color-success);"></i>
          </span>
        </div>
        <input type="file" id="csv-file" accept=".csv" style="display:none" onchange="SettingsPage.importCSV(event)">
        <div class="settings-item" onclick="SettingsPage.downloadCSVTemplate()">
          <span class="settings-item__label">下载 CSV 模板</span>
          <span class="settings-item__value">
            <i class="fa-solid fa-file-arrow-down" style="color: var(--color-text-secondary);"></i>
          </span>
        </div>
        <div class="settings-item" onclick="SettingsPage.resetData()">
          <span class="settings-item__label">重置所有数据</span>
          <span class="settings-item__value">
            <i class="fa-solid fa-rotate-right" style="color: var(--color-danger);"></i>
          </span>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section__title">关于</div>
        <div class="settings-item" onclick="SettingsPage.installApp()">
          <span class="settings-item__label">安装到桌面</span>
          <span class="settings-item__value">
            <i class="fa-solid fa-mobile-screen-button" style="color: var(--color-primary);"></i>
          </span>
        </div>
        <div class="settings-item">
          <span class="settings-item__label">版本</span>
          <span class="settings-item__value">v1.0.0</span>
        </div>
      </div>

      <div style="text-align: center; padding: var(--space-lg); color: var(--color-text-tertiary); font-size: var(--text-xs);">
        KoreanMemory - 韩语词源记忆系统
      </div>
    `;
  },

  getDailyGoal() {
    const result = query("SELECT daily_goal FROM users WHERE id = 1");
    return result[0]?.daily_goal || 20;
  },

  setDailyGoal() {
    const goals = [10, 20, 30, 50, 100];
    const current = this.getDailyGoal();
    const currentIdx = goals.indexOf(current);
    const nextIdx = (currentIdx + 1) % goals.length;
    const nextGoal = goals[nextIdx];

    execute("UPDATE users SET daily_goal = ? WHERE id = 1", [nextGoal]);
    showToast(`每日目标已设为 ${nextGoal} 个单词`);
    this.render();
  },

  toggleTheme() {
    App.toggleTheme();
    this.render();
    showToast(document.documentElement.getAttribute('data-theme') === 'dark' ? '已切换深色模式' : '已切换浅色模式');
  },

  async exportData() {
    await exportDatabase();
  },

  async importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.db')) {
      showToast('请选择 .db 格式的数据库文件');
      return;
    }
    if (!confirm('导入将覆盖当前所有数据，确定继续？')) {
      event.target.value = '';
      return;
    }
    await importDatabase(file);
    event.target.value = '';
  },

  async importCSV(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    try {
      const text = await file.text();
      const result = await importCSVFromText(text);
      if (result.error) {
        showToast(result.error);
        return;
      }
      let msg = `导入完成：成功 ${result.success} 词`;
      if (result.skipped > 0) msg += `，跳过 ${result.skipped} 词`;
      showToast(msg);
      // 刷新当前页面
      setTimeout(() => this.render(), 1500);
    } catch (e) {
      showToast('CSV 导入失败：' + e.message);
    }
  },

  downloadCSVTemplate() {
    const csv = `word,pronunciation,romanization,pos,topik_level,frequency,meaning,example_ko,example_zh,topic,is_hanja_word,is_native_word,is_loanword,conjugation_form,conjugation_label,hanja_char,hanja_reading,hanja_meaning
안녕하세요,안녕하세요,annyeonghaseyo,感叹词,1,100,你好,,,日常用语,0,1,0,,,
사랑하다,사랑하다,saranghada,动词,2,50,爱|爱情,나는 너를 사랑해.|사랑은 영원해요.,我爱你。|爱情是永恒的。,情感,1,0,0,사랑해|사랑합니다,非格式体尊称|格式体尊称,愛,ae,爱情
학교,학교,hakgyo,名词,1,80,学校,학교에 갑니다.,我去学校。,教育,1,0,0,,,學,hak,学习
컴퓨터,컴퓨터,keompyuteo,名词,3,30,电脑,컴퓨터를 켜주세요.,请打开电脑。,科技,0,0,1,,,
먹다,먹다,meokda,动词,1,20,吃,밥을 먹어요.,吃饭。,饮食,0,1,0,먹어요|먹었다,非格式体尊敬|过去时,,,
`;
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'korean_word_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('CSV 模板已下载');
  },

  async resetData() {
    if (!confirm('确定要重置所有学习数据吗？词库不会丢失，但学习记录、收藏、笔记、积分将被清空。')) return;
    if (!confirm('再次确认：此操作不可撤销！')) return;

    // 清空数据库记录
    execute("DELETE FROM reviews WHERE user_id = 1");
    execute("DELETE FROM favorites WHERE user_id = 1");
    execute("DELETE FROM notes WHERE user_id = 1");
    execute("DELETE FROM study_history WHERE user_id = 1");

    // 清空积分相关 localStorage
    localStorage.removeItem('km_points');
    localStorage.removeItem('km_sign');
    localStorage.removeItem('km_points_log');
    localStorage.removeItem('km_shop_items');
    localStorage.removeItem('km_inventory');
    localStorage.removeItem('km_points_rules');
    localStorage.removeItem('km_custom_quotes');
    localStorage.removeItem(WORD_FIX_KEY);
    localStorage.removeItem(LLM.storeKey);

    showToast('所有数据已重置');
    this.render();
  },

  async installApp() {
    if (canInstallPWA()) {
      await installPWA();
    } else {
      showToast('请通过浏览器菜单安装到桌面');
    }
  },

  // ===== AI 配置 =====
  editAI() {
    const cfg = LLM.getConfig();
    const local = LLM.isLocal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:var(--space-md);';
    const cardStyle = 'background:var(--color-white);border-radius:var(--radius-lg);width:420px;max-width:100%;max-height:90vh;overflow-y:auto;padding:20px;box-shadow:var(--shadow-lg);';
    overlay.innerHTML = `
      <div style="${cardStyle}">
        <h3 style="margin:0 0 12px;font-size:18px;">🤖 AI 助手配置</h3>
        <p style="font-size:13px;color:var(--color-text-secondary);margin:0 0 14px;line-height:1.7;">
          用智谱 GLM-4-Flash（<b>永久免费</b>）。先到 <a href="https://open.bigmodel.cn" target="_blank">open.bigmodel.cn</a>
          注册 → 控制台 → API Keys 创建密钥，粘贴到下面。
        </p>

        <div style="margin-bottom:12px;">
          <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">API Key</label>
          <input type="password" id="ai-key" value="${cfg.key}" placeholder="xxxxx.yyyyy.zzzzz"
            style="width:100%;padding:10px 12px;border:2px solid var(--color-border);border-radius:12px;font-size:14px;box-sizing:border-box;">
        </div>

        ${!local ? `
        <div style="margin-bottom:12px;">
          <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Cloudflare Worker 地址（手机端）</label>
          <input type="url" id="ai-worker" value="${cfg.workerUrl}" placeholder="https://xxx.用户名.workers.dev"
            style="width:100%;padding:10px 12px;border:2px solid var(--color-border);border-radius:12px;font-size:13px;box-sizing:border-box;">
          <div style="font-size:12px;color:var(--color-text-tertiary);margin-top:4px;">
            手机/GitHub Pages 用；填了 worker-zhipu.js 部署后的地址。电脑本地可不填。
          </div>
        </div>
        ` : ''}

        <label style="display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:12px;cursor:pointer;">
          <input type="checkbox" id="ai-enabled" ${cfg.enabled ? 'checked' : ''} style="width:18px;height:18px;">
          启用 AI 功能
        </label>

        <button class="btn-primary" onclick="SettingsPage.saveAI()" style="width:100%;padding:12px;">保存</button>
        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()" style="width:100%;margin-top:8px;padding:12px;">取消</button>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  saveAI() {
    const cfg = {
      key: (document.getElementById('ai-key')?.value || '').trim(),
      workerUrl: (document.getElementById('ai-worker')?.value || '').trim(),
      enabled: document.getElementById('ai-enabled')?.checked || false,
      model: LLM.getConfig().model || LLM.defaultModel
    };
    LLM.saveConfig(cfg);
    document.querySelector('.modal-overlay')?.remove();
    showToast(cfg.enabled && cfg.key ? 'AI 已保存并启用 🎉' : 'AI 配置已保存');
    this.render();
  },

  // ===== 管理 AI 纠错 =====
  manageFixes() {
    const ids = getFixedWordIds();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:var(--space-md);';
    let listHtml = '';
    if (ids.length === 0) {
      listHtml = '<div style="text-align:center;color:var(--color-text-tertiary);padding:20px;">还没有 AI 纠错记录<br>去词库详情页点"AI 校对"试试</div>';
    } else {
      listHtml = ids.map(id => {
        const fix = getWordFix(id);
        const w = query('SELECT word FROM words WHERE id = ?', [parseInt(id)])[0];
        return `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 0;border-bottom:1px solid var(--color-border);">
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;font-size:14px;">${w ? w.word : '#' + id}</div>
              ${fix.meaning ? `<div style="font-size:12px;color:var(--color-text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${fix.meaning}</div>` : ''}
            </div>
            <button onclick="SettingsPage.revertFix(${id})" style="flex-shrink:0;border:none;background:var(--color-bg-secondary);color:var(--color-danger);border-radius:8px;padding:6px 10px;font-size:12px;">撤销</button>
          </div>
        `;
      }).join('');
    }
    overlay.innerHTML = `
      <div style="background:var(--color-white);border-radius:var(--radius-lg);width:420px;max-width:100%;max-height:85vh;overflow-y:auto;padding:20px;box-shadow:var(--shadow-lg);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <h3 style="margin:0;font-size:17px;">🔎 AI 已纠错的词 (${ids.length})</h3>
          <button onclick="this.closest('.modal-overlay').remove()" style="border:none;background:none;font-size:18px;cursor:pointer;">✕</button>
        </div>
        <p style="font-size:12px;color:var(--color-text-tertiary);margin:0 0 8px;">这些修正保存在本机，会覆盖默认释义。点撤销可恢复。</p>
        ${listHtml}
      </div>
    `;
    document.body.appendChild(overlay);
  },

  revertFix(id) {
    removeWordFix(id);
    showToast('已撤销该词的修正');
    document.querySelector('.modal-overlay')?.remove();
    this.render();
  },

  async testAI() {
    showLoading(true);
    try {
      const reply = await LLM.chat('你是测试助手', '请只回复两个字：正常');
      showLoading(false);
      showToast('AI 连接成功 ✓ ' + reply, 'success');
    } catch (e) {
      showLoading(false);
      showToast('AI 连接失败：' + e.message, 'error');
    }
  }
};