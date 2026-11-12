/* Árvore de Natal da Billie Global BR — página #/quiz/arvore.
   Carregada sob demanda pelo quiz.js (que passa o contexto: sessão, banco, idioma). */
var ARV=(function(){
"use strict";
var UNLOCK=1798081200000; /* 24/12/2026 00:00 (Brasília) — o mesmo valor está em database.rules.json */
var MIN=100,MAX=1500,XPV=10;
var C=null,D={tree:null,err:0,n:0,loading:0,mine:null,mUid:"",mref:null,tab:"tree",auth:0,ok:null,okQ:"",okBusy:0,okErr:0,okFirst:"",okMore:0,okMap:{},tick:null,sq:0};
var K={sel:"",txt:""};

/* ====== TEXTOS ====== */
var X={
title:["Decore a árvore de Natal da Billie Global BR","Decorate the Billie Global BR Christmas tree","Decora el árbol de Navidad de Billie Global BR"],
sub:["Escolha um enfeite, escreva uma cartinha e pendure na árvore. As cartas abrem em 24/12, à meia-noite (horário de Brasília).","Pick an ornament, write a letter and hang it on the tree. Letters open on Dec 24 at midnight (Brasília time).","Elige un adorno, escribe una carta y cuélgala en el árbol. Las cartas se abren el 24/12 a medianoche (hora de Brasilia)."],
tT:["Árvore","Tree","Árbol"],tL:["Cartas","Letters","Cartas"],tM:["Minhas","Mine","Mías"],
cnt:["{n} enfeites na árvore","{n} ornaments on the tree","{n} adornos en el árbol"],
dec:["Decorar a árvore","Decorate the tree","Decorar el árbol"],
login:["Entre na sua conta para decorar a árvore e enviar sua cartinha.","Sign in to decorate the tree and send your letter.","Inicia sesión para decorar el árbol y enviar tu carta."],
shr:["Chamar alguém","Invite someone","Invitar a alguien"],cpy:["Copiar link","Copy link","Copiar enlace"],cpd:["Link copiado!","Link copied!","¡Enlace copiado!"],
opens:["As cartas abrem em","Letters open in","Las cartas se abren en"],
open:["As cartas já estão abertas! 🎉","The letters are open! 🎉","¡Las cartas ya están abiertas! 🎉"],
dd:["d","d","d"],
empty:["A árvore ainda está vazia. Seja o primeiro a decorar!","The tree is still empty. Be the first to decorate it!","El árbol aún está vacío. ¡Sé el primero en decorarlo!"],
terr:["Não foi possível carregar a árvore agora.","Couldn't load the tree right now.","No se pudo cargar el árbol ahora."],
hint:["Toque em um enfeite para ver quem enviou.","Tap an ornament to see who sent it.","Toca un adorno para ver quién lo envió."],
rf:["Atualizar","Refresh","Actualizar"],
cT:["Escolha seu enfeite","Choose your ornament","Elige tu adorno"],
cL:["Sua cartinha","Your letter","Tu carta"],
cP:["Escreva uma mensagem de Natal de verdade… (mínimo de 100 caracteres)","Write a real Christmas message… (at least 100 characters)","Escribe un mensaje de Navidad de verdad… (mínimo 100 caracteres)"],
from:["De:","From:","De:"],
note:["Sua carta passa por uma análise automática (pode levar alguns minutos). Se for uma mensagem real e respeitosa, ela vai para a árvore e você ganha +{x} XP automaticamente, mesmo se sair do site. Mensagens sem sentido, com ofensas ou conteúdo impróprio são recusadas.","Your letter goes through an automatic review (it can take a few minutes). If it's a real, respectful message it goes on the tree and you get +{x} XP automatically, even if you leave the site. Nonsense, offensive or inappropriate messages are declined.","Tu carta pasa por una revisión automática (puede tardar unos minutos). Si es un mensaje real y respetuoso, va al árbol y ganas +{x} XP automáticamente, aunque salgas del sitio. Los mensajes sin sentido, ofensivos o inapropiados se rechazan."],
send:["Enviar carta","Send letter","Enviar carta"],sending:["Enviando…","Sending…","Enviando…"],
pick:["Escolha um enfeite.","Pick an ornament.","Elige un adorno."],
short:["Escreva pelo menos {n} caracteres.","Write at least {n} characters.","Escribe al menos {n} caracteres."],
fail:["Não foi possível enviar. Aguarde alguns segundos e tente de novo.","Couldn't send. Wait a few seconds and try again.","No se pudo enviar. Espera unos segundos e inténtalo de nuevo."],
closed:["O envio de cartas já foi encerrado.","Letter sending is closed.","El envío de cartas ya está cerrado."],
sent:["Carta enviada! 🎄","Letter sent! 🎄","¡Carta enviada! 🎄"],
sentD:["Ela já está a caminho. Quando a análise terminar, seu enfeite aparece na árvore e o XP cai na sua conta sozinho.","It's on its way. When the review ends, your ornament appears on the tree and the XP lands in your account on its own.","Ya va en camino. Cuando termine la revisión, tu adorno aparece en el árbol y el XP llega solo a tu cuenta."],
wa:["Chamar alguém no WhatsApp","Invite someone on WhatsApp","Invitar por WhatsApp"],
waT:["🎄 Decore a árvore de Natal da Billie Global BR comigo! Escolha um enfeite e escreva sua cartinha — todas as cartas abrem no dia 24/12, à meia-noite.","🎄 Decorate the Billie Global BR Christmas tree with me! Pick an ornament and write your letter — all letters open on Dec 24 at midnight.","🎄 ¡Decora conmigo el árbol de Navidad de Billie Global BR! Elige un adorno y escribe tu carta: todas se abren el 24/12 a medianoche."],
cls:["Fechar","Close","Cerrar"],
inf:["Enfeite de {n}","Ornament from {n}","Adorno de {n}"],
infL:["A mensagem será aberta em 24/12, à meia-noite (Brasília).","The message opens on Dec 24 at midnight (Brasília).","El mensaje se abre el 24/12 a medianoche (Brasilia)."],
read:["Ler carta","Read letter","Leer carta"],
lock:["As cartas estão trancadas até 24/12, à meia-noite (horário de Brasília). Volte nesse dia para ler a carta de todo mundo!","The letters are locked until Dec 24 at midnight (Brasília time). Come back then to read everyone's letters!","Las cartas están bloqueadas hasta el 24/12 a medianoche (hora de Brasilia). ¡Vuelve ese día para leer las cartas de todos!"],
srch:["Pesquisar por nome de usuário…","Search by username…","Buscar por nombre de usuario…"],
none:["Nenhuma carta encontrada.","No letters found.","No se encontraron cartas."],
more:["Carregar mais","Load more","Cargar más"],
ld:["Carregando…","Loading…","Cargando…"],
mEmpty:["Você ainda não enviou cartas.","You haven't sent any letters yet.","Aún no has enviado cartas."],
mLogin:["Entre para ver as suas cartas.","Sign in to see your letters.","Inicia sesión para ver tus cartas."],
sP:["Em análise…","In review…","En revisión…"],sO:["Na árvore ✓","On the tree ✓","En el árbol ✓"],sB:["Recusada","Declined","Rechazada"],
mHide:["Só você vê o texto até o Natal.","Only you can see the text until Christmas.","Solo tú ves el texto hasta Navidad."]
};
function x(k,o){var a=X[k],s=a?a[C?C.LI:0]:k;if(o)for(var i in o)s=s.split("{"+i+"}").join(o[i]);return s}
function E(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}

/* ====== ENFEITES (32) ====== */
var BALLS=[["b_red","#ff7b86","#a30d1a",["Bola vermelha","Red bauble","Bola roja"]],["b_blue","#7cc4ff","#1b4fb3",["Bola azul","Blue bauble","Bola azul"]],["b_gold","#ffe58a","#c88a08",["Bola dourada","Gold bauble","Bola dorada"]],["b_green","#7fe3a0","#0f7a3a",["Bola verde","Green bauble","Bola verde"]],["b_purple","#d3a6ff","#6b2bb8",["Bola roxa","Purple bauble","Bola morada"]],["b_pink","#ffb3d6","#d12a7b",["Bola rosa","Pink bauble","Bola rosa"]],["b_silver","#ffffff","#8b97a8",["Bola prata","Silver bauble","Bola plateada"]],["b_orange","#ffc47a","#d9570b",["Bola laranja","Orange bauble","Bola naranja"]]];
var EMO=[["e_heart","❤️",["Coração","Heart","Corazón"]],["e_black","🖤",["Coração preto","Black heart","Corazón negro"]],["e_green","💚",["Coração verde","Green heart","Corazón verde"]],["e_snowman","⛄",["Homem de neve","Snowman","Muñeco de nieve"]],["e_santa","🎅",["Papai Noel","Santa Claus","Papá Noel"]],["e_mrs","🤶",["Mamãe Noel","Mrs. Claus","Mamá Noel"]],["e_deer","🦌",["Rena","Reindeer","Reno"]],["e_elf","🧝",["Duende","Elf","Duende"]],["e_star","⭐",["Estrela","Star","Estrella"]],["e_bell","🔔",["Sino","Bell","Campana"]],["e_gift","🎁",["Presente","Gift","Regalo"]],["e_candy","🍬",["Bala","Candy","Caramelo"]],["e_lolli","🍭",["Pirulito","Lollipop","Piruleta"]],["e_sock","🧦",["Meia de Natal","Stocking","Calcetín"]],["e_candle","🕯️",["Vela","Candle","Vela"]],["e_angel","👼",["Anjinho","Little angel","Angelito"]],["e_cookie","🍪",["Biscoito","Cookie","Galleta"]],["e_mitten","🧤",["Luva","Mitten","Guante"]],["e_ribbon","🎀",["Laço","Ribbon","Lazo"]],["e_sled","🛷",["Trenó","Sled","Trineo"]],["e_penguin","🐧",["Pinguim","Penguin","Pingüino"]],["e_bear","🐻‍❄️",["Urso polar","Polar bear","Oso polar"]],["e_flake","❄️",["Floco de neve","Snowflake","Copo de nieve"]],["e_phones","🎧",["Fone de ouvido","Headphones","Auriculares"]]];
var ALL=[],ORN={};BALLS.forEach(function(b){var o={id:b[0],k:"b",a:b[1],b:b[2],n:b[3]};ALL.push(o);ORN[o.id]=o});EMO.forEach(function(b){var o={id:b[0],k:"e",e:b[1],n:b[2]};ALL.push(o);ORN[o.id]=o});
function oid(e){return ORN.hasOwnProperty(e)?e:"e_star"}
function oh(id){var o=ORN[oid(id)];return o.k==="b"?'<i class="av-ball" style="--a:'+o.a+';--b:'+o.b+'"></i>':'<span class="av-em">'+o.e+'</span>'}
function on(id){return ORN[oid(id)].n[C?C.LI:0]}

/* ====== POSIÇÃO DO ENFEITE NA ÁRVORE (fixa por enfeite) ====== */
function hs(s){var h=2166136261|0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}h=h||1;return function(){h^=h<<13;h^=h>>>17;h^=h<<5;return ((h>>>0)%100000)/100000}}
var TIER=[{t:.12,b:.36,w:.16,p:.15},{t:.32,b:.60,w:.26,p:.30},{t:.54,b:.85,w:.39,p:.55}];
function pos(k){var r=hs(k),a=r(),i=a<TIER[0].p?0:a<TIER[0].p+TIER[1].p?1:2,T=TIER[i],y=T.t+(T.b-T.t)*(.14+.82*Math.sqrt(r())),hw=T.w*((y-T.t)/(T.b-T.t));return {x:50+(r()*2-1)*hw*82,y:y*100}}

/* ====== ÁRVORE (SVG com faux-3D) ====== */
function tier(t,b,w){return "M50,"+t+" L"+(50+w)+","+b+" Q"+(50+w/2)+","+(b+6)+" 50,"+b+" Q"+(50-w/2)+","+(b+6)+" "+(50-w)+","+b+" Z"}
function star(){var p=[];for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,r=i%2?2.9:6.6;p.push((50+Math.cos(a)*r).toFixed(2)+","+(8.5+Math.sin(a)*r).toFixed(2))}return p.join(" ")}
function svg(){var T=[[65,107,40],[37.5,75,27],[12.5,45,17]],h='<svg class="av-svg" viewBox="0 0 100 125" aria-hidden="true"><defs><linearGradient id="avg" x1="0" x2="1"><stop offset="0" stop-color="#06301a"/><stop offset=".42" stop-color="#127a3d"/><stop offset=".72" stop-color="#27ab57"/><stop offset="1" stop-color="#0a4222"/></linearGradient><linearGradient id="avs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></linearGradient><linearGradient id="avt" x1="0" x2="1"><stop offset="0" stop-color="#4a2a12"/><stop offset=".5" stop-color="#8a5226"/><stop offset="1" stop-color="#3a200e"/></linearGradient><radialGradient id="avst"><stop offset="0" stop-color="#fff6c2"/><stop offset=".55" stop-color="#ffd23f"/><stop offset="1" stop-color="#e59a0c"/></radialGradient><radialGradient id="avgl"><stop offset="0" stop-color="#ffe98a" stop-opacity=".9"/><stop offset="1" stop-color="#ffe98a" stop-opacity="0"/></radialGradient></defs>';
h+='<ellipse cx="50" cy="118.5" rx="46" ry="5.2" fill="#eaf2ff" opacity=".92"/><rect x="44" y="104" width="12" height="14" rx="1.5" fill="url(#avt)"/>';
T.forEach(function(q){var t=q[0],b=q[1],w=q[2],d=tier(t,b,w);h+='<path d="'+d+'" fill="url(#avg)" stroke="#05240f" stroke-width=".5" stroke-linejoin="round"/><path d="M50,'+t+' L'+(50-w)+','+b+' L50,'+b+' Z" fill="#000" opacity=".16"/><path d="M50,'+t+' L'+(50+w)+','+b+' L50,'+b+' Z" fill="#fff" opacity=".06"/><path d="'+d+'" fill="url(#avs)"/>';
for(var i=1;i<=3;i++){var yy=t+(b-t)*i/4,ww=w*i/4;h+='<path d="M'+(50-ww)+','+(yy+2)+' Q50,'+(yy+7)+' '+(50+ww)+','+(yy+2)+'" fill="none" stroke="#0a4a26" stroke-width=".5" opacity=".55"/>'}
h+='<path d="M'+(50-w*.78)+','+(b-6)+' Q50,'+(b+3)+' '+(50+w*.78)+','+(b-6)+'" fill="none" stroke="#f6c94a" stroke-width="1" stroke-linecap="round" opacity=".92"/>'});
var L=[[44,20],[56,28],[38,50],[62,56],[30,84],[50,80],[70,88],[44,96],[58,98],[22,98],[78,98]];L.forEach(function(p,i){h+='<circle class="av-l" cx="'+p[0]+'" cy="'+p[1]+'" r="1.15" style="animation-delay:'+(i*.37)+'s" fill="'+["#fff3a8","#ff7b86","#8fd0ff","#9bf2b5"][i%4]+'"/>'});
h+='<circle cx="50" cy="8.5" r="11" fill="url(#avgl)"/><polygon points="'+star()+'" fill="url(#avst)" stroke="#b9770a" stroke-width=".4" stroke-linejoin="round"/></svg>';return h}

