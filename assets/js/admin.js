import { LANGS, ALLERGENS, CATEGORIES } from './i18n.js';
import * as db from './data.js';
import { ADMIN_EMAIL } from './config.js';
import { esc } from './util.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

let items = [];
let settings = {};
let editing = null; // 編集中のメニュー

function toast(msg, isError = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('is-error', isError);
  t.classList.add('is-visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('is-visible'), 3200);
}

async function run(fn, okMsg) {
  try {
    const r = await fn();
    if (okMsg) toast(okMsg);
    return r;
  } catch (e) {
    console.error(e);
    toast(e.message || '保存できませんでした', true);
    throw e;
  }
}

// ───────── 画像入力（プレビュー＋アップロード＋削除） ─────────
function imageInput(container, getUrl, setUrl) {
  const render = () => {
    const url = getUrl();
    container.innerHTML = `
      <div class="a-image-input__preview">${url ? `<img src="${esc(url)}" alt="">` : '<span>写真なし</span>'}</div>
      <div class="a-image-input__actions">
        <label class="a-btn a-btn--small">写真を選ぶ<input type="file" accept="image/*" hidden></label>
        ${url ? '<button type="button" class="a-btn a-btn--small" data-remove>写真を外す</button>' : ''}
      </div>`;
    $('input[type=file]', container).addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      container.classList.add('is-busy');
      try {
        setUrl(await run(() => db.uploadImage(file)));
        render();
      } finally {
        container.classList.remove('is-busy');
      }
    });
    $('[data-remove]', container)?.addEventListener('click', () => { setUrl(''); render(); });
  };
  render();
}

// ───────── メニュー一覧 ─────────
const catName = (k) => CATEGORIES.find((c) => c.key === k)?.name.ja || k;

function renderRows() {
  const tbody = $('#item-rows');
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="a-muted">メニューがありません。「＋ メニューを追加」から登録してください。</td></tr>';
    return;
  }
  tbody.innerHTML = items.map((it, i) => {
    const missing = LANGS.filter((l) => !it.name?.[l.code]).map((l) => l.code);
    return `<tr data-id="${esc(it.id)}" class="${it.is_visible ? '' : 'is-hidden'}">
      <td><div class="a-thumb">${it.image_url ? `<img src="${esc(it.image_url)}" alt="">` : ''}</div></td>
      <td><strong>${esc(it.name?.ja || '(名称未設定)')}</strong>
        <div class="a-muted a-small">${esc(it.name?.en || '')}${missing.length ? ` <span class="a-warn">未翻訳: ${missing.join(', ')}</span>` : ''}</div></td>
      <td>${esc(catName(it.category))}</td>
      <td>${it.price != null && it.price !== '' ? `${Number(it.price).toLocaleString()}円` : '<span class="a-muted">—</span>'}</td>
      <td><input type="checkbox" class="a-switch" data-field="is_visible" ${it.is_visible ? 'checked' : ''} aria-label="表示"></td>
      <td><input type="checkbox" class="a-switch" data-field="is_sold_out" ${it.is_sold_out ? 'checked' : ''} aria-label="売り切れ"></td>
      <td class="a-nowrap">
        <button class="a-icon-btn" data-move="-1" ${i === 0 ? 'disabled' : ''} aria-label="上へ">↑</button>
        <button class="a-icon-btn" data-move="1" ${i === items.length - 1 ? 'disabled' : ''} aria-label="下へ">↓</button>
      </td>
      <td><button class="a-btn a-btn--small" data-edit>編集</button></td>
    </tr>`;
  }).join('');
}

async function reload() {
  [items, settings] = await Promise.all([db.loadMenu({ includeHidden: true }), db.loadSettings()]);
  renderRows();
  renderSettings();
}

