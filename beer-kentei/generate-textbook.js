#!/usr/bin/env node
/**
 * Generates textbook.md from all markdown files in beer-kentei/questions/
 * Collects YAML frontmatter metadata and organizes content by category.
 *
 * Usage: node beer-kentei/generate-textbook.js
 */

const fs = require('fs');
const path = require('path');

const QUESTIONS_DIR = path.join(__dirname, 'questions');
const OUTPUT_FILE = path.join(__dirname, 'textbook.md');

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
  const yamlLines = match[1].split('\n');
  let currentKey = null;
  let inList = false;

  for (const line of yamlLines) {
    const listItem = line.match(/^\s+-\s+"?(.+?)"?\s*$/);
    const keyValue = line.match(/^(\w+):\s*"?(.+?)"?\s*$/);
    const listStart = line.match(/^(\w+):\s*$/);

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

function extractSections(body) {
  const sections = {};

  const titleMatch = body.match(/^#\s+(.+)$/m);
  sections.title = titleMatch ? titleMatch[1] : '';

  const explanationMatch = body.match(/## 解説\n([\s\S]*?)(?=\n## |\n# |$)/);
  sections.explanation = explanationMatch ? explanationMatch[1].trim() : '';

  const answerMatch = body.match(/## 正解\n\n\*\*(.+?)\*\*/);
  sections.answer = answerMatch ? answerMatch[1] : '';

  const questionMatch = body.match(/## 問題\n\n([\s\S]*?)(?=\n\*\*選択肢\*\*|\n## )/);
  sections.question = questionMatch ? questionMatch[1].trim() : '';

  return sections;
}

function generateTextbook(entries) {
  const byCategory = {};

  for (const entry of entries) {
    const cat = entry.meta.category || 'その他';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(entry);
  }

  const lines = [];
  const date = new Date().toISOString().slice(0, 10);

  lines.push('# ビール検定 教科書');
  lines.push('');
  lines.push(`> 生成日: ${date}  `);
  lines.push(`> 問題数: ${entries.length}問`);
  lines.push('');
  lines.push('## 目次');
  lines.push('');

  const orderedCategories = [
    ...CATEGORY_ORDER.filter(c => byCategory[c]),
    ...Object.keys(byCategory).filter(c => !CATEGORY_ORDER.includes(c)),
  ];

  for (const cat of orderedCategories) {
    lines.push(`- [${cat}](#${cat.replace(/[・]/g, '')})`);
    const subMap = {};
    for (const e of byCategory[cat]) {
      const sub = e.meta.subcategory || 'その他';
      if (!subMap[sub]) subMap[sub] = [];
      subMap[sub].push(e);
    }
    for (const sub of Object.keys(subMap)) {
      lines.push(`  - ${sub}（${subMap[sub].length}問）`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  for (const cat of orderedCategories) {
    lines.push(`## ${cat}`);
    lines.push('');

    const catEntries = byCategory[cat];
    catEntries.sort((a, b) => (a.meta.id || '').localeCompare(b.meta.id || ''));

    const subMap = {};
    for (const e of catEntries) {
      const sub = e.meta.subcategory || 'その他';
      if (!subMap[sub]) subMap[sub] = [];
      subMap[sub].push(e);
    }

    for (const [sub, subEntries] of Object.entries(subMap)) {
      lines.push(`### ${sub}`);
      lines.push('');

      for (const entry of subEntries) {
        const { meta, sections } = entry;

        lines.push(`#### [${meta.id}] ${sections.title || meta.topic}`);
        lines.push('');

        lines.push(`**難易度**: ${meta.difficulty || '—'}  `);
        if (meta.keywords && meta.keywords.length > 0) {
          lines.push(`**キーワード**: ${meta.keywords.join(' / ')}`);
        }
        lines.push('');

        if (sections.question) {
          lines.push('**問題**');
          lines.push('');
          lines.push(`> ${sections.question.replace(/\n/g, '\n> ')}`);
          lines.push('');
        }

        if (sections.answer) {
          lines.push(`**正解**: ${sections.answer}`);
          lines.push('');
        }

        if (sections.explanation) {
          lines.push('**解説**');
          lines.push('');
          lines.push(sections.explanation);
          lines.push('');
        }

        lines.push('---');
        lines.push('');
      }
    }
  }

  lines.push('');
  lines.push(`*このファイルは generate-textbook.js により自動生成されました。*`);

  return lines.join('\n');
}

function main() {
  if (!fs.existsSync(QUESTIONS_DIR)) {
    console.error(`questions/ directory not found: ${QUESTIONS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(QUESTIONS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  if (files.length === 0) {
    console.error('No markdown files found in questions/');
    process.exit(1);
  }

  const entries = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(QUESTIONS_DIR, file), 'utf-8');
    const parsed = parseFrontmatter(content);

    if (!parsed) {
      console.warn(`Skipping ${file}: no frontmatter found`);
      continue;
    }

    const sections = extractSections(parsed.body);
    entries.push({ file, meta: parsed.meta, sections });
    console.log(`  ✓ ${file} [${parsed.meta.category} / ${parsed.meta.subcategory}]`);
  }

  const textbook = generateTextbook(entries);
  fs.writeFileSync(OUTPUT_FILE, textbook, 'utf-8');

  console.log('');
  console.log(`Generated: ${OUTPUT_FILE}`);
  console.log(`  ${entries.length} questions, ${[...new Set(entries.map(e => e.meta.category))].length} categories`);
}

main();
