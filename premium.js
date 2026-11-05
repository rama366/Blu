/* BLUES COMPANY - PREMIUM v2 enhancements.
   Load AFTER script.js. Progressive: every feature checks for
   its target elements before running, so it never breaks the base site. */
(function () {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* 1. Scroll progress bar + glass header on scroll */
  const bar = document.getElementById("scroll-progress");
  const header = document.querySelector(".site-header");
  let scrollTicking = false;
  function onScroll() {
    scrollTicking = false;
    if (bar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    }
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", () => {
    if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* 2. Pointer spotlight that follows the cursor on service cards */
  if (finePointer && !reduced) {
    document.querySelectorAll(".service-card, .carrier-item").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const bounds = card.getBoundingClientRect();
        card.style.setProperty("--mx", (event.clientX - bounds.left) + "px");
        card.style.setProperty("--my", (event.clientY - bounds.top) + "px");
      });
    });
  }

  /* 3. Subtle click ripple on buttons */
  if (!reduced) {
    document.addEventListener("click", (event) => {
      const button = event.target.closest(".button");
      if (!button) return;
      const bounds = button.getBoundingClientRect();
      const size = Math.max(bounds.width, bounds.height) * 1.15;
      const ripple = document.createElement("span");
      ripple.style.cssText = "position:absolute;left:" + (event.clientX - bounds.left - size / 2) +
        "px;top:" + (event.clientY - bounds.top - size / 2) + "px;width:" + size + "px;height:" + size +
        "px;border-radius:50%;background:rgb(255 255 255/.35);transform:scale(0);pointer-events:none;z-index:2";
      button.append(ripple);
      ripple.animate(
        [{ transform: "scale(0)", opacity: 0.7 }, { transform: "scale(1)", opacity: 0 }],
        { duration: 650, easing: "ease-out" }
      ).onfinish = () => ripple.remove();
    });
  }

  /* 4. Hero copy rises in with a stagger once the page loads */
  if (!reduced) {
    const style = document.createElement("style");
    style.textContent = "@keyframes hero-rise{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}";
    document.head.append(style);
    document.querySelectorAll(".hero-copy > *").forEach((element, index) => {
      element.style.animation = "hero-rise .9s cubic-bezier(.22,.8,.28,1) " + (0.15 + index * 0.12) + "s both";
    });
  }

  /* Truck exchange links use the existing site navigation and footer. */
  const tradeMenu = [...document.querySelectorAll(".nav-mega")].find((item) => item.querySelector("summary")?.textContent.trim() === "Trade lanes");
  const tradeLinks = tradeMenu?.querySelector(".mega-panel > div");
  if (tradeLinks && !tradeLinks.querySelector('a[href="marketplace.html"]')) {
    const link = document.createElement("a");
    link.href = "marketplace.html";
    link.textContent = "Truck exchange";
    tradeLinks.append(link);
  }
  const footerTools = [...document.querySelectorAll(".footer-column")].find((item) => item.querySelector("h2")?.textContent.trim() === "Tools");
  if (footerTools && !footerTools.querySelector('a[href="marketplace.html"]')) {
    const link = document.createElement("a");
    link.href = "marketplace.html";
    link.textContent = "Truck exchange";
    footerTools.append(link);
  }

  const privacyCopy = document.querySelector(".privacy-layout > div:last-child");
  if (privacyCopy && !privacyCopy.querySelector("[data-marketplace-privacy]")) {
    const note = document.createElement("p");
    note.dataset.marketplacePrivacy = "";
    note.append("Truck Exchange listings are visible to signed-in members. Contact details and messages in an inquiry are visible only to the sender and listing owner. Supabase hosts account and exchange data; see ");
    const policy = document.createElement("a");
    policy.href = "https://supabase.com/privacy";
    policy.target = "_blank";
    policy.rel = "noopener noreferrer";
    policy.textContent = "Supabase's privacy policy";
    note.append(policy, ". Do not share identity documents, payment-card details, or passwords in an inquiry.");
    privacyCopy.append(note);
  }

  /* Accessible, dependency-free share controls adapted from the supplied menu. */
  const share = document.createElement("div");
  share.className = "share-widget";
  share.innerHTML = '<button class="share-toggle" type="button" aria-expanded="false" aria-controls="share-menu" aria-label="Share this website" title="Share this website"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.6 6.6-4.2m-6.6 7 6.6 4.2"/></svg></button><div class="share-menu" id="share-menu" hidden><strong>Share Blues Company</strong><button type="button" data-native-share>Share link</button><a data-share-whatsapp target="_blank" rel="noopener noreferrer">WhatsApp</a><a data-share-email>Email</a><button type="button" data-copy-link>Copy website link</button><span class="share-feedback" role="status" aria-live="polite"></span></div>';
  document.body.append(share);

  const shareToggle = share.querySelector(".share-toggle");
  const shareMenu = share.querySelector(".share-menu");
  const shareUrl = document.querySelector('link[rel="canonical"]')?.href || location.href;
  const shareTitle = document.title;
  const shareText = "Blues Company freight forwarding from Dar es Salaam";
  share.querySelector("[data-share-whatsapp]").href = "https://wa.me/?text=" + encodeURIComponent(shareText + " " + shareUrl);
  share.querySelector("[data-share-email]").href = "mailto:?subject=" + encodeURIComponent(shareTitle) + "&body=" + encodeURIComponent(shareText + " " + shareUrl);

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      const input = document.createElement("textarea");
      input.value = shareUrl;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    share.querySelector(".share-feedback").textContent = "Website link copied.";
  }

  shareToggle.addEventListener("click", () => {
    const open = shareToggle.getAttribute("aria-expanded") !== "true";
    shareToggle.setAttribute("aria-expanded", String(open));
    shareMenu.hidden = !open;
    if (open) share.querySelector("[data-native-share]").focus();
  });
  share.querySelector("[data-copy-link]").addEventListener("click", copyShareLink);
  share.querySelector("[data-native-share]").addEventListener("click", async () => {
    if (navigator.share) {
      try { await navigator.share({ title: shareTitle, text: shareText, url: shareUrl }); }
      catch (error) { if (error.name !== "AbortError") share.querySelector(".share-feedback").textContent = "Sharing is unavailable here."; }
    } else {
      await copyShareLink();
    }
  });
  document.addEventListener("click", (event) => {
    if (share.contains(event.target)) return;
    shareMenu.hidden = true;
    shareToggle.setAttribute("aria-expanded", "false");
  });
  share.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      shareMenu.hidden = true;
      shareToggle.setAttribute("aria-expanded", "false");
      shareToggle.focus();
    }
  });
})();
