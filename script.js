/* CONFIG: update these verified business details, estimates, and figures before launch. */
const CONFIG = {
  companyName: "Blues Company",
  homeCity: "Dar es Salaam, Tanzania",
  contact: {
    phoneDisplay: "+255 778 164 796",
    phoneE164: "+255778164796",
    email: "info@bluescompany.site",
    address: "Dar es Salaam, Tanzania",
    hours: "Open 24 hours, 7 days a week",
    mapQuery: "Dar es Salaam, Tanzania"
  },
  whatsappPhone: "255778164796",
  web3FormsAccessKey: "4c3abde8-6b23-4b7d-8cea-d30890c6ea65",
  stats: {
    tradeLanes: null,
    yearsInBusiness: null
  },
  about: {
    story: "Blues Company helps shippers in Dar es Salaam plan and move cargo with practical freight forwarding support across sea, air and road transport.",
    mission: "To make every shipment easier to understand, better prepared, and handled with care from origin to destination.",
    promises: [
      "Review the route, cargo, and documents before booking.",
      "Keep customers informed as the shipment progresses.",
      "Coordinate carriers, customs, and delivery handoffs clearly."
    ]
  },
  volumetricDivisor: 6000,
  tradeLanes: [],
  carriers: [
    { name: "Maersk", url: "https://www.maersk.com/tracking", search: "maersk a p moller maersk" },
    { name: "MSC", url: "https://www.msc.com/en/track-a-shipment", search: "msc mediterranean shipping company" },
    { name: "CMA CGM", url: "https://www.cma-cgm.com/ebusiness/tracking", search: "cma cgm" },
    { name: "Hapag-Lloyd", url: "https://www.hapag-lloyd.com/en/online-business/track/track-by-container-solution.html", search: "hapag lloyd" },
    { name: "Ocean Network Express", url: "https://www.one-line.com/one-ecom/manage-shipment/cargo-tracking", search: "one ocean network express" },
    { name: "COSCO Shipping", url: "https://elines.coscoshipping.com/ebusiness/cargoTracking", search: "cosco shipping lines" },
    { name: "Evergreen Line", url: "https://ct.shipmentlink.com/servlet/TDB1_CargoTracking.do", search: "evergreen shipmentlink" },
    { name: "ZIM", url: "https://www.zim.com/tools/track-a-shipment", search: "zim integrated shipping services" },
    { name: "Pacific International Lines", url: "https://www.pilship.com/digital-solutions/", search: "pil pacific international lines" },
    { name: "OOCL", url: "https://www.oocl.com/eng/ourservices/eservices/cargotracking/Pages/cargotracking.aspx", search: "oocl orient overseas container line" },
    { name: "Yang Ming", url: "https://www.yangming.com/e-service/track_trace/track_trace_cargo_tracking.aspx", search: "yang ming" }
  ],
  incoterms: {
    EXW: { cost: 10, risk: 10, summary: "The seller makes the goods available at the named place, not loaded on the collecting vehicle. The buyer generally arranges loading, export and import formalities, and carriage. FCA may be more suitable where the seller clears exports." },
    FCA: { cost: 24, risk: 24, summary: "The seller delivers the goods to the buyer's nominated carrier at the named place and handles export clearance. The exact delivery point affects loading responsibility and risk transfer." },
    FOB: { cost: 47, risk: 47, summary: "For sea or inland waterway transport. The seller delivers the goods on board the vessel nominated by the buyer at the named shipment port. Risk transfers once the goods are on board." },
    CFR: { cost: 78, risk: 47, summary: "For sea or inland waterway transport. The seller pays carriage to the named destination port, but risk transfers to the buyer when the goods are on board at origin. The seller has no CIF insurance obligation." },
    CIF: { cost: 86, risk: 47, summary: "For sea or inland waterway transport. The seller pays freight and obtains minimum cover equivalent to Institute Cargo Clauses (C), unless otherwise agreed, to the named destination port; risk transfers when the goods are on board at origin." },
    CPT: { cost: 78, risk: 24, summary: "The seller pays carriage to the named destination, but risk transfers when the goods are handed to the first carrier." },
    CIP: { cost: 87, risk: 24, summary: "The seller pays carriage and obtains cover equivalent to Institute Cargo Clauses (A), unless otherwise agreed, to the named destination; risk transfers when the goods are handed over to the first carrier, not at the destination." },
    DAP: { cost: 91, risk: 91, summary: "The seller arranges and bears risk to the named destination, ready for unloading. The buyer handles import clearance and unloading." },
    DPU: { cost: 96, risk: 96, summary: "The seller arranges delivery and unloading at the named destination and bears risk through unloading. The buyer handles import clearance." },
    DDP: { cost: 100, risk: 100, summary: "The seller bears the costs and risks through delivery at the named destination, including import clearance and duties; the buyer unloads." }
  },
  serviceIcons: ["anchor", "compass", "container", "compass", "container", "crane", "anchor"]
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const menuButton = $("#menu-toggle");
const siteNav = $("#site-nav");
const briefForm = $("#brief-form");
const briefResult = $("#brief-result");
const briefSummary = $("#brief-summary");
const resultStatus = $("#result-status");
const quoteForm = $("#quote-form");
const quoteSubmit = $("#quote-submit");
const quoteStatus = $("#quote-status");
const whatsappBriefLink = $("#send-brief-whatsapp");
const whatsappQuoteLink = $("#quote-whatsapp-current");
const whatsappSuccessLink = document.createElement("a");
const carrierSearch = $("#carrier-search");
const carrierItems = $$(".carrier-item");
const carrierCount = $("#carrier-count");
const carrierEmpty = $("#carrier-empty");
let latestCbm = null;


function initializeMicroSlats() {
  const canvas = $("#micro-slats-background");
  if (!canvas) return;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state = { width: 0, height: 0, dpr: 1, pointerX: 0.5, pointerY: 0.5, targetX: 0.5, targetY: 0.5, time: 0 };
  const settings = { color: [168, 85, 247], glint: [255, 255, 255], background: [18, 15, 23], slatWidth: 10, slatHeight: 25, gap: 3 };

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    state.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    state.width = Math.max(1, bounds.width);
    state.height = Math.max(1, bounds.height);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  function paint(now) {
    state.time = reduceMotion ? 0 : now * 0.0006;
    state.pointerX += (state.targetX - state.pointerX) * 0.08;
    state.pointerY += (state.targetY - state.pointerY) * 0.08;
    const { width, height } = state;
    context.clearRect(0, 0, width, height);
    context.fillStyle = `rgb(${settings.background.join(",")})`;
    context.fillRect(0, 0, width, height);

    const spacingX = settings.slatWidth + settings.gap;
    const spacingY = settings.slatHeight + settings.gap;
    const cols = Math.ceil(width / spacingX) + 2;
    const rows = Math.ceil(height / spacingY) + 2;
    const direction = 250 * Math.PI / 180;
    const flowX = Math.cos(direction);
    const flowY = Math.sin(direction);
    const pointerInfluence = (state.pointerX - 0.5) * 1.1;

    for (let row = -1; row < rows; row += 1) {
      for (let col = -1; col < cols; col += 1) {
        const x = col * spacingX + settings.gap * 0.5;
        const y = row * spacingY + settings.gap * 0.5;
        const nx = x / Math.max(width, 1);
        const ny = y / Math.max(height, 1);
        const wave = Math.sin((nx * 8.2 + ny * 4.1) + state.time * 1.8) * 0.5 + Math.sin((nx * -4.2 + ny * 7.8) - state.time * 1.25) * 0.25;
        const cursor = Math.exp(-(((nx - state.pointerX) ** 2) + ((ny - state.pointerY) ** 2)) / 0.055) * pointerInfluence;
        const crest = Math.max(0, Math.sin(nx * 9.5 + ny * 3.2 + state.time * 2.2 + cursor * 2.8));
        const depth = 0.62 + wave * 0.18 + cursor * 0.18;
        const lean = (wave * 0.18 + cursor * 0.28) * (Math.PI / 8);
        const alpha = Math.max(0.2, Math.min(0.9, depth));
        const mix = Math.max(0, Math.min(1, crest * 0.85 + cursor * 0.8));
        const r = Math.round(settings.color[0] * (1 - mix) + settings.glint[0] * mix);
        const g = Math.round(settings.color[1] * (1 - mix) + settings.glint[1] * mix);
        const b = Math.round(settings.color[2] * (1 - mix) + settings.glint[2] * mix);
        context.save();
        context.translate(x + settings.slatWidth / 2, y + settings.slatHeight / 2);
        context.rotate(lean + flowX * 0.02);
        context.globalAlpha = alpha;
        context.fillStyle = `rgb(${r} ${g} ${b})`;
        context.beginPath();
        context.roundRect(-settings.slatWidth / 2, -settings.slatHeight * depth / 2, settings.slatWidth, settings.slatHeight * depth, 5);
        context.fill();
        context.restore();
      }
    }
    if (!reduceMotion) window.requestAnimationFrame(paint);
  }

  canvas.addEventListener("pointermove", event => {
    const bounds = canvas.getBoundingClientRect();
    state.targetX = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    state.targetY = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
  }, { passive: true });
  canvas.addEventListener("pointerleave", () => { state.targetX = 0.5; state.targetY = 0.5; });
  window.addEventListener("resize", resize, { passive: true });
  resize();
  paint(0);
}

function setContactDetails() {
  const phone = $("#contact-phone");
  phone.textContent = CONFIG.contact.phoneDisplay;
  phone.href = `tel:${CONFIG.contact.phoneE164}`;
  const whatsapp = $("#whatsapp-float");
  whatsapp.href = `https://wa.me/${CONFIG.whatsappPhone}?text=${encodeURIComponent("Hello, I would like a freight quote.")}`;
  whatsappBriefLink.href = `https://wa.me/${CONFIG.whatsappPhone}`;

  const email = $("#contact-email");
  email.href = `mailto:${CONFIG.contact.email}`;
  email.textContent = CONFIG.contact.email;
  $("#contact-address").textContent = CONFIG.contact.address;
  $("#contact-hours").textContent = CONFIG.contact.hours;
  $(".map-card").href = `https://maps.google.com/?q=${encodeURIComponent(CONFIG.contact.mapQuery)}`;
  const origin = $("#origin");
  if (!origin.value) origin.value = CONFIG.homeCity;
}

function createWhatsAppIcon() {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const symbol = document.createElementNS("http://www.w3.org/2000/svg", "use");
  icon.classList.add("whatsapp-icon");
  icon.setAttribute("viewBox", "0 0 32 32");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");
  symbol.setAttribute("href", "images/freight-icons.svg#whatsapp");
  icon.append(symbol);
  return icon;
}

function addWhatsAppIcons() {
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(link => {
    if (link.querySelector(".whatsapp-icon")) return;
    const icon = createWhatsAppIcon();
    if (link.id === "whatsapp-float") {
      const oldMark = link.querySelector("span");
      if (oldMark) oldMark.replaceWith(icon);
      else link.prepend(icon);
    } else {
      link.prepend(icon);
      link.classList.add("has-whatsapp-icon");
    }
  });
}

function addQuoteWhatsAppActions() {
  whatsappSuccessLink.id = "quote-whatsapp-success";
  whatsappSuccessLink.className = "button button-whatsapp quote-whatsapp-success";
  whatsappSuccessLink.target = "_blank";
  whatsappSuccessLink.rel = "noopener noreferrer";
  whatsappSuccessLink.textContent = "Also send these details on WhatsApp";
  whatsappSuccessLink.hidden = true;
  whatsappSuccessLink.prepend(createWhatsAppIcon());

  $(".quote-heading").append(whatsappQuoteLink);
  quoteStatus.insertAdjacentElement("afterend", whatsappSuccessLink);

  const hiddenFields = [
    ["subject", "New quote request from Blues Company website"],
    ["from_name", "Blues Company Website"],
    ["replyto", ""]
  ];
  hiddenFields.forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    quoteForm.prepend(input);
  });
  updateQuoteWhatsAppLink();
}

