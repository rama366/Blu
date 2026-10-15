/* ============================================================
   BLUES COMPANY PORTAL — portal.js
   Phase 2: Supabase-backed auth, quotes, shipments, documents.
   Falls back to Phase 1 demo data when supabase-config.js
   is not filled in, so the pages never break.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- Config ---------------- */
  var cfg = window.BLUES_CONFIG || {};
  var sb = null;
  if (window.supabase && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY
      && cfg.SUPABASE_URL.indexOf('https://') === 0) {
    sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }
  function isDemo() { return !sb; }

  /* ---------------- Tiny helpers ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var STATUS_LABEL = {
    pending: 'Pending review', quoted: 'Quote sent', booked: 'Booked',
    transit: 'In transit', delivered: 'Delivered', cancelled: 'Cancelled'
  };
  function pill(status) {
    return '<span class="pill ' + esc(status) + '">' + esc(STATUS_LABEL[status] || status) + '</span>';
  }
  function fmtDate(d) {
    if (!d) return '—';
    var dt = new Date(d);
    if (isNaN(dt)) return String(d);
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /* Toast */
  var toastBox = document.createElement('div');
  toastBox.style.cssText = 'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:999;display:grid;gap:8px;justify-items:center;pointer-events:none';
  document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(toastBox); });
  function toast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'padding:12px 20px;border-radius:12px;background:var(--navy);color:#f4f2ed;font-size:13px;font-weight:600;box-shadow:var(--shadow-lg);animation:portal-fade .25s ease both;max-width:min(92vw,460px);text-align:center';
    toastBox.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .4s ease'; }, 2600);
    setTimeout(function () { t.remove(); }, 3100);
  }

  /* ---------------- Demo data (Phase 1 parity) ---------------- */
  var DEMO_QUOTES = [
    { id: 'd1', reference: 'QT-2026-0156', customer_name: 'Amina Juma', mode: 'Sea · LCL', origin: 'Shanghai', destination: 'Dar es Salaam', status: 'pending', created_at: '2026-10-14' },
    { id: 'd2', reference: 'QT-2026-0155', customer_name: 'Kilele Traders Ltd', mode: 'Air', origin: 'Dar es Salaam', destination: 'Nairobi', status: 'pending', created_at: '2026-10-13' },
    { id: 'd3', reference: 'QT-2026-0151', customer_name: 'Baraka Logistics', mode: 'Road', origin: 'Dar es Salaam', destination: 'Kampala', status: 'quoted', created_at: '2026-10-06' },
    { id: 'd4', reference: 'QT-2026-0148', customer_name: 'Baraka Logistics', mode: 'Sea · FCL', origin: 'Dar es Salaam', destination: 'Dubai', status: 'booked', created_at: '2026-10-02' }
  ];
  var DEMO_STEPS = ['Booking confirmed', 'Cargo picked up', 'Departed origin', 'In transit', 'Arrived destination', 'Delivered'];
  var DEMO_SHIPMENTS = [
    { id: 's1', reference: 'SHP-88231', mode: 'Sea · FCL', origin: 'Dar es Salaam', destination: 'Dubai', vessel: 'MV Bahari Star', voyage: 'V.214E', status: 'transit', current_step: 2, eta: '2026-10-24', shipment_events: DEMO_STEPS.map(function (l, i) { return { label: l, sort_order: i }; }) },
    { id: 's2', reference: 'SHP-87990', mode: 'Sea · LCL', origin: 'Shanghai', destination: 'Dar es Salaam', vessel: 'MV Coral Ace', voyage: 'V.091W', status: 'booked', current_step: 0, eta: '2026-11-12', shipment_events: DEMO_STEPS.map(function (l, i) { return { label: l, sort_order: i }; }) }
  ];
  var DEMO_DOCS = [
    { id: 'doc1', name: 'Bill of Lading · BL-MAEU88231', meta: 'SHP-88231 · 1.2 MB · 08 Oct', url: null },
    { id: 'doc2', name: 'Commercial Invoice · CI-2026-0148', meta: 'QT-2026-0148 · 240 KB · 02 Oct', url: null },
    { id: 'doc3', name: 'Packing List · PL-2026-0148', meta: 'QT-2026-0148 · 180 KB · 02 Oct', url: null },
    { id: 'doc4', name: 'Certificate of Origin', meta: 'SHP-88231 · 320 KB · 05 Oct', url: null }
  ];
  var DEMO_CUSTOMERS = [
    { id: 'c1', full_name: 'Amina Juma', company: '', quotes: 1, last: '14 Oct 2026', active: true },
    { id: 'c2', full_name: 'Kilele Traders Ltd', company: 'Kilele Traders Ltd', quotes: 1, last: '13 Oct 2026', active: true },
    { id: 'c3', full_name: 'Baraka Logistics', company: 'Baraka Logistics Ltd', quotes: 3, last: '06 Oct 2026', active: true },
    { id: 'c4', full_name: 'Neema Exports', company: 'Neema Exports Co', quotes: 2, last: '28 Sep 2026', active: true }
  ];

  /* ============================================================
     AUTH PAGE (login.html)
     ============================================================ */
  function initAuth() {
    var card = $('[data-auth]');
    if (!card) return;

    /* Tabs */
    $$('[data-auth-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        $$('[data-auth-tab]').forEach(function (t) { t.classList.toggle('is-active', t === tab); t.setAttribute('aria-selected', t === tab ? 'true' : 'false'); });
        $$('[data-auth-pane]').forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-auth-pane') === tab.getAttribute('data-auth-tab')); });
      });
    });

    /* Password visibility */
    $$('.pw-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = btn.parentElement.querySelector('input');
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.textContent = input.type === 'password' ? 'Show' : 'Hide';
      });
    });

    /* Demo role picker (hidden once Supabase is live) */
    var roleButtons = $$('.role-picker [data-role]');
    if (!isDemo()) {
      var picker = $('.role-picker'), title = $('.role-title');
      if (picker) picker.style.display = 'none';
      if (title) title.style.display = 'none';
    }
    roleButtons.forEach(function (b) {
      b.addEventListener('click', function () {
        roleButtons.forEach(function (x) { x.classList.toggle('is-active', x === b); });
        localStorage.setItem('blues_demo_role', b.getAttribute('data-role'));
      });
    });
    var savedRole = localStorage.getItem('blues_demo_role');
    if (savedRole) roleButtons.forEach(function (x) { x.classList.toggle('is-active', x.getAttribute('data-role') === savedRole); });

    /* Forms */
    $$('[data-auth-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var pane = form.getAttribute('data-auth-pane');
        if (pane === 'signin') signIn(form); else signUp(form);
      });
    });

    function fail(msg) { toast(msg); }

    function signIn(form) {
      var email = form.email.value.trim();
      var password = form.password.value;
      if (!email || !password) { fail('Enter your email and password.'); return; }
      if (isDemo()) {
        var role = (localStorage.getItem('blues_demo_role') || 'user');
        toast('Demo sign-in as ' + (role === 'admin' ? 'Admin' : 'Customer'));
        setTimeout(function () { location.href = role === 'admin' ? 'admin.html' : 'dashboard.html'; }, 500);
        return;
      }
      sb.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
        if (res.error) { fail(res.error.message); return; }
        routeAfterAuth(res.data.user.id);
      });
    }

    function signUp(form) {
      var name = form.name.value.trim(), email = form.email.value.trim(), password = form.password.value;
      if (!name || !email || !password) { fail('Please complete all required fields.'); return; }
      if (password.length < 8) { fail('Password must be at least 8 characters.'); return; }
      if (isDemo()) {
        localStorage.setItem('blues_demo_role', 'user');
        toast('Demo account created — welcome aboard.');
        setTimeout(function () { location.href = 'dashboard.html'; }, 500);
        return;
      }
      sb.auth.signUp({
        email: email, password: password,
        options: { data: { full_name: name, company: form.company ? form.company.value.trim() : '', phone: form.phone ? form.phone.value.trim() : '' } }
      }).then(function (res) {
        if (res.error) { fail(res.error.message); return; }
        if (res.data.session) { routeAfterAuth(res.data.user.id); }
        else { toast('Account created — check your email to confirm, then sign in.'); }
      });
    }

    function routeAfterAuth(userId) {
      sb.from('profiles').select('is_admin').eq('id', userId).single().then(function (res) {
        var admin = res.data && res.data.is_admin;
        toast('Welcome back.');
        setTimeout(function () { location.href = admin ? 'admin.html' : 'dashboard.html'; }, 450);
      });
    }
  }

  /* ============================================================
     GUARD + CHROME (dashboard.html / admin.html)
     ============================================================ */
  var session = null;   // { user, profile } in live mode
  var demoRole = null;  // 'user' | 'admin' in demo mode

  function guard() {
    var need = document.body.getAttribute('data-guard');
    if (!need) return Promise.resolve(true);
    if (isDemo()) {
      demoRole = localStorage.getItem('blues_demo_role') || 'user';
      if (need === 'admin' && demoRole !== 'admin') { location.replace('login.html'); return Promise.resolve(false); }
      return Promise.resolve(true);
    }
    return sb.auth.getSession().then(function (res) {
      var s = res.data.session;
      if (!s) { location.replace('login.html'); return false; }
      return sb.from('profiles').select('*').eq('id', s.user.id).single().then(function (p) {
        session = { user: s.user, profile: p.data };
        if (need === 'admin' && !(p.data && p.data.is_admin)) { location.replace('dashboard.html'); return false; }
        fillUserChrome();
        return true;
      });
    });
  }

  function fillUserChrome() {
    var name = session && session.profile && session.profile.full_name
      ? session.profile.full_name
      : (session ? (session.user.email || 'Customer') : 'Customer');
    $$('[data-user-name]').forEach(function (el) { el.textContent = name; });
    $$('[data-user-initial]').forEach(function (el) { el.textContent = name.charAt(0).toUpperCase(); });
    var setName = $('#set-name'); if (setName) setName.value = name;
    var setEmail = $('#set-email'); if (setEmail && session) setEmail.value = session.user.email || '';
    var setPhone = $('#set-phone'); if (setPhone && session && session.profile) setPhone.value = session.profile.phone || '';
    var setCo = $('#set-company'); if (setCo && session && session.profile) setCo.value = session.profile.company || '';
  }

  function initChrome() {
    /* Demo banner → mode banner */
    $$('.demo-banner').forEach(function (b) {
      if (!isDemo()) {
        b.innerHTML = '<strong>Live mode.</strong> Connected to Supabase — accounts, quotes, shipments and documents are real data.';
      }
    });

    /* Theme */
    var savedTheme = localStorage.getItem('blues_theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
    $$('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? '' : 'dark';
        if (next) document.documentElement.setAttribute('data-theme', next);
        else document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('blues_theme', next);
      });
    });

    /* Bell */
    $$('[data-bell]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var menu = btn.parentElement.querySelector('.bell-menu');
        if (menu) menu.classList.toggle('is-open');
      });
    });
    document.addEventListener('click', function () { $$('.bell-menu.is-open').forEach(function (m) { m.classList.remove('is-open'); }); });

    /* Sidebar (mobile) */
    var scrim = $('.side-scrim');
    $$('[data-side-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sbEl = $('.sidebar'); if (!sbEl) return;
        sbEl.classList.toggle('is-open'); if (scrim) scrim.classList.toggle('is-open');
      });
    });
    if (scrim) scrim.addEventListener('click', function () {
      $('.sidebar').classList.remove('is-open'); scrim.classList.remove('is-open');
    });

    /* Panel links */
    $$('[data-panel-link]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var id = link.getAttribute('data-panel-link');
        $$('.panel').forEach(function (p) { p.classList.toggle('is-active', p.id === id); });
        $$('.side-link[data-panel-link]').forEach(function (l) { l.classList.toggle('is-active', l === link || l.getAttribute('data-panel-link') === id); });
        if (scrim) { $('.sidebar').classList.remove('is-open'); scrim.classList.remove('is-open'); }
      });
    });

    /* Logout */
    $$('[data-logout]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var done = function () { localStorage.removeItem('blues_demo_role'); location.href = 'login.html'; };
        if (isDemo()) done(); else sb.auth.signOut().then(done);
      });
    });

    /* Demo-only buttons */
    $$('[data-demo]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        toast('Coming in Phase 3 — this control is visual only.');
      });
    });
  }

  /* ============================================================
     CUSTOMER PORTAL DATA (dashboard.html)
     ============================================================ */
  function customerId() {
    return isDemo() ? 'demo-customer' : session.user.id;
  }

  function fetchQuotes() {
    if (isDemo()) return Promise.resolve(DEMO_QUOTES.filter(function (q) { return ['d3', 'd4'].indexOf(q.id) >= 0; }));
    return sb.from('quotes').select('*').eq('customer_id', customerId()).order('created_at', { ascending: false }).then(function (r) { return r.data || []; });
  }

  function fetchShipments() {
    if (isDemo()) return Promise.resolve(DEMO_SHIPMENTS);
    return sb.from('shipments')
      .select('*, shipment_events(*)')
      .eq('customer_id', customerId())
      .order('created_at', { ascending: false })
      .then(function (r) { return r.data || []; });
  }

  function fetchDocuments() {
    if (isDemo()) return Promise.resolve(DEMO_DOCS);
    return sb.from('documents').select('*').eq('customer_id', customerId()).order('uploaded_at', { ascending: false })
      .then(function (r) {
        var rows = r.data || [];
        return Promise.all(rows.map(function (d) {
          return sb.storage.from('documents').createSignedUrl(d.storage_path, 120).then(function (u) {
            d.url = (u.data && u.data.signedUrl) || null; return d;
          });
        }));
      });
  }

  function stepperHTML(steps, currentIdx) {
    return '<div class="stepper">' + steps.map(function (s, i) {
      var cls = i < currentIdx ? 'done' : (i === currentIdx ? 'current' : '');
      var dot = i < currentIdx ? '✓' : String(i + 1);
      return '<div class="step ' + cls + '"><span class="step-dot">' + dot + '</span><small>' + esc(s) + '</small></div>';
    }).join('') + '</div>';
  }

  function renderStats(values) {
    $$('#overview .stat-card .stat-value').forEach(function (el, i) {
      if (values[i] != null) el.textContent = values[i];
    });
  }

  function renderCurrentShipment(shipments) {
    var host = $('#current-shipment'); if (!host) return;
    var active = shipments.filter(function (s) { return ['booked', 'transit'].indexOf(s.status) >= 0; })[0] || shipments[0];
    if (!active) { host.innerHTML = '<div class="card-head"><div><h2>Current shipment</h2></div></div><div class="card-body"><p style="color:var(--muted);font-size:13px">No shipments yet — request a quote and we will take it from there.</p></div>'; return; }
    var events = (active.shipment_events || []).slice().sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
    var steps = events.length ? events.map(function (e) { return e.label; }) : DEMO_STEPS;
    host.innerHTML =
      '<div class="card-head"><div><h2>Current shipment</h2><p>' + esc(active.reference) + ' · ' + esc(active.mode || '') + '</p></div>' + pill(active.status) + '</div>' +
      '<div class="card-body"><p class="ship-route">' + esc(active.origin) + ' <span style="color:var(--brass)">→</span> ' + esc(active.destination) + '</p>' +
      '<div class="ship-meta">' +
      (active.vessel ? '<span>Vessel <strong>' + esc(active.vessel) + '</strong></span>' : '') +
      (active.voyage ? '<span>Voyage <strong>' + esc(active.voyage) + '</strong></span>' : '') +
      (active.eta ? '<span>ETA <strong>' + fmtDate(active.eta) + '</strong></span>' : '') +
      '</div>' + stepperHTML(steps, active.current_step || 0) + '</div>';
  }

  function quoteRow(q, full) {
    return '<tr><td><strong>' + esc(q.reference) + '</strong></td>' +
      (full ? '<td>' + esc(q.origin) + ' → ' + esc(q.destination) + '</td><td>' + esc(q.mode || '—') + '</td><td>' + esc(fmtDate(q.created_at)) + '</td>' : '') +
      '<td>' + pill(q.status) + '</td><td></td></tr>';
  }

  function renderQuotes(quotes) {
    var mini = $('#quotes-mini-tbody'); if (mini) mini.innerHTML = quotes.slice(0, 4).map(function (q) { return quoteRow(q, false); }).join('') || '<tr><td colspan="4" style="color:var(--muted)">No quotes yet.</td></tr>';
    var full = $('#quotes-tbody'); if (full) full.innerHTML = quotes.map(function (q) { return quoteRow(q, true); }).join('') || '<tr><td colspan="6" style="color:var(--muted)">No quotes yet — use “New quote request” to get started.</td></tr>';
  }

  function renderShipments(shipments) {
    var host = $('#shipment-cards'); if (!host) return;
    if (!shipments.length) { host.innerHTML = '<div class="card"><div class="card-body"><p style="color:var(--muted);font-size:13px;margin:0">No shipments yet.</p></div></div>'; return; }
    host.innerHTML = shipments.map(function (s) {
      var events = (s.shipment_events || []).slice().sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
      var steps = events.length ? events.map(function (e) { return e.label; }) : DEMO_STEPS;
      return '<div class="card"><div class="card-head"><div><h2>' + esc(s.reference) + '</h2><p>' + esc(s.origin) + ' → ' + esc(s.destination) + ' · ' + esc(s.mode || '') + '</p></div>' + pill(s.status) + '</div>' +
        '<div class="card-body"><div class="ship-meta">' +
        (s.vessel ? '<span>Vessel <strong>' + esc(s.vessel) + '</strong></span>' : '') +
        (s.voyage ? '<span>Voyage <strong>' + esc(s.voyage) + '</strong></span>' : '') +
        (s.eta ? '<span>ETA <strong>' + fmtDate(s.eta) + '</strong></span>' : '') +
        '</div>' + stepperHTML(steps, s.current_step || 0) + '</div></div>';
    }).join('');
  }

  function docIcon() {
    return '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>';
  }

  function renderDocuments(docs) {
    var host = $('#doc-list'); if (!host) return;
    host.innerHTML = docs.map(function (d) {
      var meta = d.meta || (d.shipment_reference ? d.shipment_reference + ' · ' : '') + (d.uploaded_at ? fmtDate(d.uploaded_at) : '');
      var btn = d.url
        ? '<a class="btn btn-outline btn-sm" href="' + esc(d.url) + '" target="_blank" rel="noopener">Download</a>'
        : '<button class="btn btn-outline btn-sm" type="button" data-doc-demo>Download</button>';
      return '<div class="doc-item"><span class="doc-ico">' + docIcon() + '</span><div><strong>' + esc(d.name) + '</strong><small>' + esc(meta) + '</small></div>' + btn + '</div>';
    }).join('') || '<p style="color:var(--muted);font-size:13px">No documents yet.</p>';
    $$('[data-doc-demo]', host).forEach(function (b) {
      b.addEventListener('click', function () { toast('Demo document — downloads go live in Phase 2 storage.'); });
    });
  }

  function initUpload() {
    var zone = $('.upload-zone'); if (!zone) return;
    var input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.style.display = 'none';
    document.body.appendChild(input);
    zone.addEventListener('click', function (e) {
      if (e.target.closest('a,button') && !e.target.closest('[data-demo]')) return;
      e.preventDefault();
      if (isDemo()) { toast('Demo mode — uploads go live once Supabase is connected.'); return; }
      input.click();
    });
    input.addEventListener('change', function () {
      if (!input.files.length || isDemo()) return;
      toast('Uploading ' + input.files.length + ' file(s)…');
      var jobs = Array.prototype.map.call(input.files, function (f) {
        var safe = f.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
        var path = session.user.id + '/' + Date.now() + '-' + safe;
        return sb.storage.from('documents').upload(path, f).then(function (up) {
          if (up.error) throw up.error;
          return sb.from('documents').insert({
            customer_id: session.user.id, name: f.name, storage_path: path,
            mime: f.type, size: f.size
          });
        });
      });
      Promise.all(jobs).then(function () { toast('Upload complete.'); loadCustomerData(); })
        .catch(function (err) { toast('Upload failed: ' + (err.message || err)); });
      input.value = '';
    });
  }

  function loadCustomerData() {
    Promise.all([fetchQuotes(), fetchShipments(), fetchDocuments()]).then(function (r) {
      var quotes = r[0], shipments = r[1], docs = r[2];
      renderStats([shipments.length, quotes.length, docs.length, 3]);
      renderCurrentShipment(shipments);
      renderQuotes(quotes);
      renderShipments(shipments);
      renderDocuments(docs);
    });
  }

  /* Customer settings: save profile */
  function initCustomerSettings() {
    var btn = $('#settings .btn[data-demo]'); if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (isDemo()) { toast('Demo mode — profile saves go live with Supabase.'); return; }
      sb.from('profiles').update({
        full_name: $('#set-name').value.trim(),
        company: $('#set-company').value.trim(),
        phone: $('#set-phone').value.trim()
      }).eq('id', session.user.id).then(function (r) {
        if (r.error) { toast('Save failed: ' + r.error.message); return; }
        toast('Profile saved.');
        fillUserChrome();
      });
    });
  }

  /* ============================================================
     ADMIN DATA (admin.html)
     ============================================================ */
  var inboxFilter = 'all';

  function adminFetchQuotes() {
    if (isDemo()) return Promise.resolve(DEMO_QUOTES.slice());
    return sb.from('quotes').select('*').order('created_at', { ascending: false }).then(function (r) { return r.data || []; });
  }
  function adminFetchCustomers() {
    if (isDemo()) return Promise.resolve(DEMO_CUSTOMERS.slice());
    return Promise.all([
      sb.from('profiles').select('*').order('created_at', { ascending: false }),
      sb.from('quotes').select('id, customer_id, created_at')
    ]).then(function (r) {
      var profiles = r[0].data || [], quotes = r[1].data || [];
      return profiles.map(function (p) {
        var mine = quotes.filter(function (q) { return q.customer_id === p.id; });
        var last = mine.length ? mine.map(function (q) { return q.created_at; }).sort().pop() : p.created_at;
        return { id: p.id, full_name: p.full_name || p.id, company: p.company || '', quotes: mine.length, last: last, active: true };
      });
    });
  }

  var cachedQuotes = [];
  function renderInbox() {
    var tbody = $('#inbox-tbody'); if (!tbody) return;
    var rows = cachedQuotes.filter(function (q) { return inboxFilter === 'all' || q.status === inboxFilter; });
    tbody.innerHTML = rows.map(function (q) {
      return '<tr><td><strong>' + esc(q.reference) + '</strong><br><small>' + esc(q.origin) + ' → ' + esc(q.destination) + '</small></td>' +
        '<td>' + esc(q.customer_name || '—') + '</td>' +
        '<td>' + esc(q.mode || '—') + '</td>' +
        '<td><select class="status-select" data-status-for="' + esc(q.id) + '">' +
        Object.keys(STATUS_LABEL).map(function (k) { return '<option value="' + k + '"' + (k === q.status ? ' selected' : '') + '>' + STATUS_LABEL[k] + '</option>'; }).join('') +
        '</select></td>' +
        '<td data-pill-for="' + esc(q.id) + '">' + pill(q.status) + '</td>' +
        '<td><button class="btn btn-ghost btn-sm" data-view-quote="' + esc(q.id) + '">View</button></td></tr>';
    }).join('') || '<tr><td colspan="6" style="color:var(--muted)">Nothing in this view.</td></tr>';

    $$('[data-status-for]', tbody).forEach(function (sel) {
      sel.addEventListener('change', function () {
        var id = sel.getAttribute('data-status-for');
        var status = sel.value;
        if (isDemo()) {
          var dq = cachedQuotes.filter(function (q) { return q.id === id; })[0];
          if (dq) dq.status = status;
          applyQuoteStatus(id, status);
          toast('Demo: ' + dq.reference + ' → ' + STATUS_LABEL[status]);
          return;
        }
        sb.from('quotes').update({ status: status }).eq('id', id).then(function (r) {
          if (r.error) { toast('Update failed: ' + r.error.message); return; }
          applyQuoteStatus(id, status);
          toast('Quote updated — ' + STATUS_LABEL[status]);
        });
      });
    });
    $$('[data-view-quote]', tbody).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var q = cachedQuotes.filter(function (x) { return x.id === btn.getAttribute('data-view-quote'); })[0];
        if (!q) return;
        var extra = [];
        if (q.cargo) extra.push('Cargo: ' + q.cargo);
        if (q.incoterm) extra.push('Incoterm: ' + q.incoterm);
        if (q.ready_date) extra.push('Cargo ready: ' + fmtDate(q.ready_date));
        if (q.notes) extra.push('Notes: ' + q.notes);
        toast(q.reference + ' · ' + q.origin + ' → ' + q.destination + (extra.length ? ' · ' + extra.join(' · ') : ''));
      });
    });
  }

  function applyQuoteStatus(id, status) {
    var q = cachedQuotes.filter(function (x) { return x.id === id; })[0];
    if (q) q.status = status;
    var cell = $('[data-pill-for="' + id + '"]'); if (cell) cell.innerHTML = pill(status);
    if (inboxFilter !== 'all' && status !== inboxFilter) renderInbox();
    refreshAdminBadges();
  }

  function refreshAdminBadges() {
    var pending = cachedQuotes.filter(function (q) { return q.status === 'pending'; }).length;
    $$('.badge-dot').forEach(function (b) {
      var inSidebar = b.closest('.side-link');
      if (inSidebar || b.closest('.topbar-actions')) b.textContent = pending;
    });
  }

  function renderCustomers(customers) {
    var tbody = $('#customers-tbody'); if (!tbody) return;
    tbody.innerHTML = customers.map(function (c) {
      return '<tr><td><strong>' + esc(c.full_name) + '</strong><br><small>' + esc(c.company || 'Individual') + '</small></td>' +
        '<td>' + esc(c.quotes) + '</td><td>' + esc(fmtDate(c.last)) + '</td>' +
        '<td><span class="pill active">Active</span></td>' +
        '<td><button class="btn btn-ghost btn-sm" data-demo>Manage</button></td></tr>';
    }).join('') || '<tr><td colspan="5" style="color:var(--muted)">No customers yet.</td></tr>';
    $$('[data-demo]', tbody).forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); toast('Customer management detail arrives in Phase 3.'); });
    });
  }

  function loadAdminData() {
    adminFetchQuotes().then(function (quotes) {
      cachedQuotes = quotes;
      renderInbox();
      refreshAdminBadges();
      /* Dashboard "latest quote requests" + stats */
      var latest = $('#dashboard tbody');
      if (latest) {
        latest.innerHTML = quotes.slice(0, 3).map(function (q) {
          return '<tr><td><strong>' + esc(q.reference) + '</strong><br><small>' + esc(q.mode || '') + ' · ' + esc(q.origin) + ' → ' + esc(q.destination) + '</small></td><td>' + esc(q.customer_name || '—') + '</td><td>' + pill(q.status) + '</td></tr>';
        }).join('');
      }
      return adminFetchCustomers();
    }).then(function (customers) {
      renderCustomers(customers);
      var pending = cachedQuotes.filter(function (q) { return q.status === 'pending'; }).length;
      var shipQ = isDemo() ? Promise.resolve(6) : sb.from('shipments')
        .select('id', { count: 'exact', head: true })
        .in('status', ['booked', 'transit']).then(function (r) { return r.count || 0; });
      shipQ.then(function (active) {
        $$('#dashboard .stat-card .stat-value').forEach(function (el, i) {
          if (i === 0) el.textContent = pending;
          if (i === 1) el.textContent = customers.length;
          if (i === 2) el.textContent = active;
        });
      });
    });
  }

  function initAdminInbox() {
    $$('#inbox [data-filter]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        $$('#inbox [data-filter]').forEach(function (c) { c.classList.toggle('is-active', c === chip); });
        inboxFilter = chip.getAttribute('data-filter');
        renderInbox();
      });
    });
  }

  /* Admin settings: save business settings */
  function initAdminSettings() {
    var saveBtn = $('#settings .btn-gold[data-demo]'); if (!saveBtn) return;
    if (!isDemo()) {
      sb.from('settings').select('*').then(function (r) {
        (r.data || []).forEach(function (row) {
          var map = { phone: '#biz-phone', email: '#biz-email', address: '#biz-address', hours: '#biz-hours' };
          var el = $(map[row.key]); if (el) el.value = row.value;
        });
      });
    }
    saveBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (isDemo()) { toast('Demo mode — settings save for real in Phase 2.'); return; }
      var rows = [
        { key: 'phone', value: $('#biz-phone').value },
        { key: 'email', value: $('#biz-email').value },
        { key: 'address', value: $('#biz-address').value },
        { key: 'hours', value: $('#biz-hours').value }
      ];
      Promise.all(rows.map(function (row) { return sb.from('settings').upsert(row); })).then(function () {
        toast('Settings saved.');
      }).catch(function (err) { toast('Save failed: ' + (err.message || err)); });
    });
    /* Change password */
    var pwBtn = $$('#settings .btn-outline')[0];
    if (pwBtn) pwBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (isDemo()) { toast('Demo mode — password change needs Supabase auth.'); return; }
      var pw = prompt('New password (minimum 8 characters):');
      if (!pw) return;
      if (pw.length < 8) { toast('Password too short.'); return; }
      sb.auth.updateUser({ password: pw }).then(function (r) {
        toast(r.error ? 'Error: ' + r.error.message : 'Password updated.');
      });
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    initAuth();
    initChrome();
    guard().then(function (ok) {
      if (!ok) return;
      if ($('#overview')) { loadCustomerData(); initUpload(); initCustomerSettings(); }
      if ($('#inbox')) { loadAdminData(); initAdminInbox(); initAdminSettings(); }
    });
  });
})();
