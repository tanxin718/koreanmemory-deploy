/**
 * KoreanMemory - 积分管理器
 * 使用 localStorage 存储积分、签到、商城数据
 */

// ===== Toast 增强（支持类型） =====
const Toast = {
  show(message, type = 'default') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.className = 'toast show';
    if (type === 'success') el.classList.add('toast--success');
    else if (type === 'warning') el.classList.add('toast--warning');
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => { el.className = 'toast hidden'; }, 300);
    }, 2000);
  }
};

const POINTS_KEY = 'km_points';
const SIGN_KEY = 'km_sign';
const LOG_KEY = 'km_points_log';
const SHOP_KEY = 'km_shop_items';       // 统一商品存储（合并系统+自定义）
const INVENTORY_KEY = 'km_inventory';
const RULES_KEY = 'km_points_rules';   // 自定义积分规则

// ===== 商城图标库 =====
const SHOP_ICON_LIBRARY = {
  '美妆护肤': [
    { icon: 'fa-solid fa-lips', label: '口红' },
    { icon: 'fa-solid fa-spray-can', label: '香水' },
    { icon: 'fa-solid fa-pump-soap', label: '洗护' },
    { icon: 'fa-solid fa-soap', label: '洁面' },
    { icon: 'fa-solid fa-spa', label: '护肤' },
    { icon: 'fa-solid fa-hand-sparkles', label: '护手霜' },
    { icon: 'fa-solid fa-mitten', label: '面膜' },
    { icon: 'fa-solid fa-wand-magic-sparkles', label: '美妆工具' },
  ],
  '美食饮品': [
    { icon: 'fa-solid fa-mug-hot', label: '咖啡' },
    { icon: 'fa-solid fa-mug-saucer', label: '茶饮' },
    { icon: 'fa-solid fa-bottle-water', label: '饮料' },
    { icon: 'fa-solid fa-ice-cream', label: '冰淇淋' },
    { icon: 'fa-solid fa-cake-candles', label: '蛋糕' },
    { icon: 'fa-solid fa-cookie', label: '甜点' },
    { icon: 'fa-solid fa-pizza-slice', label: '披萨' },
    { icon: 'fa-solid fa-burger', label: '汉堡' },
    { icon: 'fa-solid fa-bowl-rice', label: '韩餐' },
    { icon: 'fa-solid fa-utensils', label: '美食' },
    { icon: 'fa-solid fa-wine-glass', label: '酒水' },
    { icon: 'fa-solid fa-candy-cane', label: '零食' },
  ],
  '数码电子': [
    { icon: 'fa-solid fa-mobile-screen', label: '手机' },
    { icon: 'fa-solid fa-laptop', label: '笔记本' },
    { icon: 'fa-solid fa-headphones', label: '耳机' },
    { icon: 'fa-solid fa-tablet-screen-button', label: '平板' },
    { icon: 'fa-solid fa-camera', label: '相机' },
    { icon: 'fa-solid fa-gamepad', label: '游戏' },
    { icon: 'fa-solid fa-keyboard', label: '键盘' },
    { icon: 'fa-solid fa-mouse', label: '鼠标' },
    { icon: 'fa-solid fa-charging-station', label: '充电器' },
  ],
  '服饰配饰': [
    { icon: 'fa-solid fa-shirt', label: '衣服' },
    { icon: 'fa-solid fa-shoe-prints', label: '鞋子' },
    { icon: 'fa-solid fa-hat-cowboy', label: '帽子' },
    { icon: 'fa-solid fa-glasses', label: '眼镜' },
    { icon: 'fa-solid fa-watch', label: '手表' },
    { icon: 'fa-solid fa-gem', label: '珠宝' },
    { icon: 'fa-solid fa-bag-shopping', label: '包包' },
    { icon: 'fa-solid fa-mitten', label: '手套' },
  ],
  '生活娱乐': [
    { icon: 'fa-solid fa-film', label: '电影' },
    { icon: 'fa-solid fa-music', label: '音乐' },
    { icon: 'fa-solid fa-ticket', label: '门票' },
    { icon: 'fa-solid fa-plane', label: '旅行' },
    { icon: 'fa-solid fa-hotel', label: '住宿' },
    { icon: 'fa-solid fa-spa', label: 'SPA' },
    { icon: 'fa-solid fa-dumbbell', label: '健身' },
    { icon: 'fa-solid fa-book', label: '书籍' },
    { icon: 'fa-solid fa-paw', label: '宠物' },
    { icon: 'fa-solid fa-seedling', label: '植物' },
  ],
  '学习成长': [
    { icon: 'fa-solid fa-graduation-cap', label: '课程' },
    { icon: 'fa-solid fa-certificate', label: '证书' },
    { icon: 'fa-solid fa-pen', label: '文具' },
    { icon: 'fa-solid fa-book-open', label: '图书' },
    { icon: 'fa-solid fa-lightbulb', label: '灵感' },
    { icon: 'fa-solid fa-trophy', label: '奖励' },
    { icon: 'fa-solid fa-medal', label: '勋章' },
    { icon: 'fa-solid fa-crown', label: '头衔' },
  ],
  '其他': [
    { icon: 'fa-solid fa-gift', label: '礼物' },
    { icon: 'fa-solid fa-heart', label: '心愿' },
    { icon: 'fa-solid fa-star', label: '星星' },
    { icon: 'fa-solid fa-bolt', label: '能量' },
    { icon: 'fa-solid fa-fire', label: '热门' },
    { icon: 'fa-solid fa-rocket', label: '起飞' },
    { icon: 'fa-solid fa-piggy-bank', label: '存钱' },
    { icon: 'fa-solid fa-coins', label: '金币' },
  ]
};

