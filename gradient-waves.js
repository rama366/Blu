(function () {
  "use strict";

  var canvas = document.querySelector("[data-gradient-waves]");
  if (!canvas) return;

  var context = canvas.getContext("2d", { alpha: false });
  if (!context) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var color = parseColor(canvas.dataset.waveColor || "#b28e4c");
  var options = {
    amplitude: clamp(Number(canvas.dataset.amplitude) || 0.11, 0.02, 0.3),
    swell: clamp(Number(canvas.dataset.swell) || 0.045, 0, 0.16),
    lightAngle: Number(canvas.dataset.lightAngle) || 32,
    speed: clamp(Number(canvas.dataset.speed) || 0.00028, 0.00002, 0.002)
  };
  var width = 1;
  var height = 1;
  var pixelRatio = 1;
  var frame = 0;
  var visible = true;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function parseColor(value) {
    var match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(value);
    return match ? match.slice(1).map(function (part) { return parseInt(part, 16); }) : [178, 142, 76];
  }

  function rgba(alpha) {
    return "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + alpha + ")";
  }

  function resize() {
    var bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    draw(0);
  }

  function waveY(position, layer, time) {
    var phase = position * Math.PI * 2;
    var primary = Math.sin(phase * (1.05 + layer * 0.24) + time * options.speed + layer * 1.1);
    var secondary = Math.sin(phase * 0.58 - time * options.speed * 0.72 + layer * 0.8);
    var base = height * (0.29 + layer * 0.13);
    return base + primary * height * options.amplitude * (0.5 + layer * 0.13) + secondary * height * options.swell;
  }

  function draw(time) {
    var radians = options.lightAngle * Math.PI / 180;
    var dx = Math.cos(radians) * width * 0.7;
    var dy = Math.sin(radians) * height * 0.7;
    var background = context.createLinearGradient(width / 2 - dx, height / 2 - dy, width / 2 + dx, height / 2 + dy);
    background.addColorStop(0, "#173a53");
    background.addColorStop(0.52, "#0d263b");
    background.addColorStop(1, "#081827");
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    var step = Math.max(5, width / 220);
    for (var layer = 0; layer < 3; layer += 1) {
      context.beginPath();
      context.moveTo(0, height);
      context.lineTo(0, waveY(0, layer, time));
      for (var x = step; x < width; x += step) {
        context.lineTo(x, waveY(x / width, layer, time));
      }
      context.lineTo(width, height);
      context.closePath();
      context.fillStyle = rgba(0.06 + layer * 0.035);
      context.fill();

      context.beginPath();
      for (var point = 0; point <= width; point += step) {
        var y = waveY(point / width, layer, time);
        if (point === 0) context.moveTo(point, y);
        else context.lineTo(point, y);
      }
      context.strokeStyle = rgba(0.22 - layer * 0.04);
      context.lineWidth = layer === 0 ? 1.2 : 0.7;
      context.stroke();
    }
  }

  function animate(time) {
    if (!visible || document.hidden) return;
    draw(time);
    frame = window.requestAnimationFrame(animate);
  }

  function updateVisibility(isVisible) {
    visible = isVisible;
    window.cancelAnimationFrame(frame);
    if (!reducedMotion && visible && !document.hidden) frame = window.requestAnimationFrame(animate);
  }

  resize();
  if (!reducedMotion) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        updateVisibility(entries[0].isIntersecting);
      }).observe(canvas);
    } else {
      updateVisibility(true);
    }
  }
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", function () { updateVisibility(visible); });
}());