function bindRows() {
  const tbody = $('#item-rows');
  tbody.addEventListener('change', async (e) => {
    const sw = e.target.closest('[data-field]');
    if (!sw) return;
    const id = sw.closest('tr').dataset.id;
    const item = items.find((x) => x.id === id);
    item[sw.dataset.field] = sw.checked;
    await run(() => db.patchItems([{ id, [sw.dataset.field]: sw.checked }]), '保存しました');
    renderRows();
  });
  tbody.addEventListener('click', async (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    const idx = items.findIndex((x) => x.id === tr.dataset.id);
    if (e.target.closest('[data-edit]')) return openEditor(items[idx]);
    const mv = e.target.closest('[data-move]');
    if (mv) {
      const j = idx + Number(mv.dataset.move);
      [items[idx], items[j]] = [items[j], items[idx]];
      items.forEach((it, k) => { it.sort_order = k + 1; });
      renderRows();
      await run(() => db.patchItems(items.map((it) => ({ id: it.id, sort_order: it.sort_order }))));
    }
  });
}

// ───────── 編集ダイアログ ─────────
function openEditor(item) {
  editing = structuredClone(item || {
    id: '', category: 'rice', name: {}, description: {}, price: null, image_url: '',
    allergens: {}, is_visible: true, is_sold_out: false, sort_order: (items.at(-1)?.sort_order || 0) + 1,
  });
  const form = $('#edit-form');
  $('#edit-title').textContent = item ? `「${item.name?.ja || ''}」を編集` : 'メニューを追加';
  $('#delete-item').hidden = !item;
  $('#edit-status').textContent = '';
  $('#category-select').innerHTML = CATEGORIES.map((c) => `<option value="${c.key}">${esc(c.name.ja)}</option>`).join('');
  form.category.value = editing.category;
  form.price.value = editing.price ?? '';
  form.is_visible.checked = editing.is_visible;
  form.is_sold_out.checked = editing.is_sold_out;

  $('#lang-fields').innerHTML = LANGS.map((l) => `
    <div class="a-lang-row">
      <div class="a-lang-row__label">${esc(l.label)}${l.code === 'ja' ? ' <span class="a-req">必須</span>' : ''}
        ${l.code !== 'ja' ? `<button type="button" class="a-linkbtn" data-translate="${l.code}">翻訳を確認 ↗</button>` : ''}</div>
      <input name="name_${l.code}" placeholder="メニュー名" value="${esc(editing.name?.[l.code] || '')}" ${l.code === 'ja' ? 'required' : ''} lang="${l.html}">
      <textarea name="desc_${l.code}" rows="2" placeholder="説明（任意）" lang="${l.html}">${esc(editing.description?.[l.code] || '')}</textarea>
    </div>`).join('');

  $('#allergen-fields').innerHTML = ALLERGENS.map((a) => {
    const v = editing.allergens?.[a.key] || '';
    const opt = (val, label) => `<label><input type="radio" name="al_${a.key}" value="${val}" ${v === val ? 'checked' : ''}><span>${label}</span></label>`;
    return `<div class="a-allergen"><span>${esc(a.name.ja)}</span><div class="a-seg">${opt('', '—')}${opt('contains', '〇')}${opt('may', '△')}</div></div>`;
  }).join('');

  imageInput($('#item-image-input'), () => editing.image_url, (u) => { editing.image_url = u; });
  $('#edit-dialog').showModal();
}

function readEditor() {
  const f = $('#edit-form');
  const name = {}, description = {}, allergens = {};
  for (const l of LANGS) {
    const n = f[`name_${l.code}`].value.trim();
    const d = f[`desc_${l.code}`].value.trim();
    if (n) name[l.code] = n;
    if (d) description[l.code] = d;
  }
  for (const a of ALLERGENS) {
    const v = f.querySelector(`input[name="al_${a.key}"]:checked`)?.value;
    if (v) allergens[a.key] = v;
  }
  return {
    ...editing,
    category: f.category.value,
    price: f.price.value === '' ? null : Number(f.price.value),
    is_visible: f.is_visible.checked,
    is_sold_out: f.is_sold_out.checked,
    name, description, allergens,
  };
}

