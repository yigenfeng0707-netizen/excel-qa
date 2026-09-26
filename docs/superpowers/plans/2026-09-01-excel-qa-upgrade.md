# Excel 智能问答应用完整升级计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `excel-qa/index.html` 单文件应用升级为结构化、有版本管理、有本地代理、可导出记录的项目。

**Architecture:** 保持"纯静态前端 + 零依赖 Node 代理"的轻量架构。前端拆分为 `index.html / css/style.css / js/app.js` 三件套；新增 Node 内置 `http`/`https` 模块编写的转发代理，解决浏览器直调 DashScope 的 CORS 问题；问答历史支持一键导出 Markdown。

**Tech Stack:** 原生 HTML/CSS/JavaScript、SheetJS (xlsx, CDN 引入)、Node.js（仅内置模块，无 npm 依赖）、Git。

**现状基线：**
- 当前 `excel-qa/index.html` 共 250 行：CSS 内联在 `<style>`（第 7–73 行），JS 内联在 `<script>`（第 133–248 行），另有一行 CDN 引入 `<script src="https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js"></script>`（第 132 行）。
- 工作区 `d:\APPs\qianwenVibeCoding` **尚未 git init**。
- 所有 shell 命令在 PowerShell 中执行，语句分隔用 `;` 不用 `&&`。

**目标文件结构：**

```
excel-qa/
├── index.html        # 仅保留 HTML 结构，外链 css/js
├── css/style.css     # 从 index.html 抽出的全部样式
├── js/app.js         # 从 index.html 抽出的全部脚本
├── server/proxy.js   # 零依赖 Node 转发代理
├── package.json      # 提供 npm start 启动代理
└── README.md         # 项目说明文档
```

---

### Task 1: 初始化 Git 仓库并建立首次提交

**Files:**
- Create: `d:\APPs\qianwenVibeCoding\.gitignore`

- [x] **Step 1: 创建 .gitignore**

在工作区根目录 `d:\APPs\qianwenVibeCoding` 创建 `.gitignore`，内容如下（忽略 AI 工具生成的二进制索引与运行时文件，保留 `.codeartsdoer` 中的 agent/skill 配置）：

```gitignore
# codegraph 二进制索引与运行时文件
.codegraph/

# 系统与编辑器
Thumbs.db
Desktop.ini
.vscode/
.idea/

# Node
node_modules/
```

- [x] **Step 2: git init 并首次提交**

```powershell
cd d:\APPs\qianwenVibeCoding; git init; git add .; git commit -m "chore: initial commit - excel-qa app, research reports and configs"
```

预期输出：`[main (root-commit) xxxx] ...`，列出 excel-qa/index.html、两份研究报告、.gitignore 及 .codeartsdoer 配置文件。

- [x] **Step 3: 验证提交结果**

```powershell
git log --oneline; git status
```

预期：显示 1 条 root-commit，`git status` 显示 working tree clean。

---

### Task 2: 拆分 CSS 到独立文件

**Files:**
- Create: `excel-qa/css/style.css`
- Modify: `excel-qa/index.html`

- [x] **Step 1: 创建 css/style.css**

新建 `excel-qa/css/style.css`，内容 = `index.html` 中 `<style>` 标签（第 7–73 行）的全部内部文本，即从 `:root{` 第一行到 `@media(max-width:600px){.settings-row{grid-template-columns:1fr}.qa-input{flex-direction:column}}` 最后一行，原样复制，不加 `<style>` 标签。

- [x] **Step 2: 修改 index.html 引用外部样式**

在 `index.html` 中将整个 `<style>...</style>` 块（含标签本身）替换为一行外链：

```html
<link rel="stylesheet" href="css/style.css">
```

替换后 `index.html` 的 `<head>` 应为：

```html
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Excel 智能问答 · 大白话查数据</title>
<link rel="stylesheet" href="css/style.css">
</head>
```

- [x] **Step 3: 浏览器验证样式正常**

用浏览器打开 `d:\APPs\qianwenVibeCoding\excel-qa\index.html`（或 `Start-Process d:\APPs\qianwenVibeCoding\excel-qa\index.html`）。
预期：页面仍为渐变标题「📊 Excel 智能问答」、虚线上传框、卡片圆角阴影样式，与拆分前完全一致。按 F12 查看 Console 无 404。