function makeQuoteWhatsAppUrl(values) {
  const rows = [
    ["Name", values.get("name")], ["Company", values.get("company")],
    ["Phone", values.get("phone")], ["Email", values.get("email")],
    ["Service", values.get("service")], ["Cargo type", values.get("cargoType")],
    ["Shipping mode", values.get("mode")], ["Origin", values.get("origin")],
    ["Destination", values.get("destination")], ["Approximate weight / volume", values.get("weightVolume")],
    ["Message", values.get("message")]
  ].filter(([, value]) => String(value || "").trim());
  const message = ["Freight quote request for Blues Company", "", ...rows.map(([label, value]) => `${label}: ${value}`)].join("\n");
  return `https://wa.me/${CONFIG.whatsappPhone}?text=${encodeURIComponent(message)}`;
}

function updateQuoteWhatsAppLink() {
  const values = new FormData(quoteForm);
  const replyTo = quoteForm.elements.namedItem("replyto");
  if (replyTo) replyTo.value = String(values.get("email") || "").trim();
  whatsappQuoteLink.href = makeQuoteWhatsAppUrl(values);
}

quoteForm.addEventListener("input", updateQuoteWhatsAppLink);
quoteForm.addEventListener("change", updateQuoteWhatsAppLink);

function renderServiceIcons() {
  $$(".service-icon").forEach((container, index) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    svg.setAttribute("viewBox", "0 0 32 32");
    svg.setAttribute("aria-hidden", "true");
    use.setAttribute("href", `images/freight-icons.svg#${CONFIG.serviceIcons[index]}`);
    svg.append(use);
    container.replaceChildren(svg);
  });
}

