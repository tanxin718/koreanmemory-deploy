/**
 * KoreanMemory - PWA 安装提示 + Service Worker 管理
 */
let deferredPrompt = null;

// 强制卸载旧的 Service Worker（开发阶段）
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => {
      console.log('[PWA] 卸载旧 Service Worker:', reg.scope);
      reg.unregister();
    });
  });
  // 清除所有缓存
  caches.keys().then(keys => {
    keys.forEach(k => {
      console.log('[PWA] 删除缓存:', k);
      caches.delete(k);
    });
  });
}

// 注册 Service Worker（部署时取消注释）
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('./sw.js')
//       .then(registration => {
//         console.log('[PWA] Service Worker 注册成功:', registration.scope);
//       })
//       .catch(err => {
//         console.warn('[PWA] Service Worker 注册失败:', err);
//       });
//   });
// }

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