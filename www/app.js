(() => {
'use strict';

/* ================= Utilitaires ================= */
const $ = (s, r = document) => r.querySelector(s);
const h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const CapG = window.Capacitor;
const CX = window.capacitorExports || {};
const isNative = !!(CapG && CapG.isNativePlatform && CapG.isNativePlatform());
const fileSrc = p => !p ? '' : /^(blob:|data:|https?:)/.test(p) ? p : CapG.convertFileSrc('file://' + p);
const Bars = isNative && CX.SystemBars ? CX.SystemBars : null;

const I = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  chev: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
  cover: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.5"/></svg>',
  play: '<svg viewBox="0 0 24 24" style="fill:#fff;stroke:none"><path d="M7 4.8v14.4a1 1 0 0 0 1.5.9l11.6-7.2a1 1 0 0 0 0-1.8L8.5 3.9A1 1 0 0 0 7 4.8z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" style="fill:#fff;stroke:none"><rect x="6" y="4" width="4" height="16" rx="1.2"/><rect x="14" y="4" width="4" height="16" rx="1.2"/></svg>',
  loop: '<svg viewBox="0 0 24 24"><path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  mute: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9.5l5 5m0-5l-5 5"/></svg>',
  photos: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.5"/></svg>',
  album: '<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="14" rx="3"/><path d="M7 3h10"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  move: '<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M10 13h6m-2.5-2.5L16 13l-2.5 2.5"/></svg>',
  addTo: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/></svg>',
  selectI: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.8 2.8L16.2 9.6"/></svg>',
  pencil: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  phone: '<svg viewBox="0 0 24 24"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 18.5h3"/></svg>',
  zip: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M12 3v2m0 2v2m0 2v2"/><rect x="10.5" y="13" width="3" height="4" rx="1"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3z"/></svg>',
  heartOn: '<svg viewBox="0 0 24 24" style="fill:#fff"><path d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3z"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".6" style="fill:#fff"/></svg>',
  sort: '<svg viewBox="0 0 24 24"><path d="M7 4v16m0 0l-3-3m3 3l3-3M17 20V4m0 0l-3 3m3-3l3 3"/></svg>',
  auto: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>'
};

/* ================= Plugin natif (+ repli navigateur) ================= */
const WebVault = {
  pickMedia({ multiple = true } = {}) {
    return new Promise(res => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*,video/*'; inp.multiple = multiple;
      inp.onchange = () => res({ items: [...inp.files].map(f => {
        const v = f.type.startsWith('video/'), url = URL.createObjectURL(f);
        return { id: uid(), path: url, thumb: v ? '' : url, type: v ? 'video' : 'image', mime: f.type, name: f.name, taken: f.lastModified, added: Date.now(), duration: 0 };
      }) });
      inp.addEventListener('cancel', () => res({ items: [] }));
      inp.click();
    });
  },
  async saveToGallery({ path }) { const a = document.createElement('a'); a.href = fileSrc(path); a.download = 'secret'; a.click(); },
  async deleteFiles() {},
  async writeDb() {},
  async readDb() { return {}; },
  async importZip() { throw new Error('android'); },
  async canDeleteFromGallery() { return { available: false }; },
  async ensurePreviews() { return { previews: {} }; },
  async deleteFromGallery() { return { deleted: false }; },
  async exportZip() { throw new Error('android'); },
  async biometricAvailable() { return { available: false }; },
  async authenticate() { return { success: false }; },
  addListener() { return { remove() {} }; }
};
const Vault = isNative ? CX.registerPlugin('Vault') : WebVault;

/* ================= Données (localStorage + copie native) ================= */
const KEY = 'secret.db.v1';
const fresh = () => ({
  v: 1,
  cats: [{ id: 'c1', name: 'Privé', cover: null, albums: [] }, { id: 'c2', name: 'Souvenirs', cover: null, albums: [] }],
  albums: {}, media: {},
  settings: { loop: true, cols: 3, bio: true }
});
let db = fresh();
let backupTimer = 0;
function readLocal() { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.v === 1) return d; } catch (e) {} return null; }
function save() {
  const json = JSON.stringify(db);
  try { localStorage.setItem(KEY, json); } catch (e) { toast('Erreur de sauvegarde'); }
  clearTimeout(backupTimer);
  backupTimer = setTimeout(() => Vault.writeDb({ json }).catch(() => {}), 400);
}
async function loadDb() {
  let d = readLocal();
  if (!d && isNative) {
    try { const r = await Vault.readDb(); if (r && r.json) { const p = JSON.parse(r.json); if (p && p.v === 1) d = p; } } catch (e) {}
  }
  if (d) { db = d; db.settings = Object.assign(fresh().settings, db.settings); }
  save();
}

const sortKey = m => m.taken || m.added || 0;
const SORTS = { old: 'Plus anciennes d’abord', new: 'Plus récentes d’abord', added: 'Ordre d’importation' };
const albumItems = a => {
  const l = a.items.map(id => db.media[id]).filter(Boolean);
  if (a.sort === 'added') return l;
  return a.sort === 'new' ? l.sort((x, y) => sortKey(y) - sortKey(x)) : l.sort((x, y) => sortKey(x) - sortKey(y));
};
const kindOf = () => db.settings.kind || 'all';
const viewItems = a => { const k = kindOf(); const l = albumItems(a); return k === 'all' ? l : l.filter(m => k === 'ai' ? m.ai : !m.ai); };
const albumCover = a => db.media[a.cover] || (a.items.length ? db.media[a.items[a.items.length - 1]] : null);
const catAlbums = c => c.albums.map(id => db.albums[id]).filter(Boolean);
const catCover = c => db.media[c.cover] || catAlbums(c).map(albumCover).find(Boolean) || null;
const catOf = a => db.cats.find(c => c.id === a.cat);

function isReferenced(id) {
  if (db.cats.some(c => c.cover === id)) return true;
  return Object.values(db.albums).some(a => a.cover === id || a.items.includes(id));
}
function gc(ids) {
  const paths = [];
  for (const id of ids) {
    const m = db.media[id];
    if (!m || isReferenced(id)) continue;
    paths.push(m.path); if (m.thumb) paths.push(m.thumb); if (m.preview) paths.push(m.preview);
    delete db.media[id];
  }
  if (paths.length) Vault.deleteFiles({ paths }).catch(() => {});
}

/* ================= Historique / couches (bouton retour Android) ================= */
const layers = [];
let skipPop = 0, pendingPush = 0;
function openLayer(close) {
  layers.push(close);
  if (skipPop) pendingPush++; else history.pushState({ n: layers.length }, '');
}
function dismissTop() {
  const c = layers.pop(); if (!c) return;
  if (pendingPush) pendingPush--; else { skipPop++; history.back(); }
  c();
}
function dismissLayer(close) { if (layers[layers.length - 1] === close) dismissTop(); }
addEventListener('popstate', () => {
  if (skipPop) {
    skipPop--;
    if (!skipPop) for (; pendingPush > 0; pendingPush--) history.pushState({}, '');
    return;
  }
  const c = layers.pop(); if (c) c();
});

/* ================= Toast, feuilles, dialogues ================= */
function toast(msg, ms) {
  const t = $('#hud');
  if (ms === 0) { t.querySelector('span').textContent = msg; t.classList.add('show'); }
  else t.classList.remove('show');
}

function sheet({ title, msg, opts }) {
  return new Promise(res => {
    const L = $('#layer');
    const bd = h('<div class="backdrop"></div>');
    const head = title || msg ? `<div class="head">${title ? `<b>${esc(title)}</b>` : ''}${esc(msg || '')}</div>` : '';
    const sh = h(`<div class="sheet"><div class="group glass">${head}${opts.map((o, i) =>
      `<button class="opt ${o.danger ? 'danger' : ''} ${o.toggle ? 'row' : ''}" data-i="${i}">${esc(o.label)}${o.toggle ? `<span class="sw switch ${o.on ? 'on' : ''}"></span>` : ''}</button>`).join('')}</div>
      <div class="group glass"><button class="opt cancel" data-i="-1">${opts.some(o => !o.toggle) ? 'Annuler' : 'OK'}</button></div></div>`);
    L.append(bd, sh);
    requestAnimationFrame(() => requestAnimationFrame(() => { bd.classList.add('show'); sh.classList.add('show'); }));
    let result = null, done = false;
    const close = () => {
      if (done) return; done = true;
      bd.classList.remove('show'); sh.classList.remove('show');
      setTimeout(() => { bd.remove(); sh.remove(); }, 420);
      res(result);
    };
    openLayer(close);
    bd.onclick = () => dismissLayer(close);
    sh.onclick = e => {
      const b = e.target.closest('[data-i]'); if (!b) return;
      const i = +b.dataset.i, o = opts[i];
      if (o && o.toggle) { o.on = !o.on; b.querySelector('.switch').classList.toggle('on', o.on); o.toggle(o.on); return; }
      result = i < 0 ? null : i; dismissLayer(close);
    };
  });
}

function dialog({ title, msg, value, input, ok = 'OK', danger }) {
  return new Promise(res => {
    const L = $('#layer');
    const bd = h('<div class="backdrop"></div>');
    const dl = h(`<div class="dialog glass"><div class="body"><h3>${esc(title)}</h3>${msg ? `<p>${esc(msg)}</p>` : ''}
      ${input ? `<input type="text" maxlength="40" value="${esc(value || '')}" enterkeyhint="done">` : ''}</div>
      <div class="btns"><button data-a="0">Annuler</button><button data-a="1" class="${danger ? 'danger' : ''}">${esc(ok)}</button></div></div>`);
    L.append(bd, dl);
    requestAnimationFrame(() => requestAnimationFrame(() => { bd.classList.add('show'); dl.classList.add('show'); }));
    const inp = dl.querySelector('input');
    if (inp) setTimeout(() => { inp.focus(); inp.select(); }, 250);
    let result = null, done = false;
    const close = () => {
      if (done) return; done = true;
      if (inp) inp.blur();
      bd.classList.remove('show'); dl.classList.remove('show');
      setTimeout(() => { bd.remove(); dl.remove(); }, 300);
      res(result);
    };
    openLayer(close);
    const submit = () => { result = inp ? inp.value.trim() || null : true; dismissLayer(close); };
    dl.onclick = e => { const b = e.target.closest('[data-a]'); if (!b) return; if (b.dataset.a === '1') submit(); else dismissLayer(close); };
    if (inp) inp.onkeydown = e => { if (e.key === 'Enter') submit(); };
  });
}

/* ================= Rendu des couvertures ================= */
let phN = 0;
function coverHTML(m, full) {
  if (!m) return `<div class="cover-empty ph-${phN++ % 4}">${I.photos}</div>`;
  if (m.type === 'video' && full) {
    return `<video class="cover-media" src="${fileSrc(m.path)}" ${m.thumb ? `poster="${fileSrc(m.thumb)}"` : ''} muted loop autoplay playsinline preload="metadata"></video>`;
  }
  const s = full && m.type === 'image' ? m.path : (m.thumb || (m.type === 'image' ? m.path : ''));
  return s ? `<img class="cover-media" src="${fileSrc(s)}" decoding="async" alt="">` : `<div class="cover-empty ph-${phN++ % 4}">${I.photos}</div>`;
}
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
function countLabel(items) {
  const v = items.filter(m => m.type === 'video').length, p = items.length - v;
  if (!items.length) return 'Vide';
  return [p && plural(p, 'photo', 'photos'), v && plural(v, 'vidéo', 'vidéos')].filter(Boolean).join(', ');
}
const fmtDur = s => { s = Math.max(0, Math.round(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/* ================= Accueil ================= */
let homeKey = '';
function renderHome() {
  phN = 0;
  const box = $('#cats');
  const key = db.cats.map(c => [c.name, c.cover, catAlbums(c).map(a => a.id + ':' + a.items.length + ':' + (albumCover(a) || {}).id).join(','), (catCover(c) || {}).id].join('|')).join('/');
  if (key === homeKey) return;
  homeKey = key;
  box.innerHTML = db.cats.map((c, i) => {
    const n = catAlbums(c).length;
    return `<div class="cat pressable" data-i="${i}">${coverHTML(catCover(c), true)}<div class="shade"></div>
      <button class="icon-btn glass more" data-more="${i}" aria-label="Options">${I.more}</button>
      <div class="label">${stackHTML(c)}<h2>${esc(c.name)}</h2><p>${n ? `${plural(n, 'album', 'albums')} · ${plural(catAlbums(c).reduce((t, a) => t + a.items.length, 0), 'élément', 'éléments')}` : 'Aucun album'}</p></div>
      <span class="icon-btn glass go">${I.chev}</span></div>`;
  }).join('');
  const total = Object.keys(db.media).length, nAl = Object.keys(db.albums).length;
  $('#homeSub').textContent = total ? `${plural(total, 'élément', 'éléments')} · ${plural(nAl, 'album', 'albums')}` : 'Votre album privé';
}
function stackHTML(c) {
  const th = catAlbums(c).map(albumCover).filter(m => m && m.thumb).slice(0, 3);
  return th.length ? `<div class="stack">${th.map(m => `<span><img src="${fileSrc(m.thumb)}" alt=""></span>`).join('')}</div>` : '';
}
$('#cats').addEventListener('click', e => {
  const more = e.target.closest('[data-more]');
  if (more) { e.stopPropagation(); catMenu(db.cats[+more.dataset.more]); return; }
  const c = e.target.closest('.cat'); if (c) openCategory(db.cats[+c.dataset.i]);
});
longPress($('#cats'), '.cat', t => {
  const c = db.cats[+t.dataset.i];
  contextMenu(t, { kind: 'cat', title: c.name, actions: catActions(c), open: () => openCategory(c) });
});

async function pickCover(target) {
  clearTimeout(extT); busyExternal = true;
  try {
    const r = await Vault.pickMedia({ multiple: false });
    const m = r.items && r.items[0]; if (!m) return;
    db.media[m.id] = m;
    const old = target.cover; target.cover = m.id;
    if (old) gc([old]);
    save(); refreshAll(); toast('Couverture mise à jour');
  } catch (e) { toast('Import impossible'); } finally { endExternal(); }
}

async function rename(obj, title) {
  const n = await dialog({ title, input: true, value: obj.name, ok: 'Enregistrer' });
  if (n) { obj.name = n; save(); refreshAll(); }
}
function catActions(c) {
  const list = [
    { label: 'Renommer', icon: I.pencil, run: () => rename(c, 'Renommer la catégorie') },
    { label: 'Couverture depuis le téléphone', icon: I.phone, run: () => pickCover(c) }
  ];
  if (c.cover) list.push({ label: 'Couverture automatique', icon: I.auto, run: () => { const old = c.cover; c.cover = null; gc([old]); save(); refreshAll(); } });
  list.push(
    { label: 'Importer un ZIP', icon: I.zip, run: () => importZip(c, null) },
    { label: 'Exporter en ZIP', icon: I.save, run: () => exportZip(c.name, catAlbums(c).flatMap(a => albumItems(a).map(m => zipEntry(m, a.name)))) }
  );
  return list;
}
async function runSheet(title, actions) {
  const acts = actions.filter(Boolean);
  const i = await sheet({ title, opts: acts });
  if (i != null) acts[i].run();
}
const catMenu = c => runSheet(c.name, catActions(c));

/* ================= Pile d'écrans ================= */
const stack = [];
function topScreen() { return stack.length ? stack[stack.length - 1] : $('#home'); }
function pushScreen(el) {
  const prev = topScreen();
  $('#app').appendChild(el);
  el.classList.add('push-in');
  prev.classList.remove('returning'); prev.classList.add('under');
  setTimeout(() => prev.querySelectorAll('video').forEach(v => v.pause()), 480);
  stack.push(el);
  const close = () => {
    stack.splice(stack.indexOf(el), 1);
    const p = topScreen(); p.classList.remove('under'); p.classList.add('returning');
    p.querySelectorAll('video.cover-media').forEach(v => v.play().catch(() => {}));
    el.classList.remove('push-in'); el.classList.add('push-out');
    el.querySelectorAll('video').forEach(v => v.pause());
    setTimeout(() => el.remove(), 430);
  };
  el._close = close;
  openLayer(close);
  const sc = el.querySelector('.scroller'), nav = el.querySelector('.nav');
  if (sc && nav) sc.addEventListener('scroll', () => nav.classList.toggle('scrolled', sc.scrollTop > 44), { passive: true });
  el.querySelector('.back')?.addEventListener('click', () => dismissLayer(close));
}
function refreshAll() { renderHome(); stack.forEach(s => s._render && s._render()); }

/* ================= Catégorie ================= */
function openCategory(c) {
  const el = h(`<section class="screen"><div class="scroller">
    <div class="nav"><button class="icon-btn glass back" aria-label="Retour">${I.back}</button><span class="title-sm"></span>
      <div class="right"><button class="icon-btn glass" data-act="menu" aria-label="Options">${I.more}</button></div></div>
    <h1 class="big-title"></h1><p class="sub"></p><div class="albums"></div></div>
    <button class="fab glass" data-act="new" aria-label="Nouvel album">${I.plus}</button></section>`);
  el._render = () => {
    phN = 0;
    const list = catAlbums(c);
    el.querySelector('.title-sm').textContent = c.name;
    el.querySelector('.big-title').textContent = c.name;
    el.querySelector('.sub').textContent = plural(list.length, 'album', 'albums');
    el.querySelector('.albums').innerHTML = list.length ? list.map(a => `<button class="album" data-id="${a.id}">
        <div class="thumb">${coverHTML(albumCover(a), !!a.cover && (db.media[a.cover] || {}).type === 'video')}</div>
        <p class="name">${esc(a.name)}</p><p class="count">${a.items.length}</p></button>`).join('')
      : `<div class="empty" style="grid-column:1/-1">${I.album}<b>Aucun album</b>Touchez + pour créer votre premier album.</div>`;
  };
  el._render();
  el.addEventListener('click', async e => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'new') {
      const name = await dialog({ title: 'Nouvel album', msg: 'Choisissez un nom pour cet album.', input: true, ok: 'Créer' });
      if (!name) return;
      const a = { id: uid(), name, cat: c.id, cover: null, items: [], created: Date.now() };
      db.albums[a.id] = a; c.albums.push(a.id); save(); refreshAll();
      openAlbum(a);
      return;
    }
    if (act === 'menu') { catMenu(c); return; }
    const al = e.target.closest('.album');
    if (al) openAlbum(db.albums[al.dataset.id]);
  });
  longPress(el.querySelector('.albums'), '.album', t => {
    const a = db.albums[t.dataset.id];
    contextMenu(t.querySelector('.thumb'), { kind: 'album', title: a.name, actions: albumActions(a), open: () => openAlbum(a) });
  });
  pushScreen(el);
}

function albumActions(a, fromAlbum) {
  const list = [
    { label: 'Renommer', icon: I.pencil, run: () => rename(a, "Renommer l'album") },
    { label: 'Couverture depuis le téléphone', icon: I.phone, run: () => pickCover(a) }
  ];
  if (a.cover) list.push({ label: 'Couverture automatique', icon: I.auto, run: () => { const old = a.cover; a.cover = null; gc([old]); save(); refreshAll(); } });
  db.cats.filter(c => c.id !== a.cat).forEach(c => list.push({
    label: `Déplacer vers « ${c.name} »`, icon: I.move, run: () => {
      const from = catOf(a); if (from) from.albums = from.albums.filter(x => x !== a.id);
      a.cat = c.id; c.albums.push(a.id); save(); refreshAll(); toast(`Album déplacé vers « ${c.name} »`);
    }
  }));
  list.push({ label: 'Exporter en ZIP', icon: I.save, run: () => exportZip(a.name, albumItems(a).map(m => zipEntry(m))) });
  list.push(null, { label: "Supprimer l'album", icon: I.trash, danger: true, run: async () => {
    const ok = await dialog({ title: `Supprimer « ${a.name} » ?`, msg: `${plural(a.items.length, 'élément sera supprimé', 'éléments seront supprimés')} de Secret.`, ok: 'Supprimer', danger: true });
    if (!ok) return;
    const ids = [...a.items, a.cover].filter(Boolean);
    const c = catOf(a); if (c) c.albums = c.albums.filter(x => x !== a.id);
    delete db.albums[a.id]; gc(ids); save();
    const top = topScreen(); if (top._album === a) dismissLayer(top._close);
    refreshAll(); toast('Album supprimé');
  } });
  return list;
}
const albumMenu = a => runSheet(a.name, albumActions(a));

/* ================= Album (grille façon Photos) ================= */
function openAlbum(a) {
  const el = h(`<section class="screen"><div class="scroller">
    <div class="nav"><button class="icon-btn glass back" aria-label="Retour">${I.back}</button>
      <button class="pill glass hidden" data-act="all">Tout sélectionner</button><span class="title-sm"></span>
      <div class="right"><button class="pill glass" data-act="select">Sélectionner</button>
      <button class="icon-btn glass" data-act="menu" aria-label="Options">${I.more}</button></div></div>
    <h1 class="big-title"></h1><p class="sub"></p>
    <div class="seg glass"><i class="seg-thumb"></i><button data-kind="all">Tout</button><button data-kind="real">Real</button><button data-kind="ai">IA</button></div>
    <div class="grid"></div><div class="grid-foot"></div></div>
    <button class="fab glass" data-act="add" aria-label="Importer">${I.plus}</button>
    <div class="toolbar glass hidden">
      <button class="tb-btn" data-act="s-save" aria-label="Télécharger">${I.save}</button>
      <button class="tb-btn" data-act="s-zip" aria-label="Exporter en ZIP">${I.zip}</button>
      <button class="tb-btn" data-act="s-move" aria-label="Déplacer">${I.move}</button>
      <button class="tb-btn" data-act="s-add" aria-label="Ajouter à un album">${I.addTo}</button>
      <button class="tb-btn tb-ai" data-act="s-ai" aria-label="Mention IA">IA</button>
      <button class="tb-btn" data-act="s-cover" aria-label="Couverture">${I.cover}</button>
      <button class="tb-btn danger" data-act="s-del" aria-label="Supprimer">${I.trash}</button>
    </div></section>`);
  el._album = a;
  const grid = el.querySelector('.grid'), sc = el.querySelector('.scroller');
  let items = [], selecting = false; const sel = new Set();
  el._render = () => {
    if (!db.albums[a.id]) return;
    items = viewItems(a);
    const all = albumItems(a), nAi = all.filter(m => m.ai).length;
    el.querySelector('.big-title').textContent = a.name;
    el.querySelector('.sub').textContent = countLabel(all) + (nAi ? ` · ${nAi} IA` : '');
    const k = kindOf(), seg = el.querySelector('.seg');
    seg.dataset.k = k;
    seg.querySelectorAll('[data-kind]').forEach(b => b.classList.toggle('on', b.dataset.kind === k));
    grid.className = `grid c${db.settings.cols}${selecting ? ' selecting' : ''}`;
    const key = k + '|' + items.map(m => m.id + (m.fav ? '*' : '') + (m.ai ? '~' : '')).join(',');
    if (key !== el._key) {
      el._key = key;
      let month = '';
      grid.innerHTML = items.map((m, i) => {
        const mo = new Date(sortKey(m) || Date.now()).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const head = a.sort !== 'added' && mo !== month ? `<div class="mhead">${esc(mo)}</div>` : '';
        month = mo;
        return `${head}<div class="cell${sel.has(m.id) ? ' sel' : ''}" data-i="${i}">
      ${m.thumb ? `<img src="${fileSrc(m.thumb)}" loading="lazy" decoding="async" draggable="false" alt="">` : `<div class="cover-empty ph-${i % 4}">${I.photos}</div>`}
      ${m.type === 'video' ? `<span class="dur">${fmtDur(m.duration)}</span>` : ''}${m.fav ? `<span class="favb">${I.heartOn}</span>` : ''}${m.ai ? '<span class="aib">IA</span>' : ''}<span class="check">${I.check}</span></div>`;
      }).join('');
      if (!items.length) grid.innerHTML = all.length
        ? `<div class="empty" style="grid-column:1/-1">${I.photos}<b>Aucun élément ${k === 'ai' ? 'IA' : 'Real'}</b>${k === 'ai' ? 'Sélectionnez des photos puis touchez « IA » pour les marquer.' : 'Tous les éléments de cet album sont marqués IA.'}</div>`
        : `<div class="empty" style="grid-column:1/-1">${I.photos}<b>Album vide</b>Touchez + pour importer des photos et des vidéos.</div>`;
    }
    el.querySelector('.grid-foot').textContent = items.length ? countLabel(items) : '';
    updateSelUI();
  };
  function updateSelUI() {
    const selBtn = el.querySelector('[data-act="select"]');
    selBtn.textContent = 'Annuler'; selBtn.classList.toggle('hidden', !selecting);
    const all = el.querySelector('[data-act="all"]');
    all.classList.toggle('hidden', !selecting || !items.length);
    all.textContent = items.length && sel.size === items.length ? 'Tout désélectionner' : 'Tout sélectionner';
    el.querySelector('.toolbar').classList.toggle('hidden', !selecting);
    el.querySelector('.fab').classList.toggle('hidden', selecting);
    el.querySelector('.back').classList.toggle('hidden', selecting);
    el.querySelector('[data-act="menu"]').classList.toggle('hidden', selecting);
    el.querySelector('.title-sm').textContent = a.name;
    el.querySelector('.title-sm').classList.toggle('hidden', selecting);
    el.querySelector('.big-title').textContent = selecting ? (sel.size ? plural(sel.size, 'sélectionné', 'sélectionnés') : 'Sélectionnez des éléments') : a.name;
    el.querySelector('.nav').classList.toggle('scrolled', sc.scrollTop > 44);
    el.querySelectorAll('.toolbar .tb-btn').forEach(b => b.disabled = !sel.size);
    el.querySelector('[data-act="s-cover"]').disabled = sel.size !== 1;
    el.querySelector('.seg').classList.toggle('hidden', selecting);
  }
  function setSelecting(on) {
    selecting = on; sel.clear();
    grid.classList.toggle('selecting', on);
    grid.querySelectorAll('.cell.sel').forEach(c => c.classList.remove('sel'));
    updateSelUI();
  }
  el._render();
  const selectAll = () => { setSelecting(true); items.forEach(m => sel.add(m.id)); paintSel(); };
  const paintSel = () => { grid.querySelectorAll('.cell').forEach(c => c.classList.toggle('sel', sel.has(items[+c.dataset.i].id))); updateSelUI(); };
  const selected = () => items.filter(m => sel.has(m.id));

  el.addEventListener('click', async e => {
    if (dragDone) { dragDone = false; return; }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'select') { setSelecting(!selecting); return; }
    if (act === 'all') { if (sel.size === items.length) sel.clear(); else items.forEach(m => sel.add(m.id)); paintSel(); return; }
    if (act === 's-move' || act === 's-add') {
      const ids = selected().map(m => m.id);
      if (await moveMedia(ids, a, act === 's-add')) setSelecting(false);
      return;
    }
    if (act === 'menu') {
      runSheet(a.name, [
        items.length && { label: 'Tout sélectionner', icon: I.selectI, run: selectAll },
        { label: `Trier : ${SORTS[a.sort || 'old']}`, icon: I.sort, run: async () => {
          const keys = Object.keys(SORTS);
          const i = await sheet({ title: 'Trier les éléments', opts: keys.map(k => ({ label: (k === (a.sort || 'old') ? '✓  ' : '') + SORTS[k] })) });
          if (i == null) return;
          a.sort = keys[i]; save(); el._key = ''; el._render();
        } },
        ...albumActions(a)
      ]);
      return;
    }
    const kb = e.target.closest('[data-kind]');
    if (kb) { db.settings.kind = kb.dataset.kind; save(); el._render(); sc.scrollTo({ top: 0 }); return; }
    if (act === 's-ai') {
      const list = selected(); if (!list.length) return;
      const i = await sheet({ title: plural(list.length, 'élément', 'éléments'), opts: [{ label: 'Mentionner « IA »' }, { label: 'Mentionner « Real »' }] });
      if (i == null) return;
      list.forEach(m => { m.ai = i === 0; });
      save(); setSelecting(false); refreshAll();
      return;
    }
    if (act === 'add') {
      const i = await sheet({ title: 'Importer', opts: [{ label: 'Photos et vidéos' }, { label: 'Fichier ZIP' }] });
      if (i === 0) importInto(a); else if (i === 1) importZip(catOf(a), a);
      return;
    }
    if (act === 's-save') { flashSave(e.target.closest('[data-act]'), selected()); return; }
    if (act === 's-zip') { const list = selected(); setSelecting(false); exportZip(`${a.name} (${list.length})`, list.map(m => zipEntry(m))); return; }
    if (act === 's-cover') { const [id] = sel; await chooseCover(db.media[id], a); setSelecting(false); return; }
    if (act === 's-del') {
      const ids = [...sel];
      if (await deleteMedia(a, ids)) setSelecting(false);
      return;
    }
    const cell = e.target.closest('.cell'); if (!cell) return;
    const m = items[+cell.dataset.i];
    if (selecting) { sel.has(m.id) ? sel.delete(m.id) : sel.add(m.id); cell.classList.toggle('sel', sel.has(m.id)); updateSelUI(); }
    else openViewer(a, +cell.dataset.i, cell);
  });
  longPress(grid, '.cell', (cell, p) => {
    if (selecting) return;
    const i = +cell.dataset.i, m = items[i];
    navigator.vibrate && navigator.vibrate(12);
    setSelecting(true); sel.add(m.id); paintSel();
    drag = { touch: !!p.touch, x: p.x, y: p.y, lx: p.x, ly: p.y, start: i, val: true, base: new Set(sel), active: true };
    requestAnimationFrame(autoScroll);
  });

  // Sélection par glissement (comme Photos iOS)
  let drag = null, dragDone = false;
  grid.addEventListener('pointerdown', e => {
    if (!selecting) return;
    const cell = e.target.closest('.cell'); if (!cell) return;
    const i = +cell.dataset.i;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, start: i, val: !sel.has(items[i].id), base: new Set(sel), active: false };
  });
  const applyDrag = () => {
    const c = document.elementFromPoint(drag.lx, drag.ly)?.closest('.cell'); if (!c || !grid.contains(c)) return;
    const j = +c.dataset.i, lo = Math.min(drag.start, j), hi = Math.max(drag.start, j);
    sel.clear(); drag.base.forEach(x => sel.add(x));
    for (let k = lo; k <= hi; k++) drag.val ? sel.add(items[k].id) : sel.delete(items[k].id);
    paintSel();
  };
  const autoScroll = () => {
    if (!drag || !drag.active) return;
    const r = sc.getBoundingClientRect();
    const v = drag.ly < r.top + 110 ? -(r.top + 110 - drag.ly) / 6 : drag.ly > r.bottom - 110 ? (drag.ly - (r.bottom - 110)) / 6 : 0;
    if (v) { sc.scrollTop += v; applyDrag(); }
    requestAnimationFrame(autoScroll);
  };
  grid.addEventListener('pointermove', e => {
    if (!drag || (drag.touch ? true : drag.id !== undefined && e.pointerId !== drag.id)) return;
    drag.lx = e.clientX; drag.ly = e.clientY;
    if (!drag.active) {
      const dx = Math.abs(e.clientX - drag.x), dy = Math.abs(e.clientY - drag.y);
      if (dx > 7 && dx > dy) { drag.active = true; try { grid.setPointerCapture(e.pointerId); } catch (_) {} requestAnimationFrame(autoScroll); }
      else if (dy > 10) { drag = null; return; }
      else return;
    }
    applyDrag();
  });
  grid.addEventListener('touchmove', e => {
    if (!drag || !drag.active) return;
    e.preventDefault();
    if (drag.touch) { const t = e.touches[0]; drag.lx = t.clientX; drag.ly = t.clientY; applyDrag(); }
  }, { passive: false });
  const endDrag = () => { if (drag && drag.active) dragDone = true; drag = null; setTimeout(() => { dragDone = false; }, 350); };
  grid.addEventListener('pointerup', e => { if (drag && !drag.touch) endDrag(); });
  grid.addEventListener('pointercancel', e => { if (drag && !drag.touch) endDrag(); });
  grid.addEventListener('touchend', () => { if (drag && drag.touch) endDrag(); });
  grid.addEventListener('touchcancel', () => { if (drag && drag.touch) endDrag(); });
  pinchColumns(sc, grid);
  pushScreen(el);
  requestAnimationFrame(() => { sc.scrollTop = sc.scrollHeight; });
}

function pinchColumns(sc, grid) {
  let d0 = 0;
  const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  sc.addEventListener('touchstart', e => { if (e.touches.length === 2) d0 = dist(e.touches); }, { passive: true });
  sc.addEventListener('touchmove', e => {
    if (e.touches.length !== 2 || !d0) return;
    const r = dist(e.touches) / d0, order = [2, 3, 5];
    let i = order.indexOf(db.settings.cols);
    if (r > 1.3 && i > 0) i--; else if (r < 0.75 && i < order.length - 1) i++; else return;
    d0 = dist(e.touches);
    db.settings.cols = order[i]; save();
    grid.classList.remove('c2', 'c3', 'c5'); grid.classList.add('c' + order[i]);
  }, { passive: true });
  sc.addEventListener('touchend', () => { d0 = 0; }, { passive: true });
}

function longPress(root, sel, fn) {
  let t = 0, x = 0, y = 0, fired = false, cur = null;
  const clear = () => { clearTimeout(t); cur && cur.classList.remove('pressing'); cur = null; };
  const start = (tg, cx, cy, touch) => {
    clear(); fired = false; x = cx; y = cy; cur = tg;
    tg.classList.add('pressing');
    t = setTimeout(() => { fired = true; tg.classList.remove('pressing'); cur = null; fn(tg, { x, y, touch }); }, 420);
  };
  root.addEventListener('touchstart', e => {
    if (e.touches.length > 1) { clear(); return; }
    const tg = e.target.closest(sel); if (!tg) return;
    start(tg, e.touches[0].clientX, e.touches[0].clientY, true);
  }, { passive: true });
  root.addEventListener('touchmove', e => { const p = e.touches[0]; if (cur && Math.hypot(p.clientX - x, p.clientY - y) > 10) clear(); }, { passive: true });
  root.addEventListener('touchend', clear); root.addEventListener('touchcancel', clear);
  root.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') return; const tg = e.target.closest(sel); if (tg) start(tg, e.clientX, e.clientY, false); });
  root.addEventListener('pointermove', e => { if (e.pointerType !== 'touch' && cur && Math.hypot(e.clientX - x, e.clientY - y) > 10) clear(); });
  root.addEventListener('pointerup', e => { if (e.pointerType !== 'touch') clear(); });
  root.addEventListener('scroll', clear, { passive: true, capture: true });
  root.addEventListener('click', e => { if (fired) { e.stopPropagation(); e.preventDefault(); fired = false; } }, true);
  root.addEventListener('contextmenu', e => e.preventDefault());
  root.addEventListener('dragstart', e => e.preventDefault());
}

/* ================= Actions sur les médias ================= */
let busyExternal = false, extT = 0;
const endExternal = () => { clearTimeout(extT); extT = setTimeout(() => { busyExternal = false; }, 900); };
async function importInto(a) {
  clearTimeout(extT); busyExternal = true;
  let sub;
  try {
    sub = await Vault.addListener('importProgress', p => toast(`Importation ${p.done}/${p.total}…`, 0));
    const r = await Vault.pickMedia({ multiple: true });
    const list = (r && r.items) || [];
    if (!list.length) return;
    const sources = list.map(m => m.source).filter(Boolean);
    list.forEach(m => { delete m.source; db.media[m.id] = m; a.items.push(m.id); });
    save(); refreshAll();
    toast(null);
    const top = topScreen().querySelector('.scroller'); if (top) requestAnimationFrame(() => top.scrollTo({ top: top.scrollHeight, behavior: 'smooth' }));
    if (sources.length) await offerGalleryDelete(sources);
  } catch (e) { toast(null); }
  finally { endExternal(); sub && sub.remove && sub.remove(); }
}

async function offerGalleryDelete(uris) {
  try { if (!(await Vault.canDeleteFromGallery()).available) return; } catch (e) { return; }
  const n = uris.length;
  const i = await sheet({
    title: n > 1 ? `${n} éléments importés dans Secret` : 'Importé dans Secret',
    msg: n > 1 ? 'Supprimer les originaux de la galerie du téléphone ?' : "Supprimer l'original de la galerie du téléphone ?",
    opts: [{ label: n > 1 ? `Supprimer les ${n} originaux` : "Supprimer l'original", danger: true }, { label: 'Garder dans la galerie' }]
  });
  if (i !== 0) return;
  clearTimeout(extT); busyExternal = true;
  try { await Vault.deleteFromGallery({ uris }); } catch (e) {}
  finally { endExternal(); }
}

const safeName = n => String(n || '').replace(/[\\/:*?"<>|]/g, '_').trim() || 'Album';
function zipEntry(m, folder) {
  const ext = (m.path.match(/\.[a-z0-9]+$/i) || [''])[0];
  let name = m.name || (m.id.slice(0, 8) + ext);
  if (!/\.[a-z0-9]+$/i.test(name)) name += ext;
  return { path: m.path, name: (folder ? safeName(folder) + '/' : '') + safeName(name), time: m.taken || m.added || 0 };
}

async function importZip(cat, album) {
  if (!isNative) { toast('Disponible sur Android'); return; }
  clearTimeout(extT); busyExternal = true;
  let sub;
  try {
    sub = await Vault.addListener('zipProgress', p => toast(`Importation ${p.done}…`, 0));
    const r = await Vault.importZip();
    const list = (r && r.items) || [];
    if (!list.length) { if (r && r.zipName != null) toast('Aucune photo ou vidéo dans ce ZIP'); return; }
    let albumsTouched = 0;
    const add = (a, m) => { delete m.folder; db.media[m.id] = m; a.items.push(m.id); };
    if (album) list.forEach(m => add(album, m));
    else {
      const groups = new Map();
      list.forEach(m => { const k = m.folder || r.zipName || 'Import'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(m); });
      for (const [name, ms] of groups) {
        let a = catAlbums(cat).find(x => x.name === name);
        if (!a) { a = { id: uid(), name, cat: cat.id, cover: null, items: [], created: Date.now() }; db.albums[a.id] = a; cat.albums.push(a.id); }
        ms.forEach(m => add(a, m)); albumsTouched++;
      }
    }
    save(); refreshAll();
    toast(`${plural(list.length, 'élément importé', 'éléments importés')}${albumsTouched ? ` dans ${plural(albumsTouched, 'album', 'albums')}` : ''}`, 2600);
  } catch (e) { toast('ZIP illisible'); }
  finally { endExternal(); sub && sub.remove && sub.remove(); }
}

async function exportZip(name, entries) {
  if (!isNative) { toast('Disponible sur Android'); return; }
  if (!entries.length) { toast('Rien à exporter'); return; }
  clearTimeout(extT); busyExternal = true;
  let sub;
  try {
    sub = await Vault.addListener('zipProgress', p => toast(`Export ${p.done}/${p.total}…`, 0));
    const r = await Vault.exportZip({ name: safeName(name), entries });
    toast(`${r.name} enregistré dans Téléchargements/Secret`, 3200);
  } catch (e) { toast("Échec de l'export"); }
  finally { endExternal(); sub && sub.remove && sub.remove(); }
}

async function saveMany(list) {
  if (!list.length) return 0;
  clearTimeout(extT); busyExternal = true;
  let ok = 0;
  for (const m of list) {
    if (list.length > 1) toast(`Téléchargement ${ok + 1}/${list.length}…`, 0);
    try { await Vault.saveToGallery({ path: m.path, mime: m.mime }); ok++; } catch (e) {}
  }
  endExternal();
  toast(null);
  return ok;
}

async function deleteMedia(a, ids) {
  if (!ids.length) return false;
  const ok = await dialog({ title: ids.length > 1 ? `Supprimer ${ids.length} éléments ?` : 'Supprimer cet élément ?', msg: 'Ils seront définitivement supprimés de Secret.', ok: 'Supprimer', danger: true });
  if (!ok) return false;
  a.items = a.items.filter(x => !ids.includes(x));
  gc(ids); save(); refreshAll();
  return true;
}

async function chooseCover(m, a) {
  if (!m) return;
  const c = catOf(a);
  const i = await sheet({ title: 'Utiliser comme couverture', opts: [{ label: `Couverture de l'album « ${a.name} »` }, { label: `Couverture de « ${c ? c.name : 'la catégorie'} »` }] });
  if (i == null) return;
  const target = i === 0 ? a : c; if (!target) return;
  const old = target.cover; target.cover = m.id;
  if (old && old !== m.id) gc([old]);
  save(); refreshAll(); toast('Couverture mise à jour');
}

function mediaActions(m, a, onSelect) {
  const list = [
    { label: 'Enregistrer dans la galerie', icon: I.save, run: () => saveMany([m]) },
    { label: 'Déplacer vers un album', icon: I.move, run: () => moveMedia([m.id], a, false) },
    { label: 'Ajouter à un album', icon: I.addTo, run: () => moveMedia([m.id], a, true) },
    { label: 'Utiliser comme couverture', icon: I.cover, run: () => chooseCover(m, a) },
    { label: m.ai ? 'Mentionner « Real »' : 'Mentionner « IA »', icon: I.selectI, run: () => { m.ai = !m.ai; save(); refreshAll(); if (V) updateViewerChrome(true); } }
  ];
  if (onSelect) list.push({ label: 'Sélectionner', icon: I.selectI, run: onSelect });
  list.push(null, { label: 'Supprimer', icon: I.trash, danger: true, run: () => deleteMedia(a, [m.id]) });
  return list;
}

async function moveMedia(ids, from, copy) {
  if (!ids.length) return false;
  const to = await pickAlbum(copy ? 'Ajouter à un album' : 'Déplacer vers un album', from);
  if (!to) return false;
  ids.forEach(id => { if (!to.items.includes(id)) to.items.push(id); });
  if (!copy) from.items = from.items.filter(x => !ids.includes(x));
  save(); refreshAll();
  toast(`${plural(ids.length, 'élément', 'éléments')} ${copy ? 'ajouté' : 'déplacé'}${ids.length > 1 ? 's' : ''} vers « ${to.name} »`);
  if (V && !copy) {
    V.items = viewItems(V.a);
    if (!V.items.length) dismissLayer(closeViewer);
    else { V.idx = Math.min(V.idx, V.items.length - 1); resetZoom(); renderSlides(false); }
  }
  return true;
}

function pickAlbum(title, from) {
  return new Promise(res => {
    const L = $('#layer');
    const bd = h('<div class="backdrop"></div>');
    const rows = db.cats.map(c => {
      const al = catAlbums(c).filter(x => x !== from);
      return `<p class="phead">${esc(c.name)}</p>` + (al.length ? al.map(x => `<button class="prow" data-id="${x.id}">
        <span class="th">${coverHTML(albumCover(x), false)}</span><span class="pn"><b>${esc(x.name)}</b><small>${x.items.length}</small></span></button>`).join('')
        : '<p class="pnone">Aucun autre album</p>');
    }).join('');
    const sh = h(`<div class="sheet picker"><div class="group glass"><div class="head"><b>${esc(title)}</b></div>
      <div class="plist"><button class="prow new" data-new="1"><span class="th">${I.plus}</span><span class="pn"><b>Nouvel album…</b></span></button>${rows}</div></div>
      <div class="group glass"><button class="opt cancel" data-x="1">Annuler</button></div></div>`);
    L.append(bd, sh);
    requestAnimationFrame(() => requestAnimationFrame(() => { bd.classList.add('show'); sh.classList.add('show'); }));
    let result = null, done = false, creating = false;
    const close = () => {
      if (done) return; done = true;
      bd.classList.remove('show'); sh.classList.remove('show');
      setTimeout(() => { bd.remove(); sh.remove(); }, 420);
      if (!creating) res(result);
    };
    openLayer(close);
    bd.onclick = () => dismissLayer(close);
    sh.onclick = async e => {
      if (e.target.closest('[data-x]')) { dismissLayer(close); return; }
      if (e.target.closest('[data-new]')) {
        creating = true; dismissLayer(close);
        const name = await dialog({ title: 'Nouvel album', input: true, ok: 'Créer' });
        if (!name) { res(null); return; }
        const c = catOf(from) || db.cats[0];
        const na = { id: uid(), name, cat: c.id, cover: null, items: [], created: Date.now() };
        db.albums[na.id] = na; c.albums.push(na.id); save();
        res(na); return;
      }
      const r = e.target.closest('[data-id]'); if (!r) return;
      result = db.albums[r.dataset.id]; dismissLayer(close);
    };
  });
}

/* ================= Menu contextuel (appui long, style iOS) ================= */
function contextMenu(src, { kind, media, title, actions, open }) {
  const L = $('#layer');
  const vw = innerWidth, vh = innerHeight;
  const cs = getComputedStyle(document.documentElement);
  const sat = parseFloat(cs.getPropertyValue('--safe-area-inset-top')) || 0;
  const sab = parseFloat(cs.getPropertyValue('--safe-area-inset-bottom')) || 0;
  const r = src.getBoundingClientRect();
  const acts = actions;
  const bd = h('<div class="ctx-bd"></div>');
  const pv = h('<div class="ctx-prev"></div>');
  let pw, ph, ratio = 1;
  if (kind === 'media') {
    const img = src.querySelector('img');
    if (img && img.naturalWidth) ratio = img.naturalWidth / img.naturalHeight;
    pv.innerHTML = media.type === 'video'
      ? `<video src="${fileSrc(media.path)}" ${media.thumb ? `poster="${fileSrc(media.thumb)}"` : ''} muted autoplay loop playsinline></video>`
      : `<img src="${fileSrc(media.thumb || media.path)}" alt="">`;
    if (media.type === 'image') { const full = new Image(); full.onload = () => { const i = pv.querySelector('img'); if (i) i.src = full.src; }; full.src = fileSrc(media.path); }
    pw = Math.min(vw - 48, 360); ph = pw / ratio;
    const maxH = vh * 0.48; if (ph > maxH) { ph = maxH; pw = ph * ratio; }
  } else {
    pv.innerHTML = src.innerHTML;
    pv.querySelectorAll('.more,.go').forEach(x => x.remove());
    ratio = r.width / r.height;
    pw = Math.min(kind === 'cat' ? vw - 32 : 230, r.width * 1.08); ph = pw / ratio;
    const maxH = vh * 0.38; if (ph > maxH) { ph = maxH; pw = Math.min(vw - 32, ph * ratio); }
  }
  const menu = h(`<div class="ctx-menu glass">${title ? `<div class="ctx-title">${esc(title)}</div>` : ''}${acts.map((x, i) => x ? `<button class="ctx-item ${x.danger ? 'danger' : ''}" data-i="${i}"><span>${esc(x.label)}</span>${x.icon || ''}</button>` : '<div class="ctx-sep"></div>').join('')}</div>`);
  pv.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${getComputedStyle(src).borderRadius}`;
  L.append(bd, pv, menu);
  const mw = Math.min(290, vw - 32); menu.style.width = mw + 'px';
  const mh = menu.offsetHeight;
  const total = ph + 14 + mh;
  let top = clamp((vh - total) / 2, sat + 16, Math.max(sat + 16, vh - sab - 16 - total));
  const left = (vw - pw) / 2;
  const mLeft = clamp(r.left + r.width / 2 - mw / 2, 16, vw - 16 - mw);
  menu.style.cssText = `left:${kind === 'media' ? (vw - mw) / 2 : mLeft}px;top:${top + ph + 14}px;width:${mw}px`;
  navigator.vibrate && navigator.vibrate(10);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    bd.classList.add('show'); menu.classList.add('show'); pv.classList.add('lift');
    pv.style.left = left + 'px'; pv.style.top = top + 'px'; pv.style.width = pw + 'px'; pv.style.height = ph + 'px';
    pv.style.borderRadius = kind === 'cat' ? '30px' : '16px';
  }));
  let done = false;
  const close = (fast) => {
    if (done) return; done = true;
    bd.classList.remove('show'); menu.classList.remove('show');
    if (fast) pv.classList.add('fade');
    else { pv.style.left = r.left + 'px'; pv.style.top = r.top + 'px'; pv.style.width = r.width + 'px'; pv.style.height = r.height + 'px'; pv.classList.remove('lift'); }
    setTimeout(() => { pv.querySelectorAll('video').forEach(v => v.pause()); bd.remove(); pv.remove(); menu.remove(); }, 380);
  };
  let fast = false;
  const closer = () => close(fast);
  openLayer(closer);
  bd.onclick = () => dismissLayer(closer);
  pv.onclick = () => { if (done) return; fast = true; dismissLayer(closer); setTimeout(open, 60); };
  menu.onclick = e => {
    const b = e.target.closest('[data-i]'); if (!b || done) return;
    const act = acts[+b.dataset.i];
    fast = true; dismissLayer(closer);
    setTimeout(() => act.run(), 120);
  };
}

/* ================= Visionneuse (façon Photos iOS) ================= */
let V = null, closeAnimT = 0;
const isVid = e => e && e.tagName === 'VIDEO';
function openViewer(a, idx, cell) {
  const el = $('#viewer');
  clearTimeout(closeAnimT);
  el.innerHTML = `<div class="v-bg"></div><div class="track"></div>
    <div class="v-top">
      <button class="icon-btn glass" data-act="close" aria-label="Retour">${I.back}</button>
      <div class="v-date glass"><b></b><small></small></div>
      <button class="icon-btn glass" data-act="more" aria-label="Plus">${I.more}</button>
    </div>
    <div class="v-bottom">
      <div class="vctl glass hidden">
        <button class="tb-btn" data-act="play" aria-label="Lecture">${I.pause}</button>
        <span class="time t-cur">0:00</span>
        <div class="scrub"><div class="bar"><div class="fill"></div><div class="knob"></div></div></div>
        <span class="time t-dur">0:00</span>
        <button class="tb-btn" data-act="mute" aria-label="Son">${I.sound}</button>
        <button class="tb-btn" data-act="loop" aria-label="Lecture en boucle">${I.loop}</button>
      </div>
      <div class="film"><div class="film-in"></div></div>
      <div class="v-bar">
        <button class="icon-btn glass big" data-act="save" aria-label="Télécharger">${I.save}</button>
        <div class="v-mid glass">
          <button class="tb-btn" data-act="fav" aria-label="Favori">${I.heart}</button>
          <button class="tb-btn" data-act="info" aria-label="Infos">${I.info}</button>
          <button class="tb-btn" data-act="cover" aria-label="Couverture">${I.cover}</button>
        </div>
        <button class="icon-btn glass big" data-act="del" aria-label="Supprimer">${I.trash}</button>
      </div>
    </div>`;
  V = { el, a, items: viewItems(a), idx, slides: new Map(), s: 1, tx: 0, ty: 0, chrome: true, muted: false };
  el.classList.remove('hidden', 'chromeless', 'closing');
  el.style.background = '';
  buildFilm();
  renderSlides(false);
  openLayer(closeViewer);
  heroOpen(cell);
}

function fitRect(box, nw, nh) {
  const f = Math.min(box.width / nw, box.height / nh), w = nw * f, h = nh * f;
  return { left: box.left + (box.width - w) / 2, top: box.top + (box.height - h) / 2, width: w, height: h };
}
function ghost(src, r) {
  const g = document.createElement('img');
  g.className = 'v-ghost'; g.src = src;
  Object.assign(g.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  return g;
}
function heroOpen(cell) {
  const img = cell && cell.querySelector('img');
  const el = V.el;
  if (!img || !img.naturalWidth) { el.classList.add('opening'); setTimeout(() => el.classList.remove('opening'), 320); return; }
  const from = cell.getBoundingClientRect();
  const to = fitRect({ left: 0, top: 0, width: el.clientWidth, height: el.clientHeight }, img.naturalWidth, img.naturalHeight);
  const g = ghost(img.src, from);
  el.appendChild(g); el.classList.add('hero');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.classList.add('hero-in');
    Object.assign(g.style, { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px', borderRadius: '0' });
  }));
  const slideImg = curEl();
  const ready = slideImg && slideImg.tagName === 'IMG' && slideImg.decode ? Promise.race([slideImg.decode().catch(() => {}), sleep(700)]) : Promise.resolve();
  Promise.all([sleep(400), ready]).then(() => { el.classList.remove('hero', 'hero-in'); requestAnimationFrame(() => g.remove()); });
}
function closeViewer() {
  if (!V) return;
  const v = V; V = null;
  const el = v.el, m = v.items[v.idx], slide = v.slides.get(m && m.id);
  const media = slide && slide.querySelector('img,video');
  const grid = topScreen().querySelector('.grid');
  const cell = grid && grid.querySelector(`.cell[data-i="${v.idx}"]`);
  const cimg = cell && cell.querySelector('img');
  Bars && Bars.show().catch(() => {});
  const cleanup = () => {
    v.slides.forEach(s => { const x = s.querySelector('video'); if (x) { x.pause(); x.removeAttribute('src'); x.load(); } });
    el.classList.add('hidden'); el.classList.remove('closing', 'chromeless'); el.innerHTML = ''; el.style.background = '';
  };
  const nw = media && (media.naturalWidth || media.videoWidth), nh = media && (media.naturalHeight || media.videoHeight);
  if (!cimg || !nw) { el.classList.add('closing'); closeAnimT = setTimeout(cleanup, 260); return; }
  cell.scrollIntoView({ block: 'nearest' });
  const from = fitRect(slide.getBoundingClientRect(), nw, nh), to = cell.getBoundingClientRect();
  const g = ghost(cimg.src, from);
  if (!isVid(media)) g.src = media.currentSrc || media.src;
  el.appendChild(g);
  el.classList.add('closing', 'hero');
  slide.style.visibility = 'hidden';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    Object.assign(g.style, { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px' });
  }));
  closeAnimT = setTimeout(cleanup, 400);
}
const curMedia = () => V && V.items[V.idx];
const curSlide = () => V && V.slides.get(V.items[V.idx]?.id);
const curEl = () => { const s = curSlide(); return s && s.querySelector('img,video'); };

function makeSlide(m) {
  const s = document.createElement('div');
  s.className = 'slide';
  if (m.type === 'video') {
    s.innerHTML = `<video src="${fileSrc(m.path)}" ${m.thumb ? `poster="${fileSrc(m.thumb)}"` : ''} playsinline preload="metadata"></video>`;
  } else {
    s.innerHTML = `<img src="${fileSrc(m.preview || m.path)}" decoding="async" alt="" draggable="false">`;
  }
  return s;
}
function renderSlides(anim, dx = 0, fromFilm) {
  const keep = new Set();
  const track = V.el.querySelector('.track');
  for (let i = V.idx - 1; i <= V.idx + 1; i++) {
    const m = V.items[i]; if (!m) continue;
    keep.add(m.id);
    let s = V.slides.get(m.id);
    if (!s) { s = makeSlide(m); V.slides.set(m.id, s); track.appendChild(s); }
    s.classList.toggle('anim', !!anim);
    s.style.transform = `translateX(calc(${(i - V.idx) * 100}% + ${(i - V.idx) * 14}px + ${dx}px))`;
  }
  V.slides.forEach((s, id) => {
    if (keep.has(id)) return;
    const v = s.querySelector('video'); if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
    s.remove(); V.slides.delete(id);
  });
  V.slides.forEach((s, id) => {
    const v = s.querySelector('video'); if (!v) return;
    if (id !== curMedia().id) { v.pause(); v.preload = 'none'; } else v.preload = 'auto';
  });
  fetchPreviews();
  if (!dx) updateViewerChrome(fromFilm);
}

/* Pellicule de miniatures */
function buildFilm() {
  const inner = V.el.querySelector('.film-in');
  inner.innerHTML = V.items.map((m, i) => `<button class="ft" data-fi="${i}">${m.thumb ? `<img src="${fileSrc(m.thumb)}" loading="lazy" decoding="async" alt="">` : ''}</button>`).join('');
  V.el.querySelector('.film').classList.toggle('hidden', V.items.length < 2);
}
function centerFilm(smooth) {
  const film = V.el.querySelector('.film'), t = film.querySelector(`[data-fi="${V.idx}"]`); if (!t) return;
  film.querySelectorAll('.ft.on').forEach(x => x !== t && x.classList.remove('on'));
  t.classList.add('on');
  const target = t.offsetLeft + 24 - film.clientWidth / 2;
  film._prog = true;
  film.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' });
  clearTimeout(film._pt); film._pt = setTimeout(() => { film._prog = false; }, smooth ? 450 : 50);
}
(function filmGestures() {
  const el = $('#viewer');
  let user = false, endT = 0;
  const film = () => el.querySelector('.film');
  const pick = () => {
    const f = film(); if (!f || !V) return;
    const mid = f.scrollLeft + f.clientWidth / 2;
    let best = V.idx, bd = 1e9;
    f.querySelectorAll('.ft').forEach(t => { const d = Math.abs(t.offsetLeft + t.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = +t.dataset.fi; } });
    if (best !== V.idx) {
      const v = curEl(); if (isVid(v)) v.pause();
      resetZoom(); V.idx = best; renderSlides(false, 0, true);
    }
  };
  el.addEventListener('touchstart', e => { if (e.target.closest('.film')) { user = true; film().classList.add('scrubbing'); clearTimeout(endT); } }, { passive: true });
  const release = () => {
    clearTimeout(endT);
    endT = setTimeout(() => { if (!V) return; user = false; film().classList.remove('scrubbing'); centerFilm(true); }, 160);
  };
  el.addEventListener('touchend', e => { if (user) release(); }, { passive: true });
  el.addEventListener('scroll', e => {
    if (!V || !e.target.classList || !e.target.classList.contains('film')) return;
    if (e.target._prog && !user) return;
    pick();
    if (user && !e.target.matches(':active')) release();
  }, true);
  el.addEventListener('click', e => {
    const t = e.target.closest('.ft'); if (!t || !V) return;
    const i = +t.dataset.fi; if (i === V.idx) return;
    const v = curEl(); if (isVid(v)) v.pause();
    resetZoom(); V.idx = i; renderSlides(false);
  });
})();

function updateViewerChrome(fromFilm) {
  const m = curMedia(); if (!m) return;
  const d = new Date(m.taken || m.added);
  const day = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  V.el.querySelector('.v-date b').textContent = day;
  V.el.querySelector('.v-date small').textContent = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + (m.ai ? ' · IA' : '');
  const fav = V.el.querySelector('[data-act="fav"]');
  fav.innerHTML = m.fav ? I.heartOn : I.heart; fav.classList.toggle('faved', !!m.fav);
  const ctl = V.el.querySelector('.vctl');
  ctl.classList.toggle('hidden', m.type !== 'video');
  V.el.querySelector('[data-act="loop"]').classList.toggle('on', db.settings.loop);
  V.el.querySelector('[data-act="mute"]').innerHTML = V.muted ? I.mute : I.sound;
  if (!fromFilm) centerFilm(true);
  else { const f = V.el.querySelector('.film'); f.querySelectorAll('.ft.on').forEach(x => x.classList.remove('on')); f.querySelector(`[data-fi="${V.idx}"]`)?.classList.add('on'); }
  if (m.type === 'video') bindVideo();
}
function bindVideo() {
  const v = curEl(); if (!isVid(v)) return;
  v.loop = db.settings.loop; v.muted = V.muted;
  if (v._bound) { v.play().catch(() => {}); return; }
  v._bound = true;
  const ctl = V.el.querySelector('.vctl');
  const fill = ctl.querySelector('.fill'), knob = ctl.querySelector('.knob');
  const tick = () => {
    if (!V || curEl() !== v) return;
    const p = v.duration ? v.currentTime / v.duration : 0;
    fill.style.width = p * 100 + '%'; knob.style.left = p * 100 + '%';
    ctl.querySelector('.t-cur').textContent = fmtDur(v.currentTime);
    ctl.querySelector('.t-dur').textContent = fmtDur(v.duration);
    ctl.querySelector('[data-act="play"]').innerHTML = v.paused ? I.play : I.pause;
    if (!v.paused) requestAnimationFrame(tick);
  };
  v._tick = tick;
  ['play', 'pause', 'loadedmetadata', 'seeked', 'timeupdate', 'ended'].forEach(ev => v.addEventListener(ev, tick));
  v.play().catch(() => tick());
}

async function flashSave(btn, list) {
  if (!btn || btn.classList.contains('busy')) return;
  btn.classList.remove('done', 'fail'); btn.classList.add('busy');
  const ok = await saveMany(list);
  btn.classList.remove('busy'); btn.classList.add(ok === list.length ? 'done' : 'fail');
  navigator.vibrate && navigator.vibrate(ok === list.length ? 15 : [30, 40, 30]);
  setTimeout(() => btn.classList.remove('done', 'fail'), 1400);
}

function viewerAction(act, btn) {
  const m = curMedia(); if (!m) return;
  const v = curEl();
  if (act === 'close') dismissLayer(closeViewer);
  else if (act === 'play' && isVid(v)) { v.paused ? v.play().catch(() => {}) : v.pause(); }
  else if (act === 'mute') { V.muted = !V.muted; if (isVid(v)) v.muted = V.muted; updateViewerChrome(true); }
  else if (act === 'loop') {
    db.settings.loop = !db.settings.loop; save();
    if (isVid(v)) v.loop = db.settings.loop;
    updateViewerChrome(true);
  }
  else if (act === 'fav') {
    m.fav = !m.fav; save(); updateViewerChrome(true);
    btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
    refreshAll();
  }
  else if (act === 'info') {
    const d = new Date(m.taken || m.added);
    const lines = [
      d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      m.name || '',
      m.type === 'video' ? `Vidéo · ${fmtDur(m.duration)}` : 'Photo',
      `Album : ${V.a.name}`
    ].filter(Boolean);
    sheet({ title: 'Informations', msg: lines.join('\n'), opts: [] });
  }
  else if (act === 'more') runSheet('', mediaActions(m, V.a).filter(x => x && x.icon !== I.save && x.icon !== I.trash && x.icon !== I.cover));
  else if (act === 'save') flashSave(btn, [m]);
  else if (act === 'cover') chooseCover(m, V.a);
  else if (act === 'del') {
    const a = V.a;
    deleteMedia(a, [m.id]).then(ok => {
      if (!ok || !V) return;
      const s = V.slides.get(m.id); if (s) { s.remove(); V.slides.delete(m.id); }
      V.items = viewItems(a);
      if (!V.items.length) { dismissLayer(closeViewer); return; }
      V.idx = Math.min(V.idx, V.items.length - 1);
      buildFilm(); resetZoom(); renderSlides(false);
    });
  }
}

function setChrome(on) {
  V.chrome = on;
  V.el.classList.toggle('chromeless', !on);
  if (Bars) (on ? Bars.show() : Bars.hide()).catch(() => {});
}
function resetZoom(anim) {
  V.s = 1; V.tx = 0; V.ty = 0; applyZoom(anim);
}
function applyZoom(anim) {
  const e = curEl(); if (!e) return;
  e.style.transition = anim ? 'transform .3s cubic-bezier(.32,.72,0,1)' : 'none';
  e.style.transform = V.s === 1 && !V.tx && !V.ty ? '' : `translate(${V.tx}px,${V.ty}px) scale(${V.s})`;
}
function clampPan() {
  const e = curEl(); if (!e) return;
  const w = V.el.clientWidth, hh = V.el.clientHeight;
  const nw = e.naturalWidth || e.videoWidth || w, nh = e.naturalHeight || e.videoHeight || hh;
  const fit = Math.min(w / nw, hh / nh), cw = nw * fit, ch = nh * fit, ox = (w - cw) / 2, oy = (hh - ch) / 2, s = V.s;
  V.tx = cw * s >= w ? clamp(V.tx, w - (ox + cw) * s, -ox * s) : (w - cw * s) / 2 - ox * s;
  V.ty = ch * s >= hh ? clamp(V.ty, hh - (oy + ch) * s, -oy * s) : (hh - ch * s) / 2 - oy * s;
}
function zoomAt(px, py, ns) {
  ns = clamp(ns, 1, 5);
  V.tx = px - (px - V.tx) * (ns / V.s);
  V.ty = py - (py - V.ty) * (ns / V.s);
  V.s = ns;
}
let prevBusy = false;
async function fetchPreviews() {
  if (!isNative || prevBusy || !V) return;
  const need = [];
  for (let i = V.idx - 2; i <= V.idx + 2; i++) { const m = V.items[i]; if (m && m.type === 'image' && !m.preview && !m.noPrev) need.push(m); }
  if (!need.length) return;
  prevBusy = true;
  try {
    const r = await Vault.ensurePreviews({ items: need.map(m => ({ id: m.id, path: m.path })) });
    const map = (r && r.previews) || {};
    need.forEach(m => {
      const p = map[m.id];
      if (p) {
        m.preview = p;
        const sl = V && V.slides.get(m.id), img = sl && sl.querySelector('img');
        if (img && !(curMedia() === m && V.s > 1.01)) { const pre = new Image(); pre.src = fileSrc(p); pre.decode().then(() => { img.src = pre.src; }).catch(() => {}); }
      } else if (p === '') m.noPrev = true;
    });
    save();
  } catch (e) {}
  prevBusy = false;
  if (V && V.items.slice(Math.max(0, V.idx - 2), V.idx + 3).some(m => m.type === 'image' && !m.preview && !m.noPrev)) fetchPreviews();
}
function fullRes() {
  const m = curMedia(), img = curEl();
  if (!m || !img || m.type !== 'image' || !m.preview || img._full) return;
  img._full = true;
  const pre = new Image(); pre.src = fileSrc(m.path);
  pre.decode().then(() => { if (curEl() === img) img.src = pre.src; }).catch(() => {});
}
function go(dir) {
  const n = V.idx + dir;
  if (n < 0 || n >= V.items.length) { renderSlides(true); return; }
  const v = curEl(); if (v && v.tagName === 'VIDEO') v.pause();
  resetZoom(); V.idx = n; renderSlides(true);
}

(function viewerGestures() {
  const el = $('#viewer');
  const P = new Map();
  let mode = null, sx = 0, sy = 0, st = 0, lx = 0, ly = 0, lt = 0, vx = 0, vy = 0;
  let pinch = null, lastTap = 0, tapTimer = 0, moved = false;
  el.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && V) viewerAction(b.dataset.act, b); });
  el.addEventListener('pointerdown', e => {
    if (!V || e.target.closest('.v-top,.v-bottom')) return;
    el.setPointerCapture(e.pointerId);
    P.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (P.size === 1) { mode = null; moved = false; sx = lx = e.clientX; sy = ly = e.clientY; st = lt = e.timeStamp; vx = vy = 0; V.ptx = V.tx; V.pty = V.ty; }
    if (P.size === 2) {
      const [p1, p2] = [...P.values()];
      if (curMedia().type !== 'image') return;
      mode = 'pinch'; moved = true;
      pinch = { d: Math.hypot(p1.x - p2.x, p1.y - p2.y), s: V.s, tx: V.tx, ty: V.ty, cx: (p1.x + p2.x) / 2, cy: (p1.y + p2.y) / 2 };
    }
  });
  el.addEventListener('pointermove', e => {
    if (!V || !P.has(e.pointerId)) return;
    P.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const dt = Math.max(1, e.timeStamp - lt); vx = (e.clientX - lx) / dt; vy = (e.clientY - ly) / dt; lx = e.clientX; ly = e.clientY; lt = e.timeStamp;
    if (mode === 'pinch' && P.size === 2) {
      const [p1, p2] = [...P.values()];
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y), cx = (p1.x + p2.x) / 2, cy = (p1.y + p2.y) / 2;
      V.s = pinch.s; V.tx = pinch.tx + (cx - pinch.cx); V.ty = pinch.ty + (cy - pinch.cy);
      zoomAt(cx, cy, pinch.s * d / pinch.d);
      applyZoom(false);
      return;
    }
    if (P.size !== 1) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!mode) {
      if (Math.hypot(dx, dy) < 8) return;
      moved = true;
      mode = V.s > 1.01 ? 'pan' : Math.abs(dx) > Math.abs(dy) ? 'swipe' : dy > 0 ? 'dismiss' : 'none';
    }
    if (mode === 'pan') { V.tx = V.ptx + dx; V.ty = V.pty + dy; applyZoom(false); }
    else if (mode === 'swipe') {
      const edge = (V.idx === 0 && dx > 0) || (V.idx === V.items.length - 1 && dx < 0);
      renderSlides(false, edge ? dx * 0.35 : dx);
    } else if (mode === 'dismiss') {
      const s = curSlide(); if (!s) return;
      const k = clamp(1 - dy / 900, 0.7, 1);
      s.style.transform = `translate(${dx}px, ${dy}px) scale(${k})`;
      el.querySelector('.v-bg').style.opacity = clamp(1 - dy / 400, 0, 1);
      if (V.chrome) el.classList.add('chromeless');
    }
  });
  const end = e => {
    if (!V || !P.has(e.pointerId)) return;
    P.delete(e.pointerId);
    if (mode === 'pinch') {
      if (P.size === 0) {
        if (V.s < 1.05) resetZoom(true); else { clampPan(); applyZoom(true); if (V.s > 1.8) fullRes(); }
        mode = null;
      }
      return;
    }
    if (P.size) return;
    const dx = e.clientX - sx, dy = e.clientY - sy, w = el.clientWidth;
    if (mode === 'pan') { V.tx += vx * 120; V.ty += vy * 120; clampPan(); applyZoom(true); }
    else if (mode === 'swipe') {
      if (dx < -w * 0.22 || vx < -0.45) go(1); else if (dx > w * 0.22 || vx > 0.45) go(-1); else renderSlides(true);
    } else if (mode === 'dismiss') {
      const s = curSlide();
      if (dy > 110 || vy > 0.5) dismissLayer(closeViewer);
      else {
        s.style.transition = 'transform .3s cubic-bezier(.32,.72,0,1)'; s.style.transform = 'translateX(0)';
        el.querySelector('.v-bg').style.opacity = ''; el.classList.toggle('chromeless', !V.chrome);
        setTimeout(() => { if (s) s.style.transition = ''; }, 320);
      }
    } else if (!moved && e.type === 'pointerup') {
      const now = e.timeStamp;
      if (now - lastTap < 280) {
        clearTimeout(tapTimer); lastTap = 0;
        if (curMedia().type === 'image') {
          if (V.s > 1.01) resetZoom(true); else { zoomAt(e.clientX, e.clientY, 2.5); clampPan(); applyZoom(true); fullRes(); }
        }
      } else {
        lastTap = now;
        tapTimer = setTimeout(() => { if (V) setChrome(!V.chrome); }, 280);
      }
    }
    mode = null;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);

  // Barre de lecture
  let scrubbing = false;
  const seek = e => {
    const v = curEl(); if (!v || v.tagName !== 'VIDEO' || !v.duration) return;
    const bar = el.querySelector('.scrub .bar').getBoundingClientRect();
    v.currentTime = clamp((e.clientX - bar.left) / bar.width, 0, 1) * v.duration;
    v._tick && v._tick();
  };
  el.addEventListener('pointerdown', e => {
    const sc = e.target.closest('.scrub'); if (!sc) return;
    scrubbing = true; sc.classList.add('drag'); sc.setPointerCapture(e.pointerId); seek(e);
  });
  el.addEventListener('pointermove', e => { if (scrubbing) seek(e); });
  const stopScrub = () => { if (!scrubbing) return; scrubbing = false; el.querySelector('.scrub')?.classList.remove('drag'); };
  el.addEventListener('pointerup', stopScrub); el.addEventListener('pointercancel', stopScrub);
})();

/* ================= Verrouillage ================= */
const PIN_KEY = 'secret.pin';
const lockEl = $('#lock'), dotsEl = $('#dots'), titleEl = $('#lockTitle');
let pinBuf = '', pinMode = 'enter', firstPin = '', unlocked = false, bioOK = false, fails = 0, blockedUntil = 0, onPinCancel = null;
async function hashPin(pin, salt) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pin));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function getPin() { try { return JSON.parse(localStorage.getItem(PIN_KEY)); } catch (e) { return null; } }
async function setPin(pin) { const salt = uid(); localStorage.setItem(PIN_KEY, JSON.stringify({ salt, hash: await hashPin(pin, salt) })); }

function drawDots() { [...dotsEl.children].forEach((d, i) => d.classList.toggle('on', i < pinBuf.length)); }
function setLockTitle(t) { titleEl.textContent = t; }
function shake(msg) {
  dotsEl.classList.remove('shake'); void dotsEl.offsetWidth; dotsEl.classList.add('shake');
  navigator.vibrate && navigator.vibrate([30, 40, 30]);
  if (msg) setLockTitle(msg);
  setTimeout(() => { pinBuf = ''; drawDots(); }, 350);
}
function showPad(mode) {
  pinMode = mode; pinBuf = ''; drawDots();
  setLockTitle({ enter: 'Entrez votre code', create: 'Créez un code à 4 chiffres', confirm: 'Confirmez le code', verify: 'Entrez le code actuel' }[mode]);
  $('#bioBtn').classList.toggle('off', !(mode === 'enter' && bioOK && db.settings.bio));
  $('#cancelPin').classList.toggle('hidden', !onPinCancel);
  lockEl.classList.add('pin');
}
async function onPinComplete() {
  const pin = pinBuf;
  if (pinMode === 'create') { firstPin = pin; showPad('confirm'); return; }
  if (pinMode === 'confirm') {
    if (pin !== firstPin) { pinMode = 'create'; shake('Les codes ne correspondent pas'); setTimeout(() => showPad('create'), 900); return; }
    await setPin(pin);
    if (onPinCancel) { const c = onPinCancel; onPinCancel = null; c(true); toast('Code modifié'); return; }
    unlock(); return;
  }
  if (Date.now() < blockedUntil) { shake(`Réessayez dans ${Math.ceil((blockedUntil - Date.now()) / 1000)} s`); return; }
  const p = getPin();
  if (p && await hashPin(pin, p.salt) === p.hash) {
    fails = 0;
    if (pinMode === 'verify') { showPad('create'); return; }
    unlock();
  } else {
    fails++;
    if (fails >= 5) { blockedUntil = Date.now() + 30000; fails = 0; shake('Trop d’essais : patientez 30 s'); }
    else shake('Code incorrect');
  }
}
$('#pad').addEventListener('click', e => {
  const k = e.target.closest('[data-k]');
  if (k && pinBuf.length < 4) {
    pinBuf += k.dataset.k; drawDots();
    if (pinBuf.length === 4) setTimeout(onPinComplete, 120);
  }
});
$('#delBtn').addEventListener('click', () => { pinBuf = pinBuf.slice(0, -1); drawDots(); });
$('#bioBtn').addEventListener('click', () => tryBio());
$('#cancelPin').addEventListener('click', () => { const c = onPinCancel; onPinCancel = null; c && c(false); });

async function tryBio() {
  try {
    const r = await Vault.authenticate();
    if (r && r.success) { unlock(); return true; }
  } catch (e) {}
  return false;
}

function pauseAll() { document.querySelectorAll('video').forEach(v => v.pause()); }
async function lock(initial) {
  unlocked = false; pauseAll();
  onPinCancel = null;
  lockEl.className = 'lock idle';
  lockEl.classList.remove('hidden');
  lockEl.querySelector('.shackle').style.cssText = '';
  if (!getPin()) { showPad('create'); return; }
  if (bioOK && db.settings.bio) {
    lockEl.classList.remove('pin');
    await sleep(initial ? 450 : 250);
    if (!(await tryBio())) showPad('enter');
  } else showPad('enter');
}
function unlock() {
  if (unlocked) return;
  unlocked = true;
  const app = $('#app');
  app.classList.remove('hidden', 'reveal'); void app.offsetWidth; app.classList.add('reveal');
  lockEl.classList.remove('idle', 'pin');
  lockEl.classList.add('unlocking', 'leaving');
  setTimeout(() => {
    lockEl.className = 'lock hidden'; app.classList.remove('reveal');
    document.querySelectorAll('#app video.cover-media').forEach(v => v.play().catch(() => {}));
    if (V) bindVideo();
  }, 1600);
}

function changePin() {
  lockEl.className = 'lock';
  onPinCancel = () => { lockEl.className = 'lock hidden'; };
  showPad('verify');
}

let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); if (!busyExternal) pauseAll(); return; }
  if (unlocked && !busyExternal && Date.now() - hiddenAt > 1500) lock(false);
});

/* ================= Réglages ================= */
$('#lockNow').addEventListener('click', () => lock(false));
$('#settingsBtn').addEventListener('click', () => {
  const opts = [];
  if (bioOK) opts.push({ label: 'Déverrouillage par empreinte', toggle: v => { db.settings.bio = v; save(); }, on: db.settings.bio });
  opts.push({ label: 'Lecture en boucle des vidéos', toggle: v => { db.settings.loop = v; save(); }, on: db.settings.loop });
  opts.push({ label: 'Modifier le code' });
  sheet({ title: 'Réglages', opts }).then(i => { if (i != null && opts[i].label === 'Modifier le code') changePin(); });
});

/* ================= Démarrage ================= */
(async function init() {
  await loadDb();
  try { bioOK = !!(await Vault.biometricAvailable()).available; } catch (e) { bioOK = false; }
  renderHome();
  lock(true);
})();

})();
