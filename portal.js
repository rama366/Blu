/* BLUES COMPANY PORTAL - demo logic
   Frontend-only for now. Phase 2 replaces the localStorage demo auth
   with Supabase (email/password + admin role) and loads the tables
   below from the database instead of the sample arrays. */
(function () {
  "use strict";
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => [...(c || document).querySelectorAll(s)];

  const store = {
    get role() { return localStorage.getItem("blues-demo-role"); },
    set role(v) { localStorage.setItem("blues-demo-role", v); },
    get name() { return localStorage.getItem("blues-demo-name") || "Demo Customer"; },
    set name(v) { localStorage.setItem("blues-demo-name", v); }
  };

  /* ---------- Theme (shared with main site) ---------- */
  document.documentElement.dataset.theme = localStorage.getItem("blues-theme") || "light";
  $$("[data-theme-toggle]").forEach((btn) => btn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("blues-theme", next);
  }));

  /* ---------- Demo data (Supabase replaces this in phase 2) ---------- */
  const STATUS_LABEL = { pending: "Pending review", quoted: "Quote sent", booked: "Booked", transit: "In transit", delivered: "Delivered", cancelled: "Cancelled", active: "Active" };
  const pill = (s) => '<span class="pill ' + s + '">' + (STATUS_LABEL[s] || s) + "</span>";

  const QUOTES = [
    { id: "QT-2026-0148", route: "Dar es Salaam → Dubai", mode: "Sea · FCL 20 ft", date: "02 Oct 2026", status: "booked" },
    { id: "QT-2026-0151", route: "Dar es Salaam → Kampala", mode: "Road · Cross-border", date: "06 Oct 2026", status: "quoted" },
    { id: "QT-2026-0156", route: "Shanghai → Dar es Salaam", mode: "Sea · LCL", date: "11 Oct 2026", status: "pending" },
    { id: "QT-2026-0139", route: "Dar es Salaam → Nairobi", mode: "Air · General cargo", date: "22 Sep 2026", status: "delivered" }
  ];

  const SHIPMENTS = [
    { id: "SHP-88231", route: "Dar es Salaam → Dubai", mode: "Sea · FCL 20 ft", vessel: "MV Bahari Star · V.214E", etd: "Departed 08 Oct", eta: "Arrival 02 Nov", step: 3, docs: 4 },
    { id: "SHP-88102", route: "Dar es Salaam → Kampala", mode: "Road · Cross-border", vessel: "Fleet TRK-117", etd: "Departed 12 Oct", eta: "Arrival 16 Oct", step: 1, docs: 3 }
  ];

  const DOCS = [
    ["Commercial Invoice", "PDF · 184 KB", "INV-0148"],
    ["Packing List", "PDF · 96 KB", "PL-0148"],
    ["Bill of Lading", "PDF · 210 KB", "BL-MAEU88231"],
    ["Cargo Insurance Certificate", "PDF · 122 KB", "CERT-4471"]
  ];

  const INBOX = [
    { id: "QT-2026-0156", name: "Amina Juma", company: "—", route: "Shanghai → Dar es Salaam", mode: "Sea · LCL", date: "11 Oct", status: "pending" },
    { id: "QT-2026-0155", name: "Kilele Traders Ltd", company: "Kilele Traders", route: "Dar es Salaam → Nairobi", mode: "Air", date: "10 Oct", status: "pending" },
    { id: "QT-2026-0151", name: "Baraka Logistics", company: "Baraka Logistics", route: "Dar es Salaam → Kampala", mode: "Road", date: "06 Oct", status: "quoted" },
    { id: "QT-2026-0148", name: "Gulf Imports LLC", company: "Gulf Imports", route: "Dar es Salaam → Dubai", mode: "Sea · FCL", date: "02 Oct", status: "booked" },
    { id: "QT-2026-0139", name: "Savanna Foods Co", company: "Savanna Foods", route: "Dar es Salaam → Nairobi", mode: "Air", date: "22 Sep", status: "delivered" },
    { id: "QT-2026-0131", name: "Mwezi Hardware", company: "Mwezi Hardware", route: "Dar es Salaam → Kigali", mode: "Road", date: "15 Sep", status: "cancelled" }
  ];

  const CUSTOMERS = [
    { name: "Gulf Imports LLC", email: "ops@gulfimports.example", quotes: 6, last: "02 Oct 2026", status: "active" },
    { name: "Savanna Foods Co", email: "logistics@savannafoods.example", quotes: 4, last: "22 Sep 2026", status: "active" },
    { name: "Kilele Traders Ltd", email: "info@kilele.example", quotes: 2, last: "10 Oct 2026", status: "active" },
    { name: "Mwezi Hardware", email: "sales@mwezi.example", quotes: 1, last: "15 Sep 2026", status: "active" }
  ];

  const STEP_NAMES = ["Booking", "Pickup", "Customs", "In transit", "Arrival", "Delivery"];
  function stepperHTML(current) {
    return '<div class="stepper">' + STEP_NAMES.map((name, i) => {
      const cls = i < current ? "done" : i === current ? "current" : "";
      const inner = i < current ? "✓" : String(i + 1);
      return '<div class="step ' + cls + '"><span class="step-dot">' + inner + '</span><small>' + name + "</small></div>";
    }).join("") + "</div>";
  }

  /* ---------- Auth page (login.html) ---------- */
  if ($("[data-auth]")) {
    let role = "user";
    $$(".role-picker button").forEach((btn) => btn.addEventListener("click", () => {
      role = btn.dataset.role;
      $$(".role-picker button").forEach((x) => x.classList.toggle("is-active", x === btn));
    }));
    $$("[data-auth-tab]").forEach((tab) => tab.addEventListener("click", () => {
      $$("[data-auth-tab]").forEach((x) => x.classList.toggle("is-active", x === tab));
      $$("[data-auth-pane]").forEach((pane) => pane.classList.toggle("is-active", pane.dataset.authPane === tab.dataset.authTab));
    }));
    $$(".pw-toggle").forEach((btn) => btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector("input");
      input.type = input.type === "password" ? "text" : "password";
      btn.textContent = input.type === "password" ? "Show" : "Hide";
    }));
    $$("form[data-auth-form]").forEach((form) => form.addEventListener("submit", (event) => {
      event.preventDefault();
      const named = form.querySelector("[name=name]");
      const email = form.querySelector("[name=email]");
      store.name = (named && named.value.trim()) || (email ? email.value.split("@")[0] : "Demo Customer");
      store.role = role;
      window.location.href = role === "admin" ? "admin.html" : "dashboard.html";
    }));
  }

  /* ---------- Guarded pages ---------- */
  const guard = document.body.dataset.guard;
  if (guard) {
    if (!store.role) { window.location.replace("login.html"); return; }
    if (guard === "admin" && store.role !== "admin") { window.location.replace("dashboard.html"); return; }
    $$("[data-user-name]").forEach((el) => { el.textContent = store.name; });
    $$("[data-user-initial]").forEach((el) => { el.textContent = (store.name.trim()[0] || "B").toUpperCase(); });
  }

  /* ---------- Sidebar (mobile) ---------- */
  const side = $(".sidebar");
  const scrim = $(".side-scrim");
  $$("[data-side-toggle]").forEach((btn) => btn.addEventListener("click", () => {
    side && side.classList.toggle("is-open");
    scrim && scrim.classList.toggle("is-open");
  }));
  if (scrim) scrim.addEventListener("click", () => { side.classList.remove("is-open"); scrim.classList.remove("is-open"); });

  /* ---------- Panel switching ---------- */
  $$("[data-panel-link]").forEach((btn) => btn.addEventListener("click", (event) => {
    event.preventDefault();
    const id = btn.dataset.panelLink;
    $$("[data-panel-link]").forEach((x) => x.classList.toggle("is-active", x === btn));
    $$(".panel").forEach((panel) => panel.classList.toggle("is-active", panel.id === id));
    side && side.classList.remove("is-open");
    scrim && scrim.classList.remove("is-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }));

  /* ---------- Logout ---------- */
  $$("[data-logout]").forEach((btn) => btn.addEventListener("click", (event) => {
    event.preventDefault();
    localStorage.removeItem("blues-demo-role");
    localStorage.removeItem("blues-demo-name");
    window.location.href = "login.html";
  }));

  /* ---------- Render: customer quotes ---------- */
  const quotesBody = $("#quotes-tbody");
  if (quotesBody) {
    quotesBody.innerHTML = QUOTES.map((q) =>
      "<tr><td><strong>" + q.id + "</strong></td><td>" + q.route + "</td><td>" + q.mode + "</td><td>" + q.date + "</td><td>" + pill(q.status) + '</td><td><button class="btn btn-outline btn-sm" data-demo>View</button></td></tr>'
    ).join("");
  }
  const miniBody = $("#quotes-mini-tbody");
  if (miniBody) {
    miniBody.innerHTML = QUOTES.slice(0, 3).map((q) =>
      "<tr><td><strong>" + q.id + "</strong><br><small>" + q.route + "</small></td><td>" + q.mode + "</td><td>" + pill(q.status) + "</td></tr>"
    ).join("");
  }

  /* ---------- Render: shipments ---------- */
  const shipWrap = $("#shipment-cards");
  if (shipWrap) {
    shipWrap.innerHTML = SHIPMENTS.map((s) =>
      '<div class="card"><div class="card-body">' +
      '<p class="ship-route">' + s.route + "</p>" +
      '<div class="ship-meta"><span>Ref <strong>' + s.id + '</strong></span><span>' + s.mode + "</span><span>" + s.vessel + "</span><span><strong>" + s.etd + "</strong></span><span><strong>" + s.eta + "</strong></span></div>" +
      stepperHTML(s.step) +
      '<div class="ship-meta" style="margin-bottom:0"><span>Documents: <strong>' + s.docs + ' files</strong></span><span style="margin-left:auto"><button class="btn btn-outline btn-sm" data-demo>Shipment details</button></span></div>' +
      "</div></div>"
    ).join("");
  }
  const currentShip = $("#current-shipment");
  if (currentShip && SHIPMENTS.length) {
    const s = SHIPMENTS[0];
    currentShip.innerHTML =
      '<div class="card-head"><div><h2>Current shipment</h2><p>' + s.id + " · " + s.mode + '</p></div><span class="pill transit">In transit</span></div>' +
      '<div class="card-body"><p class="ship-route">' + s.route + '</p>' +
      '<div class="ship-meta"><span>Carrier <strong>' + s.vessel + '</strong></span><span><strong>' + s.etd + '</strong></span><span><strong>' + s.eta + '</strong></span></div>' +
      stepperHTML(s.step) + "</div>";
  }

  /* ---------- Render: documents ---------- */
  const docWrap = $("#doc-list");
  if (docWrap) {
    docWrap.innerHTML = DOCS.map((d) =>
      '<div class="doc-item"><span class="doc-ico"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg></span>' +
      "<div><strong>" + d[0] + "</strong><small>" + d[1] + " · Ref " + d[2] + '</small></div><button class="btn btn-outline btn-sm" data-demo>Download</button></div>'
    ).join("");
  }

  /* ---------- Render: admin inbox ---------- */
  const inboxBody = $("#inbox-tbody");
  if (inboxBody) {
    inboxBody.innerHTML = INBOX.map((q) => {
      const options = ["pending", "quoted", "booked", "delivered", "cancelled"].map((s) =>
        '<option value="' + s + '"' + (s === q.status ? " selected" : "") + ">" + (STATUS_LABEL[s] || s) + "</option>").join("");
      return "<tr data-status-row data-status="" + q.status + ""><td><strong>" + q.id + "</strong><br><small>" + q.date + "</small></td>" +
        "<td><strong>" + q.name + "</strong><br><small>" + q.route + "</small></td>" +
        "<td>" + q.mode + "</td>" +
        '<td><select class="status-select" data-status-select>' + options + "</select></td>" +
        '<td data-status-pill>' + pill(q.status) + '</td>' +
        '<td><button class="btn btn-outline btn-sm" data-demo>Open</button></td></tr>';
    }).join("");
    inboxBody.addEventListener("change", (event) => {
      const select = event.target.closest("[data-status-select]");
      if (!select) return;
      const row = select.closest("tr");
      const status = select.value;
      row.dataset.status = status;
      row.querySelector("[data-status-pill]").innerHTML = pill(status);
    });
    /* Filter chips */
    $$(".chip[data-filter]").forEach((chip) => chip.addEventListener("click", () => {
      $$(".chip[data-filter]").forEach((x) => x.classList.toggle("is-active", x === chip));
      const filter = chip.dataset.filter;
      $$("#inbox-body tr[data-status-row]").forEach((row) => {
        row.style.display = filter === "all" || row.dataset.status === filter ? "" : "none";
      });
    }));
  }

  /* ---------- Render: customers ---------- */
  const custBody = $("#customers-tbody");
  if (custBody) {
    custBody.innerHTML = CUSTOMERS.map((c) =>
      "<tr><td><strong>" + c.name + '</strong><br><small>' + c.email + "</small></td><td>" + c.quotes + '</td><td>' + c.last + "</td><td>" + pill(c.status) + '</td><td><button class="btn btn-outline btn-sm" data-demo>Manage</button></td></tr>'
    ).join("");
  }

  /* ---------- Notifications dropdown ---------- */
  const bell = $("[data-bell]");
  const bellMenu = $(".bell-menu");
  if (bell && bellMenu) {
    bell.addEventListener("click", (event) => { event.stopPropagation(); bellMenu.classList.toggle("is-open"); });
    document.addEventListener("click", () => bellMenu.classList.remove("is-open"));
  }

  /* ---------- Anything marked data-demo ---------- */
  document.addEventListener("click", (event) => {
    const demo = event.target.closest("[data-demo]");
    if (!demo) return;
    event.preventDefault();
    alert("Demo mode: this action goes live in Phase 2, when the portal is connected to Supabase.");
  });
})();