function renderAboutDetails() {
  $("#about-story").textContent = CONFIG.about.story;
  $("#about-mission").textContent = CONFIG.about.mission;
  const promiseList = $("#about-promises");
  CONFIG.about.promises.forEach(promise => {
    const item = document.createElement("li");
    item.textContent = promise;
    promiseList.append(item);
  });
}

function renderEditableDetails() {
  const counters = { tradeLanes: CONFIG.stats.tradeLanes, years: CONFIG.stats.yearsInBusiness };
  for (const [key, value] of Object.entries(counters)) {
    const output = $(`[data-counter="${key}"]`);
    if (!output) continue;
    output.textContent = Number.isFinite(value) ? "0" : "—";
    if (!Number.isFinite(value)) continue;
    const animate = () => {
      if (reducedMotion) {
        output.textContent = new Intl.NumberFormat("en-US").format(value);
        return;
      }
      const start = performance.now();
      const duration = 1100;
      const frame = now => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        output.textContent = new Intl.NumberFormat("en-US").format(Math.round(value * eased));
        if (progress < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };
    if ("IntersectionObserver" in window && !reducedMotion) {
      const counterObserver = new IntersectionObserver((entries, observer) => {
        if (entries.some(entry => entry.isIntersecting)) {
          animate();
          observer.disconnect();
        }
      }, { threshold: 0.7 });
      counterObserver.observe(output);
    } else {
      animate();
    }
  }

  const laneGrid = $("#lane-grid");
  const transitSelect = $("#transit-route");
  for (const lane of CONFIG.tradeLanes) {
    const article = document.createElement("article");
    article.className = "lane-card";
    article.dataset.laneId = lane.id;
    article.tabIndex = 0;
    article.setAttribute("aria-label", `${lane.origin} to ${lane.destination}`);
    const flag = lane.mode.toUpperCase();
    article.innerHTML = `<small>${flag}</small><div class="lane-route"><span></span><i aria-hidden="true"></i><span></span></div><span>${lane.mode} · <b>${lane.transitDays ? `${lane.transitDays.min}–${lane.transitDays.max} days indicative` : "Transit estimate by enquiry"}</b></span>`;
    const routeText = $$(".lane-route span", article);
    routeText[0].textContent = lane.origin;
    routeText[1].textContent = lane.destination;
    laneGrid.append(article);
    const option = document.createElement("option");
    option.value = lane.id;
    option.textContent = `${lane.origin} → ${lane.destination}`;
    transitSelect.append(option);
  }
  if (CONFIG.tradeLanes.length === 0) {
    transitSelect.options[0].textContent = "No configured routes yet";
    const output = $("#transit-result");
    output.querySelector("strong").textContent = "Route estimate by enquiry";
    output.querySelector("span").textContent = "Transit ranges are not published until a current route estimate is verified.";
    $(".route-layer").style.display = "none";
    $(".port-markers").style.display = "none";
    $(".map-labels").innerHTML = "<text x=\"443\" y=\"442\">DAR ES SALAAM</text>";
  }

  const trackingSelect = $("#tracking-carrier");
  for (const carrier of CONFIG.carriers) {
    const option = document.createElement("option");
    option.value = carrier.name;
    option.textContent = carrier.name;
    trackingSelect.append(option);
  }

}

function initializeTheme() {
  const themeToggle = $("#theme-toggle");
  let storedTheme = null;
  try { storedTheme = localStorage.getItem("blues-theme"); } catch { /* Storage may be disabled. */ }
  const initialTheme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : "light";
  document.documentElement.dataset.theme = initialTheme;
  updateThemeLabel();
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    try { localStorage.setItem("blues-theme", nextTheme); } catch { /* Theme still works for this page view. */ }
    updateThemeLabel();
  });
  function updateThemeLabel() {
    const isDark = document.documentElement.dataset.theme === "dark";
    themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
    themeToggle.title = `Switch to ${isDark ? "light" : "dark"} theme`;
    themeToggle.firstElementChild.textContent = isDark ? "☼" : "◐";
  }
}

