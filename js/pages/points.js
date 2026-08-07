/**
 * KoreanMemory - 积分中心
 * 签到 + 商城 + 积分记录
 */
const PointsPage = {
  state: {
    tab: 'signin'  // 'signin' | 'shop' | 'bag' | 'log'
  },

  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('app-content');
    const points = getPoints();
    const signData = getSignData();

    container.innerHTML = `
      <div class="points-header">
        <img src="icons/mascot-character.jpg" alt="" class="points-header__avatar">
        <div class="points-header__amount">
          <i class="fa-solid fa-coins"></i>
          <span>${points}</span>
        </div>
        <div class="points-header__label">我的积分</div>
      </div>

      <div class="tab-bar tab-bar--4">
        <button class="tab-bar__item ${this.state.tab === 'signin' ? 'active' : ''}" onclick="PointsPage.switchTab('signin', this)">
          <i class="fa-solid fa-calendar-check"></i> 签到
        </button>
        <button class="tab-bar__item ${this.state.tab === 'shop' ? 'active' : ''}" onclick="PointsPage.switchTab('shop', this)">
          <i class="fa-solid fa-bag-shopping"></i> 商城
        </button>
        <button class="tab-bar__item ${this.state.tab === 'bag' ? 'active' : ''}" onclick="PointsPage.switchTab('bag', this)">
          <i class="fa-solid fa-treasure-chest"></i> 背包
        </button>
        <button class="tab-bar__item ${this.state.tab === 'log' ? 'active' : ''}" onclick="PointsPage.switchTab('log', this)">
          <i class="fa-solid fa-clock-rotate-left"></i> 记录
        </button>
      </div>

      <div id="points-tab-content"></div>
      <div style="height: var(--space-xl);"></div>
    `;

    this.renderTab();
  },

  switchTab(tab, btnEl) {
    this.state.tab = tab;
    document.querySelectorAll('.tab-bar__item').forEach(btn => btn.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    this.renderTab();
  },

  renderTab() {
    const container = document.getElementById('points-tab-content');
    if (this.state.tab === 'signin') {
      container.innerHTML = this.renderSignin();
    } else if (this.state.tab === 'shop') {
      container.innerHTML = this.renderShop();
    } else if (this.state.tab === 'bag') {
      container.innerHTML = this.renderBag();
    } else {
      container.innerHTML = this.renderLog();
    }
  },

  // ===== 签到 =====
  renderSignin() {
    const signed = checkTodaySigned();
    const signData = getSignData();
    const streak = signData.streak || 0;
    const totalDays = signData.totalDays || 0;

    // 未来7天签到奖励预览
    const todayBonus = signed ? 0 : POINTS_RULES.sign + Math.min(streak + 1, 6) * POINTS_RULES.sign_streak;
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + (signed ? 1 : 0) + i);
      const dayStreak = streak + (signed ? 0 : 1) + i;
      const bonus = POINTS_RULES.sign + Math.min(dayStreak, 6) * POINTS_RULES.sign_streak;
      const isToday = i === 0 && !signed;
      const isPast = i === 0 && signed;
      weekDays.push({ date: d, bonus, isToday, isPast, dayStreak });
    }

    return `
      <div class="signin-card ${signed ? 'signed' : ''}">
        ${signed ? `
          <div class="signin-status">
            <i class="fa-solid fa-circle-check" style="color: var(--color-success); font-size: 48px;"></i>
            <p style="font-size: var(--text-lg); font-weight:600; margin-top: var(--space-sm);">今日已签到</p>
            <p style="font-size: var(--text-sm); color: var(--color-text-tertiary);">连续签到 ${streak} 天 · 累计 ${totalDays} 天</p>
          </div>
        ` : `
          <div class="signin-status">
            <div style="font-size: 48px; margin-bottom: var(--space-xs);">🎁</div>
            <p style="font-size: var(--text-lg); font-weight:600;">今日可签到</p>
            <p style="font-size: var(--text-sm); color: var(--color-text-tertiary);">连续签到 ${streak} 天 · 累计 ${totalDays} 天</p>
            <button class="btn-primary mt-md signin-btn" onclick="PointsPage.doSign()">
              <i class="fa-solid fa-calendar-check"></i> 签到领 +${todayBonus} 积分
            </button>
          </div>
        `}
      </div>

      <div class="page-header mt-lg">
        <div class="page-header__title">📅 未来 7 天奖励</div>
      </div>
      <div class="signin-week">
        ${weekDays.map((d, i) => `
          <div class="signin-day ${d.isToday ? 'today' : ''} ${d.isPast ? 'past' : ''}">
            <div class="signin-day__label">${['今','明','后','三','四','五','六'][i] || '七'}</div>
            <div class="signin-day__date">${d.date.getMonth() + 1}/${d.date.getDate()}</div>
            <div class="signin-day__bonus">
              <i class="fa-solid fa-coins"></i> +${d.bonus}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="page-header mt-lg">
        <div class="page-header__title">🏆 积分规则</div>
      </div>
      <div class="rules-card">
        ${this.renderRule('fa-solid fa-calendar-check', '每日签到', `+${POINTS_RULES.sign} 起，连续递增`)}
        ${this.renderRule('fa-solid fa-book', '学习单词', `+${POINTS_RULES.study_word}/词`)}
        ${this.renderRule('fa-solid fa-flag-checkered', '完成学习', `+${POINTS_RULES.study_batch}/轮`)}
        ${this.renderRule('fa-solid fa-rotate', '复习单词', `+${POINTS_RULES.review_word}/词`)}
        ${this.renderRule('fa-solid fa-flag-checkered', '完成复习', `+${POINTS_RULES.review_batch}/轮`)}
        ${this.renderRule('fa-solid fa-clipboard-question', '测试答对', `+${POINTS_RULES.quiz_correct}/题`)}
        ${this.renderRule('fa-solid fa-trophy', '完成测试', `+${POINTS_RULES.quiz_batch}/轮`)}
        ${this.renderRule('fa-solid fa-star', '测试全对', `+${POINTS_RULES.quiz_perfect} 额外`)}
      </div>
    `;
  },

  renderRule(icon, label, value) {
    return `
      <div class="rule-item">
        <div class="rule-item__icon"><i class="${icon}"></i></div>
        <div class="rule-item__label">${label}</div>
        <div class="rule-item__value">${value}</div>
      </div>
    `;
  },

  doSign() {
    const result = doSign();
    if (result.already) {
      Toast.show('今日已签到', 'warning');
    } else {
      Toast.show(`签到成功！连续${result.streak}天，+${result.bonus} 积分 ✨`, 'success');
    }
    this.render();
  },

  // ===== 商城 =====
  renderShop() {
    const items = getShopItems();
    const points = getPoints();

    return `
      <div class="shop-points-info">
        <i class="fa-solid fa-coins"></i> 当前积分：<strong>${points}</strong>
      </div>

      <div class="shop-action-row">
        <button class="btn-primary shop-add-btn" onclick="PointsPage.showAddForm()">
          <i class="fa-solid fa-plus"></i> 添加奖励
        </button>
        <button class="btn-secondary shop-rules-btn" onclick="PointsPage.showRulesForm()">
          <i class="fa-solid fa-sliders"></i> 积分规则
        </button>
      </div>

      <div class="page-header mt-md">
        <div class="page-header__title">🎁 全部奖励（${items.length}）</div>
      </div>
      <div class="shop-grid">
        ${items.length === 0 ? `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <i class="fa-solid fa-box-open"></i>
            <p>暂无奖励，点击上方按钮添加</p>
          </div>
        ` : items.map(item => {
          const canBuy = !item.oneTime || !item.owned;
          const affordable = points >= item.cost && canBuy;
          return `
            <div class="shop-item ${item.owned ? 'owned' : ''} ${affordable ? 'affordable' : ''}">
              <div class="shop-item__icon"><i class="${item.icon}"></i></div>
              <div class="shop-item__info">
                <div class="shop-item__name">${item.name} ${item.oneTime ? '<span class="shop-item__tag">限一次</span>' : '<span class="shop-item__tag shop-item__tag--repeat">可重复</span>'}</div>
                <div class="shop-item__desc">${item.desc || ''}</div>
                ${item.redeemed > 0 ? `<div class="shop-item__redeemed">已兑换 ${item.redeemed} 次</div>` : ''}
              </div>
              <div class="shop-item__action">
                ${item.oneTime && item.owned ? `
                  <span class="shop-item__owned"><i class="fa-solid fa-check"></i> 已拥有</span>
                ` : `
                  <div class="shop-item__cost"><i class="fa-solid fa-coins"></i> ${item.cost}</div>
                `}
                <div class="shop-item__btns">
                  ${canBuy ? `
                    <button class="btn-primary shop-item__btn ${points < item.cost ? 'disabled' : ''}"
                            ${points < item.cost ? 'disabled' : ''}
                            onclick="PointsPage.buy('${item.id}')">兑换</button>
                  ` : ''}
                  <button class="shop-item__edit" onclick="PointsPage.showEditForm('${item.id}')" title="编辑">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button class="shop-item__delete" onclick="PointsPage.deleteItem('${item.id}')" title="删除">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  showAddForm() {
    this._showForm(null);
  },

  showEditForm(itemId) {
    const items = getShopItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    this._showForm(item);
  },

  _showForm(editItem) {
    const isEdit = !!editItem;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'shop-form-modal';
    overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${isEdit ? '编辑奖励' : '添加奖励'}</h3>
          <button class="modal-close" onclick="PointsPage.closeForm()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label>奖励名称</label>
            <input type="text" id="custom-name" placeholder="如：一杯咖啡、口红一支" maxlength="20" value="${editItem ? editItem.name : ''}">
          </div>
          <div class="form-field">
            <label>消耗积分</label>
            <input type="number" id="custom-cost" placeholder="如：50" min="1" max="9999" value="${editItem ? editItem.cost : 50}">
          </div>
          <div class="form-field">
            <label>描述（可选）</label>
            <input type="text" id="custom-desc" placeholder="备注信息" maxlength="50" value="${editItem ? editItem.desc || '' : ''}">
          </div>
          <div class="form-field">
            <label>兑换类型</label>
            <select id="custom-onetime" style="width:100%;height:var(--touch-target);padding:0 var(--space-md);border:2px solid var(--color-border);border-radius:var(--radius-md);font-size:var(--text-base);background:var(--color-white);color:var(--color-text-primary);">
              <option value="0" ${!editItem?.oneTime ? 'selected' : ''}>可重复兑换（如：咖啡、零食）</option>
              <option value="1" ${editItem?.oneTime ? 'selected' : ''}>仅限一次（如：主题、头衔）</option>
            </select>
          </div>
          <div class="form-field">
            <label>选择图标</label>
            <div class="icon-category-tabs">
              ${Object.keys(SHOP_ICON_LIBRARY).map((cat, i) => `
                <button class="icon-cat-tab ${i === 0 ? 'active' : ''}" onclick="PointsPage.switchIconCategory('${cat}', this)">${cat}</button>
              `).join('')}
            </div>
            <div class="icon-picker" id="icon-picker">
              ${SHOP_ICON_LIBRARY[Object.keys(SHOP_ICON_LIBRARY)[0]].map((item, i) => {
                const selected = editItem && editItem.icon === item.icon;
                return `
                  <div class="icon-option ${(!editItem && i === 0) || selected ? 'selected' : ''}" onclick="PointsPage.selectIcon('${item.icon}', this)" data-icon="${item.icon}">
                    <i class="${item.icon}"></i>
                    <span>${item.label}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="PointsPage.closeForm()">取消</button>
          <button class="btn-primary" onclick="PointsPage.saveItem(${isEdit ? `'${editItem.id}'` : 'null'})">${isEdit ? '保存修改' : '确认添加'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    if (editItem) {
      this._selectedIcon = editItem.icon;
      this._editId = editItem.id;
    } else {
      this._selectedIcon = SHOP_ICON_LIBRARY[Object.keys(SHOP_ICON_LIBRARY)[0]][0].icon;
      this._editId = null;
    }
  },

  switchIconCategory(category, btnEl) {
    document.querySelectorAll('.icon-cat-tab').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    const picker = document.getElementById('icon-picker');
    const icons = SHOP_ICON_LIBRARY[category];
    picker.innerHTML = icons.map((item, i) => `
      <div class="icon-option ${i === 0 ? 'selected' : ''}" onclick="PointsPage.selectIcon('${item.icon}', this)" data-icon="${item.icon}">
        <i class="${item.icon}"></i>
        <span>${item.label}</span>
      </div>
    `).join('');
    this._selectedIcon = icons[0].icon;
  },

  selectIcon(icon, el) {
    document.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    this._selectedIcon = icon;
  },

  closeForm() {
    const modal = document.getElementById('shop-form-modal');
    if (modal) modal.remove();
  },

  saveItem(editId) {
    const name = document.getElementById('custom-name').value.trim();
    const cost = document.getElementById('custom-cost').value;
    const desc = document.getElementById('custom-desc').value.trim();
    const oneTime = document.getElementById('custom-onetime').value === '1';
    const icon = this._selectedIcon || 'fa-solid fa-gift';

    if (!name) { Toast.show('请输入奖励名称', 'warning'); return; }
    if (!cost || parseInt(cost) < 1) { Toast.show('请输入有效的积分数量', 'warning'); return; }

    if (editId) {
      updateShopItem(editId, { name, cost: parseInt(cost), icon, desc, oneTime });
      Toast.show('修改已保存', 'success');
    } else {
      addShopItem(name, cost, icon, desc, oneTime);
      Toast.show('添加成功！', 'success');
    }
    this.closeForm();
    this.renderTab();
  },

  deleteItem(itemId) {
    if (confirm('确定删除这个奖励吗？')) {
      deleteShopItem(itemId);
      Toast.show('已删除', 'success');
      this.renderTab();
    }
  },

  // ===== 积分规则 =====
  showRulesForm() {
    const rules = getPointsRules();
    const keys = Object.keys(rules);
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'rules-modal';
    overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>积分规则设置</h3>
          <button class="modal-close" onclick="PointsPage.closeRulesForm()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <p style="font-size: var(--text-sm); color: var(--color-text-tertiary); margin-bottom: var(--space-md);">可修改各项积分奖励数值，也可添加自定义规则。默认规则不可删除。</p>
          <div id="rules-list">
            ${keys.map(k => {
              const r = rules[k];
              const isDefault = !!DEFAULT_POINTS_RULES[k];
              return `
                <div class="rule-row" data-key="${k}">
                  <div class="rule-row__info">
                    <div class="rule-row__label">${r.label}</div>
                    <div class="rule-row__desc">${r.desc || ''}</div>
                  </div>
                  <div class="rule-row__input">
                    <input type="number" class="rule-value" data-key="${k}" value="${r.value}" min="0" max="9999" ${isDefault ? '' : 'data-custom="1"'}>
                    ${!isDefault ? `<button class="shop-item__delete" onclick="PointsPage.removeRule('${k}')" title="删除"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <button class="btn-secondary mt-md" style="width:100%;" onclick="PointsPage.showAddRuleForm()">
            <i class="fa-solid fa-plus"></i> 添加自定义规则
          </button>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="PointsPage.closeRulesForm()">取消</button>
          <button class="btn-primary" onclick="PointsPage.saveRules()">保存规则</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  showAddRuleForm() {
    const key = 'custom_' + Date.now();
    const list = document.getElementById('rules-list');
    const div = document.createElement('div');
    div.className = 'rule-row rule-row--new';
    div.dataset.key = key;
    div.innerHTML = `
      <div class="rule-row__info">
        <input type="text" class="rule-label" data-key="${key}" placeholder="规则名称" style="width:100%;height:32px;border:1px solid var(--color-border);border-radius:6px;padding:0 8px;font-size:var(--text-sm);">
        <input type="text" class="rule-desc" data-key="${key}" placeholder="说明（可选）" style="width:100%;height:28px;border:1px solid var(--color-border);border-radius:6px;padding:0 8px;font-size:var(--text-xs);margin-top:4px;">
      </div>
      <div class="rule-row__input">
        <input type="number" class="rule-value" data-key="${key}" value="10" min="0" max="9999" data-custom="1">
        <button class="shop-item__delete" onclick="this.closest('.rule-row').remove()" title="删除"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    `;
    list.appendChild(div);
  },

  removeRule(key) {
    if (!confirm('确定删除这条自定义规则吗？')) return;
    deletePointsRule(key);
    Toast.show('已删除', 'success');
    this.showRulesForm();
  },

  saveRules() {
    const rows = document.querySelectorAll('.rule-row');
    const rules = {};
    rows.forEach(row => {
      const key = row.dataset.key;
      const valueEl = row.querySelector('.rule-value');
      const labelEl = row.querySelector('.rule-label');
      const descEl = row.querySelector('.rule-desc');
      const value = parseInt(valueEl?.value) || 0;
      const label = labelEl?.value || DEFAULT_POINTS_RULES[key]?.label || key;
      const desc = descEl?.value || DEFAULT_POINTS_RULES[key]?.desc || '';
      rules[key] = { label, value, desc };
    });
    localStorage.setItem(RULES_KEY, JSON.stringify(rules));
    this.closeRulesForm();
    Toast.show('积分规则已保存', 'success');
  },

  closeRulesForm() {
    const modal = document.getElementById('rules-modal');
    if (modal) modal.remove();
  },

  // ===== 背包 =====
  _bagFilter: 'all',  // 'all' | 'unused' | 'used'

  renderBag() {
    const inv = getInventory();
    const unusedCount = inv.filter(i => !i.used).length;
    const usedCount = inv.filter(i => i.used).length;

    if (inv.length === 0) {
      return `
        <div class="empty-state" style="margin-top: 40px;">
          <img src="icons/reward-gift.jpg" alt="" style="width:80px;height:80px;border-radius:var(--radius-lg);object-fit:cover;box-shadow:var(--shadow-md);margin-bottom:var(--space-md);">
          <p style="font-size: var(--text-lg); font-weight: 600; color: var(--color-text-primary);">背包空空如也</p>
          <p style="font-size: var(--text-sm); color: var(--color-text-tertiary); margin-top: var(--space-xs);">去商城兑换奖励吧~</p>
          <button class="btn-primary mt-md" onclick="PointsPage.switchTab('shop')">前往商城</button>
        </div>
      `;
    }

    let filtered = inv;
    if (this._bagFilter === 'unused') filtered = inv.filter(i => !i.used);
    else if (this._bagFilter === 'used') filtered = inv.filter(i => i.used);

    return `
      <div class="bag-tabs">
        <button class="bag-tab ${this._bagFilter === 'all' ? 'active' : ''}" onclick="PointsPage.switchBagFilter('all')">
          <div class="bag-tab__value">${inv.length}</div>
          <div class="bag-tab__label">全部</div>
        </button>
        <button class="bag-tab ${this._bagFilter === 'unused' ? 'active' : ''}" onclick="PointsPage.switchBagFilter('unused')">
          <div class="bag-tab__value" style="color: var(--color-success);">${unusedCount}</div>
          <div class="bag-tab__label">可使用</div>
        </button>
        <button class="bag-tab ${this._bagFilter === 'used' ? 'active' : ''}" onclick="PointsPage.switchBagFilter('used')">
          <div class="bag-tab__value" style="color: var(--color-text-tertiary);">${usedCount}</div>
          <div class="bag-tab__label">已使用</div>
        </button>
      </div>

      ${filtered.length === 0 ? `
        <div class="empty-state" style="padding: 30px;">
          <i class="fa-solid fa-box-open" style="font-size: 32px; color: var(--color-text-tertiary);"></i>
          <p style="margin-top: var(--space-sm); color: var(--color-text-tertiary);">此分类下暂无物品</p>
        </div>
      ` : `
        <div class="bag-grid">
          ${filtered.map(item => {
            const img = getCardImage(item.icon.replace('fa-solid ', ''));
            return `
              <div class="bag-card ${item.used ? 'used' : ''}">
                <div class="bag-card__image">
                  <img src="${img}" alt="">
                  <div class="bag-card__icon"><i class="${item.icon}"></i></div>
                  ${item.used ? '<div class="bag-card__badge">已使用</div>' : '<div class="bag-card__badge bag-card__badge--new">可用</div>'}
                </div>
                <div class="bag-card__body">
                  <div class="bag-card__name">${item.name}</div>
                  ${item.desc ? `<div class="bag-card__desc">${item.desc}</div>` : ''}
                  <div class="bag-card__time">${this.formatTime(item.obtainedAt)}</div>
                  ${item.used ? `
                    <div class="bag-card__note">
                      <div class="bag-card__note-label"><i class="fa-solid fa-note-sticky"></i> 使用备注</div>
                      <div class="bag-card__note-text" id="note-text-${item.id}">${item.note || '<span style="color:var(--color-text-tertiary);">点击编辑备注...</span>'}</div>
                      <button class="btn-secondary bag-card__note-btn" onclick="PointsPage.editNote('${item.id}')">
                        <i class="fa-solid fa-pen"></i> ${item.note ? '修改' : '添加'}备注
                      </button>
                    </div>
                  ` : ''}
                </div>
                <div class="bag-card__actions">
                  <button class="btn-primary bag-card__btn" onclick="PointsPage.useItem('${item.id}')">
                    ${item.used ? '<i class="fa-solid fa-rotate-left"></i> 取消使用' : '<i class="fa-solid fa-hand"></i> 使用'}
                  </button>
                  <button class="shop-item__delete" onclick="PointsPage.deleteBagItem('${item.id}')" title="丢弃">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;
  },

  switchBagFilter(filter) {
    this._bagFilter = filter;
    this.renderTab();
  },

  editNote(itemId) {
    const inv = getInventory();
    const item = inv.find(i => i.id === itemId);
    if (!item) return;
    const note = prompt('请输入使用备注（如：兑换了一杯星巴克拿铁）', item.note || '');
    if (note !== null) {
      updateInventoryNote(itemId, note);
      Toast.show('备注已保存', 'success');
      this.renderTab();
    }
  },

  useItem(itemId) {
    const result = useInventoryItem(itemId);
    if (result.ok) {
      Toast.show(result.msg, 'success');
    } else {
      Toast.show(result.msg, 'warning');
    }
    this.renderTab();
  },

  deleteBagItem(itemId) {
    if (confirm('确定丢弃这个物品吗？')) {
      deleteInventoryItem(itemId);
      Toast.show('已丢弃', 'success');
      this.renderTab();
    }
  },

  buy(itemId) {
    const result = buyShopItem(itemId);
    if (result.ok) {
      Toast.show(result.msg, 'success');
    } else {
      Toast.show(result.msg, 'warning');
    }
    this.renderTab();
    const amountEl = document.querySelector('.points-header__amount span');
    if (amountEl) amountEl.textContent = getPoints();
  },

  // ===== 积分记录 =====
  renderLog() {
    const log = formatPointsLog();

    if (log.length === 0) {
      return `
        <div class="empty-state" style="margin-top: 40px;">
          <i class="fa-solid fa-inbox" style="color: var(--color-text-tertiary);"></i>
          <p>暂无积分记录</p>
          <p style="font-size: var(--text-sm); color: var(--color-text-tertiary);">签到或学习即可获得积分</p>
        </div>
      `;
    }

    return `
      <div class="log-list">
        ${log.map(entry => `
          <div class="log-item">
            <div class="log-item__icon ${entry.amount > 0 ? 'positive' : 'negative'}">
              <i class="fa-solid ${entry.amount > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
            </div>
            <div class="log-item__info">
              <div class="log-item__reason">${entry.reason}</div>
              <div class="log-item__time">${this.formatTime(entry.time)}</div>
            </div>
            <div class="log-item__amount ${entry.amount > 0 ? 'positive' : 'negative'}">
              ${entry.amount > 0 ? '+' : ''}${entry.amount}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  formatTime(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${m}/${day} ${h}:${min}`;
  }
};
