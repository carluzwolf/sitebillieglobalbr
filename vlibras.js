/* VLibras - tradutor de Libras do Governo Federal (https://vlibras.gov.br) */
(function () {
  if (window.__vlibrasLoaded) return;
  window.__vlibrasLoaded = true;
  function init() {
    var w = document.createElement("div");
    w.setAttribute("vw", "");
    w.className = "enabled";
    w.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
    document.body.appendChild(w);
    var s = document.createElement("script");
    s.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    s.onload = function () { new window.VLibras.Widget("https://vlibras.gov.br/app"); };
    document.body.appendChild(s);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
