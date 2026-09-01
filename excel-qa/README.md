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
