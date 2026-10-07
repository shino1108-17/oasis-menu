import { LANGS, ALLERGENS, CATEGORIES, DIETS, pick, ui, detectLang } from './i18n.js';
import { loadMenu, loadSettings } from './data.js';
import { esc } from './util.js';

const $ = (s) => document.querySelector(s);
const FILTER_KEY = 'oasis-filter';
const ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

const state = {
  lang: detectLang(),
  items: [],
  settings: {},
  avoid: new Set(),
  diets: new Set(),
  strict: true,
  category: 'all',
  q: '',
};

try {
  const saved = JSON.parse(localStorage.getItem(FILTER_KEY) || 'null');
  if (saved) {
    state.avoid = new Set(saved.avoid || []);
    state.diets = new Set(saved.diets || []);
    state.strict = saved.strict ?? true;
  }
} catch {}

function persistFilter() {
  try {
    localStorage.setItem(FILTER_KEY, JSON.stringify({ avoid: [...state.avoid], diets: [...state.diets], strict: state.strict }));
  } catch {}
}

// ───────── 絞り込みロジック ─────────
function avoidKeys() {
  const keys = new Set(state.avoid);
  for (const d of DIETS) if (state.diets.has(d.key)) d.avoid.forEach((k) => keys.add(k));
  return keys;
}

/** 条件に引っかかったアレルゲンキーの一覧（空なら食べられる） */
function hits(item, keys) {
  return [...keys].filter((k) => {
    const v = item.allergens?.[k];
    return v === 'contains' || (state.strict && v === 'may');
  });
}

function matchesQuery(item) {
  if (!state.q) return true;
  const q = state.q.toLowerCase();
  return Object.values(item.name || {}).some((n) => String(n).toLowerCase().includes(q));
}

// ───────── 描画 ─────────
const allergenName = (key) => pick(ALLERGENS.find((a) => a.key === key)?.name, state.lang);
const categoryName = (key) => pick(CATEGORIES.find((c) => c.key === key)?.name, state.lang);
const priceText = (p) => (p == null || p === '' ? '' : ui('yen', state.lang, { n: Number(p).toLocaleString('ja-JP') }));

function media(item, cls = '') {
  if (item.image_url) return `<img src="${esc(item.image_url)}" alt="" loading="lazy" class="${cls}">`;
  return `<span class="placeholder"><span class="placeholder__cat">${esc(categoryName(item.category))}</span>
    <span class="placeholder__name" lang="ja">${esc(item.name?.ja || '')}</span></span>`;
}

function chips(item, keys) {
  const list = ALLERGENS.filter((a) => item.allergens?.[a.key]);
  if (!list.length) return '';
  return `<ul class="chips">${list.map((a) => {
    const may = item.allergens[a.key] === 'may';
    const hit = keys.has(a.key) && (!may || state.strict);
    return `<li class="chip${may ? ' chip--may' : ''}${hit ? ' chip--hit' : ''}" title="${esc(ui(may ? 'may' : 'contains', state.lang))}">${may ? '△ ' : ''}${esc(pick(a.name, state.lang))}</li>`;
  }).join('')}</ul>`;
}

function card(item, keys, reason) {
  const name = pick(item.name, state.lang);
  const desc = pick(item.description, state.lang);
  return `<article class="card${item.is_sold_out ? ' is-soldout' : ''}">
    <button type="button" class="card__media" data-open="${esc(item.id)}" aria-label="${esc(name)} — ${esc(ui('details', state.lang))}">
      ${media(item)}
      ${item.is_sold_out ? `<span class="badge">${esc(ui('sold_out', state.lang))}</span>` : ''}
    </button>
    <div class="card__body">
      <p class="card__cat">${esc(categoryName(item.category))}</p>
      <h3 class="card__name">${esc(name)}</h3>
      ${state.lang !== 'ja' && item.name?.ja ? `<p class="card__ja" lang="ja">${esc(item.name.ja)}</p>` : ''}
      ${reason ? `<p class="card__reason">${esc(reason)}</p>` : ''}
      ${desc ? `<p class="card__desc">${esc(desc)}</p>` : ''}
      ${chips(item, keys)}
      <div class="card__foot">
        ${priceText(item.price) ? `<span class="price">${esc(priceText(item.price))}</span>` : ''}
        <button type="button" class="ghost-link" data-open="${esc(item.id)}">${esc(ui('details', state.lang))}${ICON_ARROW}</button>
      </div>
    </div>
  </article>`;
}

