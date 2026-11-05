(function () {
  "use strict";

  try {
    if (sessionStorage.getItem("blues_storage_notice") === "dismissed") return;
  } catch (error) {
    // Continue without persistence when browser storage is unavailable.
  }

  var notice = document.createElement("aside");
  notice.className = "storage-notice";
  notice.setAttribute("role", "region");
  notice.setAttribute("aria-label", "Cookie and browser storage notice");

  var message = document.createElement("p");
  message.append("Essential storage only: this site uses browser storage for sign-in and your display preference. No analytics or advertising cookies are active. ");

  var policy = document.createElement("a");
  policy.href = "/policies.html#cookies";
  policy.textContent = "Cookie details";
  message.append(policy);

  var dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.textContent = "Dismiss";
  dismiss.addEventListener("click", function () {
    try { sessionStorage.setItem("blues_storage_notice", "dismissed"); } catch (error) {}
    notice.remove();
  });

  notice.append(message, dismiss);
  document.body.append(notice);
}());