- [x] **Step 4: 提交**

```powershell
cd d:\APPs\qianwenVibeCoding; git add excel-qa/css/style.css excel-qa/index.html; git commit -m "refactor: extract inline CSS into css/style.css"
```

---

### Task 3: 拆分 JS 到独立文件

**Files:**
- Create: `excel-qa/js/app.js`
- Modify: `excel-qa/index.html`

- [x] **Step 1: 创建 js/app.js**

新建 `excel-qa/js/app.js`，内容 = `index.html` 中第二个 `<script>` 标签（原第 133–248 行）的全部内部文本，即从 `const $=id=>document.getElementById(id);` 到最后一行 `$('question').addEventListener('keydown',...`，原样复制，不加 `<script>` 标签。

- [x] **Step 2: 修改 index.html 引用外部脚本**

将 `<script>` 内联块（含标签本身）整体替换为带 `defer` 的外链，放在 SheetJS CDN 引入之后（defer 保证执行顺序在 DOM 之后，且不依赖内联位置）：

```html
<script src="https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js"></script>
<script src="js/app.js" defer></script>
```

- [x] **Step 3: 浏览器验证功能正常**

刷新页面，按 F12 确认 Console 无报错。验证三条主链路：
1. 拖入一个 `.xlsx` 文件 → 出现表格预览和「行 × 列」信息；
2. 出现 4 个建议问题按钮；
3. 填入任意 API Key 并点击提问 → 按钮变为「思考中」并进入请求流程（此时允许因 Key 无效/CORS 失败，重点是 JS 已加载运行）。

- [x] **Step 4: 提交**

```powershell
cd d:\APPs\qianwenVibeCoding; git add excel-qa/js/app.js excel-qa/index.html; git commit -m "refactor: extract inline JavaScript into js/app.js"
```

---

### Task 4: 编写零依赖 Node 转发代理

**Files:**
- Create: `excel-qa/server/proxy.js`
- Create: `excel-qa/package.json`

- [x] **Step 1: 创建 server/proxy.js**

```js
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
      upRes.pipe(res);
    });
    upstream.on('error', err => {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: { message: '代理请求上游失败: ' + err.message, type: 'proxy_upstream_error' } }));
    });
    upstream.write(body);
    upstream.end();
  });
});

server.listen(PORT, () => {
  console.log(`[excel-qa proxy] http://localhost:${PORT}/chat/completions  ->  ${TARGET}/chat/completions`);
  console.log('[excel-qa proxy] 页面「接口前缀」请填: http://localhost:8787');
});
```

- [x] **Step 2: 创建 package.json**

```json
{
  "name": "excel-qa",
  "version": "1.0.0",
  "description": "上传 Excel · 大白话提问 · AI 直接给答案",
  "private": true,
  "scripts": {
    "start": "node server/proxy.js"
  }
}
```

- [x] **Step 3: 启动代理并验证**

后台启动（PowerShell）：

```powershell
cd d:\APPs\qianwenVibeCoding\excel-qa; node server/proxy.js
```

预期控制台输出两行 `[excel-qa proxy] ...`。保持其运行，另开终端验证：

```powershell
curl.exe -i -X POST http://localhost:8787/chat/completions -H "Content-Type: application/json" -d "{}"
```

预期：返回 `HTTP/1.1 200`（DashScope 对空 body 返回 4xx JSON 也算通过——关键是**响应头含 `Access-Control-Allow-Origin: *`** 且返回的是上游 JSON 而非连接失败）。再验证 404 路径：

```powershell
curl.exe -i http://localhost:8787/other
```

预期：`HTTP/1.1 404`，body 为 `{"error":{"message":"仅支持 POST /chat/completions",...}}`。

- [x] **Step 4: 提交**

```powershell
cd d:\APPs\qianwenVibeCoding; git add excel-qa/server/proxy.js excel-qa/package.json; git commit -m "feat: add zero-dependency Node proxy to bypass CORS"
```

---

### Task 5: 前端接入代理并更新提示文案

**Files:**
- Modify: `excel-qa/index.html`（设置区 HTML，约第 119–127 行）
- Modify: `excel-qa/js/app.js`（endpoint 默认值）

- [x] **Step 1: 修改 js/app.js 默认 endpoint（无 localStorage 时生效）**

找到 `index.html` 原有 `<input id="endpoint" value="https://dashscope.aliyuncs.com/compatible-mode/v1">` 对应的 HTML（在 index.html 中修改，见 Step 2），JS 中 `cfg.endpoint` 为空时输入框即使用该 value，无需改 JS 逻辑。仅确认 `saveCfg` 读取的是输入框值即可，不动代码。

- [x] **Step 2: 修改 index.html 设置区默认值与提示**

1) 将接口前缀输入框默认值改为本地代理：

```html
<input type="text" id="endpoint" value="http://localhost:8787">
```

2) 将 `<p class="tip">` 的提示文案整体替换为：

```html
<p class="tip">
  💡 Key 在 <code>bailian.console.aliyun.com</code> → API-KEY → 创建。<br>
  💡 默认通过本地代理 <code>http://localhost:8787</code> 转发以避免跨域，先运行 <code>npm start</code>（在 excel-qa 目录下）。<br>
  💡 若不想跑代理，可把「接口前缀」改回 <code>https://dashscope.aliyuncs.com/compatible-mode/v1</code> 直连，跨域失败时再启用代理。<br>
  💡 Key 仅存在本浏览器(localStorage)，不会上传服务器。