function closeMobileNav() {
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
  siteNav.classList.remove("is-open");
  $$(".nav-mega[open]", siteNav).forEach(menu => menu.open = false);
}
menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  siteNav.classList.toggle("is-open", !isOpen);
});
siteNav.addEventListener("click", event => {
  if (event.target.closest("a")) closeMobileNav();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeMobileNav();
    $$(".nav-mega[open]").forEach(menu => menu.open = false);
    if (document.activeElement === carrierSearch) {
      carrierSearch.value = "";
      filterCarriers();
      carrierSearch.blur();
    }
  }
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    carrierSearch.focus();
  }
});

document.querySelectorAll("[data-track-mode]").forEach(tab => {
  tab.addEventListener("click", () => {
    const mode = tab.dataset.trackMode;
    $$("[data-track-mode]").forEach(item => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
    });
    const input = $("#tracking-reference");
    const label = $("#tracking-label");
    const panel = $("#tracking-form");
    const isCarrier = mode === "carrier";
    const isQuote = mode === "quote";
    panel.hidden = isQuote;
    $("#quote-shortcut").hidden = !isQuote;
    input.disabled = isCarrier || isQuote;
    if (isQuote) {
      $("#tracking-status").textContent = "Continue to the quote form to share shipment details.";
      return;
    }
    input.placeholder = mode === "bl" ? "Enter bill of lading number" : "Enter container number";
    label.textContent = mode === "bl" ? "Bill of lading number" : "Container number";
    panel.setAttribute("aria-labelledby", tab.id);
    $("#tracking-status").textContent = isCarrier ? "Choose a shipping line to open its official tracking tools." : "Tracking opens the shipping line's official website. Live data is provided by the carrier.";
    if (isCarrier) $("#tracking-carrier").focus();
    else input.focus();
  });
});
$("#tracking-form").addEventListener("submit", event => {
  event.preventDefault();
  const carrier = CONFIG.carriers.find(item => item.name === $("#tracking-carrier").value);
  if (!carrier) {
    $("#tracking-status").textContent = "Select your shipping line to continue to its official tracking site.";
    $("#tracking-carrier").focus();
    return;
  }
  const reference = $("#tracking-reference").value.trim();
  const currentTab = $("[data-track-mode].is-active").dataset.trackMode;
  $("#tracking-status").textContent = reference && currentTab !== "carrier"
    ? `Opening ${carrier.name}. Paste your ${currentTab === "bl" ? "bill of lading" : "container"} reference on the carrier's page.`
    : `Opening ${carrier.name}'s official tracking page.`;
  window.open(carrier.url, "_blank", "noopener,noreferrer");
});