function bindEditor() {
  const dlg = $('#edit-dialog');
  dlg.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) dlg.close();
    const tr = e.target.closest('[data-translate]');
    if (tr) {
      const ja = [$('#edit-form').name_ja.value, $('#edit-form').desc_ja.value].filter(Boolean).join('\n');
      const tl = tr.dataset.translate === 'zh' ? 'zh-CN' : tr.dataset.translate;
      window.open(`https://translate.google.com/?sl=ja&tl=${tl}&text=${encodeURIComponent(ja)}&op=translate`, '_blank', 'noopener');
    }
  });
  $('#edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = readEditor();
    $('#edit-status').textContent = '保存中…';
    try {
      await run(() => db.saveItem(data), '保存しました');
      dlg.close();
      await reload();
    } catch {
      $('#edit-status').textContent = '';
    }
  });
  $('#delete-item').addEventListener('click', async () => {
    if (!editing?.id || !confirm(`「${editing.name?.ja || ''}」を削除しますか？\n（一時的に隠すだけなら「表示」のチェックを外してください）`)) return;
    await run(() => db.deleteItem(editing.id), '削除しました');
    dlg.close();
    await reload();
  });
  $('#add-item').addEventListener('click', () => openEditor(null));
}

// ───────── サイト設定 ─────────
const SETTING_FIELDS = [
  { key: 'hero_sub', label: 'トップの説明文', rows: 2 },
  { key: 'notice', label: 'お知らせ（空欄なら非表示）', rows: 2 },
  { key: 'hours', label: '営業時間（空欄なら非表示）', rows: 2 },
  { key: 'disclaimer', label: 'アレルギーについての注意書き', rows: 3 },
];
let heroImage = '';

function renderSettings() {
  const f = $('#settings-form');
  f.hero_title.value = settings.hero_title || 'OASIS';
  heroImage = settings.hero_image || '';
  imageInput($('#hero-image-input'), () => heroImage, (u) => { heroImage = u; });
  $('#settings-langs').innerHTML = SETTING_FIELDS.map((fd) => `
    <fieldset class="a-fieldset">
      <legend>${esc(fd.label)}</legend>
      ${LANGS.map((l) => `<label class="a-lang-line"><span>${esc(l.label)}</span>
        <textarea name="${fd.key}_${l.code}" rows="${fd.rows}" lang="${l.html}">${esc(settings[fd.key]?.[l.code] || '')}</textarea></label>`).join('')}
    </fieldset>`).join('');
}

function bindSettings() {
  $('#settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const next = { hero_title: f.hero_title.value.trim() || 'OASIS', hero_image: heroImage };
    for (const fd of SETTING_FIELDS) {
      next[fd.key] = Object.fromEntries(LANGS.map((l) => [l.code, f[`${fd.key}_${l.code}`].value.trim()]));
    }
    await run(() => db.saveSettings(next), '保存しました');
    settings = { ...settings, ...next };
    $('#settings-status').textContent = `保存しました（${new Date().toLocaleTimeString()}）`;
  });
}

// ───────── Excel 取り込み ─────────
const HEADER_TO_KEY = {
  小麦: 'wheat', 卵: 'egg', 乳: 'milk', クルミ: 'walnut', くるみ: 'walnut', 落花生: 'peanut', 落下生: 'peanut', 'カシューナッツ': 'cashew',
  そば: 'buckwheat', エビ: 'shrimp', えび: 'shrimp', カニ: 'crab', かに: 'crab', 大豆: 'soybean', 鶏肉: 'chicken', 牛肉: 'beef', 豚肉: 'pork',
  バナナ: 'banana', リンゴ: 'apple', りんご: 'apple', ゼラチン: 'gelatin', サバ: 'mackerel', さば: 'mackerel', ごま: 'sesame',
};
const MARK = { '〇': 'contains', '○': 'contains', '◯': 'contains', '●': 'contains', '△': 'may' };

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('ライブラリを読み込めませんでした'));
    document.head.append(s);
  });
}

