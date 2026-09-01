// excel-qa 本地转发代理：解决浏览器直调 DashScope 的 CORS 问题
// 用法: node server/proxy.js   （或 npm start）
// 可用环境变量覆盖: PORT(默认 8787), TARGET(默认 DashScope OpenAI 兼容地址)
const http = require('http');
const https = require('https');

const PORT = Number(process.env.PORT) || 8787;
const TARGET = (process.env.TARGET || 'https://dashscope.aliyuncs.com/compatible-mode/v1').replace(/\/+$/, '');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

const server = http.createServer((req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method !== 'POST' || req.url.split('?')[0] !== '/chat/completions') {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: { message: '仅支持 POST /chat/completions', type: 'proxy_not_found' } }));
    return;
  }

  req.setEncoding('utf8');
  let body = '';
  req.on('data', c => { body += c; });
  req.on('end', () => {
    const target = new URL(TARGET + '/chat/completions');
    const lib = target.protocol === 'https:' ? https : http;
    const upstream = lib.request({
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      path: target.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers['authorization'] || '',
        'Content-Length': Buffer.byteLength(body)
      }
    }, upRes => {
      res.writeHead(upRes.statusCode || 502, { 'Content-Type': 'application/json; charset=utf-8' });
      upRes.on('error', () => { res.destroy(); });
      upRes.pipe(res);
    });
    upstream.on('error', err => {
      if (res.headersSent) { res.destroy(); return; }
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: { message: '代理请求上游失败: ' + err.message, type: 'proxy_upstream_error' } }));
    });
    upstream.write(body);
    upstream.end();
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[excel-qa proxy] http://localhost:${PORT}/chat/completions  ->  ${TARGET}/chat/completions`);
  console.log(`[excel-qa proxy] 页面「接口前缀」请填: http://localhost:${PORT}`);
});