function highlightLane(id, active) {
  $$("[data-route]").filter(path => path.dataset.route === id).forEach(path => path.classList.toggle("is-highlighted", active));
  const card = $$(".lane-card").find(item => item.dataset.laneId === id);
  if (card) card.classList.toggle("is-highlighted", active);
}
$$(".lane-card").forEach(card => {
  card.addEventListener("pointerenter", () => highlightLane(card.dataset.laneId, true));
  card.addEventListener("pointerleave", () => highlightLane(card.dataset.laneId, false));
  card.addEventListener("focus", () => highlightLane(card.dataset.laneId, true));
  card.addEventListener("blur", () => highlightLane(card.dataset.laneId, false));
});

function setupMotion() {
  const loader = $("#page-loader");
  const dismissLoader = () => loader.classList.add("is-done");
  window.addEventListener("load", dismissLoader, { once: true });
  window.setTimeout(dismissLoader, reducedMotion ? 0 : 900);

  if (reducedMotion || !("IntersectionObserver" in window)) {
    $$("[data-reveal]").forEach(item => item.classList.add("is-visible"));
  } else {
    document.documentElement.classList.add("reveal-ready");
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -24px 0px" });
    const revealTargets = $$("[data-reveal]");
    revealTargets.forEach(item => revealObserver.observe(item));
    requestAnimationFrame(() => revealTargets.forEach(item => {
      const bounds = item.getBoundingClientRect();
      if (bounds.top < window.innerHeight * 0.92 && bounds.bottom > 0) {
        item.classList.add("is-visible");
        revealObserver.unobserve(item);
      }
    }));
    window.setTimeout(() => revealTargets.forEach(item => item.classList.add("is-visible")), 1400);
  }

  let scrollFrame = 0;
  const updateScrollEffects = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const scrollY = window.scrollY;
      const hero = $("#hero-visual");
      if (hero && !reducedMotion) {
        const progress = Math.max(-12, Math.min(18, (scrollY - hero.offsetTop) * 0.045));
        hero.style.setProperty("--parallax-y", `${progress}px`);
      }
      const topButton = $("#back-top-button");
      topButton.classList.toggle("is-visible", scrollY > 700);
      const timeline = $("#journey-timeline");
      if (timeline) {
        const bounds = timeline.getBoundingClientRect();
        const progress = Math.max(0, Math.min(100, ((window.innerHeight * 0.72 - bounds.top) / (bounds.height * 0.82)) * 100));
        timeline.style.setProperty("--timeline-progress", `${progress}%`);
      }
    });
  };
  window.addEventListener("scroll", updateScrollEffects, { passive: true });
  updateScrollEffects();
  $("#back-top-button").addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));
}

function getBriefFields() {
  const values = new FormData(briefForm);
  return [
    ["Origin", values.get("origin")], ["Destination", values.get("destination")],
    ["Freight mode", values.get("freightMode")], ["Cargo ready date", values.get("readyDate") || "Not specified"],
    ["Cargo description", values.get("cargoDescription")], ["Quantity / size", values.get("cargoQuantity") || "Not specified"],
    ["Incoterm", values.get("tradeTerm") || "Not specified"], ["Special handling / notes", values.get("cargoNotes") || "None"]
  ];
}
function formatBrief(fields) {
  return ["SHIPMENT BRIEF", "", ...fields.map(([label, value]) => `${label}: ${value}`)].join("\n");
}
briefForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!briefForm.reportValidity()) return;
  const fields = getBriefFields();
  briefSummary.replaceChildren();
  fields.forEach(([label, value]) => {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    row.append(term, description);
    briefSummary.append(row);
  });
  briefResult.hidden = false;
  whatsappBriefLink.href = `https://wa.me/${CONFIG.whatsappPhone}?text=${encodeURIComponent(formatBrief(fields))}`;
  resultStatus.textContent = "This brief is not sent to anyone until you choose to share it.";
  briefResult.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
});
$("#copy-brief").addEventListener("click", async () => {
  const text = formatBrief(getBriefFields());
  try {
    await navigator.clipboard.writeText(text);
    resultStatus.textContent = "Shipment brief copied to clipboard.";
  } catch {
    const fallback = document.createElement("textarea");
    fallback.value = text;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.body.append(fallback);
    fallback.select();
    const copied = document.execCommand("copy");
    fallback.remove();
    resultStatus.textContent = copied ? "Shipment brief copied to clipboard." : "Copy was blocked. Use Download .txt instead.";
  }
});
$("#download-brief").addEventListener("click", () => {
  const fileUrl = URL.createObjectURL(new Blob([formatBrief(getBriefFields())], { type: "text/plain;charset=utf-8" }));
  const download = document.createElement("a");
  download.href = fileUrl;
  download.download = "shipment-brief.txt";
  download.click();
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
  resultStatus.textContent = "Shipment brief downloaded.";
});

