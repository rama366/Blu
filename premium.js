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
})();