// ===== 默认商城商品 =====
const DEFAULT_SHOP_ITEMS = [
  { id: 'theme_sakura', name: '樱花主题', desc: '解锁樱花粉配色方案', icon: 'fa-solid fa-palette', cost: 200, oneTime: true, owned: false, redeemed: 0 },
  { id: 'theme_ocean', name: '海洋主题', desc: '解锁清凉海洋蓝配色方案', icon: 'fa-solid fa-water', cost: 200, oneTime: true, owned: false, redeemed: 0 },
  { id: 'mascot_hat', name: '吉祥物帽子', desc: '给吉祥物戴上可爱帽子', icon: 'fa-solid fa-hat-wizard', cost: 150, oneTime: true, owned: false, redeemed: 0 },
  { id: 'mascot_glasses', name: '吉祥物眼镜', desc: '给吉祥物戴上酷炫眼镜', icon: 'fa-solid fa-glasses', cost: 150, oneTime: true, owned: false, redeemed: 0 },
  { id: 'double_points', name: '双倍积分卡', desc: '下次学习/测试积分翻倍', icon: 'fa-solid fa-bolt', cost: 300, oneTime: false, owned: false, redeemed: 0 },
  { id: 'skip_review', name: '免复习券', desc: '跳过一次复习任务', icon: 'fa-solid fa-forward', cost: 100, oneTime: false, owned: false, redeemed: 0 },
  { id: 'custom_title', name: '自定义头衔', desc: '设置独特的个人头衔', icon: 'fa-solid fa-crown', cost: 500, oneTime: true, owned: false, redeemed: 0 },
  { id: 'streak_shield', name: '连续护盾', desc: '保护一天连续不断', icon: 'fa-solid fa-shield-halved', cost: 250, oneTime: false, owned: false, redeemed: 0 }
];

// ===== 积分规则（默认 + 自定义覆盖） =====
const DEFAULT_POINTS_RULES = {
  sign: { label: '每日签到', value: 10, desc: '每天签到固定奖励' },
  sign_streak: { label: '连续签到加成', value: 5, desc: '每连续一天额外+5（上限30）' },
  study_word: { label: '学习单词', value: 2, desc: '每学一个单词' },
  study_batch: { label: '完成一轮学习', value: 20, desc: '完成20个单词学习' },
  review_word: { label: '复习单词', value: 3, desc: '每复习一个单词' },
  review_batch: { label: '完成一轮复习', value: 30, desc: '完成一轮复习任务' },
  quiz_correct: { label: '测试答对', value: 5, desc: '测试每答对一题' },
  quiz_batch: { label: '完成一轮测试', value: 25, desc: '完成一轮测试任务' },
  quiz_perfect: { label: '全对额外奖励', value: 15, desc: '一轮测试全对额外奖励' }
};

function getPointsRules() {
  try {
    const saved = JSON.parse(localStorage.getItem(RULES_KEY));
    if (saved) return Object.assign({}, DEFAULT_POINTS_RULES, saved);
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_POINTS_RULES));
}

