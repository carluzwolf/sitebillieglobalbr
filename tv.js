/* BillieTV \u2014 por Billie Global BR. Carregado sob demanda pelo index.html */
(function(){
var DB=null,$=function(i){return document.getElementById(i)},LS=window.localStorage;
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function get(k,d){try{return JSON.parse(LS.getItem(k))||d}catch(e){return d}}
function put(k,v){try{LS.setItem(k,JSON.stringify(v))}catch(e){}}
var I={play:'<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg>',plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',check:'<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
back:'<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',chev:'<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round"><path d="M9 5l7 7-7 7"/></svg>'};
function nav(act){return '<a href="#/tv"'+(act==="h"?' class="on"':'')+'><svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v8a2 2 0 0 1-2 2h-3.5v-6h-5v6H6a2 2 0 0 1-2-2z"/></svg>In\u00edcio</a><a href="#/tv/buscar"'+(act==="s"?' class="on"':'')+'><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>Buscar</a><a href="#/tv/lista"'+(act==="l"?' class="on"':'')+'><svg viewBox="0 0 24 24"><path d="M6 4h12v17l-6-4-6 4z"/></svg>Minha Lista</a><a href="#/"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h5M7 13h10M7 16.5h10"/></svg>Not\u00edcias</a><a href="#/quiz"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>Perfil</a>'}
function mode(on,act){document.body.classList.toggle("tvmode",on);var n=$("tvnav");if(on){if(!n){n=document.createElement("nav");n.id="tvnav";document.body.appendChild(n)}n.innerHTML=nav(act)}}
function load(cb){if(DB)return cb();fetch("/billietv.json?"+Date.now()).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(x){if(!x||!x.items)throw 0;DB=x;cb()}).catch(function(){var v=$("v");if(v&&/#\/tv/.test(location.hash))v.innerHTML='<div class="tvempty">BillieTV indispon\u00edvel no momento.</div>'})}
function byId(id){return DB.items.filter(function(x){return x.id===id})[0]}
function inList(id){return get("bt_list",[]).indexOf(id)>-1}
function prog(id){return get("bt_prog",{})[id]||null}
/* cart\u00e3o */
function card(x,wide){var img=wide?(x.backdrop||x.poster):(x.poster||x.backdrop),p=prog(x.id),pc=p&&p.d?Math.min(100,Math.round(p.t/p.d*100)):0;
return '<a class="tvc'+(wide?' w':'')+'" href="#/tv/v/'+esc(x.id)+'"><div class="tvp">'+(img?'<img src="'+esc(img)+'" alt="" loading="lazy" onerror="this.remove()">':'')+'<div class="ph" style="--c:'+esc(x.color||"#7c0912")+(img?';opacity:0':'')+'"><small>'+esc(x.type||"")+'</small><b>'+esc(x.t)+'</b></div>'+
'<button class="tvfav'+(inList(x.id)?' on':'')+'" data-fav="'+esc(x.id)+'" aria-label="Minha Lista">'+(inList(x.id)?I.check:I.plus)+'</button>'+(pc>2&&pc<97?'<div class="tvprog"><i style="width:'+pc+'%"></i></div>':'')+'</div><div class="nm">'+esc(x.t)+'</div></a>'}
function rowH(title,list,link,wide){if(!list.length)return"";return '<section class="tvrow"><div class="tvrt"><h3>'+esc(title)+'</h3>'+(link?'<a href="'+link+'">Ver tudo '+I.chev+'</a>':'')+'</div><div class="tvrs">'+list.map(function(x){return card(x,wide)}).join("")+'</div></section>'}
function items(cat){return DB.items.filter(function(x){return x.cat===cat})}
/* destaque */
function hero(){var hs=DB.items.filter(function(x){return x.hero});if(!hs.length)return"";
return '<div class="tvh"><div class="tvh-s" id="tvhs">'+hs.map(function(x){var bg=x.backdrop||x.poster;return '<div class="tvh-i" style="background-color:'+esc(x.color||"#7c0912")+(bg?';background-image:url('+esc(bg)+')':'')+'"><div class="tvh-b"><span class="tvtag">'+esc(x.type||"BillieTV")+'</span><h2>'+esc(x.t)+'</h2><p>'+esc(x.d||"")+'</p><div class="tvh-a"><a class="tvb" href="#/tv/v/'+esc(x.id)+'">'+I.play+'Assistir</a><button class="tvb g" data-fav="'+esc(x.id)+'">'+(inList(x.id)?I.check+'Na lista':I.plus+'Minha Lista')+'</button></div></div></div>'}).join("")+'</div><div class="tvdots" id="tvd">'+hs.map(function(_,i){return '<i'+(i?'':' class="on"')+'></i>'}).join("")+'</div></div>'}
var tmr;function heroRun(){clearInterval(tmr);var s=$("tvhs");if(!s)return;var n=s.children.length,d=$("tvd").children;
function sync(){var i=Math.round(s.scrollLeft/s.clientWidth);for(var k=0;k<d.length;k++)d[k].className=k===i?"on":""}
s.addEventListener("scroll",sync,{passive:true});
tmr=setInterval(function(){if(!$("tvhs")){clearInterval(tmr);return}if(n<2)return;var i=(Math.round(s.scrollLeft/s.clientWidth)+1)%n;s.scrollTo({left:i*s.clientWidth,behavior:"smooth"})},6000)}
function chips(act){return '<div class="tvchips"><a href="#/tv"'+(act?'':' class="on"')+'>Tudo</a>'+DB.cats.map(function(c){return '<a href="#/tv/c/'+c.id+'"'+(act===c.id?' class="on"':'')+'>'+esc(c.label)+'</a>'}).join("")+'</div>'}
function paint(h){document.body.classList.remove("tvplaying");$("v").innerHTML=h;scrollTo(0,0)}
/* p\u00e1ginas */
function home(){mode(true,"h");var h='<div class="tv">'+hero()+chips("");
var rec=Object.keys(get("bt_prog",{})).map(byId).filter(function(x){var p=prog(x.id);return x&&p&&p.d&&p.t/p.d>.02&&p.t/p.d<.97});
h+=rowH("Continuar assistindo",rec,"",true);
DB.cats.forEach(function(c){h+=rowH(c.label,items(c.id),"#/tv/c/"+c.id,c.id==="filmes"||c.id==="shows")});
paint(h+'</div>');heroRun();document.title="BillieTV \u2014 Billie Global BR"}
function cat(id){mode(true,"h");var c=DB.cats.filter(function(x){return x.id===id})[0];if(!c){location.hash="#/tv";return}
paint('<div class="tv">'+chips(id)+'<h1 class="tvt">'+esc(c.label)+'</h1><div class="tvgrid">'+items(id).map(function(x){return card(x)}).join("")+'</div></div>')}
function lista(){mode(true,"l");var l=get("bt_list",[]).map(byId).filter(Boolean);paint('<div class="tv"><h1 class="tvt">Minha Lista</h1>'+(l.length?'<div class="tvgrid">'+l.map(function(x){return card(x)}).join("")+'</div>':'<div class="tvempty">Sua lista est\u00e1 vazia. Toque no + de qualquer t\u00edtulo para salvar aqui.</div>')+'</div>')}
function busca(){mode(true,"s");paint('<div class="tv"><div class="tvsrch"><input id="tvq" type="search" placeholder="Buscar v\u00eddeos, clipes, shows..." autocomplete="off"></div><div class="tvgrid" id="tvres"></div></div>');
var q=$("tvq");function go(){var s=q.value.trim().toLowerCase(),r=DB.items.filter(function(x){return !s||(x.t+" "+x.type+" "+x.year+" "+x.d).toLowerCase().indexOf(s)>-1});$("tvres").innerHTML=r.length?r.map(function(x){return card(x)}).join(""):'<div class="tvempty" style="grid-column:1/-1">Nada encontrado.</div>'}
q.oninput=go;go();q.focus()}
/* player */
function parse(src){src=String(src||"").trim();if(!src)return null;var m;
if(m=src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/))return{k:"yt",id:m[1]};
if(m=src.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=)([\w-]+)/))return{k:"drive",id:m[1]};
if(/\.(mp4|webm|ogv|mov|m4v)(\?|#|$)/i.test(src))return{k:"file",u:src};
return{k:"frame",u:src}}
var ytReady=null;function ytApi(cb){if(window.YT&&YT.Player)return cb();if(!ytReady){ytReady=[];var pr=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=function(){if(pr)pr();var q=ytReady;ytReady=null;q.forEach(function(f){f()})};var s=document.createElement("script");s.src="https://www.youtube.com/iframe_api";document.head.appendChild(s)}ytReady.push(cb)}
function fmt(t){t=Math.max(0,Math.floor(t||0));var h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return(h?h+":"+(m<10?"0":""):"")+m+":"+(s<10?"0":"")+s}
var pt;
function mount(box,x){clearInterval(pt);box.classList.remove("drv");var s=parse(x.src);
if(!s){box.innerHTML='<div class="tvsoon" style="--c:'+esc(x.color||"#7c0912")+'"><b>Em breve na BillieTV</b><span>Este v\u00eddeo ainda n\u00e3o foi publicado.</span></div>';return}
function dframe(){clearInterval(pt);box.classList.add("drv");box.innerHTML='<div class="drv-w"><iframe src="https://drive.google.com/file/d/'+encodeURIComponent(s.id)+'/preview" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" title="'+esc(x.t||"V\u00eddeo")+'"></iframe></div>'}
if(s.k==="drive"){var gk=DB&&DB.driveKey?String(DB.driveKey).trim():"";s={k:"file",u:gk?"https://www.googleapis.com/drive/v3/files/"+encodeURIComponent(s.id)+"?alt=media&key="+encodeURIComponent(gk):"https://drive.usercontent.google.com/download?id="+encodeURIComponent(s.id)+"&export=download&confirm=t",id:s.id,drive:1,key:!!gk}}
if(s.k==="frame"){box.innerHTML='<iframe src="'+esc(s.u)+'" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="no-referrer"></iframe>';return}
var sv=prog(x.id),start=sv&&sv.t>5&&sv.d&&sv.t<sv.d-15?sv.t:0;
function save(c,d){var nw=Date.now();if(d&&c>1&&nw-(box._sv||0)>5000){box._sv=nw;var pr=get("bt_prog",{});pr[x.id]={t:c,d:d};put("bt_prog",pr)}}
function pl(on){document.body.classList.toggle("tvplaying",!!on)}
if(s.k==="file"){box.innerHTML='<video controls playsinline preload="metadata" controlsList="nodownload" '+(x.backdrop||x.poster?'poster="'+esc(x.backdrop||x.poster)+'" ':'')+'src="'+esc(s.u)+'"></video>';var v=box.querySelector("video");
var ok=0,fb=function(){if(!ok){v.onerror=null;try{v.pause();v.removeAttribute("src");v.load()}catch(e){}dframe()}};
if(s.drive){if(!s.key)v.referrerPolicy="no-referrer";v.onerror=fb;setTimeout(fb,12000)}
v.onloadedmetadata=function(){ok=1;if(start)v.currentTime=start};v.ontimeupdate=function(){save(v.currentTime,v.duration)};v.onplay=function(){pl(1)};v.onpause=v.onended=function(){pl(0)};box._pause=function(){v.pause()};return}
box.innerHTML='<div class="yt"><div id="tvyt"></div></div>';
ytApi(function(){var p=new YT.Player("tvyt",{width:"100%",height:"100%",videoId:s.id,host:"https://www.youtube-nocookie.com",playerVars:{controls:1,rel:0,modestbranding:1,playsinline:1,iv_load_policy:3,fs:1,start:Math.floor(start),origin:location.origin},events:{onReady:function(){box._pause=function(){p.pauseVideo()};pt=setInterval(function(){if(!document.body.contains(box)){clearInterval(pt);return}try{save(p.getCurrentTime(),p.getDuration())}catch(e){}},2000)},onStateChange:function(e){pl(e.data===1)}}})})}
function watch(id){var x=byId(id);if(!x){location.hash="#/tv";return}mode(true,"h");
var more=DB.items.filter(function(y){return y.cat===x.cat&&y.id!==x.id});
paint('<div class="tvw"><a class="tvback" href="#/tv">'+I.back+'BillieTV</a><div class="tvpl" id="tvpl"></div><div class="tvinfo"><span class="tvtag">'+esc(x.type||"BillieTV")+'</span><h1>'+esc(x.t)+'</h1><div class="tvmeta">'+(x.year?'<span>'+esc(x.year)+'</span>':'')+(x.dur?'<span>'+esc(x.dur)+'</span>':'')+'<span class="b">BillieTV</span></div><p>'+esc(x.d||"")+'</p><div class="tvact"><button class="tvb g" data-fav="'+esc(x.id)+'">'+(inList(x.id)?I.check+'Na lista':I.plus+'Minha Lista')+'</button><button class="tvb g" id="tvcast"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>Assistir na TV</button><button class="tvb g" id="tvsh"><svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 11l7.6-4M8.2 13l7.6 4"/></svg>Compartilhar</button></div></div></div><div class="tv">'+rowH("Mais como este",more,"#/tv/c/"+x.cat)+'</div>');
document.title=x.t+" \u2014 BillieTV";mount($("tvpl"),x);
$("tvcast").onclick=function(){cast(x)};$("tvsh").onclick=function(){var u=location.href,d={title:x.t+" \u2014 BillieTV",text:"Assista na BillieTV, por Billie Global BR",url:u};if(navigator.share)navigator.share(d).catch(function(){});else window.open("https://wa.me/?text="+encodeURIComponent(d.title+" "+u),"_blank")}}
/* lista (+) */
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-fav]");if(!b)return;e.preventDefault();e.stopPropagation();var id=b.getAttribute("data-fav"),l=get("bt_list",[]),i=l.indexOf(id);if(i>-1)l.splice(i,1);else l.push(id);put("bt_list",l);
[].forEach.call(document.querySelectorAll('[data-fav="'+id+'"]'),function(el){var on=l.indexOf(id)>-1;if(el.classList.contains("tvfav")){el.classList.toggle("on",on);el.innerHTML=on?I.check:I.plus}else el.innerHTML=on?I.check+"Na lista":I.plus+"Minha Lista"});
if(/#\/tv\/lista/.test(location.hash))lista()},true);

/* Assistir na TV: carrega /tv-cast.js s\u00f3 quando a pessoa toca no bot\u00e3o */
function cast(x){window.TVH={esc:esc,fmt:fmt,$:$};if(window.TVCAST)return window.TVCAST(x);var s=document.createElement("script");s.src="/tv-cast.js?"+Date.now();s.onload=function(){window.TVCAST(x)};s.onerror=function(){alert("N\u00e3o foi poss\u00edvel carregar o Assistir na TV.")};document.head.appendChild(s)}
var T={
show:function(h){load(function(){var m;if(m=h.match(/^#\/tv\/v\/([\w-]+)/))return watch(m[1]);if(m=h.match(/^#\/tv\/c\/([\w-]+)/))return cat(m[1]);if(h==="#/tv/buscar")return busca();if(h==="#/tv/lista")return lista();home()})},
off:function(){mode(false);clearInterval(tmr);clearInterval(pt)},
/* faixa na home do site principal */
rail:function(){var el=$("tvhome");if(!el)return;load(function(){el=$("tvhome");if(!el)return;var l=DB.items.filter(function(x){return x.cat==="filmes"||x.hero}).concat(DB.items.filter(function(x){return x.cat==="clipes"})).slice(0,12);
el.innerHTML='<div class="tvrt"><a href="#/tv" aria-label="BillieTV"><img class="tvlogo" src="/billietv-logo.svg" alt="BillieTV"></a><a href="#/tv">Ver tudo '+I.chev+'</a></div><div class="tvrs">'+l.map(function(x){return card(x,true)}).join("")+'</div>'})}
};
window.TV=T})();

  
