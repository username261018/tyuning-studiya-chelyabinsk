(function () {
  var html = document.documentElement;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var chrome = document.getElementById("chrome");
  var spacer = document.getElementById("spacer");
  var burger = document.querySelector(".burger");
  var menu = document.getElementById("menu");
  var spot = document.getElementById("spot");
  var map = document.getElementById("map");
  var mapBtn = document.getElementById("map-btn");

  function measure() {
    var h = chrome ? chrome.offsetHeight : 0;
    html.style.setProperty("--top-h", h + "px");
    if (spacer) spacer.style.height = h + "px";
  }
  measure();
  if (chrome && "ResizeObserver" in window) new ResizeObserver(measure).observe(chrome);
  window.addEventListener("resize", measure);

  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", open ? "false" : "true");
      burger.setAttribute("aria-label", open ? "Открыть меню" : "Закрыть меню");
      if (open) menu.setAttribute("hidden", "");
      else menu.removeAttribute("hidden");
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Открыть меню");
        menu.setAttribute("hidden", "");
      });
    });
  }

  if (map && mapBtn) {
    mapBtn.addEventListener("click", function () {
      var src = map.getAttribute("data-src");
      if (!src) return;
      var iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.title = "Карта: Тюнинг студия, Челябинск";
      iframe.loading = "lazy";
      iframe.allowFullscreen = true;
      map.innerHTML = "";
      map.appendChild(iframe);
    });
  }

  if (fine && spot) {
    var x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(tickSpot);
    });
    function tickSpot() {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      spot.style.transform = "translate(" + x + "px," + y + "px)";
      if (Math.abs(tx - x) > 0.4 || Math.abs(ty - y) > 0.4) raf = requestAnimationFrame(tickSpot);
      else raf = 0;
    }
  }

  if (fine) {
    document.querySelectorAll(".polaroid, .work-frame").forEach(function (el) {
      var base = el.style.getPropertyValue("--ang") || "3deg";
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        el.style.rotate = "calc(" + base + " + " + (dx * 4) + "deg)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.rotate = "";
      });
    });
  }

  function wrapWords(el) {
    if (el.getAttribute("data-wrapped")) return;
    var text = (el.textContent || "").trim();
    var words = text.split(/\s+/);
    el.textContent = "";
    var step = el.tagName === "H2" ? 60 : 70;
    words.forEach(function (w, i) {
      var o = document.createElement("span");
      o.className = "w";
      var inn = document.createElement("span");
      inn.className = "wi";
      inn.style.setProperty("--d", i * step + "ms");
      inn.textContent = w;
      o.appendChild(inn);
      el.appendChild(o);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    el.setAttribute("data-wrapped", "1");
  }

  document.querySelectorAll("[data-words]").forEach(wrapWords);

  function wide() {
    return window.matchMedia("(min-width: 900px)").matches;
  }

  function updateLane() {
    var sec = document.querySelector("[data-lane]");
    var lane = document.getElementById("gal-lane");
    var bar = document.getElementById("gal-progress");
    if (!sec || !lane || !html.classList.contains("m-on") || !wide()) {
      if (lane) lane.style.transform = "";
      return;
    }
    var pin = sec.querySelector(".gal-pin");
    var viewport = sec.querySelector(".gal-viewport") || lane.parentElement;
    var pinW = pin ? pin.offsetWidth + 32 : 0;
    var viewW = viewport.clientWidth;
    var extra = Math.max(0, lane.scrollWidth - viewW);
    var topH = parseFloat(getComputedStyle(html).getPropertyValue("--top-h")) || 0;
    var r = sec.getBoundingClientRect();
    var start = topH - r.top;
    var travel = Math.max(1, sec.offsetHeight - window.innerHeight);
    var p = Math.max(0, Math.min(1, start / travel));
    lane.style.transform = "translateX(" + (-extra * p) + "px)";
    if (bar) {
      bar.removeAttribute("hidden");
      var i = bar.querySelector("i");
      if (i) i.style.scale = p + " 1";
    }
  }

  function updatePanel() {
    var el = document.querySelector("[data-panel]");
    if (!el || !html.classList.contains("m-on")) return;
    var r = el.getBoundingClientRect();
    var start = window.innerHeight;
    var end = window.innerHeight * 0.4;
    var t = (start - r.top) / (start - end);
    t = Math.max(0, Math.min(1, t));
    el.style.setProperty("--fx", (48 * (1 - t)).toFixed(1) + "px");
  }

  function sweep() {
    var vh = window.innerHeight;
    document.querySelectorAll("[data-rv]").forEach(function (el) {
      if (el.getAttribute("data-h") != null && !el.classList.contains("in")) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh) el.classList.add("in");
    });
  }

  function onCurtainEnd(e) {
    if (e.propertyName !== "clip-path") return;
    var el = e.currentTarget;
    el.style.clipPath = "none";
    var img = el.querySelector("img");
    if (img) img.style.scale = "none";
  }
  document.querySelectorAll("[data-curtain]").forEach(function (el) {
    el.addEventListener("transitionend", onCurtainEnd);
  });

  function onScroll() {
    sweep();
    updateLane();
    updatePanel();
    if (window.DEMO && window.DEMO.reviewsLane) window.DEMO.reviewsLane();
  }

  if (html.classList.contains("m-on") && !reduce) {
    html.classList.add("m-ready");
    var io = "IntersectionObserver" in window
      ? new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              var el = en.target;
              if (el.getAttribute("data-h") != null) return;
              el.classList.add("in");
            }
          });
        }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" })
      : null;
    document.querySelectorAll("[data-rv]").forEach(function (el) {
      if (io && el.getAttribute("data-h") == null) io.observe(el);
    });

    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(function () {
        document.querySelectorAll('[data-h="0"]').forEach(function (el) { el.classList.add("in"); });
      }, 300);
      setTimeout(function () {
        document.querySelectorAll('[data-h="photo"]').forEach(function (el) { el.classList.add("in"); });
      }, 500);
      setTimeout(function () {
        document.querySelectorAll('[data-h="cap"]').forEach(function (el) { el.classList.add("in"); });
      }, 800);
    });
    if (document.readyState !== "loading") {
      document.dispatchEvent(new Event("DOMContentLoaded"));
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("hashchange", sweep);
    window.addEventListener("beforeprint", function () {
      document.querySelectorAll("[data-rv]").forEach(function (el) { el.classList.add("in"); });
    });
    sweep();
    updateLane();
    updatePanel();
  } else {
    html.classList.remove("m-on");
  }
})();
