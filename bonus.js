/* ============================================================
   DESAFIO BÔNUS — Billie Global BR
   Arquivo REMOVÍVEL: depois das 22h, apague este arquivo (bonus.js)
   no GitHub e o desafio some do site. Quem completou continua com o nome verde.
   ============================================================ */
var QZB=(function(){
"use strict";
var ID="b20261105";
var START=Date.UTC(2026,10,5,18,0,0);   /* 05/11/2026 15:00 (Brasília) */
var END=Date.UTC(2026,10,6,1,0,0);      /* 05/11/2026 22:00 (Brasília) */
var GRACE=30*60000;                      /* tolerância p/ salvar quem começou antes das 22h */
var XP_Q=10;                             /* 20 perguntas x 10 = 200 XP no máximo */
var TF=["Verdadeiro","Falso"];

/* 10 perguntas difíceis (A–E) + 10 verdadeiro/falso. Mesma ordem para todos. a = índice da resposta certa (TF: 0=Verdadeiro, 1=Falso) */
var Q=[
{t:"m",q:"Em que mês e ano foi lançado o single “Therefore I Am”?",o:["Julho de 2020","Setembro de 2020","Novembro de 2020","Janeiro de 2021","Março de 2021"],a:2,e:"“Therefore I Am” saiu em 12 de novembro de 2020, como single de Happier Than Ever."},
{t:"m",q:"Qual a idade de Billie quando ela se tornou a mais jovem a vencer as quatro principais categorias do Grammy na mesma noite (2020)?",o:["16 anos","17 anos","18 anos","19 anos","20 anos"],a:2,e:"Ela tinha 18 anos no Grammy de 2020 (Álbum, Gravação, Canção do Ano e Artista Revelação)."},
{t:"m",q:"Qual faixa encerra o álbum When We All Fall Asleep, Where Do We Go??",o:["i love you","listen before i go","xanny","ilomilo","goodbye"],a:4,e:"“goodbye” é a última faixa do álbum de 2019."},
{t:"m",q:"Qual é a faixa de abertura do álbum Happier Than Ever?",o:["my future","Getting Older","Lost Cause","Halley's Comet","Billie Bossa Nova"],a:1,e:"O álbum de 2021 abre com “Getting Older”."},
{t:"m",q:"Qual faixa encerra o álbum Hit Me Hard and Soft?",o:["The Greatest","Wildflower","L'Amour de Ma Vie","Blue","The Diner"],a:3,e:"“Blue” é a décima e última faixa de Hit Me Hard and Soft."},
{t:"m",q:"Qual música rendeu a Billie o Grammy de Gravação do Ano em 2021?",o:["bad guy","Everything I Wanted","Therefore I Am","Your Power","my future"],a:1,e:"“Everything I Wanted” venceu Gravação do Ano no Grammy de 2021."},
{t:"m",q:"Em que data foi lançado o álbum Happier Than Ever?",o:["30 de julho de 2021","30 de março de 2021","29 de março de 2019","17 de maio de 2024","18 de dezembro de 2021"],a:0,e:"Happier Than Ever foi lançado em 30 de julho de 2021."},
{t:"m",q:"Quem co-dirigiu, ao lado de Patrick Osborne, o filme-concerto “Happier Than Ever: A Love Letter to Los Angeles”?",o:["Spike Jonze","Sofia Coppola","Robert Rodriguez","Edgar Wright","Wes Anderson"],a:2,e:"O filme (Disney+, 2021) foi dirigido por Robert Rodriguez e Patrick Osborne."},
{t:"m",q:"Quem dirigiu o documentário “Billie Eilish: The World's a Little Blurry” (2021)?",o:["R.J. Cutler","Michel Gondry","Mark Romanek","Alma Har'el","Spike Jonze"],a:0,e:"O documentário foi dirigido por R.J. Cutler."},
{t:"m",q:"O nome completo de Billie é Billie Eilish ___ Baird O'Connell. Qual é o nome do meio?",o:["Wolf","Rose","Sky","Pirate","Moon"],a:3,e:"O nome completo é Billie Eilish Pirate Baird O'Connell."},

{t:"tf",q:"Billie Eilish nasceu em Los Angeles, Califórnia.",a:0,e:"Verdadeiro. Ela nasceu em Los Angeles em 18 de dezembro de 2001."},
{t:"tf",q:"Happier Than Ever é o álbum de estreia de Billie Eilish.",a:1,e:"Falso. O álbum de estreia é When We All Fall Asleep, Where Do We Go? (2019)."},
{t:"tf",q:"Finneas é irmão mais velho de Billie.",a:0,e:"Verdadeiro. Finneas nasceu em 1997, quatro anos antes dela."},
{t:"tf",q:"A música “Your Power” faz parte do álbum Hit Me Hard and Soft.",a:1,e:"Falso. “Your Power” é de Happier Than Ever (2021)."},
{t:"tf",q:"A música “Lunch” faz parte do álbum Hit Me Hard and Soft.",a:0,e:"Verdadeiro. “Lunch” é a segunda faixa do álbum de 2024."},
{t:"tf",q:"“Ocean Eyes” foi publicada no SoundCloud em 2015.",a:0,e:"Verdadeiro. A música foi publicada em 2015, quando Billie tinha 13 anos."},
{t:"tf",q:"Em 2022, Billie foi headliner do Coachella e se tornou a mais jovem a fazer isso.",a:0,e:"Verdadeiro. Ela tinha 20 anos quando foi atração principal do festival."},
{t:"tf",q:"A música “Everybody Dies” faz parte do álbum When We All Fall Asleep, Where Do We Go?",a:1,e:"Falso. “Everybody Dies” é de Happier Than Ever."},
{t:"tf",q:"“No Time to Die” rendeu a Billie e Finneas o Oscar de Melhor Canção Original em 2022.",a:0,e:"Verdadeiro. A música do filme de James Bond venceu na cerimônia de 2022."},
{t:"tf",q:"A música “Birds of a Feather” faz parte do álbum Happier Than Ever.",a:1,e:"Falso. “Birds of a Feather” é de Hit Me Hard and Soft (2024)."}
];
var X=null,tm=null,seen="";

function now(){return Date.now()}
function st(){var n=now();return n<START?"wait":(n>=END?"end":"open")}
function pad(v){return v<10?"0"+v:""+v}
function fmt(ms){ms=Math.max(0,Math.floor(ms/1000));return pad(Math.floor(ms/3600))+":"+pad(Math.floor(ms%3600/60))+":"+pad(ms%60)}
function done(){var m=X.S.me;return m&&m.bonus&&typeof m.bonus[ID]==="number"?m.bonus[ID]:null}
function key(){return "bg_bz_"+X.S.user.uid+"_"+ID}
function load(){var a=[];try{a=JSON.parse(localStorage.getItem(key())||"[]")}catch(e){}return Array.isArray(a)?a.slice(0,Q.length):[]}
function P(){var S=X.S;if(!S.bz||S.bz.k!==key())S.bz={k:key(),ans:load(),rev:false,fin:false,res:null,err:false,saving:false};return S.bz}
function sv(){try{localStorage.setItem(key(),JSON.stringify(X.S.bz.ans))}catch(e){}}
function bar(p){return '<div class="qz-bar"><i style="width:'+p+'%"></i></div>'}

function tick(){var el=document.getElementById("qzb-t");
if(!el){clearInterval(tm);tm=null;return}
var s=st();if(s!==seen){seen=s;X.redraw();return}
el.textContent=s==="wait"?fmt(START-now()):(s==="open"?fmt(END-now()):"00:00:00")}
function startTick(){seen=st();if(!tm)tm=setInterval(tick,1000)}

/* ----- card que aparece embaixo do quiz diário ----- */
function card(x){X=x;startTick();var s=st(),d=done(),h='<div class="qz-card qzb"><span class="qzb-tag">⚡ DESAFIO BÔNUS</span><h3>Desafio Bônus da Billie</h3>';
if(d!==null)return h+'<p class="qz-big">Desafio concluído! Você fez '+d+'/'+Q.length+' e ganhou +'+d*XP_Q+' XP. Seu nome está verde no ranking 💚</p><small>Quer ver? Abra o Ranking.</small></div>';
if(s==="end")return h+'<p class="qz-big">🔒 Desafio encerrado.</p><small>Este desafio estava disponível das 15h às 22h.</small></div>';
h+='<p>10 perguntas difíceis (A–E) + 10 de verdadeiro ou falso. Ganhe até <b>200 XP</b> e, ao concluir, seu nome fica <b style="color:#16ff3a">verde neon</b> no ranking!</p>';
if(s==="wait")return h+'<small>Libera às 15h. Faltam:</small><div class="qzb-t" id="qzb-t">'+fmt(START-now())+'</div><button class="btn" disabled>🔒 Bloqueado</button></div>';
var a=P().ans.length;
return h+'<small>Termina às 22h. Tempo restante:</small><div class="qzb-t" id="qzb-t">'+fmt(END-now())+'</div><a class="btn" href="#/quiz/bonus">'+(a?'Continuar ('+a+'/'+Q.length+')':'Começar o desafio')+'</a></div>'}

/* ----- tela do desafio ----- */
function pick(k){var p=P();if(p.rev||p.fin||st()==="end"&&now()>=END+GRACE)return;p.ans.push(k);p.rev=true;sv();X.redraw()}
function nxt(){var p=P();if(!p.rev)return;p.rev=false;if(p.ans.length>=Q.length)finish();else X.redraw()}
function finish(){var p=P(),S=X.S;if(p.fin&&!p.err)return;if(done()!==null){location.hash="#/quiz";return}
var sc=0;p.ans.forEach(function(a,i){if(Q[i]&&a===Q[i].a)sc++});
var f={};f["bonus/"+ID]=sc;var ex={};ex["rank/"+S.user.uid+"/g"]=1;
p.fin=true;p.err=false;p.saving=true;X.redraw();
X.commit(sc*XP_Q,f,ex).then(function(r){p.saving=false;p.res={sc:sc,gain:sc*XP_Q,r:r};X.redraw()}).catch(function(){p.saving=false;p.fin=false;p.err=true;X.redraw()})}
function again(){var p=P();p.err=false;p.fin=false;finish()}

function page(x){X=x;startTick();var S=X.S,m=S.me,s=st(),p=P();
var back='<a class="btn o" href="#/quiz">← Voltar</a>';
if(p.res){var r=p.res;return '<div class="qz-card qzb qz-res"><span class="qzb-tag">⚡ DESAFIO BÔNUS</span><h3>Desafio concluído!</h3><div class="qz-score">'+r.sc+'<small>/'+Q.length+'</small></div><div class="qz-gain">+'+r.gain+' XP</div><p>Seu nome agora aparece em <b style="color:#16ff3a">verde neon</b> no ranking 💚</p>'+(r.r&&r.r.up?'<div class="qz-msg ok">Você subiu de nível: '+X.esc(r.r.up.ic+" "+r.r.up.n)+'! 🎊</div>':'')+'<div class="acts" style="justify-content:center"><a class="btn" href="#/quiz/ranking">🏆 Ver ranking</a></div></div>'}
if(done()!==null&&!p.fin){setTimeout(function(){location.hash="#/quiz"},0);return '<div class="empty">Carregando…</div>'}
if(p.saving)return '<div class="qz-card qzb"><p class="qz-big">Salvando sua pontuação…</p></div>';
if(p.err)return '<div class="qz-card qzb"><p class="qz-big">Não foi possível salvar. Verifique a conexão.</p><button class="btn" onclick="QZB.again()">Tentar novamente</button></div>';
var late=now()>=END+GRACE;
if(!p.ans.length&&s!=="open"||late&&!p.rev){return '<div class="qz-card qzb"><h3>'+(s==="wait"?'🔒 Ainda bloqueado':'🔒 Desafio encerrado')+'</h3>'+(s==="wait"?'<p>Libera às 15h.</p><div class="qzb-t" id="qzb-t">'+fmt(START-now())+'</div>':'<p>Este desafio já terminou.</p>')+back+'</div>'}
if(!p.rev&&p.ans.length>=Q.length){setTimeout(finish,0);return '<div class="qz-card qzb"><p class="qz-big">Salvando sua pontuação…</p></div>'}
var i=p.rev?p.ans.length-1:p.ans.length,q=Q[i],sel=p.rev?p.ans[i]:-1,n=Q.length;
var h='<div class="qz-card qzb qz-q"><div class="qz-qh"><span>⚡ Bônus · Pergunta '+(i+1)+' de '+n+(q.t==="tf"?' · Verdadeiro ou Falso':'')+'</span><span id="qzb-t">'+(s==="open"?fmt(END-now()):"")+'</span></div>'+bar(Math.round(i/n*100))+'<h3 class="qz-qt">'+X.esc(q.q)+'</h3><div class="qzb-opts'+(q.t==="tf"?' tf':'')+'">';
var opts=q.t==="tf"?TF:q.o;
opts.forEach(function(o,k){var cl="qz-opt";if(p.rev){if(k===q.a)cl+=" right";else if(k===sel)cl+=" wrong";else cl+=" dim"}
h+='<button type="button" class="'+cl+'"'+(p.rev?' disabled':' onclick="QZB.pick('+k+')"')+'>'+(q.t==="tf"?'':'<i>'+"ABCDE".charAt(k)+'</i>')+'<span>'+X.esc(o)+'</span></button>'});
h+='</div>';
if(p.rev){var ok=sel===q.a;h+='<div class="qz-fb '+(ok?'ok':'ko')+'"><b>'+(ok?'Acertou! 🎉':'Não foi dessa vez 😕')+'</b><p>'+X.esc(q.e)+'</p></div><button class="btn qz-nx" onclick="QZB.nxt()">'+(p.ans.length>=n?'Ver resultado →':'Próxima →')+'</button>'}
return h+'</div>'}

return {card:card,page:page,pick:pick,nxt:nxt,again:again}
})();
