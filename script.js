const menuButton = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const briefForm = document.querySelector("#brief-form");
const briefResult = document.querySelector("#brief-result");
const briefSummary = document.querySelector("#brief-summary");
const resultStatus = document.querySelector("#result-status");
const quoteForm = document.querySelector("#quote-form");
const quoteSubmit = document.querySelector("#quote-submit");
const quoteStatus = document.querySelector("#quote-status");
const whatsappBriefLink = document.querySelector("#send-brief-whatsapp");
const whatsappNumber = "255778164796";
const web3FormsAccessKey = "4c3abde8-6b23-4b7d-8cea-d30890c6ea65";
const carrierSearch = document.querySelector("#carrier-search");
const carrierItems = [...document.querySelectorAll(".carrier-item")];
const carrierCount = document.querySelector("#carrier-count");
const carrierEmpty = document.querySelector("#carrier-empty");

document.querySelector("#year").textContent = new Date().getFullYear();
document.querySelector("#ready-date").min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  siteNav.classList.toggle("is-open", !isOpen);
});

siteNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    siteNav.classList.remove("is-open");
  }
});

function getBriefFields() {
  const values = new FormData(briefForm);
  return [
    ["Origin", values.get("origin")],
    ["Destination", values.get("destination")],
    ["Freight mode", values.get("freightMode")],
    ["Cargo ready date", values.get("readyDate") || "Not specified"],
    ["Cargo description", values.get("cargoDescription")],
    ["Quantity / size", values.get("cargoQuantity") || "Not specified"],
    ["Incoterm", values.get("tradeTerm") || "Not specified"],
    ["Special handling / notes", values.get("cargoNotes") || "None"]
  ];
}

function formatBrief(fields) {
  return ["SHIPMENT BRIEF", "", ...fields.map(([label, value]) => `${label}: ${value}`)].join("\n");
}

briefForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const fields = getBriefFields();
  briefSummary.replaceChildren();
  for (const [label, value] of fields) {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    row.append(term, description);
    briefSummary.append(row);
  }
  briefResult.hidden = false;
  const whatsappMessage = formatBrief(fields);
  whatsappBriefLink.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
  resultStatus.textContent = "This brief is not sent to anyone until you choose to share it.";
  briefResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

document.querySelector("#copy-brief").addEventListener("click", async () => {
  const text = formatBrief(getBriefFields());
  try {
    await navigator.clipboard.writeText(text);
    resultStatus.textContent = "Shipment brief copied to clipboard.";
  } catch {
    const temporaryInput = document.createElement("textarea");
    temporaryInput.value = text;
    temporaryInput.setAttribute("readonly", "");
    temporaryInput.style.position = "fixed";
    temporaryInput.style.opacity = "0";
    document.body.append(temporaryInput);
    temporaryInput.select();
    const copied = document.execCommand("copy");
    temporaryInput.remove();
    resultStatus.textContent = copied ? "Shipment brief copied to clipboard." : "Copy was blocked by your browser. Use Download .txt instead.";
  }
});

document.querySelector("#download-brief").addEventListener("click", () => {
  const file = new Blob([formatBrief(getBriefFields())], { type: "text/plain;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(file);
  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = "shipment-brief.txt";
  downloadLink.click();
  URL.revokeObjectURL(downloadUrl);
  resultStatus.textContent = "Shipment brief downloaded.";
});

function filterCarriers() {
  const query = carrierSearch.value.trim().toLowerCase();
  let visibleCount = 0;
  for (const carrier of carrierItems) {
    const isMatch = carrier.dataset.carrier.includes(query);
    carrier.hidden = !isMatch;
    if (isMatch) visibleCount += 1;
  }
  carrierCount.textContent = `${visibleCount} carrier ${visibleCount === 1 ? "tool" : "tools"}`;
  carrierEmpty.hidden = visibleCount !== 0;
}

carrierSearch.addEventListener("input", filterCarriers);

document.querySelector("#use-shipment-brief").addEventListener("click", () => {
  const brief = new FormData(briefForm);
  const setQuoteField = (name, value) => {
    const field = quoteForm.elements.namedItem(name);
    if (field && value) field.value = value;
  };
  const selectedMode = brief.get("freightMode") || "";
  const mode = selectedMode.toLowerCase().startsWith("ocean") ? "sea" : selectedMode.toLowerCase().includes("air") ? "air" : selectedMode ? "not sure" : "";
  const notes = [
    brief.get("cargoNotes") ? `Special handling / notes: ${brief.get("cargoNotes")}` : "",
    brief.get("readyDate") ? `Cargo ready date: ${brief.get("readyDate")}` : "",
    brief.get("tradeTerm") ? `Incoterm: ${brief.get("tradeTerm")}` : ""
  ].filter(Boolean).join("\n");

  setQuoteField("origin", brief.get("origin"));
  setQuoteField("destination", brief.get("destination"));
  setQuoteField("cargoType", brief.get("cargoDescription"));
  setQuoteField("weightVolume", brief.get("cargoQuantity"));
  setQuoteField("mode", mode);
  setQuoteField("message", notes);
  quoteStatus.textContent = "Shipment details copied into the quote form. Add your name and contact details to continue.";
  document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
  quoteForm.querySelector("[name=name]").focus({ preventScroll: true });
});

quoteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!quoteForm.reportValidity()) return;

  const buttonLabel = quoteSubmit.querySelector(".submit-label");
  quoteSubmit.disabled = true;
  quoteSubmit.setAttribute("aria-busy", "true");
  buttonLabel.textContent = "Sending request...";
  quoteStatus.className = "quote-status";
  quoteStatus.textContent = "Sending your request securely...";

  const payload = new FormData(quoteForm);
  payload.set("access_key", web3FormsAccessKey);
  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: payload
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.message || "We couldn't send your request. Please try again.");

    quoteStatus.classList.add("is-success");
    quoteStatus.textContent = "Thank you. Your quote request has been sent successfully.";
    quoteForm.reset();
    document.querySelector("#quote-botcheck").checked = false;
  } catch (error) {
    quoteStatus.classList.add("is-error");
    quoteStatus.textContent = error.message;
  } finally {
    quoteSubmit.disabled = false;
    quoteSubmit.removeAttribute("aria-busy");
    buttonLabel.textContent = "Send quote request";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    carrierSearch.focus();
  }
  if (event.key === "Escape" && document.activeElement === carrierSearch) {
    carrierSearch.value = "";
    filterCarriers();
    carrierSearch.blur();
  }
});

const carrierLinks = document.querySelectorAll(".carrier-item");
const revealObserver = "IntersectionObserver" in window ? new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }
}, { threshold: 0.15 }) : null;
if (revealObserver) {
  carrierLinks.forEach((item) => revealObserver.observe(item));
}