function treeOrn(){var t=D.tree||[],n=t.length,sz=Math.max(5,Math.min(9,10-n/55)),h="";
t.forEach(function(o){var p=pos(o.id);h+='<button type="button" class="av-o" style="left:'+p.x.toFixed(2)+'%;top:'+p.y.toFixed(2)+'%;--os:'+sz.toFixed(2)+'" onclick="ARV.info(\''+E(o.id)+'\')" aria-label="'+E(on(o.e)+" — "+o.n)+'">'+oh(o.e)+'</button>'});return h}

/* ====== DATA ====== */
function ref(p){return C.S.db.ref(p)}
function loadTree(){if(D.loading||!C.S.ready)return;D.loading=1;D.err=0;
var a=ref("arvore").orderByKey().limitToLast(400).once("value").then(function(s){var o=s.val()||{},l=Object.keys(o).sort().map(function(k){var v=o[k]||{};return {id:k,u:v.u,n:String(v.n||"?").slice(0,30),e:oid(v.e),t:v.t||0}});D.tree=l});
var b=ref("arvoreMeta/n").once("value").then(function(s){D.n=+s.val()||0},function(){});
Promise.all([a,b]).then(function(){D.n=Math.max(D.n,D.tree.length);D.loading=0;C.redraw()}).catch(function(){D.loading=0;D.err=1;if(!D.tree)D.tree=[];C.redraw()});
if(C.S.user&&C.refreshXp)C.refreshXp()}
function loadMine(){var u=C.S.user;if(!u){if(D.mref){D.mref.off();D.mref=null}D.mine=null;D.mUid="";return}
if(D.mUid===u.uid||!C.S.ready)return;D.mUid=u.uid;if(D.mref)D.mref.off();
D.mref=ref("cartas/pend/"+u.uid).limitToLast(50);var prev=-1;
D.mref.on("value",function(s){var o=s.val()||{},l=Object.keys(o).sort().reverse().map(function(k){var v=o[k]||{};return {id:k,e:oid(v.e),m:String(v.m||""),t:v.t||0,s:v.s||0,r:v.r||"",a:v.a||0}});D.mine=l;
var ok=l.filter(function(z){return z.s===1}).length;if(prev>=0&&ok>prev){D.tree=null;loadTree()}prev=ok;if(C.refreshXp&&ok)C.refreshXp();C.redraw()},function(){D.mine=[];C.redraw()})}
function rowOf(k,v){v=v||{};return {id:k,u:v.u,n:String(v.n||"?").slice(0,30),e:oid(v.e),m:String(v.m||""),t:v.t||0}}
function loadOk(more){if(D.okBusy||!C.S.ready||Date.now()<UNLOCK)return;D.okBusy=1;D.okErr=0;var q=D.okQ.trim().toLowerCase(),r=ref("cartas/ok"),qq;
if(q)qq=r.orderByChild("nl").startAt(q).endAt(q+"\uf8ff").limitToFirst(60);
else{qq=r.orderByKey();if(more&&D.okFirst)qq=qq.endBefore(D.okFirst);qq=qq.limitToLast(30)}
var my=D.sq;qq.once("value").then(function(s){if(my!==D.sq&&q)return;var o=s.val()||{},ks=Object.keys(o),l=ks.map(function(k){return rowOf(k,o[k])});l.sort(function(a,b){return a.id<b.id?1:-1});
l.forEach(function(z){D.okMap[z.id]=z});
if(q){D.ok=l;D.okMore=0}else{D.okMore=ks.length>=30?1:0;if(ks.length)D.okFirst=ks.sort()[0];D.ok=(more&&D.ok?D.ok:[]).concat(l)}
D.okBusy=0;list()}).catch(function(){D.okBusy=0;D.okErr=1;if(!D.ok)D.ok=[];list()})}
function list(){var el=document.getElementById("av-okl");if(el)el.innerHTML=listH();else C.redraw()}