function getRuleValue(key) {
  const rules = getPointsRules();
  return rules[key]?.value ?? DEFAULT_POINTS_RULES[key]?.value ?? 0;
}

function updatePointsRule(key, value, label, desc) {
  const rules = getPointsRules();
  if (!rules[key]) rules[key] = { label, value, desc };
  else {
    if (value !== undefined) rules[key].value = value;
    if (label !== undefined) rules[key].label = label;
    if (desc !== undefined) rules[key].desc = desc;
  }
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

function addPointsRule(key, label, value, desc) {
  const rules = getPointsRules();
  rules[key] = { label, value: Math.max(0, parseInt(value) || 0), desc: desc || '' };
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

function deletePointsRule(key) {
  // 不允许删除默认规则
  if (DEFAULT_POINTS_RULES[key]) return false;
  const rules = getPointsRules();
  delete rules[key];
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
  return true;
}

// 兼容旧代码：保留 POINTS_RULES 对象形式（取值时动态获取）
const POINTS_RULES = new Proxy({}, { get: (_, k) => getRuleValue(k) });

// ===== 读取数据 =====

function getPoints() {
  return parseInt(localStorage.getItem(POINTS_KEY) || '0', 10);
}

function setPoints(val) {
  localStorage.setItem(POINTS_KEY, String(Math.max(0, val)));
}

function addPoints(amount, reason) {
  const current = getPoints();
  setPoints(current + amount);
  addPointsLog(amount, reason);
  return current + amount;
}

function spendPoints(amount) {
  const current = getPoints();
  if (current < amount) return false;
  setPoints(current - amount);
  addPointsLog(-amount, '商城兑换');
  return true;
}

// ===== 签到 =====

function getSignData() {
  try {
    return JSON.parse(localStorage.getItem(SIGN_KEY)) || { lastDate: '', streak: 0, totalDays: 0 };
  } catch { return { lastDate: '', streak: 0, totalDays: 0 }; }
}

function checkTodaySigned() {
  const data = getSignData();
  const today = new Date().toISOString().split('T')[0];
  return data.lastDate === today;
}

function doSign() {
  if (checkTodaySigned()) return { already: true };

  const data = getSignData();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (data.lastDate === yesterday) {
    data.streak = Math.min(data.streak + 1, 30);
  } else {
    data.streak = 1;
  }

  data.lastDate = today;
  data.totalDays = (data.totalDays || 0) + 1;
  localStorage.setItem(SIGN_KEY, JSON.stringify(data));

  const bonus = POINTS_RULES.sign + Math.min(data.streak, 6) * POINTS_RULES.sign_streak;
  addPoints(bonus, `每日签到（连续${data.streak}天）`);

  return { already: false, streak: data.streak, bonus };
}

// ===== 积分记录 =====

function getPointsLog() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY)) || [];
  } catch { return []; }
}

function addPointsLog(amount, reason) {
  const log = getPointsLog();
  log.unshift({ amount, reason, time: new Date().toISOString() });
  if (log.length > 100) log.length = 100;
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

// ===== 商城（统一存储） =====

function getShopItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(SHOP_KEY));
    if (saved && saved.length > 0) return saved;
  } catch {}
  // 首次使用，初始化默认商品
  const items = JSON.parse(JSON.stringify(DEFAULT_SHOP_ITEMS));
  localStorage.setItem(SHOP_KEY, JSON.stringify(items));
  return items;
}

function buyShopItem(itemId) {
  const items = getShopItems();
  const item = items.find(i => i.id === itemId);
  if (!item) return { ok: false, msg: '商品不存在' };
  // 一次性商品判断是否已拥有，可重复兑换的不限制
  if (item.oneTime && item.owned) return { ok: false, msg: '已拥有' };
  if (getPoints() < item.cost) return { ok: false, msg: '积分不足' };
  spendPoints(item.cost);
  if (item.oneTime) item.owned = true;
  item.redeemed = (item.redeemed || 0) + 1;
  localStorage.setItem(SHOP_KEY, JSON.stringify(items));
  addToInventory(item.name, item.icon, item.desc);
  return { ok: true, msg: `兑换成功：${item.name}` };
}

