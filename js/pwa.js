/**
 * KoreanMemory - PWA 安装提示 + Service Worker 管理
 */
let deferredPrompt = null;

// 注册 Service Worker（PWA 必需，让应用可离线 + 独立运行）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('[PWA] Service Worker 注册成功:', registration.scope);
      })
      .catch(err => {
        console.warn('[PWA] Service Worker 注册失败:', err);
      });
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

async function installPWA() {
  if (!deferredPrompt) {
    showToast('请通过浏览器菜单安装');
    return;
  }
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  if (result.outcome === 'accepted') {
    showToast('安装成功！');
  }
  deferredPrompt = null;
}

function canInstallPWA() {
  return !!deferredPrompt;
}