/* ====== HTML DA PÁGINA ====== */
function cd(){var ms=UNLOCK-Date.now();if(ms<=0)return "";var s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),c=s%60;
function p(n){return (n<10?"0":"")+n}return d+x("dd")+" "+p(h)+":"+p(m)+":"+p(c)}
function tick(){var e=document.getElementById("av-cd");if(!e){clearInterval(D.tick);D.tick=null;return}
if(Date.now()>=UNLOCK){clearInterval(D.tick);D.tick=null;D.ok=null;C.redraw();return}e.textContent=cd()}
function head(){var open=Date.now()>=UNLOCK;
return '<div class="av-hero"><h2>🎄 '+E(x("title"))+'</h2><p>'+E(x("sub"))+'</p><div class="av-cdw">'+(open?'<b>'+E(x("open"))+'</b>':'<small>'+E(x("opens"))+'</small><b id="av-cd">'+cd()+'</b>')+'</div></div>'}
function tabsH(){function b(k,l){return '<button type="button" class="'+(D.tab===k?'on':'')+'" onclick="ARV.tab(\''+k+'\')">'+E(x(l))+'</button>'}return '<div class="av-tabs" role="tablist">'+b("tree","tT")+b("letters","tL")+b("mine","tM")+'</div>'}
function actH(){var link='<div class="av-acts"><button type="button" class="btn av-go" onclick="ARV.compose()">🎁 '+E(x("dec"))+'</button><button type="button" class="btn o" onclick="ARV.wa()">'+E(x("shr"))+'</button><button type="button" class="btn o" id="av-cp" onclick="ARV.copy()">'+E(x("cpy"))+'</button></div>';return link}
function treeH(){var h='<div class="av-stage"><div class="av-snow" aria-hidden="true"></div><div class="av-tilt" id="av-tilt" onpointermove="ARV.mv(event)" onpointerleave="ARV.lv()"><div class="av-tree">'+svg()+'<div class="av-ol">'+(D.tree?treeOrn():'')+'</div></div></div></div>';
h+='<div class="av-meta"><span>'+(D.tree===null?E(x("ld")):E(x("cnt",{n:C.fmt(D.n)})))+'</span><button type="button" class="qz-rf" onclick="ARV.reload()" aria-label="'+E(x("rf"))+'" title="'+E(x("rf"))+'">↻</button></div>';
if(D.err)h+='<div class="qz-msg bad">'+E(x("terr"))+'</div>';else if(D.tree&&!D.tree.length)h+='<div class="empty">'+E(x("empty"))+'</div>';else h+='<p class="av-hint">'+E(x("hint"))+'</p>';
h+=actH();
if(!C.S.user&&D.auth)h+='<div class="qz-msg ok">'+E(x("login"))+'</div>'+C.auth();return h}
function lettersH(){if(Date.now()<UNLOCK)return '<div class="qz-card av-lock"><span>🔒</span><p>'+E(x("lock"))+'</p></div>';
return '<div class="qz-srch"><input type="search" id="av-q" placeholder="'+E(x("srch"))+'" value="'+E(D.okQ)+'" oninput="ARV.sq(this.value)" autocomplete="off"></div><div id="av-okl">'+listH()+'</div>'}
function dt(t){try{return new Date(t).toLocaleDateString(C.LI===0?"pt-BR":C.LI===1?"en-US":"es-ES",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",year:"numeric"})}catch(e){return ""}}
function listH(){if(D.ok===null)return '<div class="qz-sk" style="height:90px;margin-bottom:10px"></div><div class="qz-sk" style="height:90px"></div>';
var h="";if(D.okErr)h+='<div class="qz-msg bad">'+E(x("terr"))+'</div>';if(!D.ok.length&&!D.okErr)return h+'<div class="empty">'+E(x("none"))+'</div>';
D.ok.forEach(function(z){h+='<button type="button" class="av-lt" onclick="ARV.letter(\''+E(z.id)+'\')"><span class="av-ltO">'+oh(z.e)+'</span><span class="av-ltB"><b>'+E(z.n)+'</b><small>'+E(dt(z.t))+'</small><em>'+E(z.m.slice(0,110))+(z.m.length>110?"…":"")+'</em></span></button>'});
if(D.okMore&&!D.okQ)h+='<button type="button" class="btn o av-more" onclick="ARV.more()"'+(D.okBusy?' disabled':'')+'>'+E(D.okBusy?x("ld"):x("more"))+'</button>';return h}
function mineH(){if(!C.S.user)return '<div class="empty">'+E(x("mLogin"))+'</div>'+(D.auth?C.auth():'<button type="button" class="btn av-go" onclick="ARV.login()">'+E(x("dec"))+'</button>');
if(D.mine===null)return '<div class="qz-sk" style="height:90px"></div>';var open=Date.now()>=UNLOCK;
if(!D.mine.length)return '<div class="empty">'+E(x("mEmpty"))+'</div>'+actH();
var h='<p class="av-hint">'+E(x("mHide"))+'</p>';
D.mine.forEach(function(z){var st=z.s===1?'<em class="av-s ok">'+E(x("sO"))+(z.a?' · +'+z.a+' XP':'')+'</em>':z.s===2?'<em class="av-s bad">'+E(x("sB"))+(z.r?': '+E(z.r):'')+'</em>':'<em class="av-s">'+E(x("sP"))+'</em>';
h+='<div class="av-lt av-mine"><span class="av-ltO">'+oh(z.e)+'</span><span class="av-ltB"><b>'+E(on(z.e))+'</b><small>'+E(dt(z.t))+'</small>'+st+'<span class="av-txt">'+E(z.m)+'</span></span></div>'});return h+actH()}

function page(ctx){C=ctx;var h=head()+tabsH();
if(D.tree===null)loadTree();loadMine();
if(D.tab==="letters"){if(D.ok===null&&Date.now()>=UNLOCK)loadOk(0);h+=lettersH()}else if(D.tab==="mine")h+=mineH();else h+=treeH();
if(!D.tick&&Date.now()<UNLOCK)D.tick=setInterval(tick,1000);return '<div class="av">'+h+'</div>'}

/* ====== AÇÕES ====== */
function link(){return location.origin+"/#/quiz/arvore"}
function waShare(){var u="https://wa.me/?text="+encodeURIComponent(x("waT")+"\n"+link());try{window.open(u,"_blank","noopener")}catch(e){location.href=u}}
function copy(){var l=link(),b=document.getElementById("av-cp");function ok(){if(b){var o=b.textContent;b.textContent=x("cpd");setTimeout(function(){b.textContent=x("cpy")},1800)}}
if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(l).then(ok,function(){window.prompt(x("cpy"),l)});else window.prompt(x("cpy"),l)}
function tab(k){D.tab=k;C.redraw();window.scrollTo&&window.scrollTo({top:0})}

/* 3D: inclina a árvore com o dedo/mouse */
function mv(e){var t=document.getElementById("av-tilt");if(!t||(window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches))return;var r=t.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;t.style.setProperty("--ry",(px*22).toFixed(1)+"deg");t.style.setProperty("--rx",(-py*10).toFixed(1)+"deg")}
function lv(){var t=document.getElementById("av-tilt");if(t){t.style.setProperty("--ry","0deg");t.style.setProperty("--rx","0deg")}}

/* ====== MODAIS ====== */
function closeM(){var m=document.getElementById("av-mod");if(m)m.remove();document.body.classList.remove("av-nos");document.removeEventListener("keydown",esc)}
function esc(e){if(e.key==="Escape")closeM()}
function modal(inner,cls){closeM();var m=document.createElement("div");m.id="av-mod";m.className="av-mod";m.innerHTML='<div class="av-bd" onclick="ARV.close()"></div><div class="av-box '+(cls||"")+'" role="dialog" aria-modal="true"><button type="button" class="av-x" onclick="ARV.close()" aria-label="'+E(x("cls"))+'">×</button>'+inner+'</div>';document.body.appendChild(m);document.body.classList.add("av-nos");document.addEventListener("keydown",esc);return m}
function info(id){var o=null;(D.tree||[]).forEach(function(z){if(z.id===id)o=z});if(!o)return;var open=Date.now()>=UNLOCK;
modal('<div class="av-big">'+oh(o.e)+'</div><h3>'+E(x("inf",{n:o.n}))+'</h3><p>'+E(on(o.e))+'</p>'+(open?'<button type="button" class="btn av-go" onclick="ARV.letter(\''+E(o.id)+'\')">'+E(x("read"))+'</button>':'<p class="av-lk">🔒 '+E(x("infL"))+'</p>'),"av-sm")}
function letter(id){var z=D.okMap[id];function show(z){modal('<div class="av-big">'+oh(z.e)+'</div><h3>'+E(z.n)+'</h3><small>'+E(dt(z.t))+'</small><div class="av-paper">'+E(z.m)+'</div>',"av-sm")}
if(z){show(z);return}modal('<div class="qz-sk" style="height:160px"></div>',"av-sm");
ref("cartas/ok/"+id).once("value").then(function(s){var v=s.val();if(!v){closeM();return}z=rowOf(id,v);D.okMap[id]=z;show(z)}).catch(function(){closeM()})}

function pickH(){var h="";ALL.forEach(function(o){h+='<button type="button" class="av-pk'+(K.sel===o.id?' on':'')+'" data-id="'+o.id+'" onclick="ARV.pick(\''+o.id+'\')" aria-pressed="'+(K.sel===o.id)+'" title="'+E(o.n[C.LI])+'" aria-label="'+E(o.n[C.LI])+'">'+oh(o.id)+'</button>'});return h}
function compose(){if(!C.S.user||!C.S.me){D.auth=1;D.tab=D.tab==="letters"?"tree":D.tab;C.redraw();return}
if(Date.now()>=UNLOCK){alert(x("closed"));return}
modal('<h3>'+E(x("cT"))+'</h3><div class="av-grid" id="av-grid">'+pickH()+'</div><h3>'+E(x("cL"))+'</h3><p class="av-from">'+E(x("from"))+' <b>'+E(C.S.me.name)+'</b></p><textarea id="av-ta" maxlength="'+MAX+'" rows="6" placeholder="'+E(x("cP"))+'" oninput="ARV.inp(this)">'+E(K.txt)+'</textarea><div class="av-cc"><span id="av-cn"></span></div><div class="qz-msg bad" id="av-er" hidden></div><p class="av-note">'+E(x("note",{x:XPV}))+'</p><button type="button" class="btn av-go" id="av-sd" onclick="ARV.send()">'+E(x("send"))+'</button>',"av-cp");
inp(document.getElementById("av-ta"))}
function pick(id){K.sel=id;var g=document.getElementById("av-grid");if(g)g.innerHTML=pickH();inp(document.getElementById("av-ta"))}
function inp(t){if(!t)return;K.txt=t.value;var n=t.value.trim().length,c=document.getElementById("av-cn");if(c){c.textContent=n+"/"+MIN+(n>=MIN?" ✓":"");c.className=n>=MIN?"ok":""}}
function err(m){var e=document.getElementById("av-er");if(e){e.textContent=m;e.hidden=!m}}
function send(){var u=C.S.user,ta=document.getElementById("av-ta"),b=document.getElementById("av-sd");if(!u||!ta||!b)return;var txt=ta.value.trim();err("");
if(!K.sel)return err(x("pick"));if(txt.length<MIN)return err(x("short",{n:MIN}));if(Date.now()>=UNLOCK)return err(x("closed"));
b.disabled=true;b.textContent=x("sending");
var TS=firebase.database.ServerValue.TIMESTAMP,r=ref("cartas/pend/"+u.uid).push(),up={};up["cartas/pend/"+u.uid+"/"+r.key]={n:C.S.me.name,e:K.sel,m:txt,t:TS};up["cartaLast/"+u.uid]=TS;
C.S.db.ref().update(up).then(function(){K.sel="";K.txt="";D.tab="mine";
modal('<div class="av-big">🎄</div><h3>'+E(x("sent"))+'</h3><p>'+E(x("sentD"))+'</p><button type="button" class="btn av-wa" onclick="ARV.wa()">'+E(x("wa"))+'</button><button type="button" class="btn o" onclick="ARV.close()">'+E(x("cls"))+'</button>',"av-sm");C.redraw()},function(){b.disabled=false;b.textContent=x("send");err(Date.now()>=UNLOCK?x("closed"):x("fail"))})}

function sq(v){D.okQ=v;D.sq++;clearTimeout(D.st);D.st=setTimeout(function(){D.ok=null;D.okFirst="";list();loadOk(0)},350)}
function reload(){D.tree=null;D.loading=0;C.redraw()}
window.addEventListener("hashchange",function(){closeM();if(!/^#\/quiz\/arvore/.test(location.hash)){if(D.mref){D.mref.off();D.mref=null;D.mUid=""}if(D.tick){clearInterval(D.tick);D.tick=null}}});

return {page:page,tab:tab,compose:compose,close:closeM,pick:pick,inp:inp,send:send,info:info,letter:letter,wa:waShare,copy:copy,mv:mv,lv:lv,sq:sq,more:function(){loadOk(1);list()},reload:reload,login:function(){D.auth=1;C.redraw()},
open:function(ctx){C=ctx;D.auth=0;if(D.tab==="letters"&&Date.now()<UNLOCK)D.tab="tree"}};
})();
