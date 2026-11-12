/* Billie Global BR — extras: Google Publisher (SWG), links legais e anúncios discretos */
(function () {
  if (window.__bgExtras) return; window.__bgExtras = true;

  /* ===== CONFIGURAÇÃO (edite só aqui) ===== */
  var ADS_CLIENT = "";      // Ex.: "ca-pub-1234567890123456" (ID do AdSense). Vazio = anúncios desligados
  var SLOT_TOPO  = "";      // ID do bloco de anúncio do topo (AdSense)
  var SLOT_BASE  = "";      // ID do bloco de anúncio da base (AdSense)
  /* ======================================== */

  var path = location.pathname;
  var lang = /^\/en(\/|$)/.test(path) ? "en" : /^\/es(\/|$)/.test(path) ? "es" : "pt";
  var T = {
    pt: { legal: "Legal", terms: "Termos de Serviço", priv: "Política de Privacidade", ad: "Publicidade" },
    en: { legal: "Legal", terms: "Terms of Service", priv: "Privacy Policy", ad: "Advertisement" },
    es: { legal: "Legal", terms: "Términos de Servicio", priv: "Política de Privacidad", ad: "Publicidad" }
  }[lang];
  var isLegal = /^\/(termos|privacidade)(\/|$)/.test(path);

  /* 1) Google Subscribe with Google (Publisher Center) */
  var s = document.createElement("script");
  s.async = true; s.type = "application/javascript";
  s.src = "https://news.google.com/swg/js/v1/swg-basic.js";
  document.head.appendChild(s);
  (self.SWG_BASIC = self.SWG_BASIC || []).push(function (b) {
    b.init({
      type: "NewsArticle",
      isPartOfType: ["Product"],
      isPartOfProductId: "CAownZniCw:openaccess",
      clientOptions: { theme: "light", lang: "pt-BR" }
    });
  });

  /* 2) Estilos */
  var st = document.createElement("style");
  st.textContent =
    ".bg-ad{max-width:1120px;margin:14px auto;padding:0 16px;text-align:center;font:11px/1.2 -apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#8a8a92;clear:both}" +
    ".bg-ad small{display:block;margin-bottom:4px;letter-spacing:.08em;text-transform:uppercase;font-size:10px}" +
    ".bg-ad ins{display:block;min-height:50px;max-height:120px;overflow:hidden}" +
    ".bg-legal{display:flex;flex-wrap:wrap;gap:6px 18px;max-width:1120px;margin:22px auto 0;padding-top:16px;border-top:1px solid rgba(128,128,128,.25);font:13px/1.6 -apple-system,'Segoe UI',Roboto,Arial,sans-serif}" +
    ".bg-legal a{color:inherit;opacity:.8;text-decoration:none}.bg-legal a:hover{opacity:1;text-decoration:underline}";
  document.head.appendChild(st);

  /* 3) Links legais no rodapé */
  function addLinks() {
    var f = document.querySelector("footer");
    if (!f || f.querySelector(".bg-legal")) return;
    var d = document.createElement("div");
    d.className = "bg-legal";
    d.innerHTML = '<a href="/termos/">' + T.terms + '</a><a href="/privacidade/">' + T.priv + '</a>';
    (f.querySelector(".fw") || f).appendChild(d);
  }

  /* 4) Anúncios discretos (topo e base) — só se ADS_CLIENT estiver preenchido */
  function slot(id) {
    var w = document.createElement("div");
    w.className = "bg-ad"; w.setAttribute("aria-label", T.ad);
    w.innerHTML = "<small>" + T.ad + '</small><ins class="adsbygoogle" style="display:block" data-ad-client="' + ADS_CLIENT +
      '" data-ad-slot="' + id + '" data-ad-format="horizontal" data-full-width-responsive="false"></ins>';
    return w;
  }
  function addAds() {
    if (!ADS_CLIENT || isLegal) return;
    var main = document.getElementById("v") || document.querySelector("main");
    var foot = document.querySelector("footer");
    if (!main || document.querySelector(".bg-ad")) return;
    var as = document.createElement("script");
    as.async = true; as.crossOrigin = "anonymous";
    as.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ADS_CLIENT;
    document.head.appendChild(as);
    main.parentNode.insertBefore(slot(SLOT_TOPO), main);
    if (foot) foot.parentNode.insertBefore(slot(SLOT_BASE), foot);
    [].forEach.call(document.querySelectorAll(".bg-ad ins"), function () {
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    });
  }

  function run() { addLinks(); addAds(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
