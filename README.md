# Excel 智能问答

上传 Excel 表格，用大白话提问，AI 直接给答案。

> 应用本体在 [`excel-qa/`](excel-qa/README.md) 子目录：纯静态前端 + 零依赖 Node 转发代理。

```bash
cd excel-qa
npm start        # 起本地代理，默认 http://localhost:8787
# 然后直接用浏览器打开 excel-qa/index.html
```

API Key 只存浏览器 localStorage，不经过任何服务器；模型默认 `qwen-max`，
代理的 `TARGET` 可指向任意 OpenAI 兼容上游。

仓库根目录另存两份调研笔记（`research_report_*.md`）与 `docs/superpowers/plans/` 升级计划，
属于开发过程材料，不参与运行。
