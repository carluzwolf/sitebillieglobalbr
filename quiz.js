/* Billie Quiz — página #/quiz (login, XP, níveis, ranking, conquistas).
   Carregada sob demanda pelo index.html (usa t, LI, esc, $, stitle, paint, SITE do site). */
var QZ=(function(){
"use strict";
/* ====== CONFIG DO FIREBASE (as chaves web do Firebase são públicas por natureza; a segurança está nas regras do banco) ====== */
var CFG={apiKey:"AIzaSyBRnitmkaXTvn46Nvb7Xsd2Cf-4h4hh-24",authDomain:"siteoficial-e0823.firebaseapp.com",databaseURL:"https://siteoficial-e0823-default-rtdb.firebaseio.com",projectId:"siteoficial-e0823",storageBucket:"siteoficial-e0823.firebasestorage.app",messagingSenderId:"284014388487",appId:"1:284014388487:web:3c81b3c7f3d2a1e9e151a2"};
var SDK="https://www.gstatic.com/firebasejs/10.14.1/";
/* ====== REGRAS DO JOGO (ajuste aqui) ====== */
var N=10,CORRECT_XP=10,DONE_XP=20,PERFECT_XP=30,CHECKIN_XP=5,WEEK_GOAL=5,WEEK_XP=50;
/* Compartilhe e ganhe: cada 5 envios no WhatsApp = 50 XP, no máximo 4 vezes por dia (200 XP) */
var SH_PER=5,SH_XP=50,SH_DAY=4,SH_MAX=SH_PER*SH_DAY,SH_WAIT=600000,SH_KEY="bg_shp";
var CANAL=(typeof LINK_CANAL!=="undefined"&&LINK_CANAL)||"https://whatsapp.com/channel/0029VavaVBp5kg77PEh3Bq2g";

/* IDs (UID do Firebase) das contas verificadas. Cole aqui o ID do CARLUZ. */
var VERIF=["NaIW7JOJxVVr3T4RKfn5VF7u66T2","AZRqSxjFM8Sdjaa46atZ63M4lJc2"];
function vb(id){return VERIF.indexOf(id)>-1?' <img class="qz-vf" src="/verificado.png" alt="Verificado" title="Conta verificada">':""}
/* EMBLEMAS (pins) — ficam aqui para aparecerem para sempre, mesmo se o bonus.js for apagado.
   Imagens em /pins/ (suba os arquivos com esses nomes ou ajuste os caminhos). */
var PINS={birds:{n:"Birds of a Feather",img:"/pins/birds-of-a-feather.png"},chihiro:{n:"Chihiro",img:"/pins/chihiro.png"},lunch:{n:"Lunch",img:"/pins/lunch.png"}};
/* MOLDURAS — círculo em volta da foto (perfil e ranking). Vazio por enquanto.
   Para criar uma: FRAMES.ouro={n:{pt:"Ouro"...}}; use n:["PT","EN","ES"] e c:"cor ou gradiente CSS".
   Para dar a alguém: gravar users/UID/own/f_ouro = 1 (o id no banco leva o prefixo f_). */
var FRAMES={};
function avf(p,n,sz,fid){var a=av(p,n,sz);if(typeof fid!=="string"||!FRAMES.hasOwnProperty(fid))return a;return '<span class="qz-fw" style="background:'+FRAMES[fid].c+'">'+a+'</span>'}
function pinImg(id){var p=(typeof id==="string"&&PINS.hasOwnProperty(id))?PINS[id]:null;return p?' <img class="qz-pin" src="'+p.img+'" alt="'+ea(p.n)+'" title="'+ea(p.n)+'">':""}
var S={user:null,me:null,known:false,fbErr:false,ready:false,quiz:null,quizErr:false,play:null,rank:null,rankT:0,rankErr:false,busy:false,err:"",info:"",mode:"in",view:"hub",fEm:"",fNm:""};

/* ====== TEXTOS (pt / en / es) ====== */
var T={
gT:["Minha galeria","My gallery","Mi galería"],
gD:["Toque em um item para equipar. Toque de novo para desequipar.","Tap an item to equip it. Tap again to unequip.","Toca un elemento para equiparlo. Toca de nuevo para quitarlo."],
gB:["Emblemas","Badges","Insignias"],gF:["Molduras","Frames","Marcos"],gX:["Efeito de nome","Name effect","Efecto de nombre"],
gEq:["Equipado","Equipped","Equipado"],gNo:["Nenhum equipado","None equipped","Ninguno equipado"],
gE1:["Você ainda não tem emblemas. Participe dos desafios para ganhar!","You have no badges yet. Join the challenges to earn some!","Aún no tienes insignias. ¡Participa en los desafíos para ganar!"],
gE2:["Você ainda não tem molduras.","You have no frames yet.","Aún no tienes marcos."],
gE3:["Você ainda não tem efeitos de nome.","You have no name effects yet.","Aún no tienes efectos de nombre."],
gNeon:["Verde neon","Neon green","Verde neón"],gErr:["Não foi possível salvar. Tente de novo.","Could not save. Try again.","No se pudo guardar. Inténtalo de nuevo."],gOk:["Atualizado! ✅","Updated! ✅","¡Actualizado! ✅"],
title:["Billie Quiz","Billie Quiz","Billie Quiz"],
stSub:["Jogue, ganhe XP e suba no ranking","Play, earn XP and climb the ranking","Juega, gana XP y sube en el ranking"],
tQ:["🎯 Quiz","🎯 Quiz","🎯 Quiz"],tR:["🏆 Ranking","🏆 Ranking","🏆 Ranking"],tP:["👤 Perfil","👤 Profile","👤 Perfil"],
loading:["Carregando…","Loading…","Cargando…"],
fbErr:["Não foi possível conectar ao servidor. Tente novamente em instantes.","Couldn't connect to the server. Please try again shortly.","No se pudo conectar al servidor. Inténtalo de nuevo en unos instantes."],
quizErr:["O quiz de hoje não pôde ser carregado. Tente novamente em instantes.","Today's quiz couldn't be loaded. Please try again shortly.","No se pudo cargar el quiz de hoy. Inténtalo de nuevo en unos instantes."],
heroT:["Entre para jogar","Sign in to play","Entra para jugar"],
heroD:["Todo dia tem 10 perguntas novas sobre a Billie, criadas com IA. Cada acerto vale XP, você sobe de nível, desbloqueia conquistas e entra no ranking dos fãs.","Every day there are 10 new questions about Billie, made with AI. Each right answer earns XP, you level up, unlock achievements and join the fan ranking.","Cada día hay 10 preguntas nuevas sobre Billie, creadas con IA. Cada acierto da XP, subes de nivel, desbloqueas logros y entras en el ranking de fans."],
login:["Entrar","Sign in","Entrar"],signup:["Criar conta","Create account","Crear cuenta"],
email:["E-mail","Email","Correo electrónico"],pass:["Senha (mín. 6 caracteres)","Password (min. 6 characters)","Contraseña (mín. 6 caracteres)"],nameF:["Seu nome de fã","Your fan name","Tu nombre de fan"],
google:["Continuar com Google","Continue with Google","Continuar con Google"],or:["ou","or","o"],
toUp:["Não tem conta? Criar conta","No account? Create one","¿No tienes cuenta? Crea una"],toIn:["Já tem conta? Entrar","Already have an account? Sign in","¿Ya tienes cuenta? Entra"],
forgot:["Esqueci a senha","Forgot password","Olvidé mi contraseña"],resetOk:["Enviamos um e-mail para redefinir sua senha.","We sent you an email to reset your password.","Te enviamos un correo para restablecer tu contraseña."],
needEm:["Digite seu e-mail acima primeiro.","Type your email above first.","Escribe tu correo arriba primero."],
"e_name":["Digite um nome de pelo menos 2 letras.","Enter a name with at least 2 letters.","Escribe un nombre de al menos 2 letras."],
"e_invalid-credential":["E-mail ou senha incorretos.","Wrong email or password.","Correo o contraseña incorrectos."],
"e_wrong-password":["E-mail ou senha incorretos.","Wrong email or password.","Correo o contraseña incorrectos."],
"e_user-not-found":["E-mail ou senha incorretos.","Wrong email or password.","Correo o contraseña incorrectos."],
"e_invalid-email":["E-mail inválido.","Invalid email.","Correo no válido."],
"e_email-already-in-use":["Este e-mail já tem conta. Use “Entrar”.","This email already has an account. Use “Sign in”.","Este correo ya tiene cuenta. Usa “Entrar”."],
"e_weak-password":["Senha muito fraca (mínimo 6 caracteres).","Password too weak (min. 6 characters).","Contraseña muy débil (mínimo 6 caracteres)."],
"e_missing-password":["Digite a senha.","Enter your password.","Escribe la contraseña."],
"e_too-many-requests":["Muitas tentativas. Aguarde um pouco e tente de novo.","Too many attempts. Wait a bit and try again.","Demasiados intentos. Espera un poco e inténtalo de nuevo."],
"e_network-request-failed":["Sem conexão. Verifique sua internet.","No connection. Check your internet.","Sin conexión. Revisa tu internet."],
"e_def":["Algo deu errado. Tente novamente.","Something went wrong. Please try again.","Algo salió mal. Inténtalo de nuevo."],
dT:["Quiz do dia","Daily quiz","Quiz del día"],
dD:["10 perguntas novas todo dia. Cada acerto vale 10 XP, e há bônus por concluir e por gabaritar.","10 new questions every day. Each right answer is worth 10 XP, with bonuses for finishing and for a perfect score.","10 preguntas nuevas cada día. Cada acierto vale 10 XP, con bonos por terminar y por acertar todo."],
start:["Começar o quiz de hoje","Start today's quiz","Empezar el quiz de hoy"],cont:["Continuar o quiz","Continue the quiz","Continuar el quiz"],
doneT:["Quiz de hoje concluído ✅","Today's quiz done ✅","Quiz de hoy completado ✅"],
doneS:["Você acertou {n} de {t}. Volte amanhã para novas perguntas!","You got {n} of {t} right. Come back tomorrow for new questions!","Acertaste {n} de {t}. ¡Vuelve mañana para nuevas preguntas!"],
qn:["Pergunta {i} de {n}","Question {i} of {n}","Pregunta {i} de {n}"],
ok:["Acertou! 🎉","Correct! 🎉","¡Correcto! 🎉"],ko:["Não foi dessa vez 😕","Not this time 😕","Esta vez no 😕"],
next:["Próxima →","Next →","Siguiente →"],seeRes:["Ver resultado →","See result →","Ver resultado →"],
saving:["Salvando sua pontuação…","Saving your score…","Guardando tu puntuación…"],saveErr:["Não foi possível salvar. Verifique a conexão.","Couldn't save. Check your connection.","No se pudo guardar. Revisa la conexión."],retry:["Tentar novamente","Try again","Reintentar"],
resT:["Resultado","Result","Resultado"],resS:["{n} de {t} acertos","{n} of {t} correct","{n} de {t} aciertos"],
lbC:["Acertos","Correct answers","Aciertos"],lbD:["Quiz concluído","Quiz completed","Quiz completado"],lbP:["Gabaritou!","Perfect score!","¡Puntaje perfecto!"],lbS:["Sequência de dias","Day streak","Racha de días"],lbW:["Desafio semanal","Weekly challenge","Desafío semanal"],
lvUp:["Você subiu de nível: {n}! 🎊","You leveled up: {n}! 🎊","¡Subiste de nivel: {n}! 🎊"],newA:["Nova conquista","New achievement","Nuevo logro"],
share:["Compartilhar no WhatsApp","Share on WhatsApp","Compartir en WhatsApp"],
shareTx:["Fiz {n}/{t} no Billie Quiz e sou “{lv}” no Billie Global BR! Será que você faz mais? 🖤","I got {n}/{t} on the Billie Quiz and I'm a “{lv}” on Billie Global BR! Can you beat me? 🖤","¡Hice {n}/{t} en el Billie Quiz y soy “{lv}” en Billie Global BR! ¿Puedes superarme? 🖤"],
wT:["Desafio da semana","Weekly challenge","Desafío de la semana"],
wD:["Complete {g} quizzes nesta semana e ganhe +{x} XP.","Complete {g} quizzes this week and earn +{x} XP.","Completa {g} quizzes esta semana y gana +{x} XP."],
wDone:["Desafio concluído! +{x} XP ganhos 🎉","Challenge complete! +{x} XP earned 🎉","¡Desafío completado! +{x} XP ganados 🎉"],
streak:["Sequência","Streak","Racha"],days:["dias","days","días"],day1:["dia","day","día"],
ci:["Check-in diário feito: +{x} XP","Daily check-in done: +{x} XP","Check-in diario hecho: +{x} XP"],
lvl:["Nível","Level","Nivel"],toNext:["{n} XP para “{lv}”","{n} XP to “{lv}”","{n} XP para “{lv}”"],maxLv:["Nível máximo! 👑","Max level! 👑","¡Nivel máximo! 👑"],
rT:["Ranking dos fãs","Fan ranking","Ranking de fans"],rS:["Top 50 por XP","Top 50 by XP","Top 50 por XP"],you:["você","you","tú"],
rEmpty:["Ninguém no ranking ainda. Seja o primeiro!","Nobody on the ranking yet. Be the first!","Nadie en el ranking aún. ¡Sé el primero!"],
rNot:["Você ainda não está no top 50. Continue jogando!","You're not in the top 50 yet. Keep playing!","Aún no estás en el top 50. ¡Sigue jugando!"],
rErr:["Não foi possível carregar o ranking.","Couldn't load the ranking.","No se pudo cargar el ranking."],
pT:["Meu perfil","My profile","Mi perfil"],photo:["Trocar foto","Change photo","Cambiar foto"],nameL:["Nome","Name","Nombre"],save:["Salvar","Save","Guardar"],saved:["Salvo! ✅","Saved! ✅","¡Guardado! ✅"],
logout:["Sair da conta","Sign out","Cerrar sesión"],
stQ:["Quizzes feitos","Quizzes done","Quizzes hechos"],stP:["Gabaritos","Perfect scores","Puntajes perfectos"],stA:["Aproveitamento","Accuracy","Aprovechamiento"],stX:["XP total","Total XP","XP total"],
aT:["Histórico de conquistas","Achievements","Historial de logros"],aLock:["Bloqueada","Locked","Bloqueado"],
lvT:["Níveis","Levels","Niveles"],
shT:["Compartilhe e ganhe","Share and earn","Comparte y gana"],
shD:["Envie o canal de WhatsApp da Billie Global BR para {n} contatos e ganhe +{x} XP. Dá para repetir até {m} vezes por dia (até {t} XP).","Send the Billie Global BR WhatsApp channel to {n} contacts and earn +{x} XP. You can repeat up to {m} times a day (up to {t} XP).","Envía el canal de WhatsApp de Billie Global BR a {n} contactos y gana +{x} XP. Puedes repetir hasta {m} veces al día (hasta {t} XP)."],
shBtn:["Compartilhar no WhatsApp","Share on WhatsApp","Compartir en WhatsApp"],
shProg:["{c}/{n} envios · hoje: {g}/{t} XP","{c}/{n} sends · today: {g}/{t} XP","{c}/{n} envíos · hoy: {g}/{t} XP"],
shTx:["Ei! Acompanhe a Billie Eilish pelo canal de WhatsApp, o maior canal de WhatsApp do Brasil sobre a Billie Eilish. Acompanhe pela Billie Global BR 🖤\n\n{l}","Hey! Follow Billie Eilish on WhatsApp, the biggest WhatsApp channel in Brazil about Billie Eilish. Follow it through Billie Global BR 🖤\n\n{l}","¡Ey! Sigue a Billie Eilish en WhatsApp, el canal de WhatsApp más grande de Brasil sobre Billie Eilish. Síguela con Billie Global BR 🖤\n\n{l}"],
shWait:["Abrimos o WhatsApp. Selecione o contato, toque em enviar e volte para cá: contamos o envio quando você voltar.","We opened WhatsApp. Pick a contact, tap send and come back here: we count the send when you return.","Abrimos WhatsApp. Elige un contacto, toca en enviar y vuelve aquí: contamos el envío cuando regreses."],
shOk:["Envio contado! {c}/{n} 🎉","Send counted! {c}/{n} 🎉","¡Envío contado! {c}/{n} 🎉"],
shWin:["Barrinha completa! +{x} XP ganhos 🎉","Bar complete! +{x} XP earned 🎉","¡Barra completa! +{x} XP ganados 🎉"],
shShort:["Você voltou rápido demais, então não contamos esse envio. Toque no botão, escolha o contato e envie a mensagem.","You came back too fast, so we did not count that send. Tap the button, pick a contact and send the message.","Volviste demasiado rápido, así que no contamos ese envío. Toca el botón, elige un contacto y envía el mensaje."],
shFull:["Limite de hoje atingido (+{t} XP). Volte amanhã para compartilhar de novo!","Today's limit reached (+{t} XP). Come back tomorrow to share again!","Límite de hoy alcanzado (+{t} XP). ¡Vuelve mañana para compartir de nuevo!"],
shErr:["Não foi possível salvar o envio agora. Tente de novo.","Could not save the send right now. Try again.","No se pudo guardar el envío ahora. Inténtalo de nuevo."],
shPopT:["Compartilhe e ganhe XP 💚","Share and earn XP 💚","Comparte y gana XP 💚"],
shLater:["Agora não","Not now","Ahora no"]
};
function L(k,o){var a=T[k],s=a?a[LI]:k;if(o)for(var x in o)s=s.split("{"+x+"}").join(o[x]);return s}

/* ====== NÍVEIS (em vez de ouro/prata/bronze) ====== */
var LV=[
{x:0,ic:"🎧",n:["Ouvinte","Listener","Oyente"]},
{x:100,ic:"🖤",n:["Fã da Billie","Billie Fan","Fan de Billie"]},
{x:300,ic:"🔥",n:["Fãzaço","Super Fan","Superfán"]},
{x:700,ic:"🎫",n:["Fã de Carteirinha","Card-Carrying Fan","Fan Oficial"]},
{x:1300,ic:"🎓",n:["Mestre da Billie","Billie Master","Maestro de Billie"]},
{x:2200,ic:"⚖️",n:["Advogado da Billie","Billie's Lawyer","Abogado de Billie"]},
{x:3500,ic:"📖",n:["Enciclopédia Eilish","Eilish Encyclopedia","Enciclopedia Eilish"]},
{x:5500,ic:"👑",n:["Lenda do Fandom","Fandom Legend","Leyenda del Fandom"]},
{x:8000,ic:"💎",n:["Eilish Eterno","Eternal Eilish","Eilish Eterno"]}];
function lvOf(xp){xp=xp||0;var i=0;for(var k=0;k<LV.length;k++)if(xp>=LV[k].x)i=k;var c=LV[i],nx=LV[i+1];
return {i:i,ic:c.ic,n:c.n[LI],next:nx?nx.x:null,nn:nx?nx.n[LI]:"",pct:nx?Math.max(2,Math.round((xp-c.x)/(nx.x-c.x)*100)):100}}

/* ====== DATAS (horário de Brasília, igual ao quiz.json) ====== */
function today(){return new Date(Date.now()-10800000).toISOString().slice(0,10)}
function addDays(k,n){var d=new Date(k+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function weekKey(k){var d=new Date(k+"T00:00:00Z");d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7)+3);var y=d.getUTCFullYear(),f=new Date(Date.UTC(y,0,4));f.setUTCDate(f.getUTCDate()-((f.getUTCDay()+6)%7)+3);var w=1+Math.round((d-f)/6048e5);return y+"-W"+(w<10?"0":"")+w}

/* ====== ESTATÍSTICAS E CONQUISTAS ====== */
function ds(m){var o=[],d=(m&&m.days)||{};Object.keys(d).forEach(function(k){if(d[k]&&typeof d[k].s==="number")o.push(d[k].s)});return o}
function cnt(m){return ds(m).length}
function perf(m){return ds(m).filter(function(s){return s>=N}).length}
function wkCount(m,td){var wk=weekKey(td),d=(m&&m.days)||{};return Object.keys(d).filter(function(k){return weekKey(k)===wk&&d[k]&&typeof d[k].s==="number"}).length}
var A=[
{id:"first",ic:"🎤",n:["Primeiro quiz","First quiz","Primer quiz"],d:["Complete seu primeiro quiz diário.","Finish your first daily quiz.","Completa tu primer quiz diario."],t:function(m){return cnt(m)>=1}},
{id:"perfect",ic:"💯",n:["Gabaritou!","Perfect score!","¡Puntaje perfecto!"],d:["Acerte as 10 perguntas de um quiz.","Get all 10 questions right.","Acierta las 10 preguntas de un quiz."],t:function(m){return perf(m)>=1}},
{id:"s3",ic:"🔥",n:["3 dias seguidos","3-day streak","3 días seguidos"],d:["Visite o site 3 dias seguidos.","Visit the site 3 days in a row.","Visita el sitio 3 días seguidos."],t:function(m){return (m.streak||0)>=3}},
{id:"s7",ic:"⚡",n:["7 dias seguidos","7-day streak","7 días seguidos"],d:["Visite o site 7 dias seguidos.","Visit the site 7 days in a row.","Visita el sitio 7 días seguidos."],t:function(m){return (m.streak||0)>=7}},
{id:"s30",ic:"🌙",n:["30 dias seguidos","30-day streak","30 días seguidos"],d:["Visite o site 30 dias seguidos.","Visit the site 30 days in a row.","Visita el sitio 30 días seguidos."],t:function(m){return (m.streak||0)>=30}},
{id:"q10",ic:"📚",n:["10 quizzes","10 quizzes","10 quizzes"],d:["Complete 10 quizzes diários.","Complete 10 daily quizzes.","Completa 10 quizzes diarios."],t:function(m){return cnt(m)>=10}},
{id:"q50",ic:"🏅",n:["50 quizzes","50 quizzes","50 quizzes"],d:["Complete 50 quizzes diários.","Complete 50 daily quizzes.","Completa 50 quizzes diarios."],t:function(m){return cnt(m)>=50}},
{id:"wk",ic:"🏆",n:["Desafio semanal","Weekly challenge","Desafío semanal"],d:["Conclua um desafio semanal.","Complete a weekly challenge.","Completa un desafío semanal."],t:function(m){return !!m.wk&&Object.keys(m.wk).length>=1}},
{id:"lv5",ic:"🎓",n:["Mestre da Billie","Billie Master","Maestro de Billie"],d:["Chegue ao nível “Mestre da Billie”.","Reach the “Billie Master” level.","Llega al nivel “Maestro de Billie”."],t:function(m){return lvOf(m.xp).i>=4}},
{id:"lv9",ic:"💎",n:["Eilish Eterno","Eternal Eilish","Eilish Eterno"],d:["Chegue ao nível máximo.","Reach the maximum level.","Llega al nivel máximo."],t:function(m){return lvOf(m.xp).i>=8}}];

/* ====== HELPERS ====== */
function ea(x){return esc(x).replace(/"/g,"&quot;")}
function okPh(u){return typeof u==="string"&&u.length<15000&&/^(https:\/\/|data:image\/(jpeg|png|webp);base64,)/.test(u)}
function av(p,n,sz){sz=sz||40;var st='width:'+sz+'px;height:'+sz+'px';return okPh(p)?'<img class="qz-av" style="'+st+'" referrerpolicy="no-referrer" alt="" src="'+ea(p)+'">':'<span class="qz-av" style="'+st+';font-size:'+Math.round(sz*.45)+'px">'+esc(String(n||"?").trim().charAt(0).toUpperCase())+'</span>'}
function setP(o,path,v){var a=path.split("/"),c=o;for(var i=0;i<a.length-1;i++){if(!c[a[i]]||typeof c[a[i]]!=="object")c[a[i]]={};c=c[a[i]]}c[a[a.length-1]]=v}
function loadJS(u){return new Promise(function(res,rej){var s=document.createElement("script");s.src=u;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
function qs(){return S.quiz?S.quiz.qs.slice(0,N):[]}
function pkey(){return "bg_qzp_"+S.user.uid+"_"+S.quiz.date}
function doneScore(){var d=S.me&&S.quiz&&S.me.days&&S.me.days[S.quiz.date];return d&&typeof d.s==="number"?d.s:null}
function hdr(){var b=$("bu");if(!b)return;b.innerHTML=(S.user&&S.me)?av(S.me.photo,S.me.name,30):'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>'}

/* ====== FIREBASE ====== */
function boot(){if(S.bootP)return S.bootP;
S.bootP=loadJS(SDK+"firebase-app-compat.js").then(function(){return Promise.all([loadJS(SDK+"firebase-auth-compat.js"),loadJS(SDK+"firebase-database-compat.js")])}).then(function(){
firebase.initializeApp(CFG);S.auth=firebase.auth();S.db=firebase.database();S.ready=true;
S.auth.getRedirectResult().catch(function(e){S.err=errMsg(e);redraw()});
S.db.ref("verified").on("value",function(v){var o=v.val()||{};Object.keys(o).forEach(function(k){if(o[k]===true&&VERIF.indexOf(k)<0)VERIF.push(k)});S.rankT=0;redraw()},function(){});S.auth.onAuthStateChanged(onAuth)}).catch(function(){S.fbErr=true;S.known=true;redraw()});return S.bootP}
function errMsg(e){var c=String((e&&e.code)||"").replace("auth/","");return (T["e_"+c]||T.e_def)[LI]}

function onAuth(u){S.user=u;S.known=true;S.gal=null;S.galB=0;try{localStorage.setItem("bg_qz",u?"1":"")}catch(e){}
if(!u){S.me=null;S.play=null;hdr();redraw();return}
loadMe(u).then(function(){hdr();redraw();return checkin()}).then(function(){hdr();redraw();shResume()}).catch(function(){S.fbErr=true;redraw()})}

function loadMe(u){return S.db.ref("users/"+u.uid).once("value").then(function(s){var v=s.val();if(v){S.me=v;return}
var nm=String(S.pend||u.displayName||(u.email||"").split("@")[0]||"Fã").trim().slice(0,30)||"Fã",ph=okPh(u.photoURL)?u.photoURL:"";
var me={name:nm,photo:ph,xp:0,streak:0,last:""},up={};up["users/"+u.uid]=me;up["rank/"+u.uid]={n:nm,p:ph,x:0};
return S.db.ref().update(up).then(function(){S.me=me})})}

/* grava XP + campos de uma vez (users e rank), já checando conquistas novas */
function commit(gain,f,x){var uid=S.user.uid,sim=JSON.parse(JSON.stringify(S.me)),old=S.me.xp||0,nx=old+gain,TS=firebase.database.ServerValue.TIMESTAMP,got=[];
Object.keys(f).forEach(function(k){setP(sim,k,f[k])});sim.xp=nx;
A.forEach(function(a){if(!(sim.ach&&sim.ach[a.id])&&a.t(sim)){got.push(a.id);f["ach/"+a.id]=TS;setP(sim,"ach/"+a.id,Date.now())}});
var u={};Object.keys(f).forEach(function(k){u["users/"+uid+"/"+k]=f[k]});u["users/"+uid+"/xp"]=nx;u["rank/"+uid+"/x"]=nx;if(x)Object.keys(x).forEach(function(k){u[k]=x[k]});
return S.db.ref().update(u).then(function(){Object.keys(f).forEach(function(k){setP(S.me,k,typeof f[k]==="object"?Date.now():f[k])});S.me.xp=nx;S.rankT=0;
return {got:got,up:lvOf(nx).i>lvOf(old).i?lvOf(nx):null}})}

function checkin(){var td=today(),m=S.me;if(!m)return;var d=m.days&&m.days[td];if(d&&d.ci)return;
var st=m.last===addDays(td,-1)?(m.streak||0)+1:1,f={streak:st,last:td};f["days/"+td+"/ci"]=1;return commit(CHECKIN_XP,f)}

/* ====== QUIZ DO DIA (quiz.json gerado por IA todo dia; se faltar, usa o banco de reserva) ====== */
function seeded(str){var h=1779033703^str.length;for(var i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}
return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return (h>>>0)/4294967296}}
function pickQuiz(j){var td=today();
if(j&&j.date===td&&Array.isArray(j.questions)&&j.questions.length>=N)return {date:td,qs:j.questions,ai:true};
var b=(j&&j.bank)||[];if(b.length<N)return null;var r=seeded(td),a=b.slice();
for(var i=a.length-1;i>0;i--){var k=Math.floor(r()*(i+1)),x=a[i];a[i]=a[k];a[k]=x}
return {date:td,qs:a.slice(0,N),ai:false}}
function loadQuiz(){if(S.quiz||S.quizLoading)return;S.quizLoading=true;
fetch("/quiz.json?"+Math.floor(Date.now()/300000)).then(function(r){return r.ok?r.json():Promise.reject()}).then(function(j){S.quiz=pickQuiz(j);S.quizErr=!S.quiz;S.quizLoading=false;redraw()}).catch(function(){S.quizErr=true;S.quizLoading=false;redraw()})}
function ensurePlay(){if(!S.user||!S.quiz)return;var k=pkey();if(S.play&&S.play.k===k)return;var a=[];try{a=JSON.parse(localStorage.getItem(k)||"[]")}catch(e){}
S.play={k:k,ans:Array.isArray(a)?a.filter(function(v){return v>=0&&v<4}).slice(0,N):[],rev:false,fin:false,res:null,saveErr:false}}
function sv(){try{localStorage.setItem(S.play.k,JSON.stringify(S.play.ans))}catch(e){}}
function pick(k){var p=S.play;if(!p||p.rev||p.fin)return;p.ans.push(k);p.rev=true;sv();redraw()}
function nxt(){var p=S.play;if(!p||!p.rev)return;p.rev=false;if(p.ans.length>=qs().length)finish();else redraw()}
function finish(){var p=S.play,q=qs(),td=S.quiz.date,m=S.me;if(!p||p.fin)return;
if(doneScore()!==null){location.hash="#/quiz";return}
var sc=0;p.ans.forEach(function(a,i){if(q[i]&&a===q[i].a)sc++});
var lines=[[L("lbC")+" ("+sc+"×"+CORRECT_XP+")",sc*CORRECT_XP],[L("lbD"),DONE_XP]],gain=sc*CORRECT_XP+DONE_XP,f={};
if(sc>=q.length){lines.push([L("lbP"),PERFECT_XP]);gain+=PERFECT_XP}
var sb=Math.min(m.streak||0,7)*3;if(sb>0){lines.push([L("lbS"),sb]);gain+=sb}
f["days/"+td+"/s"]=sc;
var wk=weekKey(td),c=wkCount(m,td)+1;
if(c>=WEEK_GOAL&&!(m.wk&&m.wk[wk])){f["wk/"+wk]=1;lines.push([L("lbW"),WEEK_XP]);gain+=WEEK_XP}
p.fin=true;p.saveErr=false;p.saving=true;redraw();
commit(gain,f).then(function(r){p.saving=false;p.res={sc:sc,t:q.length,gain:gain,lines:lines,up:r.up,got:r.got};redraw()}).catch(function(){p.saving=false;p.fin=false;p.saveErr=true;redraw()})}

/* ====== DESAFIO BÔNUS (arquivo removível: /bonus.js — apague o arquivo e o desafio some) ====== */
var X={S:S,commit:commit,redraw:redraw,PINS:PINS,pinImg:pinImg,esc:function(v){return esc(v)}};
function loadBonus(){if(S.bzTried)return;S.bzTried=true;var s=document.createElement("script");s.src="/bonus.js?"+Math.floor(Date.now()/60000);
s.onload=function(){redraw()};s.onerror=function(){S.bzFail=true;redraw()};document.head.appendChild(s)}
function bonusCard(){try{return window.QZB?QZB.card(X):""}catch(e){return ""}}
function bonusPage(){try{if(window.QZB)return QZB.page(X)}catch(e){}
if(!S.bzFail)return '<div class="empty">'+L("loading")+'</div>';
setTimeout(function(){location.hash="#/quiz"},0);return ""}

/* ====== COMPARTILHE E GANHE (WhatsApp) ======
   O site não consegue "ver" dentro do WhatsApp. A detecção é: o botão abre o WhatsApp; o envio só conta
   quando a pessoa VOLTA para o site depois de ficar fora por pelo menos SH_AWAY (10s). Cada envio exige novo clique. */
function shCnt(){var m=S.me,d=m&&m.days&&m.days[today()];return Math.max(0,Math.min(SH_MAX,(d&&typeof d.sh==="number")?d.sh:0))}
function shTxt(){return L("shTx",{l:CANAL})}
function shStyle(){if(document.getElementById("qz-sh-css"))return;var s=document.createElement("style");s.id="qz-sh-css";
s.textContent=".qz-sh .qz-bar{height:14px}.qz-sh .btn{width:100%;text-align:center;margin-top:6px}.qz-sh .btn[disabled]{opacity:.55}.qz-sh .qz-msg{margin:8px 0 0}"+
"#qz-pop{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:18px}"+
"#qz-pop .qz-card{max-width:420px;width:100%;margin:0;text-align:center}#qz-pop .btn{width:100%;margin-top:8px}";document.head.appendChild(s)}
function shAway(){if(!S.shLeft)S.shLeft=Date.now()}
function shBack(){var p=S.shPend,left=S.shLeft;S.shLeft=0;if(!p||!left||!S.user||!S.me)return;
S.shPend=0;try{localStorage.removeItem(SH_KEY)}catch(e){}
if(Date.now()-p>SH_WAIT){S.shMsg="";redraw();return}
shCount()}
/* se o site recarregou ao clicar (acontece ao abrir o WhatsApp), conta o envio assim que a conta carrega */
function shResume(){var p=0;try{p=parseInt(localStorage.getItem(SH_KEY)||"0",10)||0;localStorage.removeItem(SH_KEY)}catch(e){}
if(!p||Date.now()-p>SH_WAIT||!S.user||!S.me)return;S.shPend=0;shCount()}
function shCount(){if(S.shBusy||!S.user||!S.me)return;var td=today(),n=shCnt();
if(n>=SH_MAX){S.shMsg=L("shFull",{t:SH_XP*SH_DAY});S.shKind="ok";redraw();return}
var nn=n+1,f={},gain=0,win=nn%SH_PER===0;f["days/"+td+"/sh"]=nn;if(win){f["days/"+td+"/shr"]=nn/SH_PER;gain=SH_XP}
S.shBusy=true;S.shMsg="";
commit(gain,f).then(function(r){S.shBusy=false;
S.shMsg=win?L("shWin",{x:SH_XP}):L("shOk",{c:nn%SH_PER,n:SH_PER});S.shKind="ok";
if(win&&r&&r.up)S.shMsg+=" "+L("lvUp",{n:r.up.ic+" "+r.up.n});
redraw()}).catch(function(){S.shBusy=false;S.shMsg=L("shErr");S.shKind="bad";redraw()})}
function shareCanal(){if(!S.user||!S.me||S.shBusy)return;if(shCnt()>=SH_MAX){S.shMsg=L("shFull",{t:SH_XP*SH_DAY});S.shKind="ok";redraw();return}
shClosePop();S.shPend=Date.now();S.shLeft=0;try{localStorage.setItem(SH_KEY,String(S.shPend))}catch(e){}S.shMsg=L("shWait");S.shKind="";
var u="https://wa.me/?text="+encodeURIComponent(shTxt());
var w=null;try{w=window.open(u,"_blank")}catch(e){}
if(!w)location.href=u;
redraw()}
function shBox(){var n=shCnt(),c=n%SH_PER,full=n>=SH_MAX,g=Math.floor(n/SH_PER)*SH_XP;
return '<div class="qz-card qz-sh"><h3>📲 '+L("shT")+'</h3><p>'+L("shD",{n:SH_PER,x:SH_XP,m:SH_DAY,t:SH_XP*SH_DAY})+'</p>'+bar(full?100:Math.round(c/SH_PER*100))+
'<small>'+L("shProg",{c:full?SH_PER:c,n:SH_PER,g:g,t:SH_XP*SH_DAY})+'</small>'+
(S.shMsg?'<div class="qz-msg'+(S.shKind?' '+S.shKind:'')+'">'+esc(S.shMsg)+'</div>':'')+
(full?'<div class="qz-msg ok">'+L("shFull",{t:SH_XP*SH_DAY})+'</div>':'<button class="btn" type="button" onclick="QZ.shareCanal()"'+(S.shBusy?' disabled':'')+'>💚 '+L("shBtn")+'</button>')+'</div>'}
function shClosePop(){var e=document.getElementById("qz-pop");if(e)e.remove()}
function shPopKey(){return "bg_qzpop_"+today()}
function shPopClose(){try{localStorage.setItem(shPopKey(),"1")}catch(e){}shClosePop()}
function shPop(){if(!S.user||!S.me||S.view!=="hub"||S.shPopDone||shCnt()>=SH_MAX)return;S.shPopDone=true;
try{if(localStorage.getItem(shPopKey()))return}catch(e){}
shStyle();shClosePop();var d=document.createElement("div");d.id="qz-pop";
d.innerHTML='<div class="qz-card qz-sh"><h3>'+L("shPopT")+'</h3><p>'+L("shD",{n:SH_PER,x:SH_XP,m:SH_DAY,t:SH_XP*SH_DAY})+'</p><button class="btn" type="button" onclick="QZ.shareCanal()">💚 '+L("shBtn")+'</button><button class="btn o" type="button" onclick="QZ.shPopClose()">'+L("shLater")+'</button></div>';
d.addEventListener("click",function(e){if(e.target===d)shPopClose()});document.body.appendChild(d)}
document.addEventListener("visibilitychange",function(){if(document.hidden)shAway();else shBack()});
window.addEventListener("blur",function(){if(S.shPend)shAway()});window.addEventListener("focus",function(){if(S.shPend)shBack()});
window.addEventListener("pageshow",function(){if(S.shPend){if(!S.shLeft)S.shLeft=S.shPend;shBack()}});

/* ====== AUTENTICAÇÃO ====== */
function go(){var em=($("qz-em")||{}).value||"",pw=($("qz-pw")||{}).value||"",nm=$("qz-nm")?$("qz-nm").value.trim():"";
S.fEm=em.trim();S.fNm=nm;S.err="";S.info="";
if(S.mode==="up"){if(nm.length<2){S.err=L("e_name");return redraw()}S.pend=nm.slice(0,30)}
S.busy=true;redraw();
(S.mode==="up"?S.auth.createUserWithEmailAndPassword(S.fEm,pw):S.auth.signInWithEmailAndPassword(S.fEm,pw)).then(function(c){S.busy=false;
if(S.mode==="up"&&c.user)c.user.updateProfile({displayName:S.pend}).catch(function(){});}).catch(function(e){S.busy=false;S.err=errMsg(e);redraw()})}
function google(){S.err="";var pr=new firebase.auth.GoogleAuthProvider();
S.auth.signInWithPopup(pr).catch(function(e){var c=e&&e.code;
if(c==="auth/popup-blocked"||c==="auth/operation-not-supported-in-this-environment")return S.auth.signInWithRedirect(pr);
if(c!=="auth/popup-closed-by-user"&&c!=="auth/cancelled-popup-request"){S.err=errMsg(e);redraw()}})}
function sw(){S.mode=S.mode==="in"?"up":"in";S.err="";S.info="";redraw()}
function forgot(){var em=($("qz-em")||{}).value||"";em=em.trim();S.fEm=em;S.err="";S.info="";if(!em){S.err=L("needEm");return redraw()}
S.auth.sendPasswordResetEmail(em).then(function(){S.info=L("resetOk");redraw()}).catch(function(e){S.err=errMsg(e);redraw()})}
function logout(){S.auth.signOut().then(function(){S.play=null;location.hash="#/quiz"})}

/* ====== PERFIL ====== */
function saveProf(name,photo){var uid=S.user.uid,u={};
if(name!=null){u["users/"+uid+"/name"]=name;u["rank/"+uid+"/n"]=name}
if(photo!=null){u["users/"+uid+"/photo"]=photo;u["rank/"+uid+"/p"]=photo}
return S.db.ref().update(u).then(function(){if(name!=null)S.me.name=name;if(photo!=null)S.me.photo=photo;S.rankT=0;hdr()})}
function saveName(){var v=($("qz-pn")||{}).value||"";v=v.trim().slice(0,30);if(v.length<2){S.err=L("e_name");return redraw()}
S.err="";saveProf(v,null).then(function(){S.info=L("saved");redraw()}).catch(function(){S.err=L("e_def");redraw()})}
function photo(inp){var f=inp.files&&inp.files[0];if(!f)return;var r=new FileReader();
r.onload=function(){var im=new Image();im.onload=function(){var c=document.createElement("canvas"),z=96;c.width=c.height=z;var x=c.getContext("2d"),s=Math.min(im.width,im.height);
x.drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,z,z);var d=c.toDataURL("image/jpeg",.72);
saveProf(null,d).then(function(){S.info=L("saved");redraw()}).catch(function(){S.err=L("e_def");redraw()})};
im.onerror=function(){S.err=L("e_def");redraw()};im.src=r.result};r.readAsDataURL(f)}

/* ====== GALERIA (emblemas, molduras, efeito de nome) ====== */
function loadGal(){if(!S.user||!S.db||!S.me)return;var uid=S.user.uid,m=S.me,ids=Object.keys(PINS);
Promise.all([S.db.ref("rank/"+uid).once("value")].concat(ids.map(function(i){return S.db.ref("pins/"+i+"/"+uid).once("value")}))).then(function(r){
var rk=r[0].val()||{},mo=m.own||{},g={pins:{},frames:{},neon:false},mg={};
ids.forEach(function(id,i){if(r[i+1].exists()||m.pin===id)g.pins[id]=1});
Object.keys(mo).forEach(function(k){if(k.indexOf("f_")===0&&FRAMES.hasOwnProperty(k.slice(2)))g.frames[k.slice(2)]=1});
g.neon=rk.g===1||!!mo.neon||m.fx==="neon";
if(rk.g===1&&!(mo.neon&&m.fx==="neon")){mg["users/"+uid+"/own/neon"]=1;mg["users/"+uid+"/fx"]="neon";m.own=m.own||{};m.own.neon=1;m.fx="neon"}
S.gal=g;if(Object.keys(mg).length)S.db.ref().update(mg).catch(function(){});redraw()}).catch(function(){S.gal={pins:{},frames:{},neon:false};redraw()})}
function eq(kind,id){if(!S.user||!S.gal||S.gbusy)return;var uid=S.user.uid,u={},m=S.me;id=id||"";
if(kind==="pin"){if(id&&!S.gal.pins[id])return;u["users/"+uid+"/pin"]=id||null;u["rank/"+uid+"/b"]=id||null}
else if(kind==="frame"){if(id&&!S.gal.frames[id])return;u["users/"+uid+"/frame"]=id||null;u["rank/"+uid+"/f"]=id||null}
else if(kind==="fx"){if(id&&!S.gal.neon)return;u["users/"+uid+"/fx"]=id?"neon":null;u["rank/"+uid+"/g"]=id?1:null}
else return;
S.gbusy=true;S.err="";S.info="";
S.db.ref().update(u).then(function(){var k=kind==="pin"?"pin":kind==="frame"?"frame":"fx",v=id?(kind==="fx"?"neon":id):null;if(v)m[k]=v;else delete m[k];S.rankT=0;S.info=L("gOk")}).catch(function(){S.err=L("gErr")}).then(function(){S.gbusy=false;redraw()})}
function gTile(kind,id,eqd,inner,label){return '<button type="button" class="qz-gt'+(eqd?' on':'')+'" onclick="QZ.eq(\''+kind+'\',\''+(eqd?'':id)+'\')" aria-pressed="'+(eqd?'true':'false')+'"'+(S.gbusy?' disabled':'')+'><span class="qz-gi">'+inner+'</span><b>'+esc(label)+'</b><em>'+(eqd?L("gEq"):'&nbsp;')+'</em></button>'}
function galCard(){if(!S.gal){if(!S.galB){S.galB=1;setTimeout(loadGal,0)}return '<div class="qz-card"><h3>🎖️ '+L("gT")+'</h3><div class="empty">'+L("loading")+'</div></div>'}
var g=S.gal,m=S.me,h='<div class="qz-card qz-gal"><h3>🎖️ '+L("gT")+'</h3><p>'+L("gD")+'</p>',t;
h+='<h4>'+L("gB")+'</h4>';t=Object.keys(g.pins);
h+=t.length?'<div class="qz-gg">'+t.map(function(id){return gTile("pin",id,m.pin===id,'<img src="'+ea(PINS[id].img)+'" alt="">',PINS[id].n)}).join("")+'</div>':'<div class="qz-ge">'+L("gE1")+'</div>';
h+='<h4>'+L("gF")+'</h4>';t=Object.keys(g.frames);
h+=t.length?'<div class="qz-gg">'+t.map(function(id){return gTile("frame",id,m.frame===id,'<span class="qz-fw" style="background:'+FRAMES[id].c+'"><span class="qz-av" style="width:52px;height:52px"></span></span>',FRAMES[id].n[LI])}).join("")+'</div>':'<div class="qz-ge">'+L("gE2")+'</div>';
h+='<h4>'+L("gX")+'</h4>';
h+=g.neon?'<div class="qz-gg">'+gTile("fx","neon",m.fx==="neon",'<span class="qz-green">'+esc(m.name)+'</span>',L("gNeon"))+'</div>':'<div class="qz-ge">'+L("gE3")+'</div>';
return h+'</div>'}

/* ====== RANKING ====== */
function loadRank(){S.rankT=Date.now();S.rankErr=false;
S.db.ref("rank").orderByChild("x").limitToLast(50).once("value").then(function(s){var a=[];s.forEach(function(c){var v=c.val()||{};a.push({id:c.key,n:v.n||"?",p:v.p||"",x:v.x||0,g:v.g===1,b:v.b||"",f:v.f||""})});
a.sort(function(p,q){return q.x-p.x});S.rank=a;redraw()}).catch(function(){S.rank=[];S.rankErr=true;redraw()})}

/* ====== TELAS ====== */
function bar(p){return '<div class="qz-bar"><i style="width:'+p+'%"></i></div>'}
function tabs(){var v=S.view;return '<nav class="qz-tabs"><a href="#/quiz"'+((v==="hub"||v==="play"||v==="bonus")?' class="on"':'')+'>'+L("tQ")+'</a><a href="#/quiz/ranking"'+(v==="rank"?' class="on"':'')+'>'+L("tR")+'</a><a href="#/quiz/perfil"'+(v==="prof"?' class="on"':'')+'>'+L("tP")+'</a></nav>'}
function msgs(){return (S.err?'<div class="qz-msg bad">'+esc(S.err)+'</div>':'')+(S.info?'<div class="qz-msg ok">'+esc(S.info)+'</div>':'')}
function authCard(){var up=S.mode==="up";
return '<div class="qz-card qz-hero"><h3>'+L("heroT")+'</h3><p>'+L("heroD")+'</p></div>'+
'<div class="qz-card qz-auth"><h3>'+(up?L("signup"):L("login"))+'</h3>'+msgs()+
'<form onsubmit="QZ.go();return false">'+(up?'<input id="qz-nm" type="text" maxlength="30" autocomplete="nickname" placeholder="'+ea(L("nameF"))+'" value="'+ea(S.fNm)+'">':'')+
'<input id="qz-em" type="email" autocomplete="email" placeholder="'+ea(L("email"))+'" value="'+ea(S.fEm)+'">'+
'<input id="qz-pw" type="password" autocomplete="'+(up?'new-password':'current-password')+'" placeholder="'+ea(L("pass"))+'">'+
'<button class="btn" type="submit"'+(S.busy?' disabled':'')+'>'+(S.busy?'…':(up?L("signup"):L("login")))+'</button></form>'+
'<div class="qz-or"><span>'+L("or")+'</span></div>'+
'<button class="btn o qz-g" type="button" onclick="QZ.google()"><b>G</b> '+L("google")+'</button>'+
'<div class="qz-links"><button type="button" class="qz-lk" onclick="QZ.sw()">'+(up?L("toIn"):L("toUp"))+'</button>'+(up?'':'<button type="button" class="qz-lk" onclick="QZ.forgot()">'+L("forgot")+'</button>')+'</div></div>'}
function meCard(){var m=S.me,lv=lvOf(m.xp);
return '<div class="qz-card qz-me">'+avf(m.photo,m.name,60,m.frame)+'<div class="qz-mi"><b class="qz-nm">'+(m.fx==="neon"?'<span class="qz-green">'+esc(m.name)+'</span>':esc(m.name))+vb(S.user&&S.user.uid)+pinImg(m.pin)+'</b><span class="qz-lv">'+lv.ic+' '+esc(lv.n)+'</span>'+bar(lv.pct)+
'<small>'+(m.xp||0)+' XP · '+(lv.next?L("toNext",{n:lv.next-(m.xp||0),lv:lv.nn}):L("maxLv"))+'</small></div></div>'}
function hubPage(){var m=S.me,td=today(),h=meCard();
if(S.quizErr)return h+'<div class="qz-msg bad">'+L("quizErr")+'</div>';
if(!S.quiz)return h+'<div class="empty">'+L("loading")+'</div>';
ensurePlay();var ds0=doneScore(),n=qs().length,btn;
if(ds0!==null)btn='<p class="qz-big">'+L("doneS",{n:ds0,t:n})+'</p>';
else btn='<a class="btn" href="#/quiz/jogar">'+(S.play.ans.length?L("cont")+' ('+S.play.ans.length+'/'+n+')':L("start"))+'</a>';
h+='<div class="qz-card"><h3>🎯 '+(ds0!==null?L("doneT"):L("dT"))+'</h3>'+(ds0===null?'<p>'+L("dD")+'</p>':'')+btn+'</div>';
shStyle();h+=shBox();setTimeout(shPop,600);
var wk=weekKey(td),c=Math.min(wkCount(m,td),WEEK_GOAL),wd=!!(m.wk&&m.wk[wk]);
h+='<div class="qz-card"><h3>🏆 '+L("wT")+'</h3><p>'+(wd?L("wDone",{x:WEEK_XP}):L("wD",{g:WEEK_GOAL,x:WEEK_XP}))+'</p>'+bar(Math.round(c/WEEK_GOAL*100))+'<small>'+c+'/'+WEEK_GOAL+'</small></div>';
var st=m.streak||0,ci=m.days&&m.days[td]&&m.days[td].ci;
h+='<div class="qz-card qz-row2"><div><b>🔥 '+st+'</b><small>'+L("streak")+' · '+(st===1?L("day1"):L("days"))+'</small></div><div><b>✅</b><small>'+(ci?L("ci",{x:CHECKIN_XP}):'…')+'</small></div></div>';
h+=bonusCard();return h}
function playPage(){var m=S.me;
if(S.quizErr)return '<div class="qz-msg bad">'+L("quizErr")+'</div>';
if(!S.quiz)return '<div class="empty">'+L("loading")+'</div>';
ensurePlay();var p=S.play,q=qs(),n=q.length;
if(!p.res&&doneScore()!==null){setTimeout(function(){location.hash="#/quiz"},0);return '<div class="empty">'+L("loading")+'</div>'}
if(p.res)return resultPage(p.res);
if(p.saving)return '<div class="qz-card"><p class="qz-big">'+L("saving")+'</p></div>';
if(p.saveErr||(!p.rev&&p.ans.length>=n)){var h0='<div class="qz-card"><p class="qz-big">'+(p.saveErr?L("saveErr"):L("saving"))+'</p><button class="btn" onclick="QZ.fin()">'+L("retry")+'</button></div>';if(!p.saveErr&&!p.fin)setTimeout(finish,0);return h0}
var i=p.rev?p.ans.length-1:p.ans.length,Q=q[i];if(!Q)return '<div class="empty">'+L("quizErr")+'</div>';
var sel=p.rev?p.ans[i]:-1,h='<div class="qz-card qz-q"><div class="qz-qh"><span>'+L("qn",{i:i+1,n:n})+'</span><span>'+(m.xp||0)+' XP</span></div>'+bar(Math.round(i/n*100))+'<h3 class="qz-qt">'+esc(Q.q)+'</h3><div class="qz-opts">';
Q.o.forEach(function(o,k){var cl="qz-opt";if(p.rev){if(k===Q.a)cl+=" right";else if(k===sel)cl+=" wrong";else cl+=" dim"}
h+='<button type="button" class="'+cl+'"'+(p.rev?' disabled':' onclick="QZ.pick('+k+')"')+'><i>'+"ABCD".charAt(k)+'</i><span>'+esc(o)+'</span></button>'});
h+='</div>';
if(p.rev){var okk=sel===Q.a;h+='<div class="qz-fb '+(okk?'ok':'ko')+'"><b>'+(okk?L("ok"):L("ko"))+'</b>'+(Q.e?'<p>'+esc(Q.e)+'</p>':'')+'</div><button class="btn qz-nx" onclick="QZ.nxt()">'+(p.ans.length>=n?L("seeRes"):L("next"))+'</button>'}
return h+'</div>'}
function resultPage(r){var m=S.me,lv=lvOf(m.xp),h='<div class="qz-card qz-res"><h3>'+L("resT")+'</h3><div class="qz-score">'+r.sc+'<small>/'+r.t+'</small></div><p>'+L("resS",{n:r.sc,t:r.t})+'</p><div class="qz-gain">+'+r.gain+' XP</div><ul class="qz-lines">';
r.lines.forEach(function(l){h+='<li><span>'+esc(l[0])+'</span><b>+'+l[1]+'</b></li>'});h+='</ul>';
if(r.up)h+='<div class="qz-msg ok">'+L("lvUp",{n:r.up.ic+" "+r.up.n})+'</div>';
r.got.forEach(function(id){var a=A.filter(function(x){return x.id===id})[0];if(a)h+='<div class="qz-msg ok">'+a.ic+' '+L("newA")+': <b>'+esc(a.n[LI])+'</b></div>'});
var tx=L("shareTx",{n:r.sc,t:r.t,lv:lv.n})+" "+location.origin+"/#/quiz";
h+='<div class="acts" style="justify-content:center"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(tx)+'">'+L("share")+'</a><a class="btn o" href="#/quiz/ranking">'+L("tR")+'</a></div></div>';return h}
function rankPage(){var h='<div class="qz-card"><h3>'+L("rT")+'</h3><small>'+L("rS")+'</small>';
if(S.rank===null)return h+'<div class="empty">'+L("loading")+'</div></div>';
if(S.rankErr)return h+'<div class="qz-msg bad">'+L("rErr")+'</div></div>';
if(!S.rank.length)return h+'<div class="empty">'+L("rEmpty")+'</div></div>';
var inTop=false;h+='<div class="qz-rank">';
S.rank.forEach(function(r,i){var me=S.user&&r.id===S.user.uid,lv=lvOf(r.x);if(me)inTop=true;
h+='<div class="qz-rr'+(me?' me':'')+'"><b class="qz-pos">'+(i<3?["🥇","🥈","🥉"][i]:"#"+(i+1))+'</b>'+avf(r.p,r.n,42,r.f)+'<div class="qz-rn"><div class="qz-nl"><span'+(r.g?' class="qz-green"':'')+'>'+esc(r.n)+'</span>'+vb(r.id)+pinImg(r.b)+(me?'<em>('+L("you")+')</em>':'')+'</div><small>'+lv.ic+' '+esc(lv.n)+'</small></div><b class="qz-rx">'+r.x+' XP</b></div>'});
h+='</div>';
if(S.user&&S.me&&!inTop)h+='<div class="qz-msg">'+L("rNot")+'</div>';
return h+'</div>'}
function profPage(){var m=S.me,lv=lvOf(m.xp),n=cnt(m),sc=ds(m).reduce(function(a,b){return a+b},0),acc=n?Math.round(sc/(n*N)*100):0;
var h=meCard()+'<div class="qz-card">'+msgs()+'<h3>'+L("pT")+'</h3><small style="opacity:.6;word-break:break-all">ID: '+esc(S.user?S.user.uid:"")+'</small><div class="qz-edit"><label class="btn o qz-ph">'+L("photo")+'<input type="file" accept="image/*" style="display:none" onchange="QZ.photo(this)"></label></div>'+
'<label class="qz-lb">'+L("nameL")+'</label><div class="qz-nr"><input id="qz-pn" type="text" maxlength="30" value="'+ea(m.name)+'"><button class="btn" onclick="QZ.saveName()">'+L("save")+'</button></div></div>'+
galCard()+'<div class="qz-card qz-stats"><div><b>'+(m.xp||0)+'</b><small>'+L("stX")+'</small></div><div><b>'+n+'</b><small>'+L("stQ")+'</small></div><div><b>'+perf(m)+'</b><small>'+L("stP")+'</small></div><div><b>'+acc+'%</b><small>'+L("stA")+'</small></div></div>'+
'<div class="qz-card"><h3>'+L("aT")+'</h3><div class="qz-ach">';
A.forEach(function(a){var got=m.ach&&m.ach[a.id],dt=got?new Date(got).toLocaleDateString([LANG==="pt"?"pt-BR":LANG]):"";
h+='<div class="qz-a'+(got?' on':'')+'"><span class="qz-ai">'+(got?a.ic:'🔒')+'</span><div><b>'+esc(a.n[LI])+'</b><small>'+esc(a.d[LI])+'</small>'+(got?'<em>'+esc(dt)+'</em>':'')+'</div></div>'});
h+='</div></div><div class="qz-card"><h3>'+L("lvT")+'</h3><div class="qz-lvs">';
LV.forEach(function(l,i){h+='<div class="qz-l'+(i===lv.i?' cur':(i<lv.i?' past':''))+'"><span>'+l.ic+'</span><b>'+esc(l.n[LI])+'</b><small>'+l.x+' XP</small></div>'});
h+='</div></div><button class="btn o qz-out" onclick="QZ.logout()">'+L("logout")+'</button>';return h}

function page(){var h='<div class="wrap qz">'+stitle(L("title"),L("stSub"))+tabs();
if(S.fbErr)return h+'<div class="empty">'+L("fbErr")+'</div></div>';
if(!S.ready||!S.known)return h+'<div class="empty">'+L("loading")+'</div></div>';
if(S.view==="rank")return h+rankPage()+'</div>';
if(!S.user)return h+authCard()+'</div>';
if(!S.me)return h+'<div class="empty">'+L("loading")+'</div></div>';
if(S.view==="play")return h+playPage()+'</div>';
if(S.view==="bonus")return h+bonusPage()+'</div>';
if(S.view==="prof")return h+profPage()+'</div>';
return h+hubPage()+'</div>'}
function redraw(){if(!/^#\/quiz/.test(location.hash))return;try{paint(page(),"keep")}catch(e){}}

function show(h){shClosePop();S.view=/^#\/quiz\/ranking/.test(h)?"rank":/^#\/quiz\/perfil/.test(h)?"prof":/^#\/quiz\/jogar/.test(h)?"play":/^#\/quiz\/bonus/.test(h)?"bonus":"hub";
S.err="";S.info="";document.title="Billie Quiz — "+SITE.name+" "+SITE.suffix;
loadQuiz();loadBonus();redraw();
boot().then(function(){if(!/^#\/quiz/.test(location.hash))return;if(S.view==="rank"&&S.ready&&(S.rank===null||Date.now()-S.rankT>60000))loadRank();redraw()})}

return {show:show,boot:boot,go:go,google:google,sw:sw,forgot:forgot,logout:logout,pick:pick,nxt:nxt,fin:function(){if(S.play){S.play.fin=false;finish()}},saveName:saveName,eq:eq,photo:photo,shareCanal:shareCanal,shPopClose:shPopClose,
_t:{weekKey:weekKey,lvOf:lvOf,addDays:addDays,pickQuiz:pickQuiz}}
})();
   
