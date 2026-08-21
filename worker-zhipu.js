/**
 * KoreanMemory - Cloudflare Worker：智谱 AI 公网代理
 * 用途：让手机 / GitHub Pages（https 公网）也能调用智谱 GLM-4-Flash（免费）。
 * 因为智谱 API 不允许浏览器跨域直连，需此 Worker 中转。
 *
 * -------------------- 部署教程（约 2 分钟，免费）--------------------
 * 1. 打开 https://dash.cloudflare.com 注册/登录（手机号即可，免费）
 * 2. 左侧菜单选 "Workers 和 Pages" → "创建" → "Worker" → 选个英文名，点 "部署"
 * 3. 进入刚创建的 Worker，点 "编辑代码"，删掉默认内容
 * 4. 把 本文件全部内容 粘贴进去
 * 5. 点右上角 "部署"。完成后会得到类似 https://你的名字.用户名.workers.dev 的地址
 * 6. 把这个地址复制，粘贴到应用"设置 → AI 服务"里即可
 * -------------------------------------------------------------------
 */

export default {
  async fetch(request, env, ctx) {
    // 只允许 POST /api/zhipu
    const url = new URL(request.url);
    if (url.pathname !== '/api/zhipu' || request.method !== 'POST') {
      return new Response('Not Found', { status: 404 });
    }

    // 读取前端传来的 API Key（Bearer）
    const auth = request.headers.get('Authorization');
    if (!auth) {
      return new Response(JSON.stringify({ error: { message: 'missing Authorization header' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const body = await request.text();

    // 转发到智谱
    const upstream = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth
      },
      body
    });

    const text = await upstream.text();

    // 回给前端的响应带 CORS 头，允许任意来源
    return new Response(text, {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }
};