// Supabase の接続情報（README の手順で取得して貼り付けてください）。
// 空のままだと「デモモード」で動作し、data/seed.json を表示します。
// デモモードで管理画面から行った編集は、そのブラウザの中だけに保存されます。
//
// ※ anon key / publishable key は公開して問題ないキーです（編集権限は RLS で管理者だけに制限しています）。
export const SUPABASE_URL = 'https://ycjxncuhelifggedkzsn.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_C6DPViqooq5GAPki4IzPug_qCCUl4UZ';

// 管理サイトのログイン用アカウント（内部用の固定アドレス。メールは送信されません）。
// 管理サイトではパスワードだけを入力します。
export const ADMIN_EMAIL = 'admin@oasis-menu.example.com';

// 画像を保存するストレージのバケット名（schema.sql と合わせる）
export const IMAGE_BUCKET = 'menu-images';
