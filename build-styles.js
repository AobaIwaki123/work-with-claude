#!/usr/bin/env node
// theme.json を読み込んで styles.css を生成する
const fs = require("fs");
const path = require("path");

const theme = JSON.parse(fs.readFileSync(path.join(__dirname, "theme.json"), "utf8"));
const f = theme.fontSize;
const lh = theme.lineHeight;

const css = `/* ============================================================
   styles.css — 自動生成ファイル
   編集するには theme.json を変更して node build-styles.js を実行
   ============================================================ */

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: ${f.base};
  line-height: ${lh.base};
  color: #1a1a2e;
  background: #f4f6fb;
}

header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
  color: #fff;
  padding: 48px 40px 36px;
}
header .label {
  font-size: ${f.xsmall};
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #7eceff;
  margin-bottom: 12px;
}
header h1 {
  font-size: ${f.h1};
  font-weight: 700;
  margin-bottom: 10px;
}
header .meta {
  font-size: ${f.small};
  color: #a0b4c8;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}

/* TOC */
.toc {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 24px 28px;
  margin-bottom: 40px;
}
.toc h2 {
  font-size: ${f.tocLabel};
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 14px;
}
.toc ol { padding-left: 20px; }
.toc li { margin: 5px 0; }
.toc a {
  color: #0f3460;
  text-decoration: none;
  font-size: ${f.toc};
}
.toc a:hover { text-decoration: underline; }

/* Sections */
section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 32px 36px;
  margin-bottom: 28px;
}
section h2 {
  font-size: ${f.h2};
  font-weight: 700;
  color: #0f3460;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 12px;
  margin-bottom: 20px;
}
section h3 {
  font-size: ${f.h3};
  font-weight: 700;
  color: #1a1a2e;
  margin: 24px 0 10px;
}
p { margin-bottom: 12px; }

/* Table */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: ${f.table};
  margin: 16px 0;
}
th {
  background: #f1f5f9;
  text-align: left;
  padding: 10px 14px;
  font-size: ${f.tableHeader};
  letter-spacing: 0.5px;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
}
td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}
tr:last-child td { border-bottom: none; }
tr:hover td { background: #f8fafc; }

/* Code */
pre {
  border-radius: 8px;
  margin: 14px 0;
  overflow: hidden;
}
pre code {
  display: block;
  font-size: ${f.code};
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
}
:not(pre) > code {
  background: #f1f5f9;
  color: #0f3460;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: ${f.code};
}

/* Callout boxes */
.callout {
  border-left: 4px solid;
  border-radius: 0 8px 8px 0;
  padding: 14px 18px;
  margin: 16px 0;
  font-size: ${f.callout};
}
.callout.info    { border-color: #3b82f6; background: #eff6ff; }
.callout.warn    { border-color: #f59e0b; background: #fffbeb; }
.callout.danger  { border-color: #ef4444; background: #fef2f2; }
.callout.success { border-color: #10b981; background: #ecfdf5; }
.callout strong  { display: block; margin-bottom: 4px; }

/* Badge */
.badge {
  display: inline-block;
  font-size: ${f.badge};
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  letter-spacing: 0.3px;
}
.badge.green  { background: #dcfce7; color: #15803d; }
.badge.red    { background: #fee2e2; color: #b91c1c; }
.badge.blue   { background: #dbeafe; color: #1d4ed8; }
.badge.gray   { background: #f1f5f9; color: #475569; }

/* Architecture diagram */
.arch {
  background: #1e293b;
  color: #94a3b8;
  border-radius: 8px;
  padding: 20px 22px;
  font-family: monospace;
  font-size: ${f.code};
  line-height: 1.8;
  margin: 14px 0;
}
.arch .highlight { color: #7eceff; }
.arch .green     { color: #6ee7b7; }
.arch .yellow    { color: #fde68a; }

/* Flow */
.flow { display: flex; flex-direction: column; gap: 0; margin: 16px 0; }
.flow-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px dashed #e2e8f0;
  font-size: ${f.flow};
}
.flow-item:last-child { border-bottom: none; }
.flow-num {
  min-width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #0f3460;
  color: #fff;
  font-size: ${f.xsmall};
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

/* Error box */
.error-box {
  border: 1px solid #fca5a5;
  border-radius: 8px;
  padding: 20px 22px;
  background: #fef2f2;
  font-size: ${f.errorBox};
  margin: 16px 0;
}
.error-box h4 { color: #b91c1c; font-size: ${f.h3}; margin-bottom: 10px; }

footer {
  text-align: center;
  color: #94a3b8;
  font-size: ${f.footer};
  margin-top: 60px;
}
`;

// responsive media queries
function scale(px, ratio) {
  return Math.round(parseInt(px) * ratio) + "px";
}

const mediaQueries = Object.entries(theme.responsive || {}).map(([, bp]) => {
  const s = bp.scale;
  return `
@media (min-width: ${bp.minWidth}) {
  .container    { max-width: ${bp.containerWidth}; }
  body          { font-size: ${scale(f.base, s)}; }
  header .label { font-size: ${scale(f.xsmall, s)}; }
  header h1     { font-size: ${scale(f.h1, s)}; }
  header .meta  { font-size: ${scale(f.small, s)}; }
  .toc h2       { font-size: ${scale(f.tocLabel, s)}; }
  .toc a        { font-size: ${scale(f.toc, s)}; }
  section h2    { font-size: ${scale(f.h2, s)}; }
  section h3    { font-size: ${scale(f.h3, s)}; }
  table         { font-size: ${scale(f.table, s)}; }
  th            { font-size: ${scale(f.tableHeader, s)}; }
  pre, code, .arch { font-size: ${scale(f.code, s)}; }
  .callout      { font-size: ${scale(f.callout, s)}; }
  .badge        { font-size: ${scale(f.badge, s)}; }
  .flow-item    { font-size: ${scale(f.flow, s)}; }
  .error-box    { font-size: ${scale(f.errorBox, s)}; }
  .error-box h4 { font-size: ${scale(f.h3, s)}; }
  footer        { font-size: ${scale(f.footer, s)}; }
}`;
}).join("\n");

const fullCss = css + mediaQueries;
fs.writeFileSync(path.join(__dirname, "styles.css"), fullCss, "utf8");
console.log("styles.css を生成しました（theme.json から）");