function guessCategory(name) {
  if (name.includes('ラーメン')) return 'ramen';
  if (name.includes('うどん')) return 'udon';
  if (name.includes('そば')) return 'soba';
  return 'rice';
}

async function parseExcel(file) {
  if (!window.XLSX) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
  const wb = window.XLSX.read(await file.arrayBuffer());
  const rows = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
  const hi = rows.findIndex((r) => r.some((c) => String(c).trim() === '商品名'));
  if (hi < 0) throw new Error('「商品名」の列が見つかりません。アレルギー一覧と同じ形式か確認してください。');
  const header = rows[hi].map((c) => String(c).trim());
  const nameCol = header.indexOf('商品名');
  const cols = header.map((h, i) => [i, HEADER_TO_KEY[h]]).filter(([, k]) => k);
  const out = [];
  for (const r of rows.slice(hi + 1)) {
    const name = String(r[nameCol] || '').trim();
    if (!name) continue;
    if (!cols.some(([i]) => String(r[i]).trim())) break; // 表の下の注記
    const allergens = {};
    for (const [i, k] of cols) { const m = MARK[String(r[i]).trim()]; if (m) allergens[k] = m; }
    out.push({ name, allergens });
  }
  return out;
}

const sameAllergens = (a = {}, b = {}) => ALLERGENS.every((x) => (a[x.key] || '') === (b[x.key] || ''));
const allergenText = (al) => ALLERGENS.filter((a) => al[a.key]).map((a) => (al[a.key] === 'may' ? '△' : '') + a.name.ja).join('・') || 'なし';

function bindImport() {
  $('#xlsx-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const box = $('#import-preview');
    box.innerHTML = '<p class="a-muted">読み込み中…</p>';
    let rows;
    try {
      rows = await parseExcel(file);
    } catch (err) {
      box.innerHTML = `<p class="a-error">${esc(err.message)}</p>`;
      return;
    }
    const byName = new Map(items.map((it) => [it.name?.ja, it]));
    const changed = [], added = [], same = [];
    for (const r of rows) {
      const cur = byName.get(r.name);
      if (!cur) added.push(r);
      else if (!sameAllergens(cur.allergens, r.allergens)) changed.push({ cur, r });
      else same.push(r);
    }
    const names = new Set(rows.map((r) => r.name));
    const missing = items.filter((it) => !names.has(it.name?.ja) && it.is_visible);

    box.innerHTML = `
      <div class="a-import">
        <p><strong>${rows.length}品</strong>を読み込みました。変更なし ${same.length}品 ／ アレルゲン更新 ${changed.length}品 ／ 新規 ${added.length}品</p>
        ${changed.length ? `<h3>アレルゲンが変わるメニュー</h3><ul>${changed.map(({ cur, r }) =>
          `<li><strong>${esc(r.name)}</strong><br><span class="a-muted">変更前：${esc(allergenText(cur.allergens))}</span><br>変更後：${esc(allergenText(r.allergens))}</li>`).join('')}</ul>` : ''}
        ${added.length ? `<h3>新しく追加されるメニュー</h3><p class="a-muted a-small">翻訳・写真・価格は追加後に「メニュー」タブで入力してください。</p>
          <ul>${added.map((r) => `<li><strong>${esc(r.name)}</strong> — ${esc(allergenText(r.allergens))}</li>`).join('')}</ul>` : ''}
        ${missing.length ? `<label class="a-check"><input type="checkbox" id="hide-missing"> Excelに無いメニュー（${missing.map((m) => esc(m.name?.ja)).join('、')}）を非表示にする</label>` : ''}
        <div class="a-actions">
          <button class="a-btn a-btn--primary" id="apply-import" ${changed.length || added.length || missing.length ? '' : 'disabled'}>この内容で反映する</button>
        </div>
      </div>`;

    $('#apply-import').addEventListener('click', async () => {
      const btn = $('#apply-import');
      btn.disabled = true;
      let order = Math.max(0, ...items.map((i) => i.sort_order || 0));
      await run(async () => {
        for (const { cur, r } of changed) await db.saveItem({ ...cur, allergens: r.allergens });
        for (const r of added) {
          await db.saveItem({ id: '', category: guessCategory(r.name), name: { ja: r.name }, description: {}, price: null,
            image_url: '', allergens: r.allergens, is_visible: true, is_sold_out: false, sort_order: ++order });
        }
        if ($('#hide-missing')?.checked) await db.patchItems(missing.map((m) => ({ id: m.id, is_visible: false })));
      }, 'Excelの内容を反映しました');
      await reload();
      box.innerHTML = '<p class="a-ok">反映しました。「メニュー」タブで内容を確認してください。</p>';
      e.target.value = '';
    });
  });
}

