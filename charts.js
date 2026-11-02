/* Billie Charts — página #/charts. Carregada sob demanda pelo index.html (usa t, LI, esc, $, stitle, EV, TMON do site). */
var CH={d:null,ev:null,sel:"",loading:false};
var CHT={
title:["Billie Charts","Billie Charts","Billie Charts"],
sub:["Central de estatísticas: posições nas paradas, streams, marcos e prêmios. Só músicas da Billie Eilish, lidas das fontes públicas a cada 2 horas.","Stats hub: chart positions, streams, milestones and awards. Billie Eilish songs only, read from public sources every 2 hours.","Central de estadísticas: posiciones en las listas, streams, hitos y premios. Solo canciones de Billie Eilish, leídas de fuentes públicas cada 2 horas."],
loading:["Carregando os charts…","Loading the charts…","Cargando las listas…"],
nodata:["Os dados dos charts ainda estão sendo coletados. A primeira atualização automática acontece em instantes — volte daqui a pouco!","Chart data is still being collected. The first automatic update happens shortly — check back soon!","Los datos de las listas aún se están recopilando. La primera actualización automática ocurre en breve. ¡Vuelve pronto!"],
sSongs:["Músicas nos charts","Songs charting","Canciones en listas"],
sBest:["Melhor posição","Best position","Mejor posición"],
sDaily:["Streams por dia · Spotify Global","Daily streams · Spotify Global","Streams diarios · Spotify Global"],
sTop:["Mais ouvida no Spotify","Most streamed on Spotify","Más escuchada en Spotify"],
dayN:["streams no dia","streams that day","streams del día"],
peak:["pico","peak","pico"],daysOn:["dias no chart","days on chart","días en la lista"],weeksOn:["semanas","weeks","semanas"],
none:["Nenhuma música da Billie no Top {n} deste chart hoje.","No Billie songs in this chart's Top {n} today.","Ninguna canción de Billie en el Top {n} de esta lista hoy."],
topN:["Top {n}","Top {n}","Top {n}"],dataOf:["Dados de","Data from","Datos de"],lastRead:["lidos","read","leídos"],
full:["Ver chart completo ↗","View full chart ↗","Ver lista completa ↗"],
hist:["Evolução recente","Recent trend","Evolución reciente"],hN:["Músicas da Billie no chart","Billie songs on the chart","Canciones de Billie en la lista"],hB:["Melhor posição","Best position","Mejor posición"],
soon:["O gráfico de evolução aparece depois de alguns dias de coleta.","The trend chart appears after a few days of data collection.","El gráfico de evolución aparece tras unos días de recopilación."],
msT:["Marcos de streaming · Spotify","Streaming milestones · Spotify","Hitos de streaming · Spotify"],
hit:["atingiu","reached","alcanzó"],streamsW:["streams","streams","streams"],
nextM:["faltam {x} para {y}","{x} to go until {y}","faltan {x} para {y}"],eta:["(~{d} dias no ritmo atual)","(~{d} days at the current pace)","(~{d} días al ritmo actual)"],
awT:["Prêmios e conquistas","Awards & achievements","Premios y logros"],seeCal:["Ver no calendário →","See in calendar →","Ver en el calendario →"],
note:["Dados lidos automaticamente de fontes públicas (Kworb/Spotify Charts, Apple Music, Deezer, Billboard). Site de fãs, não oficial. Posições e streams podem ter pequenas diferenças em relação às plataformas.","Data read automatically from public sources (Kworb/Spotify Charts, Apple Music, Deezer, Billboard). Unofficial fan site. Positions and streams may differ slightly from the platforms.","Datos leídos automáticamente de fuentes públicas (Kworb/Spotify Charts, Apple Music, Deezer, Billboard). Sitio de fans no oficial. Las posiciones y los streams pueden diferir levemente de las plataformas."],
upd:["Atualizado em","Updated on","Actualizado el"],
bi:[" bi"," B"," mil M"],mi:[" mi"," M"," M"]
};
var CHR={global:["Global","Global","Global"],br:["Brasil","Brazil","Brasil"],us:["EUA","USA","EE. UU."],world:["Mundo","Worldwide","Mundo"],global200:["Global 200","Global 200","Global 200"],globalexus:["Global (exceto EUA)","Global (excl. US)","Global (excl. EE. UU.)"]};
var CHP={spotify:"Spotify",apple:"Apple Music",deezer:"Deezer",billboard:"Billboard"};
var CHPO=["spotify","apple","deezer","billboard"];
function ct(k,o){var a=CHT[k],s=a?a[LI]:k;if(o)for(var x in o)s=s.replace("{"+x+"}",o[x]);return s}
function cq(x){return esc(x).replace(/"/g,"&quot;")}
function chLoc(){return ["pt-BR","en-US","es-ES"][LI]}
function chN(n){return n==null?"–":Number(n).toLocaleString(chLoc())}
function chBig(n){if(n>=1e9)return (n/1e9).toLocaleString(chLoc(),{maximumFractionDigits:2})+ct("bi");if(n>=1e6)return (n/1e6).toLocaleString(chLoc(),{maximumFractionDigits:1})+ct("mi");return chN(n)}
function chDate(s){if(!s||!/^\d{4}-\d{2}-\d{2}/.test(s))return s||"";var y=+s.slice(0,4),m=+s.slice(5,7)-1,d=+s.slice(8,10),M=TMON[LI][m];return LI===1?M+" "+d+", "+y:d+" "+M+" "+y}
function chDur(s){if(!s)return "";return Math.floor(s/60)+":"+("0"+(s%60)).slice(-2)}
function chKeys(){var d=CH.d;if(!d||!d.sources)return [];return Object.keys(d.sources)}
function chBy(p){return chKeys().filter(function(k){return d_(k).platform===p})}
function d_(k){return CH.d.sources[k]}
function chBoot(cb){
 var n=2,fin=function(){if(--n===0)cb()};
 fetch("/charts.json?"+Date.now()).then(function(r){return r.ok?r.json():Promise.reject()}).then(function(j){CH.d=j&&j.sources?j:null}).catch(function(){}).then(fin);
 if(typeof EV!=="undefined"&&EV.length){CH.ev=EV;fin()}else{fetch("/events.json?"+Date.now()).then(function(r){return r.ok?r.json():Promise.reject()}).then(function(j){CH.ev=Array.isArray(j)?j:[]}).catch(function(){CH.ev=[]}).then(fin)}
}
function chRoute(h){var m=h.match(/^#\/charts\/(\w+)/);CH.sel=m?m[1]:CH.sel;
 var ks=chKeys();if(ks.indexOf(CH.sel)<0){var first=null;CHPO.forEach(function(p){if(!first){var b=chBy(p);if(b.length)first=b[0]}});CH.sel=first||""}}
function chCover(c){return '<div class="ch-cv'+(c?'':' ph')+'">'+(c?'<img src="'+cq(c)+'" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add(\'ph\');this.parentNode.textContent=\'♪\'">':'♪')+'</div>'}
function chMove(m){if(m==null)return "";if(m==="new")return '<span class="ch-mv up">NEW</span>';if(m==="re")return '<span class="ch-mv">RE</span>';if(m>0)return '<span class="ch-mv up">▲ '+m+'</span>';if(m<0)return '<span class="ch-mv dn">▼ '+(-m)+'</span>';return '<span class="ch-mv">—</span>'}
function chRow(e,s,max){
 var meta=[e.artist];if(e.dur)meta.push(chDur(e.dur));
 var m2=[];if(e.peak)m2.push(ct("peak")+" #"+e.peak);if(e.days)m2.push(chN(e.days)+" "+ct("daysOn"));if(e.weeks)m2.push(chN(e.weeks)+" "+ct("weeksOn"));
 var st="";
 if(e.streams!=null){var w=max?Math.max(4,Math.round(e.streams/max*100)):0;st='<div class="ch-st"><b>'+chN(e.streams)+'</b><small>'+ct("dayN")+'</small><div class="ch-bar"><i style="width:'+w+'%"></i></div></div>'}
 var ttl=e.url?'<a href="'+cq(e.url)+'" target="_blank" rel="noopener"><h3>'+esc(e.title)+'</h3></a>':'<h3>'+esc(e.title)+'</h3>';
 return '<li class="ch-row"><div class="ch-pos'+(e.pos<=10?' top':'')+'"><b>'+e.pos+'</b>'+chMove(e.move)+'</div>'+chCover(e.cover)+'<div class="ch-tx">'+ttl+'<p>'+esc(meta.join(" · "))+'</p>'+(m2.length?'<p>'+esc(m2.join(" · "))+'</p>':'')+'</div>'+st+'</li>'}
function chSpark(v,inv,label){
 var pts=v.filter(function(x){return x!=null});if(pts.length<2)return "";
 var lo=Math.min.apply(null,pts),hi=Math.max.apply(null,pts),r=hi-lo||1,W=300,H=60,n=v.length,xs=[];
 var line=v.map(function(x,i){if(x==null)return null;var nx=n>1?i/(n-1)*W:0,f=(x-lo)/r;var y=inv?5+f*(H-10):H-5-f*(H-10);xs.push([nx,y]);return nx.toFixed(1)+","+y.toFixed(1)}).filter(Boolean).join(" ");
 var last=xs[xs.length-1];
 return '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" role="img" aria-label="'+cq(label)+'"><polyline points="'+line+'" vector-effect="non-scaling-stroke"/></svg>'+'<em>'+chN(pts[pts.length-1])+'</em>'}
function chHist(k){
 var h=(CH.d.history&&CH.d.history[k])||[];
 if(h.length<2)return '<p class="ch-soon">'+ct("soon")+'</p>';
 return '<div class="ch-hist"><div class="ch-card"><small>'+ct("hN")+'</small>'+chSpark(h.map(function(x){return x.n}),false,ct("hN"))+'</div>'+
  '<div class="ch-card"><small>'+ct("hB")+'</small>'+chSpark(h.map(function(x){return x.best}),true,ct("hB"))+'</div></div>'}
function chSummary(){
 var d=CH.d,songs={},best=null,bestK="";
 chKeys().forEach(function(k){d_(k).entries.forEach(function(e){songs[(e.title||"").toLowerCase()]=1;if(!best||e.pos<best.pos){best=e;bestK=k}})});
 var sg=d.sources.spotify_global,daily=0;if(sg)sg.entries.forEach(function(e){daily+=e.streams||0});
 var top=(d.streams||[])[0];
 function card(l,v,x){return '<div class="ch-card"><small>'+l+'</small><b>'+v+'</b>'+(x?'<em>'+esc(x)+'</em>':'')+'</div>'}
 return '<div class="ch-sum">'+card(ct("sSongs"),Object.keys(songs).length,"")+
  card(ct("sBest"),best?"#"+best.pos:"–",best?best.title+" · "+CHP[d_(bestK).platform]+" "+CHR[d_(bestK).region][LI]:"")+
  card(ct("sDaily"),sg&&daily?chBig(daily):"–",sg&&sg.date?chDate(sg.date):"")+
  card(ct("sTop"),top?chBig(top.total):"–",top?top.title:"")+'</div>'}
function chBoard(){
 var k=CH.sel,s=d_(k),max=0;s.entries.forEach(function(e){if(e.streams>max)max=e.streams});
 var info='<div class="ch-info"><span>'+ct("topN",{n:s.size})+(s.date?" · "+ct("dataOf")+" "+chDate(s.date):"")+'</span>'+(s.home?'<a href="'+cq(s.home)+'" target="_blank" rel="noopener">'+ct("full")+'</a>':'')+'</div>';
 var body=s.entries.length?'<ul class="ch-list">'+s.entries.map(function(e){return chRow(e,s,max)}).join("")+'</ul>':'<div class="ch-none">'+ct("none",{n:s.size})+'</div>';
 return info+body+chHist(k)}
function chTabs(){
 var h='<div class="ch-tabs" role="tablist">';
 CHPO.forEach(function(p){var b=chBy(p);if(!b.length)return;var on=d_(CH.sel).platform===p;h+='<button role="tab" aria-selected="'+on+'" class="'+(on?'on':'')+'" onclick="chSel(\''+b[0]+'\')">'+CHP[p]+'</button>'});
 h+='</div>';
 var cur=d_(CH.sel).platform,b=chBy(cur);
 if(b.length>1){h+='<div class="ch-chips">';b.forEach(function(k){h+='<button class="'+(k===CH.sel?'on':'')+'" onclick="chSel(\''+k+'\')">'+esc(CHR[d_(k).region][LI])+'</button>'});h+='</div>'}
 return h}
function chMilestones(){
 var d=CH.d,S=d.streams||[];if(!S.length)return "";
 var max=S[0].total,h=stitle(ct("msT"));
 (d.milestones||[]).slice(0,3).forEach(function(m){h+='<div class="ch-hit"><span>🎉</span><span><b>'+esc(m.title)+'</b> '+ct("hit")+' <b>'+chBig(m.mark)+'</b> '+ct("streamsW")+' · '+chDate(m.date)+'</span></div>'});
 h+='<ol class="ch-ms">';
 S.slice(0,10).forEach(function(s,i){
  var step=5e8,nx=(Math.floor(s.total/step)+1)*step,rem=nx-s.total,prev=nx-step,pct=Math.round((s.total-prev)/step*100),bn=Math.floor(s.total/1e9);
  var eta=s.daily>0?" "+ct("eta",{d:chN(Math.ceil(rem/s.daily))}):"";
  h+='<li><span class="n">'+(i+1)+'</span>'+chCover(s.cover)+'<div><h3>'+esc(s.title)+'</h3><span class="tot">'+chN(s.total)+'</span>'+(bn>=1?'<span class="bd">'+bn+(LI===2?' mil M':LI===1?'B+':' bi+')+'</span>':'')+'</div>'+
   '<div class="nx">'+ct("nextM",{x:chBig(rem),y:chBig(nx)})+eta+'</div><div class="ch-bar"><i style="width:'+pct+'%"></i></div></li>'});
 return h+'</ol>'}
function chAwards(){
 var ev=(CH.ev||[]).filter(function(e){return e.cat==="premios"&&e.date<=new Date().toISOString().slice(0,10)&&!e.cancelled}).sort(function(a,b){return a.date<b.date?1:-1}).slice(0,8);
 if(!ev.length)return "";
 var h=stitle(ct("awT"))+'<ul class="ch-aw">';
 ev.forEach(function(e){var o=evLoc(e);h+='<li><span class="ic">🏆</span><div><h3>'+esc(o.t)+'</h3><time datetime="'+cq(e.date)+'">'+chDate(e.date)+'</time>'+(o.d?'<p>'+esc(o.d)+'</p>':'')+'<a href="#/calendario/'+cq(e.date)+'">'+ct("seeCal")+'</a></div></li>'});
 return h+'</ul>'}
function chartsPage(){
 var head='<div class="wrap ch">'+stitle(ct("title"),CH.d&&CH.d.updated?ct("upd")+" "+chDate(CH.d.updated.slice(0,10)):"")+'<p class="ch-sub">'+ct("sub")+'</p>';
 if(!CH.d||!chKeys().length)return head+'<div class="ch-none">'+ct("nodata")+'</div>'+chAwards()+'</div>';
 return head+chSummary()+chTabs()+'<div id="chx">'+chBoard()+'</div>'+chMilestones()+chAwards()+'<p class="ch-note">'+ct("note")+'</p></div>'}
function chSel(k){CH.sel=k;var v=document.querySelector(".ch");if(!v)return;var y=scrollY;
 var tmp=document.createElement("div");tmp.innerHTML=chartsPage();var nw=tmp.firstChild;v.parentNode.replaceChild(nw,v);scrollTo(0,y);
 try{history.replaceState(null,"","#/charts/"+k)}catch(e){}}
function chShow(h){
 CH.loading=true;chBoot(function(){CH.loading=false;if(!/^#\/charts/.test(location.hash))return;chRoute(location.hash);paint(chartsPage())})}
