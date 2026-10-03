/* =========================================================
   START PARTNER — interactions
   ========================================================= */
(function () {
  "use strict";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav state on scroll + progress bar ---------- */
  const nav = $("#nav");
  const progressBar = $("#progressBar");
  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("scrolled", y > 24);
    if (progressBar) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $("#burger");
  const mobileMenu = $("#mobileMenu");
  function closeMenu() {
    if (!burger || !mobileMenu) return;
    burger.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("open");
    mobileMenu.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  if (burger && mobileMenu) {
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      if (open) { closeMenu(); return; }
      burger.setAttribute("aria-expanded", "true");
      mobileMenu.classList.add("open");
      mobileMenu.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    });
    $$("a", mobileMenu).forEach((a) => a.addEventListener("click", closeMenu));
  }

  /* ---------- Reveal on scroll (staggered) ---------- */
  const reveals = $$("[data-reveal]");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          // stagger siblings sharing a parent
          const siblings = Array.from(el.parentElement.querySelectorAll(":scope > [data-reveal]"));
          const idx = Math.max(0, siblings.indexOf(el));
          el.style.transitionDelay = Math.min(idx * 80, 400) + "ms";
          el.classList.add("in");
          io.unobserve(el);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- Animated counters ---------- */
  const formatNum = (n) => Math.round(n).toLocaleString("ru-RU");
  function animateCount(el) {
    const target = parseFloat(el.getAttribute("data-count")) || 0;
    const suffix = el.getAttribute("data-suffix") || "";
    if (prefersReduced) { el.textContent = formatNum(target) + suffix; return; }
    const dur = 1500;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = formatNum(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const counters = $$("[data-count]");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((c) => cio.observe(c));
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- FAQ accordion (smooth, single-open) ---------- */
  const accs = $$(".acc");
  accs.forEach((acc) => {
    const content = $(".acc__content", acc);
    const summary = $("summary", acc);
    summary.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = acc.hasAttribute("open");
      // close others
      accs.forEach((other) => {
        if (other !== acc && other.hasAttribute("open")) {
          const oc = $(".acc__content", other);
          oc.style.maxHeight = null;
          other.removeAttribute("open");
        }
      });
      if (isOpen) {
        content.style.maxHeight = null;
        acc.removeAttribute("open");
      } else {
        acc.setAttribute("open", "");
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });
  window.addEventListener("resize", () => {
    accs.forEach((acc) => {
      if (acc.hasAttribute("open")) {
        const c = $(".acc__content", acc);
        c.style.maxHeight = c.scrollHeight + "px";
      }
    });
  });

  /* ---------- Calculator ---------- */
  const PAY_PER_COURIER = 40000;
  const couriers = $("#couriers");
  const orders = $("#orders");
  const couriersOut = $("#couriersOut");
  const ordersOut = $("#ordersOut");
  const calcSum = $("#calcSum");
  const calcCouriers = $("#calcCouriers");
  const calcOrders = $("#calcOrders");

  function paintRange(input) {
    const min = +input.min, max = +input.max, val = +input.value;
    const pct = ((val - min) / (max - min)) * 100;
    input.style.background =
      `linear-gradient(90deg, var(--lime) 0%, var(--lime) ${pct}%, rgba(244,243,236,.15) ${pct}%, rgba(244,243,236,.15) 100%)`;
  }

  let sumRAF = null;
  function animateSum(to) {
    if (prefersReduced) { calcSum.textContent = formatNum(to) + " ₽"; return; }
    const fromText = (calcSum.textContent || "0").replace(/[^\d]/g, "");
    const from = parseFloat(fromText) || 0;
    const dur = 600, start = performance.now();
    if (sumRAF) cancelAnimationFrame(sumRAF);
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      calcSum.textContent = formatNum(from + (to - from) * eased) + " ₽";
      if (p < 1) sumRAF = requestAnimationFrame(tick);
    }
    sumRAF = requestAnimationFrame(tick);
  }

  function updateCalc() {
    if (!couriers || !orders) return;
    const c = +couriers.value;
    const o = +orders.value;
    couriersOut.textContent = c;
    ordersOut.textContent = o;
    calcCouriers.textContent = c;
    calcOrders.textContent = o;
    animateSum(c * PAY_PER_COURIER);
    paintRange(couriers);
    paintRange(orders);
  }
  if (couriers && orders) {
    couriers.addEventListener("input", updateCalc);
    orders.addEventListener("input", updateCalc);
    // init
    paintRange(couriers);
    paintRange(orders);
    calcSum.textContent = formatNum((+couriers.value) * PAY_PER_COURIER) + " ₽";
  }

  /* ---------- Magnetic buttons ---------- */
  if (!prefersReduced && window.matchMedia("(hover:hover)").matches) {
    $$(".magnetic").forEach((btn) => {
      const strength = 18;
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * strength;
        const y = ((e.clientY - r.top) / r.height - 0.5) * strength;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });

    /* ---------- Card tilt ---------- */
    const tilt = $("#tiltCard");
    if (tilt) {
      const wrap = tilt.parentElement;
      wrap.addEventListener("mousemove", (e) => {
        const r = tilt.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -10;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 10;
        tilt.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      wrap.addEventListener("mouseleave", () => { tilt.style.transform = ""; });
    }

    /* ---------- Card spotlight ---------- */
    $$(".card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });

    /* ---------- Cursor glow ---------- */
    const glow = $("#cursorGlow");
    if (glow) {
      let gx = window.innerWidth / 2, gy = window.innerHeight / 2, cx = gx, cy = gy;
      window.addEventListener("mousemove", (e) => { gx = e.clientX; gy = e.clientY; });
      (function loop() {
        cx += (gx - cx) * 0.12;
        cy += (gy - cy) * 0.12;
        glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
        requestAnimationFrame(loop);
      })();
    }
  }

  /* ---------- Smooth anchor scroll with nav offset ---------- */
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
    });
  });
})();