</p>
```

3) 同时把「思考中/失败提示」中关于跨域的措辞保持不变即可（app.js 第 234 行错误提示已覆盖代理场景，无需改动）。

- [x] **Step 3: 端到端验证**

保持代理运行，浏览器打开页面：
1. 设置区「接口前缀」显示 `http://localhost:8787`；
2. 填入真实 DashScope Key，上传一个 xlsx，点击建议问题「这张表有哪些字段，分别是什么意思」；
3. 预期：正常返回 AI 回答并写入历史列表（不再出现 CORS 报错）。

- [x] **Step 4: 提交**

```powershell
cd d:\APPs\qianwenVibeCoding; git add excel-qa/index.html; git commit -m "feat: default endpoint to local proxy and update setup tips"
```

---

### Task 6: 新增问答记录导出功能

**Files:**
- Modify: `excel-qa/index.html`（问答卡片区，约第 95–103 行）
- Modify: `excel-qa/js/app.js`

- [x] **Step 1: index.html 增加导出按钮**

将问答卡片标题行改为带导出按钮的布局：

```html
<div class="card">
  <h2><span class="num">2</span>用大白话提问</h2>
  <button id="exportBtn" class="ghost" style="float:right;margin:-4px 0 0">导出记录</button>
  <div class="qa-input">
    <textarea id="question" placeholder="例如：3月销量最高的产品是哪个？总销售额多少？"></textarea>
    <button id="askBtn" disabled>提问</button>
  </div>
  <div style="clear:both"></div>
  <div class="suggest" id="suggest"></div>
  <div class="answer" id="answer" style="display:none"></div>
  <div class="history" id="history"></div>
</div>
```

（相对原文件的差异：新增 `#exportBtn` 与其后的 `clear:both` 分隔 div，其余结构不变。）

- [x] **Step 2: js/app.js 增加 exportHistory 并绑定**

在 `addHistory` 函数之后、`escapeHtml` 之前追加：

