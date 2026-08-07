/**
 * KoreanMemory - 统计页
 */
const StatsPage = {
  init() {
    this.render();
    this.loadStats();
  },

  render() {
    const container = document.getElementById('app-content');
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header__title">学习统计</div>
      </div>
      <div id="stats-content">
        <div class="loading" style="text-align:center;padding:40px;">加载中...</div>
      </div>
    `;
  },

  loadStats() {
    const stats = getStudyStats();
    const weeklyData = this.getWeeklyStats();
    const levelBreakdown = this.getLevelBreakdown();

    const container = document.getElementById('stats-content');
    container.innerHTML = `
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-card__icon">📚</div>
          <div class="stat-card__value">${stats.learnedWords}</div>
          <div class="stat-card__label">已学单词</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon">🔁</div>
          <div class="stat-card__value">${stats.pendingReviews}</div>
          <div class="stat-card__label">待复习</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon">🔥</div>
          <div class="stat-card__value">${stats.streak}</div>
          <div class="stat-card__label">连续天数</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon">📊</div>
          <div class="stat-card__value">${stats.totalWords}</div>
          <div class="stat-card__label">词库总量</div>
        </div>
      </div>

      <!-- 7天学习趋势 -->
      <div class="stats-chart">
        <div class="stats-chart__title">最近 7 天学习量</div>
        <div class="bar-chart">
          ${weeklyData.map(d => `
            <div class="bar-chart__item">
              <div class="bar-chart__value">${d.count}</div>
              <div class="bar-chart__bar" style="height: ${d.count > 0 ? Math.max(4, d.count / Math.max(...weeklyData.map(x => x.count), 1) * 100) : 4}px;"></div>
              <div class="bar-chart__label">${d.label}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 级别分布 -->
      <div class="stats-chart">
        <div class="stats-chart__title">TOPIK 级别分布</div>
        ${levelBreakdown.map(l => `
          <div style="display: flex; align-items: center; margin-bottom: var(--space-sm); gap: var(--space-sm);">
            <span style="width: 60px; font-size: var(--text-sm); font-weight: 600; color: var(--color-text-secondary);">TOPIK ${l.level}</span>
            <div class="progress-bar" style="flex: 1;">
              <div class="progress-bar__fill" style="width: ${l.percent}%; background: ${l.color};"></div>
            </div>
            <span style="width: 36px; font-size: var(--text-sm); color: var(--color-text-secondary); text-align: right;">${l.count}</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  getWeeklyStats() {
    const days = [];
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const result = query(
        "SELECT COUNT(DISTINCT word_id) as cnt FROM study_history WHERE user_id = 1 AND date(timestamp) = ?",
        [dateStr]
      );

      days.push({
        label: dayNames[d.getDay()],
        count: result[0]?.cnt || 0
      });
    }

    return days;
  },

  getLevelBreakdown() {
    const colors = ['#7C65EF', '#9B87F2', '#6EE7B7', '#FBBF24', '#F59E8B', '#FCA5A5'];
    const total = query("SELECT COUNT(*) as cnt FROM words")[0]?.cnt || 1;

    return [1, 2, 3, 4, 5, 6].map((level, i) => {
      const count = query("SELECT COUNT(*) as cnt FROM words WHERE topik_level = ?", [level])[0]?.cnt || 0;
      return {
        level,
        count,
        percent: Math.round(count / total * 100),
        color: colors[i]
      };
    });
  }
};