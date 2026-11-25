// =====================================================================
// BLACK FRIDAY · Sección Combos (vista previa)
// ---------------------------------------------------------------------
// Script de vista previa usado para diseñar la portada de Black Friday
// en vivo sobre rapaimports.com (navegador integrado / consola).
// NO está conectado a producción. La versión real vive en script.js de la
// rama black-friday (módulo "BLACK FRIDAY" al final del archivo).
//
// Qué hace en la home:
//  - Oculta la sección "El cambio está en tus manos" (antes/después).
//  - Sube la sección de banners promocionales al primer lugar.
//  - Título BLACK FRIDAY + countdown hasta las 23:59:59 (hora AR).
//  - 3 bloques: 25% OFF transferencia · Envío GRATIS · Hasta 6 cuotas.
//  - Carrusel mobile sin flechas: "Deslizá para ver más combos" + puntos.
//  - Etiqueta "Black Friday" y brillo animado sobre cada banner.
//
// Uso: pegar el contenido en la consola del navegador estando en la home.
// Una vez aprobado, pasar el CSS a style.css y la lógica a script.js.
// =====================================================================

(async function(){
  // Espera a que script.js arme el carrusel
  for (var i = 0; i < 40 && !document.querySelector('.banners-carousel-wrapper'); i++) await new Promise(r => setTimeout(r, 150));
  var home = document.querySelector('.js-home-sections-container');
  var combos = home.querySelector('[data-store="home-banner-promotional"]');
  var ba = home.querySelector('[data-store="home-before-after"]');
  document.querySelectorAll('#bf-preview-css,.bf-hero,.bf-ribbon,.bf-perks,.bf-swipe,.bf-dots,.bf-particles,.combos-countdown').forEach(e => e.remove());
  if (window.__bfTimer) clearInterval(window.__bfTimer);
  if (ba) ba.style.display = 'none';
  combos.classList.add('bf-combos');
  home.insertBefore(combos, home.firstElementChild);

  var css = `
.bf-combos{position:relative;background:radial-gradient(120% 70% at 50% 0%,#2a0003 0%,#0b0b0b 55%,#000 100%);padding:0 0 44px;overflow:hidden}
.bf-combos::before,.bf-combos::after{content:"";position:absolute;width:420px;height:420px;border-radius:50%;filter:blur(90px);opacity:.35;pointer-events:none;animation:bf-glow 6s ease-in-out infinite alternate}
.bf-combos::before{background:#e30613;top:-160px;left:-140px}
.bf-combos::after{background:#e30613;bottom:-200px;right:-160px;opacity:.22;animation-delay:-3s}
@keyframes bf-glow{to{transform:translate(40px,30px) scale(1.15)}}
.bf-combos>*{position:relative;z-index:1}
.bf-particles{position:absolute!important;inset:0;z-index:0!important;pointer-events:none;overflow:hidden}
.bf-particles span{position:absolute;bottom:-40px;color:#e30613;font:900 22px Montserrat,sans-serif;opacity:0;animation:bf-float linear infinite}
@keyframes bf-float{0%{transform:translateY(0) rotate(0);opacity:0}15%{opacity:.5}85%{opacity:.25}100%{transform:translateY(-110vh) rotate(25deg);opacity:0}}
.bf-hero{text-align:center;padding:34px 16px 6px;font-family:Montserrat,sans-serif;color:#fff}
.bf-title{margin:14px 0 0;font-weight:900;font-size:clamp(44px,9vw,104px);line-height:.9;letter-spacing:-.02em;text-transform:uppercase;color:#fff}
.bf-title .bf-outline{color:transparent;-webkit-text-stroke:2px #fff}
.bf-title .bf-red{color:#e30613;display:block;text-shadow:0 0 28px rgba(227,6,19,.55);animation:bf-flicker 4s infinite}
@keyframes bf-flicker{0%,92%,100%{opacity:1}93%{opacity:.55}94%{opacity:1}96%{opacity:.7}97%{opacity:1}}

.bf-combos .banners-carousel-title{display:none!important}
.bf-combos{scroll-margin-top:var(--bf-header,160px)}
.bf-hero{padding-bottom:22px}
.bf-title .bf-red{display:inline;margin-left:.18em}
@media(max-width:767px){.bf-title .bf-red{display:block;margin-left:0}}
.combos-countdown{display:flex;flex-direction:column;align-items:center;gap:8px;margin:-6px auto 18px;font-family:Montserrat,sans-serif;text-align:center}
.combos-countdown-label{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#fff}
.combos-countdown-clock{display:inline-flex;align-items:flex-start;gap:6px}
.combos-countdown-unit{display:flex;flex-direction:column;align-items:center;min-width:58px;padding:8px 6px 6px;background:#fff;color:#000;border-bottom:3px solid #e30613;border-radius:6px;box-shadow:0 6px 24px rgba(227,6,19,.35)}
.combos-countdown-unit b{font-size:26px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums}
.combos-countdown-unit small{margin-top:4px;font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#777}
.combos-countdown-unit.is-sec b{display:inline-block;animation:bf-tick 1s ease-out infinite}
@keyframes bf-tick{0%{transform:scale(1.18);color:#e30613}40%{transform:scale(1);color:#000}}
.combos-countdown-sep{padding-top:8px;font-size:24px;font-weight:800;line-height:1;color:#e30613;animation:bf-blink 1s steps(1) infinite}
@keyframes bf-blink{50%{opacity:.25}}

.bf-combos .banners-carousel-arrow{display:none!important}
.bf-combos .textbanner{position:relative;outline:2px solid rgba(227,6,19,.7);outline-offset:-2px;overflow:hidden}
.bf-combos .textbanner::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;z-index:2;pointer-events:none;background:linear-gradient(100deg,transparent,rgba(255,255,255,.28),transparent);transform:skewX(-18deg);animation:bf-shine 4.5s ease-in-out infinite}
.bf-combos .js-promotional-banner-container-1 .textbanner::after{animation-delay:1.5s}
.bf-combos .js-promotional-banner-container-3 .textbanner::after{animation-delay:3s}
@keyframes bf-shine{0%,60%{left:-60%}100%{left:130%}}
.bf-ribbon{position:absolute;bottom:16px;left:0;z-index:3;background:#e30613;color:#fff;font:900 11px/1 Montserrat,sans-serif;letter-spacing:.12em;text-transform:uppercase;padding:7px 11px;box-shadow:0 4px 12px rgba(0,0,0,.4);border-radius:0 4px 4px 0}

.bf-swipe,.bf-dots{display:none}
@media(max-width:767px){
  .bf-title .bf-outline{-webkit-text-stroke:1.5px #fff}
  .bf-swipe{display:flex;align-items:center;justify-content:center;gap:10px;margin:16px 0 0;color:#fff;font:700 12px Montserrat,sans-serif;letter-spacing:.14em;text-transform:uppercase}
  .bf-swipe-hand{display:inline-flex;animation:bf-hand 1.6s ease-in-out infinite}
  .bf-swipe-hand svg{width:22px;height:22px;fill:#fff}
  .bf-swipe-chev{display:inline-flex;gap:2px}
  .bf-swipe-chev i{width:7px;height:7px;border-right:2px solid #e30613;border-top:2px solid #e30613;transform:rotate(45deg);animation:bf-chev 1.2s infinite}
  .bf-swipe-chev i:nth-child(2){animation-delay:.15s}.bf-swipe-chev i:nth-child(3){animation-delay:.3s}
  @keyframes bf-hand{0%,100%{transform:translateX(8px)}50%{transform:translateX(-10px)}}
  @keyframes bf-chev{0%,100%{opacity:.2}50%{opacity:1}}
  .bf-dots{display:flex;justify-content:center;gap:8px;margin-top:12px}
  .bf-dots i{width:8px;height:8px;border-radius:999px;background:rgba(255,255,255,.3);transition:all .3s}
  .bf-dots i.on{width:26px;background:#e30613}
  .bf-combos .banners-carousel-wrapper>.row>.js-promotional-banner-container:not(.banner-clone){animation:bf-peek 1.4s ease-in-out .8s 2}
  @keyframes bf-peek{0%,100%{transform:translateX(0)}45%{transform:translateX(-38px)}}
}

@media(min-width:768px){.combos-countdown-unit{min-width:70px}.combos-countdown-unit b{font-size:32px}}
@media(max-width:767px){.bf-title{font-size:64px}}
.bf-title{margin-top:0}
.bf-title .bf-outline{color:#fff;-webkit-text-stroke:0}
.bf-combos{background:radial-gradient(120% 70% at 50% 0%,#1a0507 0%,#0b0b0b 55%,#000 100%)}
.bf-combos::before{opacity:.11}
.bf-combos::after{opacity:.07}
.bf-title .bf-red{text-shadow:0 0 10px rgba(227,6,19,.15);animation:bf-flicker2 2.2s infinite}
@keyframes bf-flicker2{0%,38%,44%,100%{opacity:1}40%{opacity:.5}42%{opacity:.85}78%{opacity:1}80%{opacity:.6}82%{opacity:1}}
.combos-countdown-unit{box-shadow:0 4px 14px rgba(0,0,0,.45)}
.bf-hero{padding-top:30px}
@media(min-width:768px){.bf-hero{padding-top:48px}}
.bf-particles span{color:#8a1018}
.bf-perks{display:grid!important;grid-template-columns:repeat(3,1fr);gap:12px;max-width:720px;margin:6px auto 28px;padding:0 16px!important;border:0!important}
.bf-block{display:flex;flex-direction:column;align-items:center;text-align:center;padding:14px 10px 13px;background:rgba(22,22,22,.92);border:1px solid rgba(255,255,255,.1);border-radius:8px;font-family:Montserrat,sans-serif}
.bf-block-k{font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#8c8c8c}
.bf-block-v{margin:6px 0 4px;font-size:24px;font-weight:800;line-height:1;color:#fff;white-space:nowrap}
.bf-block-c{font-size:12px;font-weight:500;color:#b3b3b3}
.bf-green{color:#3bb273}
@media(max-width:767px){
 .bf-perks{gap:6px;margin:4px auto 20px;padding:0 12px!important}
 .bf-block{padding:11px 4px 10px}
 .bf-block-k{font-size:8.5px;letter-spacing:.12em}
 .bf-block-v{font-size:17px;margin:5px 0 3px}
 .bf-block-c{font-size:10px;line-height:1.25}
}
`;
  var st = document.createElement('style'); st.id = 'bf-preview-css'; st.textContent = css; document.head.appendChild(st);

  // Partículas % flotando
  var parts = document.createElement('div'); parts.className = 'bf-particles';
  for (var p = 0; p < 14; p++) {
    var s = document.createElement('span'); s.textContent = p % 3 ? '%' : '★';
    s.style.left = (Math.random() * 100) + '%';
    s.style.fontSize = (14 + Math.random() * 18) + 'px';
    s.style.animationDuration = (9 + Math.random() * 9) + 's';
    s.style.animationDelay = (-Math.random() * 18) + 's';
    parts.appendChild(s);
  }

  // Hero
  var hero = document.createElement('div'); hero.className = 'bf-hero';
  hero.innerHTML = '<h2 class="bf-title"><span class="bf-outline">Black</span><span class="bf-red">Friday</span></h2>';

  combos.insertBefore(hero, combos.firstChild);
  combos.insertBefore(parts, combos.firstChild);

  // Título + countdown
  var titulo = combos.querySelector('.banners-carousel-title');
  titulo.textContent = 'Combos';
  var cd = document.createElement('div'); cd.className = 'combos-countdown'; cd.setAttribute('role', 'timer');
  cd.innerHTML = '<span class="combos-countdown-label">La oferta termina en</span><span class="combos-countdown-clock">' +
    '<span class="combos-countdown-unit"><b data-cd="h">00</b><small>horas</small></span><span class="combos-countdown-sep">:</span>' +
    '<span class="combos-countdown-unit"><b data-cd="m">00</b><small>min</small></span><span class="combos-countdown-sep">:</span>' +
    '<span class="combos-countdown-unit is-sec"><b data-cd="s">00</b><small>seg</small></span></span>';
  titulo.after(cd);
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tick() {
    var nowAr = Date.now() - 3 * 3600000;
    var resto = Math.floor((Math.floor(nowAr / 86400000) * 86400000 + 86400000 - nowAr) / 1000);
    cd.querySelector('[data-cd="h"]').textContent = pad(Math.floor(resto / 3600));
    cd.querySelector('[data-cd="m"]').textContent = pad(Math.floor(resto % 3600 / 60));
    cd.querySelector('[data-cd="s"]').textContent = pad(resto % 60);
  }
  tick(); window.__bfTimer = setInterval(tick, 1000);

  // Beneficios
  var perks = document.createElement('div'); perks.className = 'bf-perks';
  perks.innerHTML =
    '<div class="bf-block"><span class="bf-block-k">Descuento</span><span class="bf-block-v">25% OFF</span><span class="bf-block-c">por transferencia</span></div>' +
    '<div class="bf-block"><span class="bf-block-k">Envío</span><span class="bf-block-v bf-green">GRATIS</span><span class="bf-block-c">a todo el país</span></div>' +
    '<div class="bf-block"><span class="bf-block-k">Cuotas</span><span class="bf-block-v">Hasta 6</span><span class="bf-block-c">con tarjeta</span></div>';
  cd.after(perks);

  // Cintas y swipe
  combos.querySelectorAll('.textbanner').forEach(tb => { var r = document.createElement('span'); r.className = 'bf-ribbon'; r.textContent = 'Black Friday'; tb.appendChild(r); });
  var wrapper = combos.querySelector('.banners-carousel-wrapper');
  var row = wrapper.querySelector('.row');
  var swipe = document.createElement('div'); swipe.className = 'bf-swipe';
  swipe.innerHTML = '<span class="bf-swipe-hand"><svg viewBox="0 0 24 24"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10h.5V8.5a1.5 1.5 0 0 1 3 0V10h.5V9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.2a6 6 0 0 1-4.6-2.2L4 15.6a1.5 1.5 0 0 1 2.2-2L9 16z"/></svg></span>Deslizá para ver más combos<span class="bf-swipe-chev"><i></i><i></i><i></i></span>';
  wrapper.insertBefore(swipe, row);
  var reales = row.querySelectorAll('.js-promotional-banner-container:not(.banner-clone)').length;
  var dots = document.createElement('div'); dots.className = 'bf-dots';
  for (var d = 0; d < reales; d++) dots.appendChild(document.createElement('i'));
  row.after(dots);
  function updDots() {
    var step = row.querySelector('.js-promotional-banner-container').getBoundingClientRect().width || 1;
    var idx = Math.round(row.scrollLeft / step);
    var real = ((idx - 1) % reales + reales) % reales;
    dots.querySelectorAll('i').forEach((el, k) => el.classList.toggle('on', k === real));
  }
  row.addEventListener('scroll', updDots, { passive: true });
  // Arreglo de la vista previa: reposiciona en el primer slide real y carga imágenes de clones
  combos.querySelectorAll('.banner-clone img.lazyloading').forEach(im => { im.classList.remove('lazyloading'); im.classList.add('lazyloaded'); im.style.opacity = 1; });
  var stp = row.querySelector('.js-promotional-banner-container').getBoundingClientRect().width;
  if (getComputedStyle(row).overflowX === 'auto') { row.style.scrollBehavior = 'auto'; row.scrollLeft = stp; }
  updDots();

  window.scrollTo(0, 0);
  return 'Black Friday aplicado';
})()