// ───────── QR ─────────
function publicUrl() {
  return new URL('../', location.href).href;
}

function renderQr() {
  const holder = $('#qr-code');
  holder.innerHTML = '';
  if (!window.QRCode) { holder.textContent = 'QRライブラリを読み込み中…'; setTimeout(renderQr, 300); return; }
  const url = new URL($('#qr-url').value || publicUrl());
  const lang = $('#qr-lang').value;
  if (lang) url.searchParams.set('lang', lang);
  new window.QRCode(holder, { text: url.href, width: 512, height: 512, colorDark: '#001242', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M });
}

function bindQr() {
  $('#qr-url').value = publicUrl();
  $('#qr-lang').insertAdjacentHTML('beforeend', LANGS.map((l) => `<option value="${l.code}">${esc(l.label)}</option>`).join(''));
  $('#qr-url').addEventListener('input', () => { try { renderQr(); } catch {} });
  $('#qr-lang').addEventListener('change', renderQr);
  $('#qr-print').addEventListener('click', () => { document.body.classList.add('print-qr'); print(); document.body.classList.remove('print-qr'); });
  $('#qr-download').addEventListener('click', () => {
    const c = $('#qr-code canvas');
    if (!c) return;
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = 'oasis-menu-qr.png';
    a.click();
  });
}

// ───────── バックアップ ─────────
function bindBackup() {
  $('#export-json').addEventListener('click', async () => {
    const data = await run(() => db.exportAll());
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `oasis-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('#import-json').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.items) || !confirm(`${data.items.length}品のメニューと設定を復元します。同じIDのメニューは上書きされます。よろしいですか？`)) return;
    await run(async () => {
      for (const it of data.items) await db.saveItem(it);
      if (data.settings) await db.saveSettings(data.settings);
    }, '復元しました');
    e.target.value = '';
    await reload();
  });
  $('#demo-reset').hidden = !db.isDemo;
  $('#demo-reset').addEventListener('click', async () => {
    if (!confirm('デモモードで編集した内容をすべて消して、Excelの初期データに戻します。よろしいですか？')) return;
    await db.demoReset();
    await reload();
    toast('初期状態に戻しました');
  });
}

// ───────── タブ・起動 ─────────
function bindTabs() {
  $('.a-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    $$('.a-tabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', x === b));
    $$('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== b.dataset.tab; });
    if (b.dataset.tab === 'qr') renderQr();
  });
}

async function showApp() {
  $('#login-view').hidden = true;
  $('#app-view').hidden = false;
  $('#logout').hidden = db.isDemo;
  await run(reload);
}

async function init() {
  $('#demo-badge').hidden = !db.isDemo;
  $('#demo-note').hidden = !db.isDemo;
  bindTabs(); bindRows(); bindEditor(); bindSettings(); bindImport(); bindQr(); bindBackup();

  $('#login-form').username.value = ADMIN_EMAIL;
  $('#logout').addEventListener('click', async () => { await db.signOut(); location.reload(); });
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    $('#login-error').textContent = '';
    try {
      await db.signIn(f.password.value);
      await showApp();
    } catch (err) {
      $('#login-error').textContent = err.message === 'Invalid login credentials' ? 'パスワードが違います' : err.message;
    }
  });

  if (await db.getSession()) await showApp();
  else $('#login-view').hidden = false;
}

init();
