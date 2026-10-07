// データの読み書き。Supabase が設定されていればそちらを、無ければブラウザ内のデモデータを使う。
import { SUPABASE_URL, SUPABASE_ANON_KEY, IMAGE_BUCKET } from './config.js';

export const isDemo = !SUPABASE_URL || !SUPABASE_ANON_KEY;

const SEED_URL = new URL('../../data/seed.json', import.meta.url);
const DEMO_KEY = 'oasis-demo-v1';

let sbPromise;
function supabase() {
  sbPromise ??= import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
    .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
  return sbPromise;
}

const bySort = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0);

// ───────── デモモード（localStorage） ─────────
async function demoLoad() {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const res = await fetch(SEED_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error('seed.json を読み込めませんでした');
  return res.json();
}

function demoSave(db) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(db));
  } catch (e) {
    throw new Error('ブラウザの保存容量が足りません（デモモードでは画像を多く保存できません）');
  }
}

export async function demoReset() {
  try { localStorage.removeItem(DEMO_KEY); } catch {}
}

// ───────── 公開側 ─────────
export async function loadMenu({ includeHidden = false } = {}) {
  if (isDemo) {
    const db = await demoLoad();
    return db.items.filter((i) => includeHidden || i.is_visible).sort(bySort);
  }
  const sb = await supabase();
  let q = sb.from('menu_items').select('*').order('sort_order');
  if (!includeHidden) q = q.eq('is_visible', true);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function loadSettings() {
  if (isDemo) return (await demoLoad()).settings || {};
  const sb = await supabase();
  const { data, error } = await sb.from('site_settings').select('key,value');
  if (error) throw error;
  return Object.fromEntries(data.map((r) => [r.key, r.value]));
}

// ───────── 管理側 ─────────
export async function getSession() {
  if (isDemo) return { user: { email: 'demo' } };
  const sb = await supabase();
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function signIn(email, password) {
  const sb = await supabase();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const { data, error: e2 } = await sb.rpc('is_admin');
  if (e2) throw e2;
  if (!data) {
    await sb.auth.signOut();
    throw new Error('このアカウントには編集権限がありません（admins テーブルに登録してください）');
  }
}

export async function signOut() {
  if (!isDemo) await (await supabase()).auth.signOut();
}

export async function saveItem(item) {
  const row = { ...item, updated_at: new Date().toISOString() };
  if (isDemo) {
    const db = await demoLoad();
    row.id ||= crypto.randomUUID();
    const i = db.items.findIndex((x) => x.id === row.id);
    if (i >= 0) db.items[i] = row; else db.items.push(row);
    demoSave(db);
    return row;
  }
  const sb = await supabase();
  if (!row.id) delete row.id;
  const { data, error } = await sb.from('menu_items').upsert(row).select().single();
  if (error) throw error;
  return data;
}

/** 並び順や表示切替など、複数行の一部項目だけを更新する */
export async function patchItems(patches) {
  if (isDemo) {
    const db = await demoLoad();
    for (const p of patches) Object.assign(db.items.find((x) => x.id === p.id) || {}, p);
    demoSave(db);
    return;
  }
  const sb = await supabase();
  for (const { id, ...fields } of patches) {
    const { error } = await sb.from('menu_items').update(fields).eq('id', id);
    if (error) throw error;
  }
}

export async function deleteItem(id) {
  if (isDemo) {
    const db = await demoLoad();
    db.items = db.items.filter((x) => x.id !== id);
    demoSave(db);
    return;
  }
  const sb = await supabase();
  const { error } = await sb.from('menu_items').delete().eq('id', id);
  if (error) throw error;
}

export async function saveSettings(settings) {
  if (isDemo) {
    const db = await demoLoad();
    db.settings = { ...db.settings, ...settings };
    demoSave(db);
    return;
  }
  const sb = await supabase();
  const rows = Object.entries(settings).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));
  const { error } = await sb.from('site_settings').upsert(rows);
  if (error) throw error;
}

/** 画像を縮小して保存し、表示用URLを返す */
export async function uploadImage(file) {
  const blob = await resizeImage(file, isDemo ? 900 : 1600, isDemo ? 0.72 : 0.85);
  if (isDemo) {
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(blob);
    });
  }
  const sb = await supabase();
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`;
  const { error } = await sb.storage.from(IMAGE_BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw error;
  return sb.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

async function resizeImage(file, maxSize, quality) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

/** 全データを書き出す（バックアップ用） */
export async function exportAll() {
  return { items: await loadMenu({ includeHidden: true }), settings: await loadSettings() };
}
