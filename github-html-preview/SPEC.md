# GitHub HTML Preview - Chrome拡張機能

## 目標

GitHubでHTMLファイルを開いたとき、Markdownと同じようにソースコードではなくレンダリングされたプレビューを表示する。

## 期待する挙動

- 左側のファイルツリーはそのまま
- HTMLファイルをクリックすると、右側がソースコード表示ではなくプレビュー表示になる
- Markdownファイルを開いたときと同じ体験

## 仕組み

### URL変換

GitHub上のHTMLファイルのURLをGitHub PagesのURLに変換してiframeで表示する。

```
github.com/{user}/{repo}/blob/{branch}/{path}/file.html
         ↓
{user}.github.io/{repo}/{path}/file.html
```

### 実装方法

1. Content Scriptが `github.com/*/blob/*.html` のURLを検知
2. GitHub PagesのURLに変換
3. GitHubのコード表示エリアをiframeに置き換え

## 制約

- GitHub Pagesが有効になっているリポジトリのみ動作する
- GitHub Pagesが無効な場合はデフォルトのソースコード表示にフォールバック

## ファイル構成

```
github-html-preview/
  manifest.json   # 拡張機能の設定
  content.js      # GitHubページに注入するスクリプト
```
