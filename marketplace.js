(function () {
  "use strict";

  var statusEl = document.getElementById("market-status");
  var authEl = document.getElementById("market-auth");
  var appEl = document.getElementById("market-app");
  var client = null;
  var user = null;
  var listings = [];
  var view = "board";
  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };

  function setStatus(message, kind) {
    statusEl.textContent = message || "";
    statusEl.dataset.kind = kind || "";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function formatDate(value) {
    if (!value) return "Date to be confirmed";
    return new Date(value + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  function normalized(value) {
    return String(value || "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
  }

  function routeText(listing) {
    return escapeHtml(listing.origin) + " to " + escapeHtml(listing.destination);
  }

  function cardHtml(listing, own) {
    var isTruck = listing.listing_type === "truck";
    var title = isTruck ? "Available truck" : "Cargo needs a truck";
    var detail = isTruck
      ? [listing.vehicle_type, listing.capacity_tons ? listing.capacity_tons + " tonnes" : ""].filter(Boolean).join(" · ")
      : [listing.cargo_description, listing.vehicle_type, listing.capacity_tons ? listing.capacity_tons + " tonnes" : ""].filter(Boolean).join(" · ");
    var price = listing.price_amount == null ? "Rate negotiable" : escapeHtml(listing.price_currency) + " " + Number(listing.price_amount).toLocaleString();
    return '<article class="listing-card"><div class="listing-card-head"><span class="listing-kind ' + (isTruck ? "truck" : "load") + '">' + title + '</span><time class="listing-date" datetime="' + escapeHtml(listing.pickup_date) + '">' + escapeHtml(formatDate(listing.pickup_date)) + '</time></div>' +
      '<h2 class="listing-route"><span>' + escapeHtml(listing.origin) + '</span><i aria-hidden="true"></i><span>' + escapeHtml(listing.destination) + '</span></h2>' +
      '<p class="listing-detail">' + (detail ? escapeHtml(detail) : "Cargo and vehicle details available by inquiry") + '</p>' +
      (listing.notes ? '<p class="listing-note">' + escapeHtml(listing.notes) + '</p>' : "") +
      '<div class="listing-card-foot"><span class="listing-price">' + price + '</span>' + (own ? '<span class="pill active">Your listing</span>' : '<button type="button" class="btn btn-outline btn-sm" data-inquire="' + escapeHtml(listing.id) + '">Ask about this route <span aria-hidden="true">↗</span></button>') + '</div></article>';
  }

  function emptyHtml(message) {
    return '<div class="empty-state">' + escapeHtml(message) + '</div>';
  }

  function renderBoard() {
    var query = normalized($("#route-search").value);
    var selectedDate = $("#date-filter").value;
    var visible = listings.filter(function (listing) {
      if (view === "trucks" && listing.listing_type !== "truck") return false;
      if (view === "loads" && listing.listing_type !== "load") return false;
      if (selectedDate && listing.pickup_date !== selectedDate) return false;
      if (query && !normalized(listing.origin + " " + listing.destination + " " + listing.cargo_description + " " + listing.vehicle_type).includes(query)) return false;
      return true;
    });
    $("#listing-count").textContent = visible.length + (visible.length === 1 ? " listing" : " listings");
    $("#listing-grid").innerHTML = visible.length ? visible.map(function (listing) { return cardHtml(listing, listing.owner_id === user.id); }).join("") : emptyHtml("No listings match those filters yet. Try another route or post the first one.");
    $("#listing-grid").hidden = false;
    $("#match-grid").hidden = true;
    $("#activity-grid").hidden = true;
    $("#listing-filters").hidden = false;
  }

  function renderMatches() {
    var trucks = listings.filter(function (item) { return item.listing_type === "truck"; });
    var loads = listings.filter(function (item) { return item.listing_type === "load"; });
    var pairs = [];
    trucks.forEach(function (truck) {
      loads.forEach(function (load) {
        var daysApart = Math.abs(Date.parse(truck.pickup_date + "T00:00:00Z") - Date.parse(load.pickup_date + "T00:00:00Z")) / 86400000;
        if (normalized(truck.origin) === normalized(load.origin) && normalized(truck.destination) === normalized(load.destination) && daysApart <= 3) {
          pairs.push({ truck: truck, load: load, daysApart: daysApart });
        }
      });
    });
    $("#listing-count").textContent = pairs.length + (pairs.length === 1 ? " route match" : " route matches");
    $("#match-grid").innerHTML = pairs.length ? pairs.map(function (pair) {
      var contactButtons = [pair.truck, pair.load].filter(function (listing) { return listing.owner_id !== user.id; }).map(function (listing) {
        return '<button type="button" class="btn btn-outline btn-sm" data-inquire="' + escapeHtml(listing.id) + '">Ask about ' + (listing.listing_type === "truck" ? "the truck" : "the cargo") + '</button>';
      }).join("");
      return '<article class="match-pair"><h3>' + routeText(pair.truck) + '</h3><p>Truck available ' + escapeHtml(formatDate(pair.truck.pickup_date)) + ' · Cargo ready ' + escapeHtml(formatDate(pair.load.pickup_date)) + '. Dates are within three days; confirm exact timing and capacity.</p><div class="listing-card-foot"><span class="pill active">Potential route match</span>' + contactButtons + '</div></article>';
    }).join("") : emptyHtml("No exact route matches within three days yet. The board updates as new trucks and cargo are posted.");
    $("#listing-grid").hidden = true;
    $("#match-grid").hidden = false;
    $("#activity-grid").hidden = true;
    $("#listing-filters").hidden = true;
  }

  function relationListing(row) {
    return row;
  }

  function activityItem(row, incoming) {
    var listing = relationListing(row) || {};
    var handled = row.status === "handled";
    return '<article class="activity-item"><strong>' + (incoming ? "Inquiry received" : "Inquiry sent") + ' · ' + escapeHtml(listing.listing_type === "truck" ? "Available truck" : "Cargo request") + '</strong><p>' + routeText(listing) + '<br>' + escapeHtml(row.contact_name) + ' · ' + escapeHtml(row.contact_method) + '<br>' + escapeHtml(row.message) + '<br>' + escapeHtml(formatDate((row.created_at || "").slice(0, 10))) + '</p>' + (incoming ? '<button type="button" class="btn btn-outline btn-sm" data-handle-inquiry="' + escapeHtml(row.id) + '" ' + (handled ? "disabled" : "") + '>' + (handled ? "Marked handled" : "Mark handled") + '</button>' : '<span class="pill ' + (handled ? "active" : "pending") + '">' + (handled ? "Handled" : "Sent") + '</span>') + '</article>';
  }

  async function renderActivity() {
    $("#listing-count").textContent = "Your private activity";
    $("#listing-grid").hidden = true;
    $("#match-grid").hidden = true;
    $("#activity-grid").hidden = false;
    $("#listing-filters").hidden = true;
    $("#my-listings").innerHTML = '<div class="activity-empty">Loading your listings…</div>';
    $("#my-inquiries").innerHTML = '<div class="activity-empty">Loading inquiries…</div>';

    var results = await Promise.all([
      client.from("marketplace_listings").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
      client.from("marketplace_inquiries").select("*").eq("sender_id", user.id).order("created_at", { ascending: false })
    ]);
    if (results[0].error || results[1].error) {
      setStatus("Your activity could not be loaded. Check the marketplace database migration and try again.", "error");
      return;
    }
    var ownListings = results[0].data || [];
    var sent = results[1].data || [];
    var received = [];
    if (ownListings.length) {
      var receivedResult = await client.from("marketplace_inquiries")
        .select("*")
        .in("listing_id", ownListings.map(function (item) { return item.id; }))
        .order("created_at", { ascending: false });
      if (receivedResult.error) {
        setStatus("Incoming inquiries could not be loaded. Check the marketplace database migration.", "error");
        return;
      }
      received = receivedResult.data || [];
    }
    $("#my-listings").innerHTML = ownListings.length
      ? ownListings.map(function (listing) { return '<article class="activity-item"><strong>' + (listing.listing_type === "truck" ? "Available truck" : "Cargo request") + ' · ' + escapeHtml(listing.status) + '</strong><p>' + routeText(listing) + '<br>Ready ' + escapeHtml(formatDate(listing.pickup_date)) + '</p>' + (listing.status === "open" ? '<button type="button" class="btn btn-outline btn-sm" data-close-listing="' + escapeHtml(listing.id) + '">Close listing</button>' : "") + '</article>'; }).join("")
      : '<div class="activity-empty">You have not posted a truck or cargo request yet.</div>';
    var inquiryItems = received.map(function (row) { return activityItem(row, true); }).concat(sent.map(function (row) { return activityItem(row, false); }));
    $("#my-inquiries").innerHTML = inquiryItems.length ? inquiryItems.join("") : '<div class="activity-empty">Private inquiries about your listings will appear here.</div>';
    setStatus("Your listings and inquiries are private to the people involved.", "");
  }

  async function refreshListings() {
    setStatus("Loading current listings…");
    var result = await client.from("marketplace_listings").select("*").eq("status", "open").order("pickup_date", { ascending: true });
    if (result.error) {
      setStatus("The marketplace database is not ready yet. Run marketplace-schema.sql in the Supabase SQL Editor, then refresh this page.", "error");
      listings = [];
      $("#listing-grid").innerHTML = emptyHtml("The marketplace is waiting for its database setup.");
      return;
    }
    listings = result.data || [];
    setStatus(listings.length ? "Listings are shared only with signed-in members." : "You’re signed in. Post the first available truck or cargo request.", "success");
    if (view === "matches") renderMatches();
    else if (view === "activity") await renderActivity();
    else renderBoard();
  }

  function setListingType() {
    var isTruck = $("#listing-type").value === "truck";
    $("#vehicle-type").required = isTruck;
    $("#capacity").required = isTruck;
    $("#cargo-description").required = !isTruck;
    $("#cargo-field").querySelector("textarea").placeholder = isTruck ? "Optional: cargo type already on board" : "Cargo type, quantity and handling needs";
  }

  async function submitListing(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var data = new FormData(form);
    var button = $("button[type=submit]", form);
    button.disabled = true;
    var record = {
      owner_id: user.id,
      listing_type: data.get("listing_type"),
      origin: String(data.get("origin")).trim(),
      destination: String(data.get("destination")).trim(),
      pickup_date: data.get("pickup_date"),
      vehicle_type: data.get("vehicle_type") || null,
      capacity_tons: data.get("capacity_tons") ? Number(data.get("capacity_tons")) : null,
      cargo_description: String(data.get("cargo_description") || "").trim() || null,
      price_amount: data.get("price_amount") ? Number(data.get("price_amount")) : null,
      price_currency: data.get("price_currency"),
      notes: String(data.get("notes") || "").trim() || null
    };
    var result = await client.from("marketplace_listings").insert(record);
    button.disabled = false;
    if (result.error) {
      setStatus("Your listing was not saved. Check the form and your account permissions, then try again.", "error");
      return;
    }
    form.reset();
    setListingType();
    $("#listing-form-panel").hidden = true;
    setStatus("Your listing is live for signed-in members.", "success");
    await refreshListings();
  }

  function openInquiry(listingId) {
    var listing = listings.find(function (item) { return item.id === listingId; });
    if (!listing || listing.owner_id === user.id) return;
    var dialog = $("#inquiry-dialog");
    $("#inquiry-route").textContent = listing.origin + " to " + listing.destination;
    $("#inquiry-form").elements.listing_id.value = listing.id;
    dialog.showModal();
  }

  async function submitInquiry(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var data = new FormData(form);
    var listing = listings.find(function (item) { return item.id === data.get("listing_id"); });
    if (!listing) {
      setStatus("That listing is no longer available.", "error");
      return;
    }
    var button = $("button[type=submit]", form);
    button.disabled = true;
    var result = await client.from("marketplace_inquiries").insert({
      listing_id: data.get("listing_id"),
      sender_id: user.id,
      listing_type: listing.listing_type,
      origin: listing.origin,
      destination: listing.destination,
      contact_name: String(data.get("contact_name")).trim(),
      contact_method: String(data.get("contact_method")).trim(),
      message: String(data.get("message")).trim()
    });
    button.disabled = false;
    if (result.error) {
      setStatus("The inquiry could not be sent. Please check the details and try again.", "error");
      return;
    }
    form.reset();
    $("#inquiry-dialog").close();
    setStatus("Inquiry sent. You can review it under My activity.", "success");
  }

  async function markHandled(id) {
    var result = await client.from("marketplace_inquiries").update({ status: "handled" }).eq("id", id);
    if (result.error) {
      setStatus("That inquiry could not be updated.", "error");
      return;
    }
    await renderActivity();
  }

  async function closeListing(id) {
    var result = await client.from("marketplace_listings").update({ status: "closed" }).eq("id", id);
    if (result.error) {
      setStatus("That listing could not be closed.", "error");
      return;
    }
    setStatus("Your listing is closed and no longer appears on the public board.", "success");
    await refreshListings();
  }

  function setupControls() {
    $$("[data-view]").forEach(function (button, index) {
      button.addEventListener("click", async function () {
        view = button.dataset.view;
        $$("[data-view]").forEach(function (tab) {
          var active = tab === button;
          tab.classList.toggle("is-active", active);
          tab.setAttribute("aria-selected", active ? "true" : "false");
        });
        $(".market-tabs").style.setProperty("--active-index", index);
        if (view === "matches") renderMatches();
        else if (view === "activity") await renderActivity();
        else renderBoard();
      });
    });
    $("#route-search").addEventListener("input", renderBoard);
    $("#date-filter").addEventListener("change", renderBoard);
    $("#toggle-listing-form").addEventListener("click", function () {
      $("#listing-form-panel").hidden = !$("#listing-form-panel").hidden;
      if (!$("#listing-form-panel").hidden) $("#listing-type").focus();
    });
    $("#close-listing-form").addEventListener("click", function () { $("#listing-form-panel").hidden = true; });
    $("#listing-type").addEventListener("change", setListingType);
    $("#listing-form").addEventListener("submit", submitListing);
    $("#inquiry-form").addEventListener("submit", submitInquiry);
    $("#close-inquiry").addEventListener("click", function () { $("#inquiry-dialog").close(); });
    $("#listing-grid").addEventListener("click", function (event) {
      var button = event.target.closest("[data-inquire]");
      if (button) openInquiry(button.dataset.inquire);
    });
    $("#match-grid").addEventListener("click", function (event) {
      var button = event.target.closest("[data-inquire]");
      if (button) openInquiry(button.dataset.inquire);
    });
    $("#my-inquiries").addEventListener("click", function (event) {
      var button = event.target.closest("[data-handle-inquiry]");
      if (button) markHandled(button.dataset.handleInquiry);
    });
    $("#my-listings").addEventListener("click", function (event) {
      var button = event.target.closest("[data-close-listing]");
      if (button) closeListing(button.dataset.closeListing);
    });
    $("[data-market-signout]").addEventListener("click", async function () {
      await client.auth.signOut();
      location.href = "login.html";
    });
    $("[data-market-theme]").addEventListener("click", function () {
      var next = document.documentElement.dataset.theme === "dark" ? "" : "dark";
      if (next) document.documentElement.dataset.theme = next;
      else delete document.documentElement.dataset.theme;
      localStorage.setItem("blues_theme", next);
    });
  }

  async function init() {
    var config = window.BLUES_CONFIG || {};
    if (!window.supabase || !config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
      setStatus("The secure service is not configured. Contact the site administrator.", "error");
      return;
    }
    try {
      client = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    } catch (error) {
      setStatus("The account service could not start. Check the Supabase project URL.", "error");
      return;
    }
    var sessionResult = await client.auth.getSession();
    if (sessionResult.error || !sessionResult.data.session) {
      statusEl.hidden = true;
      authEl.hidden = false;
      return;
    }
    user = sessionResult.data.session.user;
    $("[data-market-signout]").hidden = false;
    $("#listing-form").elements.namedItem("pickup_date").min = new Date().toISOString().slice(0, 10);
    $("#inquiry-form").elements.namedItem("contact_name").value = user.user_metadata && user.user_metadata.full_name || "";
    $("#market-app").hidden = false;
    setupControls();
    setListingType();
    await refreshListings();
  }

  var savedTheme = localStorage.getItem("blues_theme");
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  init().catch(function () {
    setStatus("The marketplace could not load. Check your connection and try again.", "error");
  });
}());