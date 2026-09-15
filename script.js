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
  const gCanvas = document.createElement("canvas");
  gCanvas.id = "galaxyfield";
  gCanvas.setAttribute("aria-hidden", "true");
  document.body.prepend(gCanvas);
  const gctx = gCanvas.getContext("2d");
  const tints = ["255,255,255", "255,255,255", "255,255,255", "205,218,255", "255,232,205"];
  let stars = [], w = 0, h = 0, dpr = 1, raf = 0, last = 0, gPlace = null;

  const galaxyImg = new Image();
  galaxyImg.src = "assets/galaxy-ngc4414.webp";
  galaxyImg.onload = () => paintGalaxy();

  function place() {
    const shot = document.querySelector(".headshot");
    let spot;
    if (shot) {
      let x = 0, y = 0;
      for (let n = shot; n; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
      spot = { x: x + shot.offsetWidth / 2, y: y + shot.offsetHeight / 2, d: Math.min(1100, shot.offsetWidth * 1.2) };
    } else {
      spot = w < 700
        ? { x: w * 0.5, y: h * 0.4, d: w * 0.8 }
        : { x: w * 0.74, y: h * 0.48, d: Math.min(1100, Math.max(w, h) * 0.45) };
    }
    gPlace = spot;
    paintGalaxy();
  }

  function paintGalaxy() {
    gctx.clearRect(0, 0, w, h);
    if (!gPlace || !galaxyImg.complete || !galaxyImg.naturalWidth) return;
    const g = gPlace;
    const gw = g.d * 0.9, gh = gw * galaxyImg.naturalHeight / galaxyImg.naturalWidth; // smaller and more distant (Owen, 2026-09-15; was 1.6)
    gctx.save();
    gctx.globalAlpha = w < 860 ? 0.35 : 0.62; // faint so it reads as far away; dimmer on phones, where it sits behind the intro text
    gctx.filter = "blur(0.6px)"; // a touch soft, like something distant (browsers without canvas filters just skip it)
    gctx.translate(g.x, g.y);
    gctx.rotate(-1.05); // turns the galaxy's long axis toward vertical so it tucks behind the portrait-shaped headshot
    gctx.drawImage(galaxyImg, -gw / 2, -gh / 2, gw, gh);
    gctx.restore();
  }

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    for (const [cv, cx] of [[canvas, ctx], [gCanvas, gctx]]) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    place();
    const count = Math.min(700, Math.round((w * h) / 3000)); // denser field (Owen, 2026-09-15): was 1 star per 6,500 px², capped at 320
    stars = Array.from({ length: count }, () => {
      const bright = Math.random() < 0.08;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: bright ? 0.9 + Math.random() * 0.7 : 0.35 + Math.random() * 0.55,
        base: 0.2 + Math.random() * 0.35,
        amp: 0.3 + Math.random() * 0.3,
        speed: 1 + Math.random() * 2.2, // roughly a 2 to 6 second pulse
        phase: Math.random() * Math.PI * 2,
        tint: tints[Math.floor(Math.random() * tints.length)],
      };
    });
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const a = Math.min(1, Math.max(0.02, s.base + s.amp * Math.sin((t / 1000) * s.speed + s.phase)));
      ctx.fillStyle = `rgba(${s.tint},${a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 0.9) { // soft glow around the brighter stars
        ctx.fillStyle = `rgba(${s.tint},${a * 0.12})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
        if (a > 0.8) { // a brief four-point sparkle as a bright star peaks
          const len = s.r * 7 * (a - 0.8) / 0.2;
          ctx.strokeStyle = `rgba(${s.tint},${(a - 0.8) * 2.5})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(s.x - len, s.y); ctx.lineTo(s.x + len, s.y);
          ctx.moveTo(s.x, s.y - len); ctx.lineTo(s.x, s.y + len);
          ctx.stroke();
        }
      }
    }
  }

  function loop(t) {
    if (t - last > 33) { draw(t); last = t; }
    raf = requestAnimationFrame(loop);
  }

  build();
  raf = requestAnimationFrame(loop);
  const replace = () => place();
  window.addEventListener("load", replace);
  if (document.fonts) document.fonts.ready.then(replace);

  let timer;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (window.innerWidth === w && window.innerHeight <= h) return;
      build();
    }, 150);
  });
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(loop);
  });
})();

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.querySelectorAll("video[autoplay]").forEach((v) => { v.removeAttribute("autoplay"); v.pause(); });
}
