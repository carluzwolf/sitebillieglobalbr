(function(){var H=window.TVH,esc=H.esc,fmt=H.fmt,$=H.$;
/* ===== Assistir na TV (pareamento por c\u00f3digo via Firebase) ===== */
var FBC={apiKey:"AIzaSyBRnitmkaXTvn46Nvb7Xsd2Cf-4h4hh-24",authDomain:"siteoficial-e0823.firebaseapp.com",databaseURL:"https://siteoficial-e0823-default-rtdb.firebaseio.com",projectId:"siteoficial-e0823"},fdb=null;
function js(u,cb,er){var s=document.createElement("script");s.src=u;s.onload=cb;s.onerror=er;document.head.appendChild(s)}
function fbLoad(cb,er){if(fdb)return cb();function init(){try{var a;try{a=firebase.app("tvc")}catch(e){a=firebase.initializeApp(FBC,"tvc")}fdb=a.database();cb()}catch(e){er()}}
if(window.firebase&&firebase.database)return init();
js("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",function(){js("https://www.gstatic.com/firebasejs/10.14.1/firebase-database-compat.js",init,er)},er)}
var cs=document.createElement("style");cs.textContent=".tvm{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.75);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px}.tvm>div{width:min(420px,100%);background:#111114;border:1px solid #2a2a30;border-radius:24px;padding:22px;text-align:center;color:#fff}.tvm h3{margin:0 0 8px;font:900 20px system-ui}.tvm p{margin:6px 0;color:#c9c9d0;font:14px/1.5 system-ui}.tvcode{font:900 46px system-ui;letter-spacing:.2em;margin:14px 0;color:#ff4d5a}.tvm input[type=range]{width:100%}.tvm .rw{display:flex;gap:10px;justify-content:center;margin:14px 0}.tvm .rw .tvb{padding:12px 18px}";try{document.head.appendChild(cs)}catch(e){}
function cast(x){var box=$("tvpl");if(box&&box._pause)box._pause();var m=document.createElement("div");m.className="tvm";document.body.appendChild(m);
function close(){clearInterval(tt);m.remove()}var tt=0;
m.innerHTML='<div><h3>Conectando\u2026</h3></div>';
fbLoad(function(){var code=String(Math.floor(100000+Math.random()*900000)),ref=fdb.ref("tvpair/"+code),n=0,conn=false,seeking=false;
ref.set({t:Date.now(),c:{n:0,a:"wait"}});
function send(a,v,it){n++;var o={n:n,a:a,v:v||0};if(it)o.item=it;ref.child("c").set(o)}
function end(){ref.off();ref.remove();if(m._fb)m._fb.remove();close()}
m.innerHTML='<div><h3>Assistir na TV</h3><p>Na TV, abra o navegador e entre em</p><p><b>'+location.host+'/ativar</b></p><p>e digite o c\u00f3digo:</p><div class="tvcode">'+code+'</div><p id="tvcs">Aguardando a TV\u2026</p><button class="tvb g" id="tvx" style="margin-top:10px">Cancelar</button></div>';
$("tvx").onclick=end;
ref.child("st").on("value",function(s){var st=s.val();if(!st)return;
if(!conn){conn=true;send("load",0,{id:x.id,t:x.t,src:x.src});
m.innerHTML='<div><h3>\ud83d\udcfa '+esc(x.t)+'</h3><p id="tvcs">Tocando na TV</p><input type="range" id="tvsk" min="0" max="1000" value="0"><p id="tvtm">0:00</p><div class="rw"><button class="tvb g" id="tvb">\u221210s</button><button class="tvb r" id="tvpp">\u23f8</button><button class="tvb g" id="tvf">+10s</button></div><p>Volume</p><input type="range" id="tvv" min="0" max="100" value="100"><button class="tvb g" id="tvq" style="margin-top:16px">Desconectar</button><button class="tvb g" id="tvmin" style="margin:16px 0 0 8px">Minimizar</button></div>';
var sk=$("tvsk");sk.onpointerdown=function(){seeking=true};sk.onchange=function(){send("seek",sk.value/1000*(window._tvd||0));seeking=false};
$("tvpp").onclick=function(){send(window._tvp?"pause":"play")};$("tvb").onclick=function(){send("seek",Math.max(0,(window._tvc||0)-10))};$("tvf").onclick=function(){send("seek",(window._tvc||0)+10)};
$("tvv").oninput=function(){send("vol",+this.value)};$("tvq").onclick=function(){send("exit");setTimeout(end,300)};$("tvmin").onclick=function(){m.style.display="none";var fb=document.createElement("button");fb.className="tvb r";fb.style.cssText="position:fixed;z-index:95;right:14px;bottom:90px";fb.textContent="\ud83d\udcfa Controle";fb.onclick=function(){fb.remove();m.style.display="flex"};document.body.appendChild(fb);m._fb=fb}}
window._tvp=st.p;window._tvc=st.c;window._tvd=st.d;if(!m.querySelector("#tvsk"))return;
if(!seeking&&st.d)$("tvsk").value=Math.round(st.c/st.d*1000);$("tvtm").textContent=fmt(st.c)+" / "+fmt(st.d);$("tvpp").textContent=st.p?"\u23f8":"\u25b6";
if(Date.now()-st.ts>15000)$("tvcs").textContent="TV sem sinal\u2026";else $("tvcs").textContent=st.p?"Tocando na TV":"Pausado"})
},function(){m.innerHTML='<div><h3>N\u00e3o foi poss\u00edvel conectar</h3><p>Verifique sua internet e tente de novo.</p><button class="tvb g" id="tvx">Fechar</button></div>';$("tvx").onclick=close})}

window.TVCAST=cast;})();
