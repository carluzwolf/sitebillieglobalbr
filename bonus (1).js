/* ============================================================================
   bonus.js — DESAFIO DOS EMBLEMAS (Billie Global BR)
   30 perguntas (20 de alternativas A–E + 10 de verdadeiro/falso), até 200 XP,
   e no final a pessoa escolhe 1 emblema. Cada emblema tem só 5 vagas.
   Carregado automaticamente pelo quiz.js (window.QZB).
   ============================================================================ */
window.QZB=(function(){
"use strict";

/* ╔══════════════════════════════════════════════╗
   ║  CHAVE LIGA/DESLIGA:  0 = "Em breve"          ║
   ║                       1 = evento ABERTO       ║
   ╚══════════════════════════════════════════════╝ */
var ATIVO=0;

var PER_PIN=5;                       /* vagas por emblema */
var PIN_IDS=["birds","chihiro","lunch"];
var TOTAL=PER_PIN*PIN_IDS.length;    /* 15 vagas no total */
var MAXQ=30,MAXXP=200;               /* 30 perguntas · XP máximo */
var BANNER="/pins/banner.png";       /* imagem com os 3 emblemas */

/* ====== PERGUNTAS (iguais para todo mundo) ======
   Alternativas: {q,o:[5 opções],a:índice da certa,e:explicação}
   Verdadeiro/Falso: {q,tf:1,a:0 (verdadeiro) ou 1 (falso),e:explicação} */
var QS=[
{q:"Qual é o nome completo de nascimento de Billie Eilish?",o:["Billie Eilish Marie Baird O'Connell","Billie Pirate Eilish Baird O'Connell","Billie Eilish Pirate Baird O'Connell","Billie Eilish Rose Baird O'Connell","Billie Eilish Pirate O'Connell Baird"],a:2,e:"O nome completo é Billie Eilish Pirate Baird O'Connell."},
{q:"Em que ano “Ocean Eyes” foi publicada no SoundCloud, virando o primeiro grande sucesso viral dela?",o:["2016","2013","2017","2015","2014"],a:3,e:"Foi em 2015, quando ela tinha 13 anos."},
{q:"Quem era o professor de dança que pediu uma música a Finneas para uma coreografia, o que acabou virando “Ocean Eyes”?",o:["Fred Diaz","Marco Alvarez","Dan Russo","Chris Delgado","Tony Marquez"],a:0,e:"Fred Diaz, professor de dança de Billie, pediu a música."},
{q:"Qual é a faixa de abertura do álbum “Hit Me Hard and Soft”?",o:["Lunch","Chihiro","Wildflower","Skinny","The Greatest"],a:3,e:"O álbum abre com “Skinny”."},
{q:"Qual é a última faixa do álbum “Hit Me Hard and Soft”?",o:["The Diner","Bittersuite","L'Amour de Ma Vie","Wildflower","Blue"],a:4,e:"O álbum fecha com “Blue”."},
{q:"Qual é a faixa de abertura de “When We All Fall Asleep, Where Do We Go?”",o:["Bad Guy","Bury a Friend","!!!!!!!","Xanny","Ilomilo"],a:2,e:"O álbum abre com a faixa “!!!!!!!”."},
{q:"Quantos prêmios Grammy Billie venceu na cerimônia de 2020 (62º Grammy Awards)?",o:["3","4","6","5","7"],a:3,e:"Foram 5: Gravação, Álbum e Canção do Ano, Artista Revelação e Melhor Álbum Pop Vocal."},
{q:"Qual foi a primeira música dela a chegar ao 1º lugar da Billboard Hot 100?",o:["Ocean Eyes","Everything I Wanted","Therefore I Am","Bad Guy","Happier Than Ever"],a:3,e:"“Bad Guy” chegou ao topo em agosto de 2019."},
{q:"Com que idade ela lançou “No Time to Die”, tornando-se a artista mais jovem a gravar um tema de James Bond?",o:["18 anos","16 anos","17 anos","19 anos","20 anos"],a:0,e:"Ela tinha 18 anos."},
{q:"Quantas faixas tem a edição padrão de “Happier Than Ever”?",o:["12","14","15","18","16"],a:4,e:"São 16 faixas, de “Getting Older” a “Male Fantasy”."},
{q:"Qual é a faixa de abertura de “Happier Than Ever”?",o:["My Future","Getting Older","Lost Cause","NDA","Oxytocin"],a:1,e:"O álbum abre com “Getting Older”."},
{q:"O título “Chihiro” faz referência à protagonista de qual filme?",o:["Meu Amigo Totoro","A Viagem de Chihiro","Princesa Mononoke","O Castelo Animado","Ponyo"],a:1,e:"Chihiro é a protagonista de A Viagem de Chihiro (Studio Ghibli)."},
{q:"Em que ano Billie e Finneas ganharam o primeiro Oscar, por “No Time to Die”?",o:["2020","2021","2023","2022","2024"],a:3,e:"O primeiro Oscar veio na cerimônia de 2022; o segundo, por “What Was I Made For?”, em 2024."},
{q:"Em qual categoria do Grammy 2024 “What Was I Made For?” venceu?",o:["Gravação do Ano","Álbum do Ano","Canção do Ano","Artista Revelação","Melhor Performance Pop Solo"],a:2,e:"Ela venceu Canção do Ano (e também Melhor Canção Escrita para Mídia Visual)."},
{q:"Quem dirigiu o documentário “Billie Eilish: The World's a Little Blurry” (2021)?",o:["Alma Har'el","Brett Morgen","Kevin Macdonald","R.J. Cutler","Jonas Åkerlund"],a:3,e:"A direção é de R.J. Cutler."},
{q:"Qual selo, em parceria com a Interscope, lançou os primeiros trabalhos dela?",o:["Republic","Darkroom","Atlantic","Def Jam","Capitol"],a:1,e:"Billie é artista da Darkroom/Interscope."},
{q:"Quem participou do remix oficial de “Bad Guy” lançado em outubro de 2019?",o:["Harry Styles","Post Malone","Shawn Mendes","Travis Scott","Justin Bieber"],a:4,e:"O remix teve Justin Bieber."},
{q:"Em qual bairro de Los Angeles Billie cresceu?",o:["Silver Lake","Echo Park","Venice","Burbank","Highland Park"],a:4,e:"Ela cresceu em Highland Park."},
{q:"Qual é a data de nascimento de Billie Eilish?",o:["18 de dezembro de 2001","18 de dezembro de 2002","12 de dezembro de 2001","19 de dezembro de 2001","18 de novembro de 2001"],a:0,e:"Billie nasceu em 18 de dezembro de 2001."},
{q:"Em que data foi lançado “Hit Me Hard and Soft”?",o:["24 de maio de 2024","10 de maio de 2024","3 de maio de 2024","31 de maio de 2024","17 de maio de 2024"],a:4,e:"O álbum saiu em 17 de maio de 2024."},

{tf:1,q:"“Happier Than Ever” foi lançado em 2021.",a:0,e:"Verdadeiro. O álbum saiu em 30 de julho de 2021."},
{tf:1,q:"Billie Eilish foi diagnosticada com síndrome de Tourette aos 11 anos.",a:0,e:"Verdadeiro. Ela já falou sobre o diagnóstico publicamente."},
{tf:1,q:"Billie Eilish nasceu em Nova York.",a:1,e:"Falso. Ela nasceu em Los Angeles, na Califórnia."},
{tf:1,q:"“Therefore I Am” faz parte de “When We All Fall Asleep, Where Do We Go?”.",a:1,e:"Falso. A música está em “Happier Than Ever”."},
{tf:1,q:"“Lovely”, com Khalid, foi lançada para a trilha da série “13 Reasons Why”.",a:0,e:"Verdadeiro. A música saiu em 2018 para a série."},
{tf:1,q:"O primeiro álbum de Billie foi gravado em um estúdio profissional em Nova York.",a:1,e:"Falso. Foi gravado no quarto de Finneas, na casa da família em Los Angeles."},
{tf:1,q:"“Birds of a Feather” é a quarta faixa de “Hit Me Hard and Soft”.",a:0,e:"Verdadeiro. A ordem é Skinny, Lunch, Chihiro, Birds of a Feather."},
{tf:1,q:"Billie ganhou o primeiro Grammy da carreira em 2019.",a:1,e:"Falso. Os primeiros Grammys vieram em janeiro de 2020."},
{tf:1,q:"“Everything I Wanted” faz parte da tracklist padrão de “Happier Than Ever”.",a:1,e:"Falso. Foi um single lançado fora dos álbuns, em 2019."},
{tf:1,q:"Em 2020, Billie foi a artista mais jovem a vencer as quatro categorias principais do Grammy na mesma noite.",a:0,e:"Verdadeiro. Ela tinha 18 anos."}
];

/* ====== TEXTOS (pt / en / es) ====== */
var T={
tag:["🏅 DESAFIO DOS EMBLEMAS","🏅 BADGE CHALLENGE","🏅 DESAFÍO DE INSIGNIAS"],
title:["Conquiste um emblema exclusivo","Earn an exclusive badge","Consigue una insignia exclusiva"],
soon:["COMEÇA EM BREVE","COMING SOON","PRÓXIMAMENTE"],
soonD:["Um desafio difícil sobre a Billie vai liberar um emblema exclusivo no seu nome. Só 5 vagas por emblema!","A hard Billie challenge will unlock an exclusive badge next to your name. Only 5 spots per badge!","Un desafío difícil sobre Billie desbloqueará una insignia exclusiva junto a tu nombre. ¡Solo 5 plazas por insignia!"],
openD:["30 perguntas difíceis sobre a Billie, até 200 XP e um emblema exclusivo no seu nome. Vagas limitadas!","30 hard questions about Billie, up to 200 XP and an exclusive badge next to your name. Limited spots!","30 preguntas difíciles sobre Billie, hasta 200 XP y una insignia exclusiva junto a tu nombre. ¡Plazas limitadas!"],
spots:["vagas restantes","spots left","plazas restantes"],
go:["Participar","Join","Participar"],cont:["Continuar","Continue","Continuar"],
closedT:["Evento encerrado","Event closed","Evento cerrado"],
closedD:["Todas as vagas dos emblemas foram preenchidas. Esse evento não volta mais.","All badge spots have been taken. This event will not return.","Todas las plazas de las insignias se han ocupado. Este evento no volverá."],
back:["Voltar","Back","Volver"],
rules:["Como funciona","How it works","Cómo funciona"],
r1:["20 perguntas de alternativas (A a E) e 10 de verdadeiro ou falso.","20 multiple-choice questions (A to E) and 10 true or false.","20 preguntas de opción múltiple (A a E) y 10 de verdadero o falso."],
r2:["Você ganha até 200 XP, conforme os acertos.","You earn up to 200 XP, depending on your score.","Ganas hasta 200 XP, según tus aciertos."],
r3:["Ao terminar, você escolhe 1 dos 3 emblemas. Cada um tem só 5 vagas.","At the end you pick 1 of 3 badges. Each has only 5 spots.","Al terminar eliges 1 de 3 insignias. Cada una tiene solo 5 plazas."],
r4:["Só dá para fazer uma vez. Se as vagas acabarem enquanto você responde, o evento fecha.","You can only do it once. If the spots run out while you answer, the event closes.","Solo se puede hacer una vez. Si las plazas se agotan mientras respondes, el evento se cierra."],
start:["Começar desafio","Start challenge","Empezar desafío"],
qn:["Pergunta {i}/{n}","Question {i}/{n}","Pregunta {i}/{n}"],
tfT:["Verdadeiro","True","Verdadero"],tfF:["Falso","False","Falso"],
ok:["Acertou! ✅","Correct! ✅","¡Acertaste! ✅"],ko:["Errou ❌","Wrong ❌","Fallaste ❌"],
next:["Próxima","Next","Siguiente"],seeRes:["Ver resultado","See result","Ver resultado"],
saving:["Salvando sua pontuação…","Saving your score…","Guardando tu puntuación…"],
saveErr:["Não foi possível salvar. Verifique a conexão.","Couldn't save. Check your connection.","No se pudo guardar. Revisa la conexión."],
retry:["Tentar novamente","Try again","Reintentar"],
done:["Desafio concluído!","Challenge complete!","¡Desafío completado!"],
hits:["acertos","correct","aciertos"],
safe:["Seu emblema está garantido. Escolha o seu:","Your badge is secured. Pick yours:","Tu insignia está asegurada. Elige la tuya:"],
left:["{n}/{t} vagas","{n}/{t} spots","{n}/{t} plazas"],
soldOut:["ESGOTADO","SOLD OUT","AGOTADO"],
pickBtn:["Escolher","Choose","Elegir"],
allFull:["As vagas normais acabaram, mas como você chegou até aqui, seu emblema está garantido. Escolha qualquer um.","The regular spots ran out, but since you made it here your badge is secured. Pick any of them.","Las plazas normales se agotaron, pero como llegaste hasta aquí tu insignia está asegurada. Elige cualquiera."],
conf:["Confirmar o emblema {n}? Essa escolha é para sempre.","Confirm the {n} badge? This choice is forever.","¿Confirmar la insignia {n}? Esta elección es para siempre."],
confBtn:["Confirmar","Confirm","Confirmar"],cancel:["Cancelar","Cancel","Cancelar"],
taken:["Esse emblema acabou de esgotar. Escolha outro.","That badge just sold out. Pick another one.","Esa insignia se acaba de agotar. Elige otra."],
claimErr:["Não foi possível salvar a escolha. Tente de novo.","Couldn't save your choice. Try again.","No se pudo guardar tu elección. Inténtalo de nuevo."],
yours:["Seu emblema","Your badge","Tu insignia"],
yoursD:["Ele aparece ao lado do seu nome no ranking e no perfil, para sempre.","It shows next to your name in the ranking and on your profile, forever.","Aparece junto a tu nombre en el ranking y en tu perfil, para siempre."],
rank:["Ver ranking","See ranking","Ver ranking"],
choose:["Escolha seu emblema","Choose your badge","Elige tu insignia"],
loading:["Carregando…","Loading…","Cargando…"]
};
function lg(){try{return typeof LI==="number"?LI:0}catch(e){return 0}}
function L(k,o){var a=T[k],s=a?a[lg()]:k;if(o)for(var x in o)s=s.split("{"+x+"}").join(o[x]);return s}

/* ====== ESTADO ====== */
var X=null,Z={live:false,bzr:null,pins:null,ans:[],rev:false,started:false,saving:false,saveErr:false,key:"",sel:"",busy:false,msg:""};
var LET="ABCDE";

function uid(){return X&&X.S.user?X.S.user.uid:""}
function me(){return X?X.S.me:null}
function isDone(){var m=me();return !!(m&&m.bz&&typeof m.bz.s==="number")}
function myPin(){var m=me();return m&&typeof m.pin==="string"&&X.PINS[m.pin]?m.pin:""}
function reserved(){return Z.bzr?Object.keys(Z.bzr).length:0}
function closed(){return !isDone()&&reserved()>=TOTAL&&!(Z.bzr&&Z.bzr[uid()])}
function freeOf(id){return PER_PIN-((Z.pins&&Z.pins[id])||0)}
function anyFree(){return PIN_IDS.some(function(id){return freeOf(id)>0})}
function esc(v){return X.esc(v)}
function ban(){return '<img class="qzb-ban" src="'+BANNER+'" alt="" onerror="this.style.display=\'none\'">'}

/* ====== TEMPO REAL: vagas e reservas (o evento fecha na hora) ====== */
function live(){if(Z.live||!X||!X.S.db)return;Z.live=true;var db=X.S.db;
db.ref("bzr").on("value",function(s){Z.bzr=s.val()||{};X.redraw()},function(){Z.bzr=Z.bzr||{}});
db.ref("pins").on("value",function(s){var v=s.val()||{},c={};PIN_IDS.forEach(function(k){c[k]=v[k]?Object.keys(v[k]).length:0});Z.pins=c;X.redraw()},function(){Z.pins=Z.pins||{}})}

function css(){if(document.getElementById("qzb-css"))return;var s=document.createElement("style");s.id="qzb-css";
s.textContent=".qzb-ban{display:block;width:100%;max-width:100%;border-radius:10px;margin:0 0 12px}"+
".qzb-pins{display:grid;gap:10px;margin:12px 0}"+
".qzb-pin{display:flex;align-items:center;gap:12px;padding:10px;border:1px solid #16ff3a55;border-radius:10px;background:#0b1a0e}"+
".qzb-pin.off{opacity:.45}.qzb-pin img{width:64px;height:64px;object-fit:contain;flex:none}"+
".qzb-pin div{flex:1;min-width:0}.qzb-pin b{display:block;font:800 16px var(--sans);color:#fff}"+
".qzb-pin small{display:block}.qzb-pin .btn{width:auto;margin:0;flex:none}"+
".qzb-sc{font:800 44px/1 var(--sans);color:#16ff3a;text-align:center}.qzb-sc small{font-size:20px;opacity:.7}"+
".qzb-xp{text-align:center;font:800 20px var(--sans);color:#fff;margin:6px 0 12px}"+
".qzb-big{display:block;width:120px;height:120px;object-fit:contain;margin:6px auto 10px}"+
".qzb ul{margin:8px 0 12px;padding-left:18px}.qzb li{margin:4px 0;color:#b9e8c2}"+
".qzb .qz-opt{width:100%}.qzb .btn.o{background:transparent;color:#16ff3a}";
document.head.appendChild(s)}

/* ====== CARD NO HUB DO QUIZ ====== */
function card(x){X=x;if(!me())return "";css();
var p=myPin();
if(p){var P=X.PINS[p];return '<div class="qz-card qzb"><span class="qzb-tag">'+L("tag")+'</span><img class="qzb-big" src="'+P.img+'" alt="" style="height:64px;width:64px;margin:4px 0 6px"><h3>'+L("yours")+': '+esc(P.n)+'</h3><p>'+L("yoursD")+'</p></div>'}
if(isDone())return '<div class="qz-card qzb"><span class="qzb-tag">'+L("tag")+'</span><h3>'+L("choose")+'</h3><p>'+L("safe")+'</p><a class="btn" href="#/quiz/bonus">'+L("choose")+'</a></div>';
if(!ATIVO)return '<div class="qz-card qzb"><span class="qzb-tag">'+L("tag")+'</span>'+ban()+'<div class="qzb-t">'+L("soon")+'</div><p>'+L("soonD")+'</p></div>';
live();
if(Z.bzr===null)return '<div class="qz-card qzb"><span class="qzb-tag">'+L("tag")+'</span><p>'+L("loading")+'</p></div>';
if(closed())return '<div class="qz-card qzb"><span class="qzb-tag">'+L("tag")+'</span><h3>'+L("closedT")+'</h3><p>'+L("closedD")+'</p></div>';
var n=Math.max(0,TOTAL-reserved());
return '<div class="qz-card qzb"><span class="qzb-tag">'+L("tag")+'</span>'+ban()+'<div class="qzb-t">'+L("title")+'</div><p>'+L("openD")+'</p><small>'+n+' '+L("spots")+'</small><br><a class="btn" href="#/quiz/bonus" style="margin-top:8px">'+(Z.ans.length?L("cont"):L("go"))+'</a></div>'}

/* ====== PÁGINA #/quiz/bonus ====== */
function page(x){X=x;css();var m=me();if(!m)return "";
if(myPin())return ownPage();
if(isDone())return choosePage();
if(!ATIVO){setTimeout(function(){location.hash="#/quiz"},0);return ""}
live();
if(Z.bzr===null)return '<div class="empty">'+L("loading")+'</div>';
if(closed())return '<div class="qz-card qzb"><span class="qzb-tag">'+L("tag")+'</span><h3>'+L("closedT")+'</h3><p>'+L("closedD")+'</p><a class="btn" href="#/quiz">'+L("back")+'</a></div>';
restore();
if(Z.saving)return '<div class="qz-card qzb"><p class="qz-big">'+L("saving")+'</p></div>';
if(Z.saveErr)return '<div class="qz-card qzb"><p class="qz-big">'+L("saveErr")+'</p><button class="btn" onclick="QZB.fin()">'+L("retry")+'</button></div>';
if(!Z.started&&!Z.ans.length)return introPage();
if(!Z.rev&&Z.ans.length>=MAXQ){setTimeout(finish,0);return '<div class="qz-card qzb"><p class="qz-big">'+L("saving")+'</p></div>'}
return playPage()}

function introPage(){
return '<div class="qz-card qzb"><span class="qzb-tag">'+L("tag")+'</span>'+ban()+'<div class="qzb-t">'+L("title")+'</div><h3>'+L("rules")+'</h3><ul><li>'+L("r1")+'</li><li>'+L("r2")+'</li><li>'+L("r3")+'</li><li>'+L("r4")+'</li></ul><small>'+Math.max(0,TOTAL-reserved())+' '+L("spots")+'</small><br><button class="btn" style="margin-top:8px" onclick="QZB.start()">'+L("start")+'</button></div>'}

function playPage(){
var i=Z.rev?Z.ans.length-1:Z.ans.length,Q=QS[i];if(!Q)return "";
var sel=Z.rev?Z.ans[i]:-1,opts=Q.tf?[L("tfT"),L("tfF")]:Q.o;
var h='<div class="qz-card qzb"><div class="qz-qh"><span>'+L("qn",{i:i+1,n:MAXQ})+'</span><span>'+Math.round(i/MAXQ*100)+'%</span></div><div class="qz-bar"><i style="width:'+Math.round(i/MAXQ*100)+'%"></i></div><h3 class="qz-qt">'+esc(Q.q)+'</h3><div class="qzb-opts'+(Q.tf?' tf':'')+'">';
opts.forEach(function(o,k){var cl="qz-opt";if(Z.rev){if(k===Q.a)cl+=" right";else if(k===sel)cl+=" wrong";else cl+=" dim"}
h+='<button type="button" class="'+cl+'"'+(Z.rev?' disabled':' onclick="QZB.pick('+k+')"')+'>'+(Q.tf?'':'<i>'+LET.charAt(k)+'</i>')+'<span>'+esc(o)+'</span></button>'});
h+='</div>';
if(Z.rev){var okk=sel===Q.a;h+='<div class="qz-fb '+(okk?'ok':'ko')+'"><b>'+(okk?L("ok"):L("ko"))+'</b>'+(Q.e?'<p>'+esc(Q.e)+'</p>':'')+'</div><button class="btn qz-nx" onclick="QZB.nxt()">'+(Z.ans.length>=MAXQ?L("seeRes"):L("next"))+'</button>'}
return h+'</div>'}

/* progresso salvo no aparelho (se recarregar, continua de onde parou) */
function restore(){var k="bg_bz_"+uid();if(Z.key===k)return;Z.key=k;var a=[];try{a=JSON.parse(localStorage.getItem(k)||"[]")}catch(e){}
Z.ans=Array.isArray(a)?a.filter(function(v){return v===0||v===1||v===2||v===3||v===4}).slice(0,MAXQ):[];Z.rev=false;Z.started=Z.ans.length>0}
function save(){try{localStorage.setItem(Z.key,JSON.stringify(Z.ans))}catch(e){}}
function start(){Z.started=true;X.redraw()}
function pick(k){if(Z.rev||Z.saving||closed()||isDone())return;Z.ans.push(k);Z.rev=true;save();X.redraw()}
function nxt(){if(!Z.rev)return;Z.rev=false;if(Z.ans.length>=MAXQ)finish();else X.redraw()}

/* termina: grava XP + a reserva da vaga numa tacada só (atomic) */
function finish(){if(Z.saving||isDone())return;
var sc=0;Z.ans.forEach(function(a,i){if(QS[i]&&a===QS[i].a)sc++});
var gain=Math.round(sc/MAXQ*MAXXP),TS=firebase.database.ServerValue.TIMESTAMP,f={},x={};
f["bz/s"]=sc;f["bz/x"]=gain;f["bz/t"]=TS;x["bzr/"+uid()+"/t"]=TS;
Z.saving=true;Z.saveErr=false;X.redraw();
X.commit(gain,f,x).then(function(){Z.saving=false;try{localStorage.removeItem(Z.key)}catch(e){}X.redraw()}).catch(function(){Z.saving=false;Z.saveErr=true;X.redraw()})}

/* ====== ESCOLHA DO EMBLEMA (já garantido) ====== */
function choosePage(){live();var m=me(),sc=m.bz.s,xp=m.bz.x||0,free=anyFree()||Z.pins===null;
var h='<div class="qz-card qzb"><span class="qzb-tag">'+L("tag")+'</span><h3>'+L("done")+'</h3><div class="qzb-sc">'+sc+'<small>/'+MAXQ+' '+L("hits")+'</small></div><div class="qzb-xp">+'+xp+' XP</div>'+ban()+'<p>'+L("safe")+'</p>';
if(!free)h+='<small>'+L("allFull")+'</small>';
if(Z.msg)h+='<div class="qz-msg bad">'+esc(Z.msg)+'</div>';
h+='<div class="qzb-pins">';
PIN_IDS.forEach(function(id){var P=X.PINS[id],fr=freeOf(id),can=free?(fr>0||Z.pins===null):true;
h+='<div class="qzb-pin'+(can?'':' off')+'"><img src="'+P.img+'" alt=""><div><b>'+esc(P.n)+'</b><small>'+(Z.pins===null?'…':(fr>0?L("left",{n:fr,t:PER_PIN}):L("soldOut")))+'</small></div>'+
(can?'<button class="btn" onclick="QZB.sel(\''+id+'\')">'+L("pickBtn")+'</button>':'')+'</div>'});
h+='</div>';
if(Z.sel&&X.PINS[Z.sel]){var P=X.PINS[Z.sel];h+='<div class="qz-msg ok"><img class="qzb-big" src="'+P.img+'" alt="">'+L("conf",{n:esc(P.n)})+'<div class="acts" style="justify-content:center;margin-top:8px"><button class="btn" '+(Z.busy?'disabled':'')+' onclick="QZB.claim()">'+(Z.busy?'…':L("confBtn"))+'</button><button class="btn o" onclick="QZB.sel(\'\')">'+L("cancel")+'</button></div></div>'}
return h+'</div>'}
function sel(id){Z.sel=id;Z.msg="";X.redraw()}

/* grava o emblema. Se o escolhido esgotou agora e ainda há outro livre, avisa;
   se o site falhar ou não houver nada livre, a pessoa leva o emblema mesmo assim. */
function claim(){var id=Z.sel;if(!id||Z.busy||!X.PINS[id])return;Z.busy=true;X.redraw();var db=X.S.db;
db.ref("pins/"+id).once("value").then(function(s){var n=s.val()?Object.keys(s.val()).length:0;
if(n>=PER_PIN&&PIN_IDS.some(function(o){return o!==id&&freeOf(o)>0})){Z.busy=false;Z.sel="";Z.msg=L("taken");X.redraw();return}
return write(id)}).catch(function(){return write(id)})}
function write(id){var u={},TS=firebase.database.ServerValue.TIMESTAMP,U=uid();
u["users/"+U+"/pin"]=id;u["rank/"+U+"/b"]=id;u["pins/"+id+"/"+U]=TS;
return X.S.db.ref().update(u).then(function(){X.S.me.pin=id;X.S.rankT=0;Z.busy=false;Z.sel="";Z.msg="";X.redraw()}).catch(function(){Z.busy=false;Z.msg=L("claimErr");X.redraw()})}

function ownPage(){var p=myPin(),P=X.PINS[p];
return '<div class="qz-card qzb" style="text-align:center"><span class="qzb-tag">'+L("tag")+'</span><img class="qzb-big" src="'+P.img+'" alt=""><h3>'+L("yours")+': '+esc(P.n)+'</h3><p>'+L("yoursD")+'</p><a class="btn" href="#/quiz/ranking">'+L("rank")+'</a></div>'}

return {card:card,page:page,start:start,pick:pick,nxt:nxt,sel:sel,claim:claim,fin:function(){Z.saveErr=false;finish()}}
})();
