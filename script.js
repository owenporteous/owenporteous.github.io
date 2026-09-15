document.documentElement.classList.add("js");

const nav = document.querySelector(".nav");
const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const observer = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); observer.unobserve(e.target); }
  }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

(() => {
  const canvas = document.createElement("canvas");
  canvas.id = "starfield";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tints = ["255,255,255", "255,255,255", "255,255,255", "205,218,255", "255,232,205"];
  let stars = [], w = 0, h = 0, raf = 0, last = 0;

  function build() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(320, Math.round((w * h) / 6500));
    stars = Array.from({ length: count }, () => {
      const bright = Math.random() < 0.08;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: bright ? 0.9 + Math.random() * 0.7 : 0.35 + Math.random() * 0.55,
        base: 0.25 + Math.random() * 0.45,
        amp: 0.15 + Math.random() * 0.35,
        speed: 0.4 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        tint: tints[Math.floor(Math.random() * tints.length)],
      };
    });
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const a = still ? s.base : Math.min(1, Math.max(0.05, s.base + s.amp * Math.sin((t / 1000) * s.speed + s.phase)));
      ctx.fillStyle = `rgba(${s.tint},${a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 0.9) { // soft glow around the brighter stars
        ctx.fillStyle = `rgba(${s.tint},${a * 0.12})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function loop(t) {
    if (t - last > 33) { draw(t); last = t; }
    raf = requestAnimationFrame(loop);
  }

  build();
  if (still) draw(0); else raf = requestAnimationFrame(loop);

  let timer;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (window.innerWidth === w && window.innerHeight <= h) return;
      build();
      if (still) draw(0);
    }, 150);
  });
  document.addEventListener("visibilitychange", () => {
    if (still) return;
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(loop);
  });
})();

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.querySelectorAll("video[autoplay]").forEach((v) => { v.removeAttribute("autoplay"); v.pause(); });
}