```js
function exportHistory(){
  const items=[...document.querySelectorAll('#history .item')].map(el=>{
    const q=el.querySelector('.q').textContent.replace(/^Q：/,'');
    const a=el.querySelector('.a').textContent;
    return `## 问：${q}\n\n${a}`;
  });
  if(!items.length){alert('暂无问答记录，先完成一次提问吧');return}
  const md=`# Excel 问答记录\n\n> 文件：${tableData?tableData.name:''} · 导出时间：${new Date().toLocaleString()}\n\n${items.join('\n\n---\n\n')}`;
  const blob=new Blob([md],{type:'text/markdown;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='excel-qa-history.md';
  a.click();
  URL.revokeObjectURL(a.href);
}
```

在文件末尾事件绑定区（`$('askBtn').addEventListener...` 之前）追加：

```js
$('exportBtn').addEventListener('click',exportHistory);
```

- [x] **Step 3: 浏览器验证**

1. 空历史时点「导出记录」→ 弹出「暂无问答记录」；
2. 完成一次提问后导出 → 下载 `excel-qa-history.md`，打开为 Markdown，含「文件名、导出时间、问题与回答」。

- [x] **Step 4: 提交**

```powershell
cd d:\APPs\qianwenVibeCoding; git add excel-qa/index.html excel-qa/js/app.js; git commit -m "feat: export Q&A history as Markdown"
```

---

### Task 7: 编写 README 并收尾

**Files:**
- Create: `excel-qa/README.md`

- [x] **Step 1: 创建 excel-qa/README.md**

````markdown
# Excel 智能问答 · 大白话查数据

上传 Excel 表格，用大白话提问，AI 直接给答案——不用懂任何公式。

## 功能

- 📤 上传 `.xlsx / .xls / .csv`，自动解析并预览前 10 行
- 💬 大白话提问（支持排序 / 求和 / 求平均 / 字段解释 / 数据总结）
- 💡 根据表头自动生成快捷问题建议
- 📜 问答历史记录，一键导出 Markdown
- 🔒 API Key 仅存浏览器 localStorage，不经过任何服务器

## 快速开始

### 1. 启动本地代理（推荐，避免跨域）

依赖 Node.js（无需安装任何 npm 包）：

```bash
cd excel-qa
npm start
# 或: node server/proxy.js
```

代理默认监听 `http://localhost:8787`，转发到 DashScope OpenAI 兼容接口。
可用环境变量覆盖：`PORT`、`TARGET`（任意 OpenAI 兼容上游）。

### 2. 打开页面

直接双击打开 `index.html`（或用任意静态服务器托管本目录）。

### 3. 配置 Key

在页面下方「设置」中填入 DashScope API Key（[百炼控制台](https://bailian.console.aliyun.com) → API-KEY → 创建），
模型默认 `qwen-max`，可改为 `qwen-plus` / `qwen3-max` 等。

## 目录结构

```
excel-qa/
├── index.html        # 页面结构
├── css/style.css     # 样式
├── js/app.js         # 全部前端逻辑
├── server/proxy.js   # 零依赖 Node 转发代理
├── package.json      # npm start 启动脚本
└── README.md
```

## 常见问题

- **跨域(CORS)报错**：使用本地代理即可解决；或把「接口前缀」改成你的自建代理地址。
- **大数据表**：目前仅将前 25 行样例发给模型，超大数据请先筛选/抽样。
- **Key 安全**：Key 只存在本浏览器，代理也不落盘记录，但请勿在公共电脑保存。
````

- [x] **Step 2: 全量回归验证**

1. `npm start` 启动代理 → 正常打印监听日志；
2. 打开页面：上传 → 预览 → 提问 → 回答 → 导出，全链路可用；
3. 控制台（浏览器 F12 与代理终端）均无报错。

- [x] **Step 3: 提交并核对最终状态**

```powershell
cd d:\APPs\qianwenVibeCoding; git add excel-qa/README.md; git commit -m "docs: add excel-qa README"
git log --oneline
```

预期共 7 条提交，`git status` clean：

```
xxxx docs: add excel-qa README
xxxx feat: export Q&A history as Markdown
xxxx feat: default endpoint to local proxy and update setup tips
xxxx feat: add zero-dependency Node proxy to bypass CORS
xxxx refactor: extract inline JavaScript into js/app.js
xxxx refactor: extract inline CSS into css/style.css
xxxx chore: initial commit - ...
```

---

## 范围之外（本次不做，YAGNI）

- 多工作表切换（目前固定取第一个 sheet）
- 前端测试框架引入（纯静态单页，人工验证成本低于搭建成本）
- 代理鉴权 / HTTPS（仅本机使用场景）
- 大表格分页发送 / 流式输出

## 风险与回滚

- 所有改动按 Task 分提交，任一步出问题 `git revert <hash>` 即可回滚。
- Task 5 修改了默认 endpoint，已使用过页面的用户 localStorage 中存有旧地址：页面提示文案已说明两种前缀均可，属可接受的兼容性差异。