function addShopItem(name, cost, icon, desc, oneTime) {
  const items = getShopItems();
  const item = {
    id: 'item_' + Date.now(),
    name: name.trim(),
    cost: Math.max(1, parseInt(cost) || 1),
    icon: icon || 'fa-solid fa-gift',
    desc: (desc || '').trim(),
    oneTime: !!oneTime,
    owned: false,
    redeemed: 0,
    createdAt: new Date().toISOString()
  };
  items.unshift(item);
  localStorage.setItem(SHOP_KEY, JSON.stringify(items));
  return item;
}

function updateShopItem(itemId, updates) {
  const items = getShopItems();
  const item = items.find(i => i.id === itemId);
  if (!item) return false;
  Object.assign(item, updates);
  localStorage.setItem(SHOP_KEY, JSON.stringify(items));
  return true;
}

function deleteShopItem(itemId) {
  const items = getShopItems();
  const filtered = items.filter(i => i.id !== itemId);
  localStorage.setItem(SHOP_KEY, JSON.stringify(filtered));
  return items.length !== filtered.length;
}

// ===== 背包（已兑换物品库存） =====

function getInventory() {
  try {
    return JSON.parse(localStorage.getItem(INVENTORY_KEY)) || [];
  } catch { return []; }
}

function addToInventory(name, icon, desc) {
  const inv = getInventory();
  inv.unshift({
    id: 'inv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    name: name,
    icon: icon || 'fa-solid fa-gift',
    desc: desc || '',
    used: false,
    note: '',
    obtainedAt: new Date().toISOString(),
    usedAt: null
  });
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
}

function useInventoryItem(itemId) {
  const inv = getInventory();
  const item = inv.find(i => i.id === itemId);
  if (!item) return { ok: false, msg: '物品不存在' };
  item.used = !item.used;
  item.usedAt = item.used ? new Date().toISOString() : null;
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
  return { ok: true, msg: item.used ? `已使用：${item.name}` : `已取消：${item.name}` };
}

function updateInventoryNote(itemId, note) {
  const inv = getInventory();
  const item = inv.find(i => i.id === itemId);
  if (!item) return false;
  item.note = (note || '').trim();
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
  return true;
}

function deleteInventoryItem(itemId) {
  const inv = getInventory();
  const filtered = inv.filter(i => i.id !== itemId);
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(filtered));
  return inv.length !== filtered.length;
}

// 根据图标返回对应的卡片背景图
function getCardImage(icon) {
  const key = (icon || '').replace('fa-solid ', '');
  const iconMap = {
    'fa-lips': 'icons/reward-beauty.jpg',
    'fa-spray-can': 'icons/reward-beauty.jpg',
    'fa-pump-soap': 'icons/reward-beauty.jpg',
    'fa-soap': 'icons/reward-beauty.jpg',
    'fa-spa': 'icons/reward-beauty.jpg',
    'fa-hand-sparkles': 'icons/reward-beauty.jpg',
    'fa-mitten': 'icons/reward-beauty.jpg',
    'fa-wand-magic-sparkles': 'icons/reward-beauty.jpg',
    'fa-mug-hot': 'icons/reward-food.jpg',
    'fa-mug-saucer': 'icons/reward-food.jpg',
    'fa-bottle-water': 'icons/reward-food.jpg',
    'fa-ice-cream': 'icons/reward-food.jpg',
    'fa-cake-candles': 'icons/reward-food.jpg',
    'fa-cookie': 'icons/reward-food.jpg',
    'fa-pizza-slice': 'icons/reward-food.jpg',
    'fa-burger': 'icons/reward-food.jpg',
    'fa-bowl-rice': 'icons/reward-food.jpg',
    'fa-utensils': 'icons/reward-food.jpg',
    'fa-wine-glass': 'icons/reward-food.jpg',
    'fa-candy-cane': 'icons/reward-food.jpg',
    'fa-mobile-screen': 'icons/reward-digital.jpg',
    'fa-laptop': 'icons/reward-digital.jpg',
    'fa-headphones': 'icons/reward-digital.jpg',
    'fa-tablet-screen-button': 'icons/reward-digital.jpg',
    'fa-camera': 'icons/reward-digital.jpg',
    'fa-gamepad': 'icons/reward-digital.jpg',
    'fa-keyboard': 'icons/reward-digital.jpg',
    'fa-mouse': 'icons/reward-digital.jpg',
    'fa-charging-station': 'icons/reward-digital.jpg'
  };
  return iconMap[key] || 'icons/reward-gift.jpg';
}

// ===== 辅助 =====

function formatPointsLog() {
  const log = getPointsLog();
  return log.slice(0, 30);
}
