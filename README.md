# OASIS メニューサイト（福岡工業大学 学生食堂）

学生食堂「オアシス」のメニューとアレルギー情報を、多言語（日本語・English・中文・한국어・Tiếng Việt・Bahasa Indonesia）で見られるサイトです。

- **対象**：在学生、留学生（宗教上食べられないものがある人を含む）、学外からのお客様。オアシスを利用するすべての人
- **工夫**：オアシスにQRコードを掲示し、学外の人もログインなしで見られる。アレルゲンや宗教・食習慣で絞り込み検索ができる
- **AIの活用**：サイトの作成と、メニュー名・説明・画面文言の翻訳（下書き）にAI（Claude）を使用

## 公開中のURL

| | URL |
|---|---|
| 公開サイト | https://shino1108-17.github.io/oasis-menu/ |
| 管理サイト | https://shino1108-17.github.io/oasis-menu/admin/ |
| ソースコード | https://github.com/shino1108-17/oasis-menu |
| Supabase | https://supabase.com/dashboard/project/ycjxncuhelifggedkzsn （組織「FIT OASIS」/ 東京リージョン / 無料プラン） |

管理サイトには、メールアドレス `admin@oasis-menu.example.com` とパスワードでログインします（内部用のアドレスなので、メールは届きません）。パスワードを変えたいときは、Supabase の **Authentication → Users** でこのユーザーを選んで変更してください。管理者を増やすときは、ユーザーを追加して `admins` テーブルにそのメールアドレスを登録します。

データベースのパスワードは、このフォルダの `.secrets/supabase-db-password.txt` にあります（Git には含めていません）。

## 構成

| ページ | URL | 内容 |
|---|---|---|
| 公開サイト | `/` | メニュー一覧、6言語の切り替え、アレルゲン・宗教・食習慣での絞り込み、詳細（アレルゲン表・注文時に見せる日本語名） |
| 管理サイト | `/admin/` | メニューの写真・名前・説明・価格・アレルゲンの編集、表示／売り切れの切り替え、並べ替え、サイト文言の編集、Excel取り込み、QRポスターの印刷、バックアップ |

```
index.html              公開サイト
admin/index.html        管理サイト
assets/css/tokens.css   デザイントークン（添付デザイン × 福工大カラー）
assets/css/site.css     公開サイトのスタイル
assets/css/admin.css    管理サイトのスタイル
assets/js/config.js     Supabase の接続設定 ← 本番公開時にここを書き換える
assets/js/i18n.js       多言語の文言・アレルゲン名・絞り込みプリセット
assets/js/data.js       データの読み書き（Supabase／デモモード）
assets/js/app.js        公開サイトの処理
assets/js/admin.js      管理サイトの処理
data/seed.json          Excel から作った初期データ（デモモード用）
supabase/schema.sql     データベースの定義（テーブル・権限・画像置き場）
supabase/seed.sql       データベースの初期データ
tools/excel_to_seed.py  Excel → seed.json / seed.sql の変換スクリプト
```

### デザイン
添付の DESIGN.md（Limón スタイル）の構成を使っています。濃色のヒーロー、明るいメニューセクション、ほぼ角丸なし、影なし、写真が主役で、アクセントは1色だけです。色は福岡工業大学の公式サイトで使われているテーマカラーに置き換えました。

| 役割 | 元のデザイン | 本サイト |
|---|---|---|
| 背景（濃） | Black Olive `#1d0b0d` | FIT Navy `#001242` |
| 見出し・リンク | Forest Ink `#103b15` | FIT Blue `#0570c7` |
| アクセント・CTA | Lemon Zest `#f7ea48` | FIT Sky `#01a2e6` |
| 背景（明） | Warm Cream `#fcf9f0` | `#f2f7f9` |

フォントの VenusCom は無料で使えないため、DESIGN.md が推奨する代替の DM Sans（和文は Noto Sans JP）を使っています。

## ローカルで確認する

```bash
python3 -m http.server 8765
```