function renderResults() {
  const keys = avoidKeys();
  const pool = state.items.filter((i) => (state.category === 'all' || i.category === state.category) && matchesQuery(i));
  const ok = [], ng = [];
  for (const item of pool) {
    const h = hits(item, keys);
    (h.length ? ng : ok).push({ item, h });
  }

  $('#count').textContent = ui('count', state.lang, { n: ok.length });
  let html = ok.length
    ? `<div class="grid">${ok.map(({ item }) => card(item, keys)).join('')}</div>`
    : `<p class="empty">${esc(ui('none_match', state.lang))}</p>`;

  if (ng.length) {
    html += `<details class="excluded"><summary>${esc(ui('excluded', state.lang, { n: ng.length }))}</summary>
      <div class="grid">${ng.map(({ item, h }) =>
        card(item, keys, ui('reason', state.lang, { x: h.map(allergenName).join(' / ') }))).join('')}</div></details>`;
  }
  $('#results').innerHTML = html;
}

function renderTabs() {
  const present = new Set(state.items.map((i) => i.category));
  const cats = [{ key: 'all', label: ui('all', state.lang) },
    ...CATEGORIES.filter((c) => present.has(c.key)).map((c) => ({ key: c.key, label: pick(c.name, state.lang) }))];
  if (!cats.some((c) => c.key === state.category)) state.category = 'all';
  $('#tabs').innerHTML = cats.map((c) =>
    `<button type="button" role="tab" class="tab" data-cat="${c.key}" aria-selected="${c.key === state.category}">${esc(c.label)}</button>`).join('');
}

function renderToggles() {
  $('#diet-toggles').innerHTML = DIETS.map((d) =>
    `<button type="button" class="toggle" data-diet="${d.key}" aria-pressed="${state.diets.has(d.key)}">${esc(pick(d.name, state.lang))}</button>`).join('');
  $('#allergen-toggles').innerHTML = ALLERGENS.map((a) =>
    `<button type="button" class="toggle" data-allergen="${a.key}" aria-pressed="${state.avoid.has(a.key)}">${esc(pick(a.name, state.lang))}</button>`).join('');
  $('#strict').checked = state.strict;
}

function renderStatic() {
  const lang = LANGS.find((l) => l.code === state.lang);
  document.documentElement.lang = lang.html;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = ui(el.dataset.i18n, state.lang); });
  $('#q').placeholder = ui('search', state.lang);

  const s = state.settings;
  $('#hero-title').textContent = s.hero_title || 'OASIS';
  $('#hero-sub').textContent = pick(s.hero_sub, state.lang);
  const heroImg = s.hero_image;
  $('#hero-media').hidden = !heroImg;
  $('#hero').classList.toggle('hero--image', !!heroImg);
  $('#hero-media').innerHTML = heroImg ? `<img src="${esc(heroImg)}" alt="">` : '';

  const notice = pick(s.notice, state.lang);
  $('#notice').hidden = !notice;
  $('#notice-text').textContent = notice;

  $('#disclaimer').textContent = pick(s.disclaimer, state.lang);
  const hours = pick(s.hours, state.lang);
  $('#hours-block').hidden = !hours;
  $('#hours').textContent = hours;

  const [c, m] = ui('legend', state.lang).split('　△');
  $('#legend').innerHTML = `<span><span class="chip">${esc(allergenName('wheat'))}</span>${esc(c.replace('● ', ''))}</span>
    <span><span class="chip chip--may">△ ${esc(allergenName('wheat'))}</span>${esc((m || '').trim())}</span>`;
}

function renderAll() {
  renderStatic();
  renderToggles();
  renderTabs();
  renderResults();
}

