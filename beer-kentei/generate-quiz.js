#!/usr/bin/env node
/**
 * Generates quiz.html from all markdown files in beer-kentei/questions/
 * Displays one question at a time with answer reveal and navigation.
 *
 * Usage: node beer-kentei/generate-quiz.js
 */

const fs = require('fs');
const path = require('path');

const QUESTIONS_DIR = path.join(__dirname, 'questions');
const OUTPUT_FILE = path.join(__dirname, 'quiz.html');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const meta = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let inList = false;

  for (const line of lines) {
    const listItem = line.match(/^\s+-\s+"?(.+?)"?\s*$/);
    const listStart = line.match(/^(\w[\w_-]*):\s*$/);
    const keyValue = line.match(/^(\w[\w_-]*):\s*"?(.+?)"?\s*$/);

    if (listItem && inList) {
      meta[currentKey].push(listItem[1]);
    } else if (listStart) {
      currentKey = listStart[1];
      meta[currentKey] = [];
      inList = true;
    } else if (keyValue) {
      meta[keyValue[1]] = keyValue[2];
      inList = false;
      currentKey = null;
    }
  }

  return { meta, body: match[2].trim() };
}

function extractQuestion(body) {
  const titleMatch = body.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : '';

  const questionMatch = body.match(/## 問題\n\n([\s\S]*?)(?=\n\*\*選択肢\*\*|\n## )/);
  const questionText = questionMatch ? questionMatch[1].trim() : '';

  const choicesMatch = body.match(/\*\*選択肢\*\*\n\n([\s\S]*?)(?=\n## )/);
  const choices = [];
  if (choicesMatch) {
    const choiceLines = choicesMatch[1].trim().split('\n');
    for (const line of choiceLines) {
      const m = line.match(/^-\s+([a-d]\))\s+(.+)$/);
      if (m) choices.push({ key: m[1].replace(')', ''), text: m[2].trim() });
    }
  }

  const answerMatch = body.match(/## 正解\n\n\*\*(.+?)\*\*/);
  const answer = answerMatch ? answerMatch[1].trim() : '';
  const answerKey = answer.match(/^([a-d])/)?.[1] || '';

  const explanationMatch = body.match(/## 解説\n([\s\S]*)$/);
  const explanation = explanationMatch ? explanationMatch[1].trim() : '';

  return { title, questionText, choices, answer, answerKey, explanation };
}

function mdToHtml(md) {
  if (!md) return '';
  let html = md;

  // Code blocks
  html = html.replace(/```[\s\S]*?```/g, m => {
    const code = m.replace(/^```[^\n]*\n/, '').replace(/\n```$/, '');
    return `<pre><code>${escHtml(code)}</code></pre>`;
  });

  // Tables
  html = html.replace(/(\|.+\|\n)+/g, tableStr => {
    const rows = tableStr.trim().split('\n');
    let result = '<table>';
    let isHeader = true;
    for (const row of rows) {
      if (/^\|[-| ]+\|$/.test(row)) { isHeader = false; continue; }
      const cells = row.split('|').slice(1, -1).map(c => c.trim());
      const tag = isHeader ? 'th' : 'td';
      result += '<tr>' + cells.map(c => `<${tag}>${inlineMd(c)}</${tag}>`).join('') + '</tr>';
      if (isHeader) isHeader = false;
    }
    return result + '</table>';
  });

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

  // Unordered lists (group consecutive items)
  html = html.replace(/((?:^- .+\n?)+)/gm, block => {
    const items = block.trim().split('\n').map(l => `<li>${inlineMd(l.replace(/^- /, ''))}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Paragraphs (double newline)
  html = html.replace(/\n{2,}/g, '\n');
  html = html.split('\n').map(line => {
    if (/^<(h[1-6]|ul|ol|li|table|pre|blockquote)/.test(line)) return line;
    if (line.trim() === '') return '';
    return `<p>${inlineMd(line)}</p>`;
  }).join('\n');

  return html;
}

function inlineMd(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateHtml(questions) {
  const date = new Date().toISOString().slice(0, 10);
  const questionsJson = JSON.stringify(questions.map(q => ({
    id: q.meta.id,
    category: q.meta.category || '',
    subcategory: q.meta.subcategory || '',
    difficulty: q.meta.difficulty || '',
    topic: q.meta.topic || '',
    keywords: q.meta.keywords || [],
    title: q.q.title,
    questionText: q.q.questionText,
    choices: q.q.choices,
    answer: q.q.answer,
    answerKey: q.q.answerKey,
    explanationHtml: mdToHtml(q.q.explanation),
  })));

  const categories = [...new Set(questions.map(q => q.meta.category).filter(Boolean))].sort();

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ビール検定 一問一答</title>
  <link rel="stylesheet" href="../styles.css">
  <style>
    .quiz-wrap { max-width: 800px; margin: 0 auto; padding: 2rem 1rem; }

    .quiz-meta { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1rem; align-items: center; }
    .badge { font-size: .75rem; padding: .2rem .6rem; border-radius: 999px; font-weight: 600; }
    .badge-cat { background: #1e3a5f; color: #7eceff; border: 1px solid #7eceff44; }
    .badge-diff-基礎 { background: #1a3a1a; color: #6be86b; border: 1px solid #6be86b44; }
    .badge-diff-応用 { background: #3a2e00; color: #f0c040; border: 1px solid #f0c04044; }
    .badge-diff-発展 { background: #3a1a1a; color: #f07070; border: 1px solid #f0707044; }

    .progress-bar { height: 4px; background: #1a2a3a; border-radius: 2px; margin-bottom: 1.5rem; }
    .progress-fill { height: 100%; background: #7eceff; border-radius: 2px; transition: width .3s; }
    .progress-label { font-size: .8rem; color: #88a0b8; text-align: right; margin-bottom: .3rem; }

    .question-card { background: #0d1f2d; border: 1px solid #1e3a5f; border-radius: 10px; padding: 1.8rem; margin-bottom: 1.5rem; }
    .question-text { font-size: 1.05rem; line-height: 1.8; color: #d8e8f8; margin-bottom: 1.5rem; }
    .choices { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .6rem; }
    .choice-item { padding: .8rem 1.2rem; border-radius: 6px; border: 1px solid #1e3a5f; background: #0a1829; color: #b8cfe8; cursor: default; display: flex; gap: .8rem; transition: background .2s; }
    .choice-key { font-weight: 700; color: #7eceff; min-width: 1.2rem; }
    .choice-item.correct { background: #0a2a0a; border-color: #4a9a4a; color: #a0e0a0; }
    .choice-item.wrong  { background: #2a0a0a; border-color: #9a4a4a; color: #d08080; opacity: .7; }

    .btn-reveal { display: block; width: 100%; padding: .9rem; border: none; border-radius: 6px; background: #7eceff; color: #0a1829; font-size: 1rem; font-weight: 700; cursor: pointer; margin-bottom: 1rem; transition: opacity .2s; }
    .btn-reveal:hover { opacity: .85; }
    .btn-reveal:disabled { opacity: .4; cursor: default; }

    .answer-section { display: none; }
    .answer-section.visible { display: block; }
    .answer-label { font-size: .85rem; color: #88a0b8; margin-bottom: .4rem; }
    .answer-text { font-size: 1.1rem; font-weight: 700; color: #7eceff; margin-bottom: 1.2rem; }
    .explanation { background: #081522; border-left: 3px solid #7eceff44; border-radius: 0 6px 6px 0; padding: 1.2rem 1.4rem; font-size: .92rem; line-height: 1.8; color: #b0c8e0; }
    .explanation h3 { color: #7eceff; font-size: 1rem; margin: 1.2rem 0 .4rem; }
    .explanation h4 { color: #a8c8e8; font-size: .9rem; margin: 1rem 0 .3rem; }
    .explanation table { border-collapse: collapse; width: 100%; margin: .8rem 0; font-size: .85rem; }
    .explanation th, .explanation td { border: 1px solid #1e3a5f; padding: .4rem .7rem; text-align: left; }
    .explanation th { background: #0d1f2d; color: #7eceff; }
    .explanation ul { padding-left: 1.4rem; margin: .5rem 0; }
    .explanation p { margin: .5rem 0; }
    .explanation strong { color: #e8d890; }
    .explanation code { background: #0a1829; padding: .1rem .4rem; border-radius: 3px; font-size: .85em; }
    .explanation pre { background: #0a1829; border: 1px solid #1e3a5f; border-radius: 6px; padding: 1rem; overflow-x: auto; }

    .nav-row { display: flex; gap: .8rem; align-items: center; justify-content: space-between; }
    .btn-nav { padding: .7rem 1.4rem; border: 1px solid #1e3a5f; border-radius: 6px; background: #0d1f2d; color: #7eceff; font-size: .9rem; cursor: pointer; transition: background .2s; }
    .btn-nav:hover { background: #1e3a5f; }
    .btn-nav:disabled { opacity: .3; cursor: default; }

    .filter-row { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1.5rem; }
    .filter-btn { padding: .35rem .9rem; border: 1px solid #1e3a5f; border-radius: 999px; background: #0d1f2d; color: #88a0b8; font-size: .8rem; cursor: pointer; transition: all .2s; }
    .filter-btn.active { background: #1e3a5f; color: #7eceff; border-color: #7eceff; }

    .shuffle-row { display: flex; gap: .5rem; margin-bottom: 1rem; align-items: center; }
    .btn-shuffle { padding: .4rem 1rem; border: 1px solid #1e3a5f; border-radius: 6px; background: #0d1f2d; color: #88a0b8; font-size: .85rem; cursor: pointer; }
    .btn-shuffle:hover { background: #1e3a5f; color: #7eceff; }
    .score-label { font-size: .85rem; color: #88a0b8; margin-left: auto; }
  </style>
</head>
<body>
  <header>
    <div class="label"><a href="../index.html" style="color:#7eceff;text-decoration:none;">← レポート一覧</a></div>
    <h1>ビール検定 一問一答</h1>
    <p>生成日: ${date} / ${questions.length}問収録</p>
  </header>

  <main class="quiz-wrap">
    <!-- フィルター -->
    <div class="filter-row" id="filterRow">
      <button class="filter-btn active" data-cat="">すべて</button>
      ${categories.map(c => `<button class="filter-btn" data-cat="${c}">${c}</button>`).join('\n      ')}
    </div>

    <div class="shuffle-row">
      <button class="btn-shuffle" id="btnShuffle">🔀 シャッフル</button>
      <button class="btn-shuffle" id="btnReset">順番に戻す</button>
      <span class="score-label" id="scoreLabel"></span>
    </div>

    <!-- プログレス -->
    <div class="progress-label" id="progressLabel"></div>
    <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>

    <!-- 問題カード -->
    <div class="quiz-meta" id="quizMeta"></div>
    <div class="question-card">
      <div class="question-text" id="questionText"></div>
      <ul class="choices" id="choiceList"></ul>
    </div>

    <button class="btn-reveal" id="btnReveal">答えを見る</button>

    <div class="answer-section" id="answerSection">
      <div class="answer-label">正解</div>
      <div class="answer-text" id="answerText"></div>
      <div class="explanation" id="explanationDiv"></div>
    </div>

    <!-- ナビゲーション -->
    <div class="nav-row" style="margin-top:1.5rem;">
      <button class="btn-nav" id="btnPrev">← 前の問題</button>
      <button class="btn-nav" id="btnNext">次の問題 →</button>
    </div>
  </main>

  <footer>
    <p>ビール検定 一問一答 — generate-quiz.js により自動生成</p>
    <p><a href="../index.html">← レポート一覧に戻る</a></p>
  </footer>

  <script>
    const ALL = ${questionsJson};

    let deck = [...ALL];
    let idx = 0;
    let revealed = false;
    let correctCount = 0;
    let answeredSet = new Set();
    let currentCat = '';

    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    function applyFilter(cat) {
      currentCat = cat;
      deck = cat ? ALL.filter(q => q.category === cat) : [...ALL];
      idx = 0;
      correctCount = 0;
      answeredSet = new Set();
      render();
    }

    function render() {
      if (deck.length === 0) {
        document.getElementById('questionText').textContent = '該当する問題がありません。';
        document.getElementById('choiceList').innerHTML = '';
        document.getElementById('quizMeta').innerHTML = '';
        document.getElementById('progressLabel').textContent = '';
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('btnReveal').disabled = true;
        document.getElementById('answerSection').classList.remove('visible');
        return;
      }

      const q = deck[idx];
      revealed = false;

      // progress
      const pct = Math.round((idx / deck.length) * 100);
      document.getElementById('progressLabel').textContent = \`\${idx + 1} / \${deck.length}問\`;
      document.getElementById('progressFill').style.width = pct + '%';
      document.getElementById('scoreLabel').textContent =
        answeredSet.size > 0 ? \`正解 \${correctCount} / \${answeredSet.size}問\` : '';

      // meta badges
      const diffClass = 'badge-diff-' + (q.difficulty || '');
      document.getElementById('quizMeta').innerHTML =
        \`<span class="badge badge-cat">\${q.category}</span>\` +
        (q.subcategory ? \`<span class="badge badge-cat" style="opacity:.7">\${q.subcategory}</span>\` : '') +
        (q.difficulty ? \`<span class="badge \${diffClass}">\${q.difficulty}</span>\` : '');

      // question
      document.getElementById('questionText').textContent = q.questionText || q.title;

      // choices
      const ul = document.getElementById('choiceList');
      ul.innerHTML = '';
      for (const c of q.choices) {
        const li = document.createElement('li');
        li.className = 'choice-item';
        li.innerHTML = \`<span class="choice-key">\${c.key})</span><span>\${c.text}</span>\`;
        ul.appendChild(li);
      }

      // answer section hidden
      document.getElementById('answerSection').classList.remove('visible');
      document.getElementById('btnReveal').disabled = false;
      document.getElementById('btnReveal').textContent = '答えを見る';

      // nav
      document.getElementById('btnPrev').disabled = idx === 0;
      document.getElementById('btnNext').disabled = idx === deck.length - 1;
    }

    function reveal() {
      if (revealed) return;
      revealed = true;
      const q = deck[idx];

      // highlight choices
      const items = document.getElementById('choiceList').children;
      for (const li of items) {
        const key = li.querySelector('.choice-key').textContent.replace(')', '');
        if (key === q.answerKey) li.classList.add('correct');
        else li.classList.add('wrong');
      }

      document.getElementById('answerText').textContent = q.answer;
      document.getElementById('explanationDiv').innerHTML = q.explanationHtml;
      document.getElementById('answerSection').classList.add('visible');
      document.getElementById('btnReveal').disabled = true;

      if (!answeredSet.has(idx)) {
        answeredSet.add(idx);
        correctCount++;
      }
      document.getElementById('scoreLabel').textContent =
        \`正解 \${correctCount} / \${answeredSet.size}問\`;
    }

    document.getElementById('btnReveal').addEventListener('click', reveal);

    document.getElementById('btnPrev').addEventListener('click', () => {
      if (idx > 0) { idx--; render(); }
    });
    document.getElementById('btnNext').addEventListener('click', () => {
      if (idx < deck.length - 1) { idx++; render(); }
    });

    document.getElementById('btnShuffle').addEventListener('click', () => {
      shuffle(deck);
      idx = 0;
      correctCount = 0;
      answeredSet = new Set();
      render();
    });
    document.getElementById('btnReset').addEventListener('click', () => {
      deck = currentCat ? ALL.filter(q => q.category === currentCat) : [...ALL];
      idx = 0;
      correctCount = 0;
      answeredSet = new Set();
      render();
    });

    document.getElementById('filterRow').addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.cat);
    });

    // keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!revealed) reveal(); }
      if (e.key === 'ArrowRight' || e.key === 'n') document.getElementById('btnNext').click();
      if (e.key === 'ArrowLeft'  || e.key === 'p') document.getElementById('btnPrev').click();
    });

    render();
  </script>
</body>
</html>`;
}

function main() {
  const files = fs.readdirSync(QUESTIONS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  const questions = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(QUESTIONS_DIR, file), 'utf-8');
    const parsed = parseFrontmatter(content);
    if (!parsed) { console.warn(`  ⚠ Skipping ${file}: no frontmatter`); continue; }

    const q = extractQuestion(parsed.body);
    questions.push({ file, meta: parsed.meta, q });
    console.log(`  ✓ ${file}`);
  }

  const html = generateHtml(questions);
  fs.writeFileSync(OUTPUT_FILE, html, 'utf-8');

  console.log('');
  console.log(`Generated: ${OUTPUT_FILE}`);
  console.log(`  ${questions.length} questions`);
}

main();
