#!/usr/bin/env node
/**
 * Generates glossary.md from all markdown files in beer-kentei/terms/
 * Handles two types:
 *   tree-*.md  (type: mece-tree)  → rendered as classification trees
 *   term-*.md  (type: term)       → rendered as grouped term definitions
 *
 * Usage: node beer-kentei/generate-glossary.js
 */

const fs = require('fs');
const path = require('path');

const TERMS_DIR = path.join(__dirname, 'terms');
const OUTPUT_FILE = path.join(__dirname, 'glossary.md');

const CATEGORY_ORDER = [
  '原材料',
  '醸造工程',
  'ビアスタイル',
  '歴史・文化',
  '法規制',
  'ブランド・銘柄',
];

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

function extractTreeSections(body) {
  const treeBlockMatch = body.match(/## 分類ツリー\n\n```\n([\s\S]*?)```/);
  const whyMeceMatch = body.match(/## なぜMECEか\n\n([\s\S]*?)(?=\n## )/);
  const studyMatch = body.match(/## 試験対策ポイント\n\n([\s\S]*?)(?=\n## |$)/);

  return {
    tree: treeBlockMatch ? treeBlockMatch[1].trim() : '',
    whyMece: whyMeceMatch ? whyMeceMatch[1].trim() : '',
    studyTips: studyMatch ? studyMatch[1].trim() : '',
  };
}

function extractTermSections(body) {
  const definitionMatch = body.match(/## 定義\n\n([\s\S]*?)(?=\n## )/);
  const detailMatch = body.match(/## 詳細説明\n\n([\s\S]*?)(?=\n## )/);
  const relevanceMatch = body.match(/## ビール検定との関連\n\n([\s\S]*?)(?=\n## )/);

  return {
    definition: definitionMatch ? definitionMatch[1].trim() : '',
    detail: detailMatch ? detailMatch[1].trim() : '',
    relevance: relevanceMatch ? relevanceMatch[1].trim() : '',
  };
}

function buildAnchor(text) {
  return text.replace(/[・\s]/g, '').toLowerCase();
}

function generateGlossary(trees, termsByCategory) {
  const lines = [];
  const date = new Date().toISOString().slice(0, 10);

  const totalTerms = Object.values(termsByCategory).reduce((s, arr) => s + arr.length, 0);

  lines.push('# ビール検定 用語集');
  lines.push('');
  lines.push(`> 生成日: ${date}  `);
  lines.push(`> 分類ツリー: ${trees.length}件 / 用語定義: ${totalTerms}件`);
  lines.push('');

  // Table of Contents
  lines.push('## 目次');
  lines.push('');
  lines.push('- [分類ツリー（MECEで整理できる概念）](#分類ツリー)');
  for (const t of trees) {
    lines.push(`  - [${t.meta.root_term}](#${buildAnchor(t.meta.root_term)})`);
  }
  lines.push('- [用語定義（独立した概念）](#用語定義)');
  const orderedCats = [
    ...CATEGORY_ORDER.filter(c => termsByCategory[c]),
    ...Object.keys(termsByCategory).filter(c => !CATEGORY_ORDER.includes(c)),
  ];
  for (const cat of orderedCats) {
    lines.push(`  - [${cat}](#${buildAnchor(cat)})（${termsByCategory[cat].length}件）`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // MECE Tree Section
  lines.push('## 分類ツリー');
  lines.push('');
  lines.push('> MECEに整理できる概念。同レベルの項目は互いに重複せず、列挙が原則として完全。');
  lines.push('');

  for (const entry of trees) {
    const { meta } = entry;
    const sections = extractTreeSections(entry.body);

    lines.push(`### ${meta.root_term}`);
    lines.push('');
    lines.push(`**カテゴリ**: ${meta.category || '—'}  `);
    if (meta.description) lines.push(`**概要**: ${meta.description}`);
    lines.push('');

    if (sections.whyMece) {
      lines.push('**MECEである理由**');
      lines.push('');
      lines.push(sections.whyMece);
      lines.push('');
    }

    if (sections.tree) {
      lines.push('```');
      lines.push(sections.tree);
      lines.push('```');
      lines.push('');
    }

    if (meta.covered_terms && meta.covered_terms.length > 0) {
      lines.push(`**収録項目**: ${meta.covered_terms.join(' / ')}`);
      lines.push('');
    }

    if (meta.related_questions && meta.related_questions.length > 0) {
      lines.push(`**関連問題**: ${meta.related_questions.map(q => `Q${q}`).join(', ')}`);
      lines.push('');
    }

    if (sections.studyTips) {
      lines.push('**試験対策ポイント**');
      lines.push('');
      lines.push(sections.studyTips);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  // Term Definition Section
  lines.push('## 用語定義');
  lines.push('');
  lines.push('> MECEツリーに収まらない独立した概念の定義。プロセス・測定値・技法・固有名詞など。');
  lines.push('');

  for (const cat of orderedCats) {
    lines.push(`### ${cat}`);
    lines.push('');

    const entries = termsByCategory[cat].sort((a, b) =>
      (a.meta.term || '').localeCompare(b.meta.term || '', 'ja')
    );

    for (const entry of entries) {
      const { meta } = entry;
      const sections = extractTermSections(entry.body);

      const titleParts = [meta.term];
      if (meta.english) titleParts.push(`*${meta.english}*`);
      if (meta.reading) titleParts.push(`（${meta.reading}）`);

      lines.push(`#### ${titleParts.join(' / ')}`);
      lines.push('');

      if (meta.description) {
        lines.push(`> ${meta.description}`);
        lines.push('');
      }

      if (sections.definition) {
        lines.push(sections.definition);
        lines.push('');
      }

      if (sections.detail) {
        lines.push(sections.detail);
        lines.push('');
      }

      if (meta.related_terms && meta.related_terms.length > 0) {
        lines.push(`**関連用語**: ${meta.related_terms.join(' / ')}`);
        lines.push('');
      }

      if (meta.related_questions && meta.related_questions.length > 0) {
        lines.push(`**関連問題**: ${meta.related_questions.map(q => `Q${q}`).join(', ')}`);
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }
  }

  lines.push(`*このファイルは generate-glossary.js により自動生成されました。*`);
  return lines.join('\n');
}

function main() {
  if (!fs.existsSync(TERMS_DIR)) {
    console.error(`terms/ directory not found: ${TERMS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(TERMS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  if (files.length === 0) {
    console.error('No markdown files found in terms/');
    process.exit(1);
  }

  const trees = [];
  const termsByCategory = {};

  for (const file of files) {
    const content = fs.readFileSync(path.join(TERMS_DIR, file), 'utf-8');
    const parsed = parseFrontmatter(content);

    if (!parsed) {
      console.warn(`  ⚠ Skipping ${file}: no frontmatter`);
      continue;
    }

    const { meta } = parsed;
    const entry = { file, meta, body: parsed.body };

    if (meta.type === 'mece-tree') {
      trees.push(entry);
      console.log(`  ✓ [tree] ${file} — ${meta.root_term}`);
    } else if (meta.type === 'term') {
      const cat = meta.category || 'その他';
      if (!termsByCategory[cat]) termsByCategory[cat] = [];
      termsByCategory[cat].push(entry);
      console.log(`  ✓ [term] ${file} — ${meta.term} (${cat})`);
    } else {
      console.warn(`  ⚠ Unknown type in ${file}: ${meta.type}`);
    }
  }

  const totalTerms = Object.values(termsByCategory).reduce((s, a) => s + a.length, 0);

  if (trees.length === 0 && totalTerms === 0) {
    console.error('No valid entries found.');
    process.exit(1);
  }

  const glossary = generateGlossary(trees, termsByCategory);
  fs.writeFileSync(OUTPUT_FILE, glossary, 'utf-8');

  console.log('');
  console.log(`Generated: ${OUTPUT_FILE}`);
  console.log(`  Trees: ${trees.length}, Terms: ${totalTerms}`);
}

main();