function filterCarriers() {
  const query = carrierSearch.value.trim().toLowerCase();
  let count = 0;
  carrierItems.forEach(item => {
    const matches = item.dataset.carrier.includes(query);
    item.hidden = !matches;
    if (matches) count += 1;
  });
  carrierCount.textContent = `${count} carrier ${count === 1 ? "tool" : "tools"}`;
  carrierEmpty.hidden = count !== 0;
}
carrierSearch.addEventListener("input", filterCarriers);

function setQuoteValue(name, value) {
  const field = quoteForm.elements.namedItem(name);
  if (field && value !== undefined && value !== null && String(value).trim()) field.value = value;
}
function copyPlannerIntoQuote(extraMessage = "", calculatedWeight = "") {
  const brief = new FormData(briefForm);
  const selectedMode = String(brief.get("freightMode") || "").toLowerCase();
  const mode = selectedMode.startsWith("ocean") ? "sea" : selectedMode.includes("air") ? "air" : selectedMode.includes("road") ? "road" : selectedMode ? "not sure" : "";
  const notes = [brief.get("cargoNotes") ? `Special handling / notes: ${brief.get("cargoNotes")}` : "", brief.get("readyDate") ? `Cargo ready date: ${brief.get("readyDate")}` : "", brief.get("tradeTerm") ? `Incoterm: ${brief.get("tradeTerm")}` : "", extraMessage].filter(Boolean).join("\n");
  setQuoteValue("origin", brief.get("origin"));
  setQuoteValue("destination", brief.get("destination"));
  setQuoteValue("cargoType", brief.get("cargoDescription"));
  setQuoteValue("weightVolume", calculatedWeight || brief.get("cargoQuantity"));
  setQuoteValue("mode", mode);
  setQuoteValue("message", notes);
}
$("#use-shipment-brief").addEventListener("click", () => {
  copyPlannerIntoQuote();
  updateQuoteWhatsAppLink();
  quoteStatus.textContent = "Shipment details copied into the quote form. Add your contact details to continue.";
  $("#contact").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  quoteForm.querySelector("[name=name]").focus({ preventScroll: true });
});
$$(".service-quote").forEach(button => button.addEventListener("click", () => {
  setQuoteValue("service", button.dataset.service);
  const service = button.dataset.service.toLowerCase();
  setQuoteValue("mode", service.includes("air") ? "air" : service.includes("road") ? "road" : service.includes("sea") ? "sea" : "not sure");
  setQuoteValue("message", `Please prepare a quote for ${button.dataset.service}.`);
  updateQuoteWhatsAppLink();
  $("#contact").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  window.setTimeout(() => $("#quote-name").focus({ preventScroll: true }), reducedMotion ? 0 : 450);
}));

const routeRequestLink = $$("#site-nav a").find(link => link.textContent.trim() === "Ask about a route");
routeRequestLink?.addEventListener("click", () => {
  setQuoteValue("message", "Please check my requested origin and destination and advise on route options.");
  updateQuoteWhatsAppLink();
});

quoteForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!quoteForm.reportValidity()) return;
  const phoneValue = String(quoteForm.elements.namedItem("phone").value || "").trim();
  const emailValue = String(quoteForm.elements.namedItem("email").value || "").trim();
  if (!phoneValue && !emailValue) {
    quoteStatus.className = "quote-status is-error";
    quoteStatus.textContent = "Please add a phone number or email address so we can reply.";
    quoteForm.elements.namedItem("phone").focus();
    return;
  }
  if ($("#quote-botcheck").checked) {
    quoteStatus.className = "quote-status is-error";
    quoteStatus.textContent = "Your request could not be verified. Please reload and try again.";
    return;
  }
  const buttonLabel = quoteSubmit.querySelector(".submit-label");
  quoteSubmit.disabled = true;
  quoteSubmit.setAttribute("aria-busy", "true");
  buttonLabel.textContent = "Sending request...";
  quoteStatus.className = "quote-status";
  quoteStatus.textContent = "Sending your request securely...";
  const payload = new FormData(quoteForm);
  payload.set("access_key", CONFIG.web3FormsAccessKey);
  payload.set("subject", "New quote request from Blues Company website");
  payload.set("from_name", "Blues Company Website");
  payload.set("replyto", String(payload.get("email") || "").trim());
  const submittedWhatsAppUrl = makeQuoteWhatsAppUrl(payload);
  try {
    const response = await fetch("https://api.web3forms.com/submit", { method: "POST", body: payload });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.message || "We couldn't send your request. Please try again.");
    quoteStatus.classList.add("is-success");
    quoteStatus.textContent = "Thank you — your quote request was sent successfully. We will reply within [X hours].";
    whatsappSuccessLink.href = submittedWhatsAppUrl;
    whatsappSuccessLink.hidden = false;
    quoteForm.reset();
    updateQuoteWhatsAppLink();
    $("#quote-botcheck").checked = false;
  } catch (error) {
    quoteStatus.classList.add("is-error");
    quoteStatus.textContent = error.message || "We couldn't send your request. Please try again.";
  } finally {
    quoteSubmit.disabled = false;
    quoteSubmit.removeAttribute("aria-busy");
    buttonLabel.textContent = "Send quote request";
  }
});