ブラウザで http://localhost:8765/ （公開サイト）と http://localhost:8765/admin/ （管理サイト）を開きます。

`assets/js/config.js` が空のあいだは **デモモード** で動きます。管理サイトでの編集は、そのブラウザの中にだけ保存されます。

## 本番公開（すべて無料）

**Supabase**（データベース・ログイン・画像保存）と **GitHub Pages**（サイトの公開）を使います。

### 1. Supabase を準備する
1. https://supabase.com で無料アカウントを作り、「New project」でプロジェクトを作成（Region は Tokyo）
2. 左メニューの **SQL Editor** で `supabase/schema.sql` の中身を貼り付けて実行
3. 続けて `supabase/seed.sql` を実行（Excel の15品が入ります）
4. 管理者のメールアドレスを登録します（例は内部用のアドレスで、メールは届きません。実在のアドレスでも構いません）。SQL Editor で次を実行してください。
   ```sql
   insert into public.admins (email) values ('admin@oasis-menu.example.com');
   ```
5. **Authentication → Users → Add user → Create new user** で、Email に手順4と同じアドレス、Password に管理者用のパスワードを入れ、「Auto Confirm User」にチェックして作成
6. **Authentication → Sign In / Providers** で「Allow new users to sign up」をオフにする（知らない人がアカウントを作れないようにするため）
7. **Project Settings → API** にある Project URL と anon key（または Publishable key）を `assets/js/config.js` に貼り付ける

> anon key はブラウザに公開しても問題ないキーです。編集できるのは `admins` に登録した人だけになるよう、データベース側（RLS）で制限しています。

### 2. GitHub Pages で公開する
1. GitHub で新しいリポジトリ（例：`oasis-menu`）を作り、このフォルダの中身をアップロード
2. リポジトリの **Settings → Pages** で Branch を `main`、フォルダを `/ (root)` にして保存
3. 数分後に `https://<ユーザー名>.github.io/oasis-menu/` で公開されます。管理サイトは末尾に `admin/` を付けた URL です

GitHub を使わない場合は、Cloudflare Pages や Netlify にフォルダをドラッグ＆ドロップしても公開できます（どちらも無料）。

### 3. QRコードを掲示する
管理サイトの **QRコード** タブで公開URLを確認し、「ポスターを印刷」を押すとA4のポスターを印刷できます。「最初に表示する言語」は「利用者の端末の言語」のままにしておくと、スマホの言語設定に合わせた言語で表示されます。

## 運用

- **毎月のアレルギー表の更新**：管理サイトの **Excel取り込み** で新しい「オアシス アレルギー一覧」を選ぶと、変更点を確認してから反映できます。商品名（日本語）が同じメニューはアレルゲンだけが更新され、写真・翻訳・価格は残ります
- **写真**：メニューの「編集」から選びます。自動で縮小してから保存します
- **売り切れ・期間限定**：一覧の「売り切れ」「表示」のチェックで切り替えられます
- **バックアップ**：**バックアップ** タブからJSONで保存できます。学期ごとに保存しておくと安心です

## 注意事項

- 翻訳は AI（Claude）が作った下書きです。公開前に、各言語を話せる留学生などに確認してもらうことをおすすめします
- メニューの説明文（例：「豚骨スープに細麺…」）は、Excel にない情報を AI が推測して書いたものです。実際の内容と違う場合は管理サイトから直してください
- 価格は Excel にないため空欄です（空欄なら表示されません）
- 「宗教・食習慣」の絞り込みは、Excel の項目（豚肉・牛肉・鶏肉・ゼラチンなど）だけで判定しています。ハラール等の認証ではありません。また、みりん・料理酒などのアルコールやだしの原料は判定に含まれていません。サイト上にもその旨を表示しています
- Excel の見出し「落下生」は「落花生」の誤記として扱っています
- Supabase の無料プランは、しばらく（1週間程度）アクセスがないとプロジェクトが一時停止されることがあります。長期休暇の後に表示されないときは、Supabase のダッシュボードから再開してください