// ───────── 詳細ダイアログ ─────────
function openDetail(id) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  const name = pick(item.name, state.lang);
  const desc = pick(item.description, state.lang);
  const rows = ALLERGENS.map((a) => {
    const v = item.allergens?.[a.key];
    const cls = v === 'contains' ? 'is-contains' : v === 'may' ? 'is-may' : 'is-free';
    const mark = v === 'contains' ? `● ${ui('contains', state.lang)}` : v === 'may' ? `△ ${ui('may', state.lang)}` : '—';
    return `<tr class="${cls}"><th scope="row">${esc(pick(a.name, state.lang))}</th><td>${esc(mark)}</td></tr>`;
  });
  const half = Math.ceil(rows.length / 2);

  const dlg = $('#detail');
  dlg.innerHTML = `
    <div class="dialog__media${item.image_url ? '' : ' dialog__media--empty'}">${media(item)}
      <button type="button" class="dialog__close" data-close><span class="visually-hidden">${esc(ui('close', state.lang))}</span>${ICON_CLOSE}</button>
    </div>
    <div class="dialog__body">
      <p class="card__cat">${esc(categoryName(item.category))}${item.is_sold_out ? ` — ${esc(ui('sold_out', state.lang))}` : ''}</p>
      <h2 class="dialog__name" id="detail-name">${esc(name)}</h2>
      ${desc ? `<p class="card__desc">${esc(desc)}</p>` : ''}
      ${priceText(item.price) ? `<p class="price">${esc(priceText(item.price))}</p>` : ''}
      ${state.lang !== 'ja' ? `<div class="ja-box" lang="ja"><small>${esc(ui('ja_name', state.lang))}</small><strong>${esc(item.name?.ja || '')}</strong></div>` : ''}
      <div class="atable-cols">
        <table class="atable"><caption>${esc(ui('allergy_table', state.lang))}</caption><tbody>${rows.slice(0, half).join('')}</tbody></table>
        <table class="atable"><caption aria-hidden="true">&nbsp;</caption><tbody>${rows.slice(half).join('')}</tbody></table>
      </div>
      <p class="diet-note">${esc(ui('legend', state.lang))}</p>
      <p class="diet-note">${esc(pick(state.settings.disclaimer, state.lang))}</p>
    </div>`;
  dlg.showModal();
}

// ───────── イベント ─────────
function bind() {
  const sel = $('#lang');
  sel.innerHTML = LANGS.map((l) => `<option value="${l.code}">${esc(l.label)}</option>`).join('');
  sel.value = state.lang;
  sel.addEventListener('change', () => {
    state.lang = sel.value;
    try { localStorage.setItem('oasis-lang', state.lang); } catch {}
    const url = new URL(location.href);
    url.searchParams.set('lang', state.lang);
    history.replaceState(null, '', url);
    renderAll();
  });

  $('#diet-toggles').addEventListener('click', (e) => {
    const b = e.target.closest('[data-diet]');
    if (!b) return;
    const k = b.dataset.diet;
    state.diets.has(k) ? state.diets.delete(k) : state.diets.add(k);
    b.setAttribute('aria-pressed', state.diets.has(k));
    persistFilter(); renderResults();
  });
  $('#allergen-toggles').addEventListener('click', (e) => {
    const b = e.target.closest('[data-allergen]');
    if (!b) return;
    const k = b.dataset.allergen;
    state.avoid.has(k) ? state.avoid.delete(k) : state.avoid.add(k);
    b.setAttribute('aria-pressed', state.avoid.has(k));
    persistFilter(); renderResults();
  });
  $('#strict').addEventListener('change', (e) => { state.strict = e.target.checked; persistFilter(); renderResults(); });
  $('#clear').addEventListener('click', () => {
    state.avoid.clear(); state.diets.clear(); state.strict = true; state.q = ''; $('#q').value = '';
    persistFilter(); renderToggles(); renderResults();
  });
  $('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    state.category = b.dataset.cat;
    renderTabs(); renderResults();
  });
  $('#q').addEventListener('input', (e) => { state.q = e.target.value.trim(); renderResults(); });

  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-open]');
    if (open) openDetail(open.dataset.open);
    if (e.target.closest('[data-close]')) $('#detail').close();
  });
  $('#detail').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  const top = $('#to-top');
  top.addEventListener('click', () => window.scrollTo({ top: 0 }));
  addEventListener('scroll', () => top.classList.toggle('is-visible', scrollY > 600), { passive: true });
}

async function init() {
  bind();
  renderStatic();
  renderToggles();
  try {
    [state.items, state.settings] = await Promise.all([loadMenu(), loadSettings()]);
    renderAll();
  } catch (err) {
    console.error(err);
    $('#results').innerHTML = `<p class="empty">${esc(ui('load_error', state.lang))}</p>`;
  }
}

init();
