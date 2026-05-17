# CLAUDE.md

## リポジトリの目的

Claudeに雑務を委譲するためのリポジトリ。作業単位ごとにディレクトリを切り、成果物をGitHub Pagesで公開する。

## ディレクトリ構成ルール

```
work-with-claude/
├── README.md               # 人間向けの説明。index.htmlへのリンクのみ記載
├── CLAUDE.md               # このファイル。Claudeへの作業ルール
├── index.html              # GitHub Pagesのトップ。全レポートの一覧
├── styles.css              # 共有CSS（build-styles.jsで生成）
├── theme.json              # フォントサイズ等の設定
├── build-styles.js         # styles.cssを生成するスクリプト
├── Makefile                # ビルドコマンド
└── <作業名>/               # 作業単位のディレクトリ
    ├── report.html         # 作業レポート（styles.cssを参照）
    └── ...                 # その他の作業ファイル
```

## 作業フロー

### 新しい作業を始めるとき

1. 作業名でディレクトリを作成する
2. 作業を進める
3. 成果物をレポート（`report.html`）としてまとめる
4. `index.html` のレポート一覧に追加する
5. commit & push

### スタイルを変更するとき

1. `theme.json` を編集する
2. `make build` を実行する（`styles.css` が再生成される）
3. commit & push

## レポートHTMLのルール

- CSSは `../styles.css` で参照する（ルートからの相対パス）
- highlight.jsとmermaid.jsはCDNから読み込む
- コードブロックには言語クラスを付与する（例：`class="language-yaml"`）
- ヘッダーとフッターの両方に `index.html` へ戻るリンクを必ず含める
- 冒頭のセクション（概要の直後）に主要参照リンクを3件程度まとめる
- 末尾のフッター直前に調査で使用した全リンクを一覧としてまとめる

```html
<!-- 冒頭：主要参照リンク（概要セクション内） -->
<h3>主要参照リンク</h3>
<ul>
  <li><a href="...">タイトル</a> — 一言説明</li>
  ...（3件程度）
</ul>

<!-- 末尾：全参照リンク（フッター直前） -->
<section id="references">
  <h2>参照リンク一覧</h2>
  <table>
    <tr><th>リンク</th><th>用途</th></tr>
    <tr><td><a href="...">タイトル</a></td><td>何を調べるために使ったか</td></tr>
    ...（調査で使用した全URL）
  </table>
</section>
```

```html
<!-- ヘッダー：label部分をリンクにする -->
<header>
  <div class="label"><a href="../index.html" style="color:#7eceff;text-decoration:none;">← レポート一覧</a></div>
  ...
</header>

<!-- フッター -->
<footer>
  <p>...</p>
  <p><a href="../index.html">← レポート一覧に戻る</a></p>
</footer>
```

## GitHub Pages

- URL: `https://aobaiwaki123.github.io/work-with-claude/`
- `index.html` がトップページ
- 各レポートは `<作業名>/report.html` として公開される

## Makefileコマンド

```bash
make build   # styles.css を再生成
make commit  # build → git add → commit → push
```