$("#cbm-form").addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const length = Number(values.get("length"));
  const width = Number(values.get("width"));
  const height = Number(values.get("height"));
  const quantity = Number(values.get("quantity"));
  const weight = Number(values.get("weight")) || 0;
  const cbm = (length * width * height * quantity) / 1_000_000;
  const volumetric = (length * width * height * quantity) / CONFIG.volumetricDivisor;
  const gross = weight * quantity;
  const chargeable = Math.max(volumetric, gross);
  latestCbm = { cbm, volumetric, gross, chargeable, quantity };
  $("#cbm-result").innerHTML = `<strong>${cbm.toFixed(3)} m³ total</strong><br>Volumetric weight: ${volumetric.toFixed(1)} kg · Gross weight: ${gross ? `${gross.toFixed(1)} kg` : "not provided"}<br>Planning chargeable weight: ${chargeable.toFixed(1)} kg`;
  $("#cbm-send").disabled = false;
});
$("#cbm-send").addEventListener("click", () => {
  if (!latestCbm) return;
  const quantity = new FormData($("#cbm-form")).get("quantity");
  const calculatedWeight = `${latestCbm.cbm.toFixed(3)} m³; approx. ${latestCbm.chargeable.toFixed(1)} kg chargeable (${quantity} piece${Number(quantity) === 1 ? "" : "s"})`;
  copyPlannerIntoQuote(`CBM estimate: ${latestCbm.cbm.toFixed(3)} m³; volumetric weight uses ${CONFIG.volumetricDivisor} cm³/kg.`, calculatedWeight);
  updateQuoteWhatsAppLink();
  $("#contact").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
});

$("#container-helper").addEventListener("change", event => {
  const volume = Number(event.target.value);
  const output = $("#container-recommendation");
  const recommendations = new Map([
    [15, "At this volume, compare an LCL quote with the cost and control of a dedicated 20 ft container."],
    [28, "A 20 ft container may be a starting point, depending on cargo shape, stowage, and weight."],
    [55, "Compare a 40 ft standard container against the actual packed volume and payload."],
    [70, "A 40 ft high cube may offer useful extra volume; confirm the cargo fits and stays within weight limits."],
    [90, "Consider multiple units or specialist equipment and request a loading review." ]
  ]);
  output.textContent = recommendations.get(volume) || "A rough guide only. Ask a forwarder to check weight and loading.";
});

function updateIncoterm() {
  const selected = $("#incoterm-select").value;
  const term = CONFIG.incoterms[selected];
  const visual = $("#incoterm-visual");
  visual.style.setProperty("--seller-cost", `${term.cost}%`);
  visual.style.setProperty("--risk-transfer", `${term.risk}%`);
  $("#incoterm-summary").textContent = `${selected}: ${term.summary}`;
}
$("#incoterm-select").addEventListener("change", updateIncoterm);
const incotermReferences = document.createElement("p");
incotermReferences.className = "tool-footnote incoterm-references";
incotermReferences.append("References: ");
const iccReference = document.createElement("a");
iccReference.href = "https://iccwbo.org/business-solutions/incoterms-rules/incoterms-2020/";
iccReference.target = "_blank";
iccReference.rel = "noopener noreferrer";
iccReference.textContent = "ICC Incoterms® 2020";
const itaReference = document.createElement("a");
itaReference.href = "https://www.trade.gov/know-your-incoterms";
itaReference.target = "_blank";
itaReference.rel = "noopener noreferrer";
itaReference.textContent = "U.S. International Trade Administration overview";
incotermReferences.append(iccReference, " · ", itaReference);
$(".incoterm-picker").append(incotermReferences);
const incotermVisualNote = document.createElement("p");
incotermVisualNote.className = "tool-footnote";
incotermVisualNote.textContent = "The stage markers are simplified illustrations, not cost percentages. The full rule and named place in the sales contract determine the parties' obligations.";
$(".incoterm-picker").append(incotermVisualNote);

