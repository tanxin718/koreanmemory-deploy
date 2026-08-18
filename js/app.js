/**
 * KoreanMemory - 主应用逻辑
 * 路由、初始化、全局状态管理
 */
const App = {
  // 路由映射表（懒加载：通过名称字符串在运行时查找）
  routeNames: {
    'home': 'HomePage',
    'word-list': 'WordListPage',
    'word': 'WordDetailPage',
    'study': 'StudyPage',
    'review': 'ReviewPage',
    'search': 'SearchPage',
    'favorites': 'FavoritesPage',
    'stats': 'StatsPage',
    'settings': 'SettingsPage',
    'topics': 'TopicsPage',
    'quiz': 'QuizPage',
    'points': 'PointsPage',
    'daily-quiz': 'DailyQuizPage'
  },
  
  currentPage: null,
  currentRoute: null,
  
  // 底部导航可见的页面
  navPages: ['home', 'word-list', 'study', 'quiz', 'points'],
  
  // 通过名称获取页面对象（const 声明的全局变量不在 window 上，需用 eval 访问）
  getPage(route) {
    const name = this.routeNames[route];
    if (!name) return null;
    try {
      return eval(name) || null;
    } catch (e) {
      console.error('[App] 获取页面失败:', name, e);
      return null;
    }
  },
  
  async init() {
    // 监听路由变化
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // 应用主题
    this.applyTheme();
    
    // 先显示基础骨架（不依赖数据库）
    document.getElementById('app-content').innerHTML = '';
    
    // 初始化数据库（带超时保护）
    try {
      console.log('[App] 开始初始化数据库...');
      const dbPromise = initDatabase();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('数据库加载超时')), 8000)
      );
      await Promise.race([dbPromise, timeoutPromise]);
      console.log('[App] 数据库初始化成功');
      showLoading(false);
      this.handleRoute();
    } catch (e) {
      console.error('[App] 数据库初始化失败:', e);
      showLoading(false);
      document.getElementById('app-content').innerHTML = `
        <div style="margin: 60px 20px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <p style="font-weight: 600; margin-bottom: 8px;">数据库加载失败</p>
          <p style="font-size: 13px; color: #999; word-break: break-all;">${e.message}</p>
          <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 24px; background: #7C65EF; color: white; border: none; border-radius: 8px; font-size: 14px;">重试</button>
        </div>
      `;
    }
  },
  
  async handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const [route, ...params] = hash.split('/');
    this.currentRoute = route;
    
    const page = this.getPage(route);
    if (!page) {
      this.navigate('home');
      return;
    }
    
    this.currentPage = page;
    this.renderHeader(route, params);
    this.renderNav(route);
    
    try {
      await page.init(params);
    } catch (e) {
      console.error('[App] 页面渲染失败:', e);
      document.getElementById('app-content').innerHTML = `
        <div style="margin: 60px 20px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <p style="font-weight: 600; margin-bottom: 8px;">页面加载出错</p>
          <p style="font-size: 13px; color: #999; word-break: break-all;">${e.message}</p>
        </div>
      `;
    }
    
    document.getElementById('app-content').scrollTop = 0;
  },
  
  navigate(route, params = '') {
    window.location.hash = `#${route}${params ? '/' + params : ''}`;
  },
  
  renderHeader(route, params) {
    const header = document.getElementById('app-header');
    const titles = {
      'home': 'KoreanMemory',
      'word-list': '词库',
      'word': '单词详情',
      'study': '学习',
      'review': '复习',
      'search': '搜索',
      'favorites': '收藏',
      'stats': '统计',
      'settings': '设置',
      'topics': '场景分类',
      'quiz': '测试',
      'points': '积分中心',
      'daily-quiz': '每日测验'
    };
    
    const title = titles[route] || 'KoreanMemory';
    const showBack = !['home', 'word-list', 'study', 'quiz', 'points'].includes(route);
    
    let html = '';
    if (showBack) {
      html += `<button class="btn-back" onclick="history.back()"><i class="fa-solid fa-arrow-left"></i></button>`;
    }
    html += `<h1>${title}</h1>`;
    
    if (route === 'word') {
      html += `<button class="btn-header-action" id="btn-fav-detail" onclick="App.currentPage.toggleFavorite()"><i class="fa-regular fa-heart"></i></button>`;
    } else if (route === 'home') {
      html += `<button class="btn-header-action" onclick="App.navigate('favorites')" title="收藏"><i class="fa-solid fa-heart"></i></button>`;
      html += `<button class="btn-header-action" onclick="App.navigate('settings')" title="设置"><i class="fa-solid fa-gear"></i></button>`;
      html += `<button class="btn-header-action" onclick="App.navigate('search')" title="搜索"><i class="fa-solid fa-magnifying-glass"></i></button>`;
    } else if (route === 'search') {
      html += '';
    } else if (route === 'settings') {
      html += '';
    } else {
      html += `<button class="btn-header-action" onclick="App.navigate('search')"><i class="fa-solid fa-magnifying-glass"></i></button>`;
    }
    
    header.innerHTML = html;
  },
  
  renderNav(route) {
    const nav = document.getElementById('bottom-nav');
    if (!this.navPages.includes(route)) {
      nav.classList.remove('visible');
      return;
    }
    
    nav.classList.add('visible');
    nav.innerHTML = `
      <button class="bottom-nav__item ${route === 'home' ? 'active' : ''}" onclick="App.navigate('home')">
        <i class="fa-solid fa-house"></i>
        <span>首页</span>
      </button>
      <button class="bottom-nav__item ${route === 'word-list' ? 'active' : ''}" onclick="App.navigate('word-list')">
        <i class="fa-solid fa-book"></i>
        <span>词库</span>
      </button>
      <button class="bottom-nav__item ${route === 'study' ? 'active' : ''}" onclick="App.navigate('study')">
        <i class="fa-solid fa-bolt"></i>
        <span>学习</span>
      </button>
      <button class="bottom-nav__item ${route === 'quiz' ? 'active' : ''}" onclick="App.navigate('quiz')">
        <i class="fa-solid fa-clipboard-question"></i>
        <span>测试</span>
      </button>
      <button class="bottom-nav__item ${route === 'points' ? 'active' : ''}" onclick="App.navigate('points')">
        <i class="fa-solid fa-coins"></i>
        <span>积分</span>
      </button>
    `;
  },
  
  applyTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    }
  },
  
  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => App.init());