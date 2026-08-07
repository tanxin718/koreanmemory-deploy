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

    container.innerHTML = `
      <div class="settings-section">
        <div class="settings-section__title">学习</div>
        <div class="settings-item" onclick="SettingsPage.setDailyGoal()">
          <span class="settings-item__label">每日目标</span>
          <span class="settings-item__value">${dailyGoal} 个单词 <i class="fa-solid fa-chevron-right settings-item__icon"></i></span>
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

    showToast('所有数据已重置');
    this.render();
  },

  async installApp() {
    if (canInstallPWA()) {
      await installPWA();
    } else {
      showToast('请通过浏览器菜单安装到桌面');
    }
  }
};