const documentChecklist = {
  export: {
    sea: ["Commercial invoice (if applicable)", "Packing list", "Shipping instructions / draft bill of lading details", "Export customs declaration", "Certificate of origin (if required)", "Permits or commodity certificates (if applicable)", "Dangerous goods declaration (if applicable)"],
    air: ["Commercial invoice (if applicable)", "Packing list", "Air waybill instructions", "Export customs declaration", "Certificate of origin (if required)", "Permits or commodity certificates (if applicable)", "Dangerous goods declaration (if applicable)"]
  },
  import: {
    sea: ["Commercial invoice", "Packing list", "Bill of lading / release details", "Import customs declaration", "Certificate of origin (if required)", "Arrival notice and local release documents", "Permits or commodity certificates (if applicable)"],
    air: ["Commercial invoice", "Packing list", "Air waybill", "Import customs declaration", "Certificate of origin (if required)", "Arrival notice and release documents", "Permits or commodity certificates (if applicable)"]
  }
};
function updateChecklist() {
  const direction = $("#checklist-direction").value;
  const mode = $("#checklist-mode").value;
  const fieldset = $("#checklist-items");
  fieldset.replaceChildren();
  const legend = document.createElement("legend");
  legend.textContent = "Common documents to review";
  fieldset.append(legend);
  documentChecklist[direction][mode].forEach((item, index) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "document";
    checkbox.value = item;
    checkbox.id = `doc-${index}`;
    const text = document.createElement("span");
    text.textContent = item;
    label.append(checkbox, text);
    fieldset.append(label);
  });
}
$("#checklist-direction").addEventListener("change", updateChecklist);
$("#checklist-mode").addEventListener("change", updateChecklist);
$("#print-checklist").addEventListener("click", () => {
  const title = `${$("#checklist-direction").value} ${$("#checklist-mode").value} document checklist`;
  const rows = $$("#checklist-items input").map(input => `<li><span class="box">${input.checked ? "✓" : ""}</span>${input.value}</li>`).join("");
  const printWindow = window.open("", "_blank", "width=760,height=720");
  if (!printWindow) return;
  printWindow.opener = null;
  printWindow.document.write(`<!doctype html><html lang="en"><meta charset="utf-8"><title>${title}</title><style>body{font:16px Arial,sans-serif;max-width:700px;margin:50px auto;color:#14283b}h1{font:32px Georgia,serif}p{color:#5e6c78;line-height:1.5}ul{padding:0;list-style:none}li{padding:12px 0;border-bottom:1px solid #ddd}.box{width:15px;height:15px;margin-right:12px;display:inline-block;border:1px solid #333;text-align:center}</style><h1>${title}</h1><p>General planning checklist. Confirm all document requirements with the relevant customs authority, carrier, and broker.</p><ul>${rows}</ul><script>window.onload=()=>window.print()</script></html>`);
  printWindow.document.close();
});

$("#transit-route").addEventListener("change", event => {
  const lane = CONFIG.tradeLanes.find(item => item.id === event.target.value);
  const output = $("#transit-result");
  output.replaceChildren();
  const route = document.createElement("strong");
  const estimate = document.createElement("span");
  route.textContent = lane ? `${lane.origin} → ${lane.destination}` : "Choose a configured route";
  estimate.textContent = lane?.transitDays ? `${lane.transitDays.min}–${lane.transitDays.max} days, indicative port-to-port estimate only.` : "No indicative range configured.";
  output.append(route, estimate);
});

function filterCarrierDirectory(query) {
  carrierSearch.value = query;
  filterCarriers();
  $("#carriers").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  window.setTimeout(() => carrierSearch.focus({ preventScroll: true }), reducedMotion ? 0 : 400);
}

function initialize() {
  document.title = `${CONFIG.companyName} | Freight, considered. Moved with care.`;
  $("#year").textContent = new Date().getFullYear();
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  $("#ready-date").min = today;
  setContactDetails();
initializeMicroSlats();
  addQuoteWhatsAppActions();
  addWhatsAppIcons();
  renderServiceIcons();
  renderAboutDetails();
  renderEditableDetails();
  initializeTheme();
  setupMotion();
  updateChecklist();
  updateIncoterm();
  $$("[data-tool]").forEach(tab => tab.addEventListener("click", () => {
    const panelId = tab.getAttribute("aria-controls");
    $$("[data-tool]").forEach(item => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
    });
    $$(".tool-panel").forEach(panel => {
      const active = panel.id === panelId;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
  }));
  const enableTabKeyboard = selector => {
    const tabs = $$(selector);
    tabs.forEach(tab => {
      tab.tabIndex = tab.classList.contains("is-active") ? 0 : -1;
      tab.addEventListener("click", () => tabs.forEach(item => item.tabIndex = item.classList.contains("is-active") ? 0 : -1));
      tab.addEventListener("keydown", event => {
        if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const index = tabs.indexOf(tab);
        const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
      });
    });
  };
  enableTabKeyboard("[data-track-mode]");
  enableTabKeyboard("[data-tool]");
  $$(".lane-card").forEach(card => {
    card.addEventListener("pointerenter", () => highlightLane(card.dataset.laneId, true));
    card.addEventListener("pointerleave", () => highlightLane(card.dataset.laneId, false));
    card.addEventListener("focus", () => highlightLane(card.dataset.laneId, true));
    card.addEventListener("blur", () => highlightLane(card.dataset.laneId, false));
  });
}
initialize();
