(function(){var __c={},__m={};
__m['app.js']=function(){
const {sectionTexture}=__r('section-textures.js');
const {materialIcon}=__r('material-icons.js');
const {installDetailNavigation,decorateDetailBack,returnView}=__r('detail-navigation.js');
const {mapPointFor,mapPoints}=__r('editorial-map.js');
const {activities,places,quizzes,interests}=__r('data.js');
const {readState,writeState,emptyState,filterActivities,reserve,STORAGE_KEY}=__r('state.js');
const {scenery,welcomeContent}=__r('scenery.js');
const {initialRoute,safeNext}=__r('routing.js');
const {captureMapCenter,mountMap,mapWidthFromQuery,changeMapZoom}=__r('map-interactions.js');
const {placeDetailView}=__r('place-details.js');
const {placeAsset}=__r('map-data.js');
const {mapView,sectorView,foodView}=__r('map-views.js');
const app=document.querySelector('#app');
const pitchDemo=location.pathname.endsWith('/pitch.html');
let storage;if(pitchDemo){const memory={};storage={getItem(key){return memory[key]||null;},setItem(key,value){memory[key]=value;}};}else{try{storage=window.localStorage;}catch{storage={getItem(){},setItem(){throw Error();}};}}
let state=readState(storage), selected={}, email='', toastTimer, mapZoom=false;
if(pitchDemo)state.onboarded=true;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const find=id=>activities.find(a=>a.id===id), place=id=>places.find(p=>p.id===id);
const route=()=>{const raw=location.hash.slice(1)||'home';const [path,query]=raw.split('?');return {parts:path.split('/'),query:new URLSearchParams(query),path};};
const go=path=>{if(location.hash==='#'+path)render();else location.hash=path;};
function persist(){if(!writeState(storage,state))toast('El navegador no permite guardar cambios. Se conservarán durante esta visita.');}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3200);}
const icons={back:'<path d="m14 6-6 6 6 6M8 12h13"/>',bookmark:'<path d="M6 3h12v18l-6-4-6 4Z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',check:'<path d="m5 12 4 4L19 6"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',drop:'<path d="M12 2S5 11 5 15a7 7 0 0 0 14 0c0-4-7-13-7-13Z"/>',people:'<circle cx="8" cy="5" r="2"/><circle cx="17" cy="5" r="2"/><path d="M5 21v-9H3V9h10v3h-2v9M15 21V10h5v6h-2v5"/>',access:'<circle cx="12" cy="4" r="2"/><path d="M4 8h16M12 7v6m0 0-5 8m5-8 5 8"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',settings:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>'};
const icon=(name,filled=false)=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="${filled?'currentColor':'none'}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[name]||icons.info}</svg>`;
const btn=(label,dest,kind='',attrs='')=>dest?`<a class="button ${kind}" href="#${esc(dest)}" ${attrs}>${label}</a>`:`<button class="button ${kind}" ${attrs}>${label}</button>`;
const gesture=(label,dest)=>`<a class="gestural" href="#${esc(dest)}">${label}</a>`;
const title=(a,b,compact=false)=>`<div class="title ${compact?'compact':''}"><h1>${a}<span class="hand">${b}</span></h1></div>`;
const header=(text,back='home')=>`<header class="topbar"><a class="back" href="#${esc(back)}" aria-label="Volver">${materialIcon('arrow_back')}</a><span class="meta">${text}</span><a class="demo-pill" href="#about">Demo</a></header>`;
function nav(active){return `<nav class="nav" aria-label="Navegación principal">${[['home','Inicio','home'],['agenda','Agenda','event'],['map','Mapa','map'],['my','Mi feria','person']].map(([id,label,file])=>`<a href="#${id}" ${active===id?'aria-current="page"':''}>${materialIcon(file)}<span>${label}</span></a>`).join('')}</nav>`;}
function screen(content,{theme='',accent='blue',active='home',label='Bioferia',navVisible=true,extra=''}={}){document.body.classList.toggle('map-viewport',extra.includes('map-interactive-page'));document.title=label+' · Bioferia';document.querySelector('meta[name=theme-color]').content=theme==='dark'?'#332e34':theme==='coral'?'#f34731':'#f0eee4';app.innerHTML=`<main id="main-content" tabindex="-1" class="screen ${theme} ${extra} page-${route().parts[0]}" style="--accent:var(--${accent})">${scenery(route().path,route().query,state)}${content}</main>${navVisible?nav(active):''}`;}
function activityCard(a,{featured=false,saved=false}={}){return `<article class="activity ${featured?'featured':''}"><a href="#event/${a.id}" class="photo-link" tabindex="-1" aria-hidden="true"><img src="./assets/${featured?a.image:(a.thumbnail||a.image)}" alt="" loading="lazy" decoding="async"></a><a class="activity-copy" href="#event/${a.id}"><span class="meta accent">${a.kind}</span><h3>${a.title}</h3><span class="meta">${a.time?`Día ${a.day} · ${a.time} · 45 min · `:''}${place(a.place).name}</span></a>${saved?`<button class="save" data-action="save" data-id="${a.id}" aria-label="${state.saved.includes(a.id)?'Quitar de guardados':'Guardar'} ${a.title}" aria-pressed="${state.saved.includes(a.id)}">${icon('bookmark',state.saved.includes(a.id))}</button>`:''}</article>`;}
const empty=(heading,copy,label,dest)=>`<div class="empty"><div class="big-icon">✳</div><h2>${heading}</h2><p>${copy}</p>${label?btn(label,dest):''}</div>`;
const pic=p=>`<img class="pic" src="${placeAsset(p)}" alt="">`;
const placeRow=p=>`<a class="space-row" href="#place/${p.id}">${pic(p)}<div class="copy"><h3>${p.name}</h3><p>${p.detail}</p></div><span aria-hidden="true">→</span></a>`;
function home(){screen(`<section class="hero"><img class="brand" src="./assets/logo.webp" alt="Bioferia"><a class="demo-pill" href="#about">Demo interactiva</a><span class="meta">BIOFERIA · ENCUENTRO SUSTENTABLE</span><h1>EL CAMBIO<span class="hand">SE VIVE ACÁ.</span></h1></section><section class="daily"><p class="meta">QUIZ DEL DÍA · ROPA</p><h2>¿Cómo elegís lo que vestís?</h2><p>Una pregunta para mirar tu guardarropa de otra manera.</p>${gesture(state.answers.consumo!==undefined?'Volvé a tu reflexión →':'Empezar →',state.answers.consumo!==undefined?'quiz/consumo/reflection':'quiz/consumo')}</section><div class="shortcuts"><a href="#place/ong" class="shortcut"><strong>CHARLAS</strong><span>Ideas en vivo →</span></a><a href="#explore" class="shortcut violet"><strong>EXPLORÁ</strong><span>Encontrá tu lugar →</span></a></div><div class="section-title"><h2>HOY EN BIOFERIA</h2><a href="#agenda">Ver agenda</a></div>${activityCard(activities[0])}`,{theme:'dark',accent:'yellow',extra:'home',active:'home',label:'Inicio'});}
function agenda(q){const day=Number(q.get('day')||1),category=q.get('category')||'Todas',search=q.get('q')||'';const dest=(d,c)=>`agenda?day=${d}&category=${encodeURIComponent(c)}&q=${encodeURIComponent(search)}`;const list=filterActivities({day,category,search});screen(`${header('AGENDA')}${title('ENCONTRÁ TU','PRÓXIMA CHARLA.',true)}<div class="chips equal" aria-label="Día">${[1,2,3].map(d=>`<a class="chip ${day===d?'selected':''}" href="#${dest(d,category)}" ${day===d?'aria-current="true"':''}>${day===d?'✓ ':''}Día ${d}</a>`).join('')}</div><form id="search-form" class="search"><label class="sr-only" for="search">Buscar charla o taller</label><input id="search" name="q" type="search" placeholder="Buscar charla o taller" value="${esc(search)}" autocomplete="off"><button class="button" type="submit">Buscar →</button></form><div class="chips equal" aria-label="Categoría">${['Todas','Consumo','Diseño'].map(c=>`<a href="#${dest(day,c)}" class="chip ${category===c?'selected':''}">${category===c?'✓ ':''}${c}</a>`).join('')}</div><p class="meta" style="margin-bottom:10px">${search?`${list.length} ${list.length===1?'resultado':'resultados'}`:'PARA EXPLORAR'}</p><div class="stack">${list.length?list.map(a=>activityCard(a)).join(''):empty('No encontramos actividades.','Probá con otro nombre o quitá los filtros.','Ver todo el día '+day,'agenda?day='+day)}</div>`,{active:'agenda',label:'Agenda'});}
function eventPage(id){const a=find(id);if(!a)return notFound();const saved=state.saved.includes(id),booked=state.reservations.includes(id);const split=a.heading||(id==='consumo'?['OTRAS FORMAS','DE CONSUMIR.']:id==='diseno'?['DISEÑAR PARA','QUE DURE.']:id==='habitar'?['OTRAS FORMAS','DE HABITAR.']:['PRENDAS CON','MIRADA PROPIA.']);screen(`${header(a.kind.toUpperCase(),a.kind==='Experiencia'?'explore':'agenda?day='+a.day)}${title(...split,true)}<img class="detail-image" src="./assets/${a.image}" alt="${esc(a.title)}"><div class="row between"><span class="tag">${a.full?'Cupos completos':a.booking?'Con inscripción':'Acceso libre'}</span><button class="chip" data-action="save" data-id="${id}" aria-pressed="${saved}">${saved?'✓ Guardado':'＋ Guardar'}</button></div><div class="detail-meta">${a.time?`<div class="row">${icon('clock')}<p><strong>Día ${a.day} · ${a.time} a ${a.end}</strong><br>45 minutos</p></div>`:''}<a class="row" href="#${mapPointFor(a.place)?'map?place='+a.place:'place/'+a.place}">${icon('pin')}<p><strong>${place(a.place).name}</strong><br><span class="inline-link">${mapPointFor(a.place)?'Ver ubicación en el mapa →':'Conocer el espacio →'}</span></p></a></div><section class="detail-description"><h2>Otra mirada empieza acá.</h2><p style="margin-top:12px">${a.description}</p></section><div class="stack">${a.full?`<div class="notice">Los cupos de este taller están completos en este recorrido de muestra.</div>${btn('Buscar otra actividad →','agenda?day='+a.day)}`:booked?`${btn('Ver mi reserva →','confirmed/'+id)}${btn('Cancelar reserva de muestra','cancel/'+id,'secondary')}`:a.booking?btn('Anotarme →',state.profile?'booking/'+id:'access?next=booking/'+id):`${btn(mapPointFor(a.place)?'Ver en el mapa →':'Conocer el espacio →',mapPointFor(a.place)?'map?place='+a.place:'place/'+a.place)}<p class="fine center">No necesitás inscripción para esta actividad.</p>`}<p class="fine muted center">Programación de muestra para probar la app.</p></div>`,{active:'agenda',label:a.title,accent:a.kind==='Experiencia'?'violet':'blue'});}
function booking(id){const a=find(id);if(!a||!a.booking)return notFound();if(a.full)return eventPage(id);if(!state.profile){go('access?next=booking/'+id);return;}screen(`${header('INSCRIPCIÓN','event/'+id)}${title('UN ENCUENTRO.','TU LUGAR.',true)}${activityCard(a)}<form id="booking-form" data-id="${id}" class="stack large" style="margin-top:24px"><label class="field">Tu nombre o apodo<input name="name" required maxlength="60" autocomplete="nickname" value="${esc(state.profile.name)}"></label><div class="notice"><strong>Reserva de muestra</strong><br>Podés probar la inscripción. No ocupa un cupo real ni reemplaza la entrada a Bioferia.</div><label class="checkrow"><input name="accept" type="checkbox" required><span>Entiendo que esta reserva es parte de la demo.</span></label>${btn('Confirmar mi reserva →',null,'','type="submit"')}</form>`,{active:'agenda',label:'Reservar'});}
function confirmed(id){const a=find(id);if(!a)return notFound();if(!state.reservations.includes(id))return screen(`${header('MI RESERVA','reservations')}${empty('No tenés una reserva activa.','Podés volver a la actividad para probar la inscripción.','Ver actividad','event/'+id)}`,{active:'my',label:'Reserva'});screen(`${header('TU RESERVA','reservations')}<div class="success-icon">✓</div>${title('YA TENÉS','TU LUGAR.',true)}<p style="margin-bottom:22px">${esc(state.profile?.name)}, tu reserva de muestra quedó guardada en este navegador.</p>${activityCard(a)}<div class="spacer"></div><div class="notice">Es una confirmación de prueba. No se envió ningún correo ni se reservó un cupo real.</div><div class="spacer"></div><div class="stack">${btn('Ver ubicación →','map?place='+a.place)}${btn('Ir a mis reservas','reservations','secondary')}${btn('Cancelar reserva','cancel/'+id,'text')}</div>`,{active:'my',label:'Reserva confirmada'});}
function cancel(id){const a=find(id);if(!a)return notFound();screen(`${header('TU RESERVA','confirmed/'+id)}${title('CAMBIAN','LOS PLANES.',true)}<p style="margin-bottom:24px">¿Querés cancelar tu reserva de muestra para esta actividad?</p>${activityCard(a)}<div class="spacer"></div><div class="stack">${btn('Sí, cancelar mi reserva',null,'danger',`data-action="cancel" data-id="${id}"`)}${btn('Conservar mi lugar','confirmed/'+id,'secondary')}</div>`,{active:'my',label:'Cancelar reserva'});}
function mapPage(q,center){center=center||(returnView()?.map?.width===mapWidthFromQuery(q)?returnView().map:undefined);const width=center?.width||mapWidthFromQuery(q);mapZoom=width>900;const view=mapView(q,mapZoom);screen(view.html,view.options);const p=mapPointFor(q.get('place'),q.get('point'));mountMap(center||(p?{x:p.x/100,y:p.y/100}:undefined),width);}
function placePage(id){if(id==='ong')return charlasPage();const custom=sectorView(id);if(custom)return screen(custom.html,custom.options);const p=place(id);if(!p)return notFound();const view=placeDetailView(p,activities.filter(a=>a.place===id),activityCard,route().query.get('point'));if(view)return screen(view.html,view.options);return notFound();}
function explore(){screen(`${header('EXPERIENCIAS')}${title('ELEGÍ POR DÓNDE','EMPEZAR.',true)}<p style="margin-bottom:26px">Comida, diseño e ideas.<br>Encontrá tu próxima conexión.</p><div class="stack large">${[activities[3],activities[2],activities[1]].map(a=>activityCard(a,{saved:true})).join('')}</div><div class="spacer"></div>${btn('Todos los espacios →','map?tab=list','secondary')}`,{theme:'dark',accent:'violet',label:'Explorar'});}
function myFair(){screen(`${header('MI FERIA')}${title(state.profile?`HOLA, ${esc(state.profile.name.toUpperCase())}.`:'TU FERIA,','A TU MANERA.',true)}<p>${state.profile?'Lo que guardaste, tus próximos encuentros y las preguntas que te acompañan.':'Guardá lo que te llama, sumá nuevas miradas y armá tu recorrido.'}</p><div class="stats"><a class="stat" href="#reservations"><strong>${state.reservations.length}</strong><span>Mis reservas →</span></a><a class="stat" href="#saved"><strong>${state.saved.length}</strong><span>Guardados →</span></a></div>${!state.profile?`<div class="card"><h2>UN CORREO.<span class="hand">TU ESPACIO.</span></h2><p style="margin:14px 0 16px">Probá el recorrido de ingreso y armá tu perfil de muestra.</p>${btn('Probar el ingreso →','access')}</div>`:''}<div class="my-visual-cards"><a class="my-quiz-card" href="#quiz/consumo"><h2>Mi quiz<br>de ropa</h2><p>Una nueva mirada</p><strong>Empezar →</strong></a><a class="my-saved-card" href="#saved"><img loading="lazy" decoding="async" src="./assets/saved-tote.webp" alt="Bolsa de Bioferia"><strong>Mis guardados →</strong></a></div><div class="menu"><a href="#history"><span>Mis reflexiones</span><span>${Object.keys(state.answers).length} →</span></a><a href="#quiz/alimentacion"><span>Quiz de alimentación</span><span>→</span></a>${state.profile?'<a href="#profile"><span>Mi perfil</span><span>→</span></a>':''}<a href="#settings"><span>Preferencias</span>${icon('settings')}</a><a href="#about"><span>Sobre esta demo</span><span>→</span></a></div>`,{active:'my',accent:'violet',label:'Mi feria'});}
function savedPage(q){const tab=q.get('tab')||'all';const list=activities.filter(a=>state.saved.includes(a.id)&&(tab==='all'||(tab==='talks'?a.kind!=='Experiencia':a.kind==='Experiencia')));screen(`${header('GUARDADOS','my')}${title('ESO QUE TE','LLAMÓ.',true)}<div class="chips">${[['all','Todo'],['talks','Charlas'],['experiences','Experiencias']].map(([id,label])=>`<a href="#saved?tab=${id}" class="chip ${tab===id?'selected':''}">${label}</a>`).join('')}</div><div class="stack">${list.length?list.map(a=>activityCard(a,{saved:true})).join(''):empty('Hay más por encontrar.','Guardá una actividad para tenerla a mano en tu recorrido.','Explorar →','explore')}</div>`,{active:'my',accent:'violet',label:'Guardados'});}
function reservations(){const list=activities.filter(a=>state.reservations.includes(a.id));screen(`${header('MIS RESERVAS','my')}${title('NOS VEMOS','AHÍ.',true)}${list.length?`<div class="stack large">${list.map(a=>`<div class="stack">${activityCard(a)}${btn('Ver reserva de muestra →','confirmed/'+a.id,'secondary')}</div>`).join('')}</div>`:empty('Tu próxima charla te espera.','Todavía no tenés reservas. Buscá una actividad y probá la inscripción.','Explorar agenda →','agenda')}`,{active:'my',accent:'violet',label:'Mis reservas'});}
function access(q){screen(`${header('TU ESPACIO','my')}${title('UN CORREO.','TU ESPACIO.',true)}<p style="margin-bottom:24px">Entrá para armar tu recorrido y encontrar todo en un mismo lugar.</p><form id="access-form" class="card stack large" data-next="${esc(q.get('next')||'my')}"><label class="field">Tu nombre o apodo<input name="name" autocomplete="nickname" placeholder="¿Cómo te llamás?" maxlength="60" required value="${esc(state.profile?.name||'')}"></label><label class="field">Correo electrónico<input name="email" type="email" autocomplete="email" placeholder="hola@ejemplo.com" required><small>Para probar, podés usar hola@ejemplo.com.</small></label><div class="notice">Este ingreso es simulado. No enviamos correos. Tu nombre y tus elecciones se guardan únicamente en este navegador.</div>${btn('Continuar →',null,'','type="submit"')}</form>`,{active:'my',accent:'violet',label:'Ingresar a la demo'});}
let pendingProfile=null;
function mail(q){screen(`${header('TU ESPACIO','access')}${title('REVISÁ','TU CORREO.',true)}<div class="success-icon">${icon('mail')}</div><p class="center">Así sería el paso de acceso por correo${email?` para <strong>${esc(email)}</strong>`:''}.</p><div class="spacer"></div><div class="notice">Estás en la demo: no se envió ningún mensaje. Usá el botón para simular el enlace de acceso.</div><div class="spacer"></div><div class="stack">${btn('Simular enlace de acceso →',null,'',`data-action="enter-demo" data-next="${esc(q.get('next')||'my')}"`)}${btn('Reenviar enlace de muestra',null,'secondary','data-action="resend"')}${btn('Cambiar correo','access?next='+encodeURIComponent(q.get('next')||'my'),'text')}</div>`,{active:'my',accent:'violet',label:'Revisar correo'});}
function interestPage(q){screen(`${header('TUS INTERESES','my')}${title('SEGUÍ LO QUE','TE MUEVE.',true)}<p>Elegí los temas que te dan curiosidad. Podés cambiarlos cuando quieras.</p><div class="interest-grid">${interests.map(i=>`<button class="chip ${state.interests.includes(i)?'selected':''}" data-action="interest" data-id="${i}" aria-pressed="${state.interests.includes(i)}">${state.interests.includes(i)?'✓ ':''}${i}</button>`).join('')}</div><div class="notice">En esta demo tus intereses quedan guardados en el perfil. La agenda muestra la programación de ejemplo completa.</div><div class="spacer"></div>${btn('Continuar →',safeNext(q.get('next')))}${btn('Elegir más tarde',safeNext(q.get('next')),'text')}`,{active:'my',accent:'violet',label:'Mis intereses'});}
function profile(){if(!state.profile)return access(new URLSearchParams());screen(`${header('MI PERFIL','my')}${title('ESTE ES','TU ESPACIO.',true)}<div class="profile-name"><div class="avatar">${esc(state.profile.name.slice(0,1).toUpperCase())}</div><div><h2>${esc(state.profile.name)}</h2><p class="muted">Perfil de muestra</p></div></div><form id="profile-form" class="stack"><label class="field">Nombre o apodo<input name="name" maxlength="60" required value="${esc(state.profile.name)}"></label>${btn('Guardar cambios',null,'','type="submit"')}</form><div class="section-title"><h2>TUS INTERESES</h2><a href="#interests">Editar</a></div><p>${state.interests.length?esc(state.interests.join(' · ')):'Todavía no elegiste temas.'}</p><div class="menu"><button data-action="logout"><span>Salir del perfil de muestra</span><span>→</span></button></div>`,{active:'my',accent:'violet',label:'Mi perfil'});}
function settings(){screen(`${header('PREFERENCIAS','my')}${title('TU RECORRIDO.','TUS REGLAS.',true)}<label class="switch-row"><span><strong>Recordatorio del quiz</strong><p class="fine muted">Mostrar una invitación en Mi feria.<br>No envía notificaciones al celular.</p></span><input type="checkbox" id="reminders" ${state.reminders?'checked':''}></label><div class="menu"><a href="#interests"><span>Mis intereses</span><span>→</span></a><a href="#privacy"><span>Datos y privacidad</span><span>→</span></a><a href="#welcome/0"><span>Volver a la bienvenida</span><span>→</span></a><button data-action="reset"><span>Reiniciar la demo</span><span>↺</span></button></div><p class="fine muted">Tus cambios se guardan en este navegador. Podés borrarlos y empezar de nuevo.</p>`,{active:'my',accent:'violet',label:'Preferencias'});}
function privacy(){screen(`${header('DATOS Y PRIVACIDAD','settings')}${title('TU MIRADA.','TUS DATOS.',true)}<div class="stack large"><section><h2>Qué guarda esta demo</h2><p>Tu nombre o apodo, intereses, favoritos, respuestas y reservas de muestra se guardan localmente en este navegador.</p></section><section><h2>Qué pasa con el correo</h2><p>El correo solo se muestra durante el recorrido simulado de ingreso. No se envía ni se guarda al cerrar la página.</p></section><section><h2>Un recorrido de prueba</h2><p>No hay cuentas ni reservas reales. No se comparten datos entre dispositivos. El alojamiento puede requerir iniciar sesión para ver esta versión privada.</p></section>${btn('Borrar mis datos de la demo',null,'secondary','data-action="reset"')}</div>`,{active:'my',accent:'violet',label:'Privacidad'});}
function quiz(id,step){const q=quizzes[id];if(!q)return notFound();const chosen=selected[id]??state.answers[id];if(step&&chosen===undefined&&step!=='intro')return quiz(id);const progress=n=>`<div class="quiz-progress" aria-label="Paso ${n} de 3">${[1,2,3].map(i=>`<span class="${i<=n?'done':''}"></span>`).join('')}</div>`;if(!step||step==='question'){screen(`${header('TU MIRADA',id==='alimentacion'?'my':'home')}<div class="quiz-tags"><span class="tag">${q.label}</span><span class="meta">QUIZ DEL DÍA</span></div>${title(q.title,q.highlight,true)}<h2 class="question">${q.question}</h2><p>${id==='consumo'?'Elegí lo que más se acerque a vos.':'Elegí una opción. Podés cambiarla antes de continuar.'}</p><div class="options" role="group" aria-label="Tu respuesta">${q.options.map((label,n)=>`<button class="option ${chosen===n?'selected':''}" data-action="answer" data-id="${id}" data-value="${n}" aria-pressed="${chosen===n}"><span class="radio" aria-hidden="true"></span>${label}</button>`).join('')}</div><p class="fine" style="margin-bottom:14px">${id==='consumo'?'No hay respuestas correctas o incorrectas.':'Podés cambiar de idea. No es un examen.'}</p>${btn('Continuar →',null,'',`data-action="quiz-next" data-id="${id}" ${chosen===undefined?'disabled':''}`)}${chosen===undefined?'<p class="fine muted" style="margin-top:12px">Elegí una opción para continuar.</p>':''}`,{accent:'coral',label:'Quiz · '+(id==='consumo'?'ropa':id),extra:'quiz-screen',navVisible:false});return;}if(step==='choice'){screen(`${header('TU ELECCIÓN','quiz/'+id)}${progress(1)}${title(q.title,q.highlight,true)}<h2 class="question">${q.question}</h2><div class="card stack"><p class="meta accent">● TU MIRADA</p><h2>${q.options[chosen]}</h2></div><div class="spacer"></div><div class="notice"><strong>Podés cambiar de idea.</strong><br>Tu respuesta es un punto de partida para seguir pensando.</div><div class="spacer"></div><div class="stack">${btn(id==='alimentacion'?'Mirá qué dicen las fuentes →':'Ver otras miradas →','quiz/'+id+(id==='alimentacion'?'/sources':'/compare'))}${btn('Cambiar mi elección ←','quiz/'+id,'secondary')}</div>`,{accent:'coral',label:'Tu elección',navVisible:false});return;}if(id==='consumo'&&step==='compare'){screen(`${header('OTRAS MIRADAS','quiz/'+id+'/choice')}${progress(2)}${title('TU MIRADA.','OTRAS MIRADAS.',true)}<h2 class="comparison-question">${q.question}</h2><p class="comparison-demo">Respuestas de ejemplo. No son datos de asistentes.</p><div class="quiz-comparison"><section class="comparison-own" aria-labelledby="your-answer"><h2 id="your-answer">Tu respuesta</h2><div class="comparison-card comparison-card-own"><p>${q.options[chosen]}</p></div></section><section class="comparison-others" aria-labelledby="other-answers"><h2 id="other-answers">Otras miradas</h2><ul>${q.options.filter((_,n)=>n!==chosen).map(option=>`<li class="comparison-card"><p>${option}</p></li>`).join('')}</ul></section></div><p class="comparison-closing">Una misma pregunta, distintas prioridades.</p><div class="stack">${btn('Mirá qué hay detrás →','quiz/'+id+'/behind')}${btn('Seguir pensando →','quiz/'+id+'/reflection','secondary')}${btn('Cambiar mi elección ←','quiz/'+id,'secondary')}</div>`,{accent:'coral',label:'Tu respuesta y otras miradas',extra:'quiz-comparison-screen',navVisible:false});return;}if(id==='consumo'&&step==='behind'){const laws=['Argentina','Chile','Uruguay','México','España'].map(c=>`<article class="law-card"><div class="law-top"><h3>${c}</h3><span>Qué dice la ley</span></div><i></i><i></i><i class="s"></i></article>`).join('');screen(`${header('QUÉ HAY DETRÁS','quiz/'+id+'/compare')}${progress(3)}${title('UNA PREGUNTA.','QUÉ HAY DETRÁS.',true)}<h2 class="comparison-question">¿Qué dice la ley en cada país?</h2><p class="comparison-demo">Contenido de ejemplo. Acá va lo que dice la ley de cada país.</p><div class="law-list">${laws}</div><div class="stack">${btn('Dar mi opinión →','quiz/'+id+'/opinion')}</div>`,{accent:'coral',label:'Qué hay detrás',extra:'quiz-comparison-screen',navVisible:false});return;}if(id==='consumo'&&step==='opinion'){const ops=['Estoy de acuerdo con lo que dice la ley.','Creo que se puede ir más lejos.','Todavía no lo tengo claro.'];screen(`${header('TU OPINIÓN','quiz/'+id+'/behind')}${progress(3)}${title('TU MIRADA.','TU OPINIÓN.',true)}<h2 class="comparison-question">¿Qué opinás vos?</h2><p>Elegí lo que más se acerque a vos.</p><div class="options" role="group" aria-label="Tu opinión">${ops.map((label,n)=>`<button class="option" data-action="op" data-id="${id}" data-value="${n}" aria-pressed="false"><span class="radio" aria-hidden="true"></span>${label}</button>`).join('')}</div><div class="spacer"></div>${btn('Enviar mi opinión →',null,'',`data-action="op-next" data-id="${id}" disabled`)}`,{accent:'coral',label:'Tu opinión',extra:'quiz-screen',navVisible:false});return;}if(id==='consumo'&&step==='opinions'){const ops=['Estoy de acuerdo con lo que dice la ley.','Creo que se puede ir más lejos.','Todavía no lo tengo claro.'],pct=[46,34,20],mine=selected.op??0;screen(`${header('OPINIONES','quiz/'+id+'/opinion')}${progress(3)}${title('TU OPINIÓN.','LAS DE LOS DEMÁS.',true)}<h2 class="comparison-question">¿Qué opinás vos?</h2><p class="comparison-demo">Respuestas de ejemplo. No son datos de asistentes.</p><div class="op-list">${ops.map((o,n)=>`<div class="op-row ${n===mine?'mine':''}"><p>${o}${n===mine?' <em>Tu opinión</em>':''}</p><div class="op-bar"><i style="width:${pct[n]}%"></i></div><b>${pct[n]}%</b></div>`).join('')}</div><p class="comparison-closing">Una misma pregunta, distintas miradas.</p><div class="stack">${btn('Volver a Mi feria','my','text')}</div>`,{accent:'coral',label:'Opiniones',extra:'quiz-comparison-screen',navVisible:false});return;}if(step==='sources'){screen(`${header('PARA SEGUIR PENSANDO','quiz/'+id+'/choice')}${progress(2)}${title('UNA PREGUNTA.','MÁS FUENTES.',true)}<div class="quote"><h2>La carne no es la única fuente.</h2><p class="reflection" style="margin-top:16px">También hay proteínas en legumbres, frutos secos, huevos y lácteos.</p></div><h2>Consultá las fuentes</h2><div class="stack" style="margin:20px 0"><a class="button light" href="https://estilosdevidasaludable.sanidad.gob.es/alimentacionSaludable/queSabemos/informacionAlimentos/macronutrientes/proteinas/home.htm" target="_blank" rel="noopener noreferrer">Ministerio de Sanidad ↗</a><a class="button light" href="https://alimentosargentinos.magyp.gob.ar/HomeAlimentos/Nutricion/Legumbres/caracteristicas_nutricionales.php" target="_blank" rel="noopener noreferrer">Alimentos Argentinos ↗</a></div>${btn('Ver otras miradas →','quiz/'+id+'/reflection','light')}`,{theme:'coral',accent:'coral',label:'Evidencia y fuentes',navVisible:false});return;}screen(`${header('TU REFLEXIÓN','quiz/'+id+(id==='consumo'?'/compare':'/choice'))}${progress(3)}${title('UNA PREGUNTA.','OTRAS MIRADAS.',true)}<div class="quote"><p class="meta">TU ELECCIÓN</p><h2 style="margin:10px 0 20px">${q.options[chosen]}</h2><p class="reflection">${q.reflections[chosen]}</p></div><p style="margin-bottom:24px">${id==='consumo'?'Otra mirada sobre tu ropa puede empezar por lo que ya tenés.':'El cambio también empieza cuando nos animamos a mirar de nuevo.'}</p><div class="stack">${btn(state.answers[id]!==undefined?'Reflexión guardada ✓':'Guardar mi reflexión',null,'light',`data-action="save-reflection" data-id="${id}"`)}${btn(id==='alimentacion'?'Seguir por Gastronomía →':'Explorar Diseño e indumentaria →',id==='alimentacion'?'place/comida':'place/moda','light')}${btn('Compartir esta mirada','share/'+id,'secondary')}${btn('Volver a Mi feria','my','text')}</div>`,{theme:'coral',accent:'coral',label:'Reflexión',navVisible:false});}
function historyPage(){const list=Object.entries(state.answers);screen(`${header('MIS REFLEXIONES','my')}${title('TU MIRADA','PERDURA.',true)}${list.length?`<div class="stack large">${list.map(([id,n])=>`<a class="card stack" href="#quiz/${id}/reflection"><span class="meta accent">${quizzes[id].label}</span><h2>${quizzes[id].question}</h2><p>${quizzes[id].options[n]}</p><span class="accent">Volver a pensar →</span></a>`).join('')}</div>`:empty('Una pregunta abre otra mirada.','Tus reflexiones guardadas van a aparecer acá.','Empezar el quiz →','quiz/consumo')}`,{active:'my',accent:'coral',label:'Mis reflexiones'});}
function share(id){if(!quizzes[id])return notFound();screen(`${header('COMPARTIR','quiz/'+id+(state.answers[id]!==undefined?'/reflection':''))}${title('QUE LA MIRADA','CIRCULE.',true)}<div class="share-card share-card-${id}"><p class="meta">BIOFERIA / ${id==='consumo'?'ROPA':'COEXISTENCIA'}</p><div><h2>${id==='alimentacion'?'MÁS ALLÁ':'¿LO NECESITO'}<span class="hand">${id==='alimentacion'?'DEL PLATO.':'O LO DESEO?'}</span></h2><p>${id==='consumo'?'Otra mirada sobre la ropa que elegís.':'Dale otra vuelta a lo cotidiano.'}</p></div><img src="./assets/logo.webp" alt="Bioferia"></div><div class="spacer"></div><div class="stack">${btn('Compartir →',null,'',`data-action="share" data-id="${id}"`)}${btn('Copiar enlace',null,'secondary',`data-action="copy" data-id="${id}"`)}${btn('Guardar tarjeta como imagen',null,'secondary',`data-action="download" data-id="${id}"`)}</div><p class="fine muted" style="margin-top:16px">La tarjeta no incluye tus datos personales. El acceso al enlace depende de los permisos de esta versión.</p>`,{accent:'coral',label:'Compartir'});}
function welcome(n){const view=welcomeContent(n);screen(view.html,{theme:view.theme,accent:view.n===1?'coral':'yellow',label:'Bienvenida · '+(view.n+1)+' de 4',navVisible:false,extra:'welcome-screen welcome-'+view.n});}
function about(){screen(`${header('SOBRE ESTA DEMO')}${title('BIOFERIA','EN TUS MANOS.',true)}<div class="stack large"><p>Una webapp para vivir la feria desde el celular, sin instalar nada.</p><div class="notice"><strong>Versión para presentar y probar</strong><br>Las actividades y reservas son de muestra. El acceso por correo está simulado.</div><section><h2>Probá tu recorrido</h2><p>Buscá una charla, guardala, reservá de muestra y encontrala en Mi feria. Explorá los espacios del mapa y sumá tu mirada a los quizzes.</p></section><section><h2>Se guarda en este navegador</h2><p>Los favoritos y las reflexiones siguen acá cuando volvés. Para empezar de cero, usá “Reiniciar la demo” en Preferencias.</p></section>${btn('Empezar a explorar →','home')}${btn('Datos y privacidad','privacy','secondary')}</div>`,{accent:'violet',label:'Sobre la demo'});}
function notFound(){screen(`${header('BIOFERIA')}${empty('Por acá todavía no.','Esta página no está en el recorrido. Volvé al inicio para seguir explorando.','Ir al inicio →','home')}`,{label:'Página no encontrada'});}
function render(){if(location.hash==='#main-content'){document.querySelector('main')?.focus();return;}const {parts:[page,id,step],query}=route();document.querySelector('#dialog').close();switch(page){case 'home':home();break;case 'agenda':agenda(query);break;case 'event':eventPage(id);break;case 'booking':booking(id);break;case 'confirmed':confirmed(id);break;case 'cancel':cancel(id);break;case 'map':mapPage(query);break;case 'place':placePage(id);break;case 'explore':explore();break;case 'food':{const v=foodView();screen(v.html,v.options);break;}case 'my':myFair();break;case 'saved':savedPage(query);break;case 'reservations':reservations();break;case 'access':access(query);break;case 'mail':mail(query);break;case 'interests':interestPage(query);break;case 'profile':profile();break;case 'settings':settings();break;case 'privacy':privacy();break;case 'quiz':quiz(id,step);break;case 'history':historyPage();break;case 'share':share(id||'consumo');break;case 'welcome':welcome(id);break;case 'about':about();break;default:notFound();}decorateDetailBack();window.scrollTo(0,returnView()?.scroll||0);if(state.reminders&&page==='my'&&Object.keys(state.answers).length===0){const menu=app.querySelector('.menu');menu?.insertAdjacentHTML('beforebegin','<div class="notice">Tu quiz de ropa te espera. <a class="inline-link" href="#quiz/consumo">Sumá tu mirada →</a></div>');}}
function modal(heading,copy,actions){const d=document.querySelector('#dialog');d.innerHTML=`<h2>${heading}</h2><p>${copy}</p>${actions}`;d.showModal();}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-action]');if(!b)return;const {action,id,value,next}=b.dataset;switch(action){case 'finish-welcome':state.onboarded=true;persist();go('home');break;case 'save':{const saved=state.saved.includes(id);state.saved=saved?state.saved.filter(x=>x!==id):[...state.saved,id];persist();const y=scrollY;render();window.scrollTo(0,y);toast(saved?'Actividad quitada de guardados.':'Guardada en Mi feria.');break;}case 'cancel':state.reservations=state.reservations.filter(x=>x!==id);persist();go('reservations');toast('Reserva de muestra cancelada.');break;case 'op':selected.op=Number(value);document.querySelectorAll('.option').forEach((el,n)=>{el.classList.toggle('selected',n===Number(value));el.setAttribute('aria-pressed',String(n===Number(value)));});document.querySelector('[data-action=op-next]').disabled=false;break;case 'op-next':go('quiz/'+id+'/opinions');break;case 'answer':selected[id]=Number(value);document.querySelectorAll('.option').forEach((el,n)=>{el.classList.toggle('selected',n===Number(value));el.setAttribute('aria-pressed',String(n===Number(value)));});document.querySelector('[data-action=quiz-next]').disabled=false;break;case 'quiz-next':go('quiz/'+id+'/choice');break;case 'save-reflection':{const n=selected[id]??state.answers[id];if(Number.isInteger(n)){state.answers[id]=n;persist();b.textContent='Reflexión guardada ✓';toast('Guardada en Mis reflexiones.');}break;}case 'map-select':{const center=captureMapCenter();const point=mapPoints.find(p=>p.id===id);if(!point)break;const q=route().query;q.set('place',point.placeId);q.set('point',point.id);window.history.replaceState(history.state,'','#map?'+q.toString());const y=scrollY;mapPage(q,b.closest('.map-point-options')?{x:point.x/100,y:point.y/100,width:center?.width}:center);window.scrollTo(0,y);document.querySelector('.map-popover-close')?.focus({preventScroll:true});break;}case 'map-zoom':changeMapZoom(value);break;case 'interest':state.interests=state.interests.includes(id)?state.interests.filter(x=>x!==id):[...state.interests,id];persist();b.classList.toggle('selected',state.interests.includes(id));b.setAttribute('aria-pressed',String(state.interests.includes(id)));b.textContent=(state.interests.includes(id)?'✓ ':'')+id;break;case 'enter-demo':state.profile=pendingProfile||state.profile||{name:'Visitante'};pendingProfile=null;email='';persist();go('interests?next='+encodeURIComponent(safeNext(next)));break;case 'resend':modal('Así funcionaría el reenvío','En la versión real recibirías otro enlace. Esta demo no envía correos.',btn('Entendido',null,'','data-action="close"'));break;case 'close':document.querySelector('#dialog').close();break;case 'logout':state.profile=null;persist();go('my');toast('Saliste del perfil de muestra.');break;case 'reset':modal('¿Empezamos de nuevo?','Se borrarán de este navegador el perfil, los favoritos, las reservas y las reflexiones de esta demo.',btn('Borrar y reiniciar',null,'danger','data-action="reset-confirm"')+btn('Conservar mi recorrido',null,'secondary','data-action="close"'));break;case 'reset-confirm':state=emptyState();selected={};pendingProfile=null;email='';persist();go('welcome/0');toast('Demo reiniciada.');break;case 'share':{const url=shareUrl(id);if(navigator.share){try{await navigator.share({title:'Bioferia · Otra mirada',text:quizzes[id].question,url});}catch(err){if(err.name!=='AbortError')copyLink(url);}}else copyLink(url);break;}case 'copy':await copyLink(shareUrl(id));break;case 'download':b.disabled=true;try{await downloadCard(id);toast('Tarjeta preparada para descargar.');}catch{toast('No se pudo preparar la tarjeta. Probá copiar el enlace.');}finally{b.disabled=false;}break;}});
document.addEventListener('submit',e=>{const f=e.target;if(!['search-form','booking-form','access-form','profile-form'].includes(f.id))return;e.preventDefault();const data=new FormData(f);if(f.id==='search-form'){const q=route().query;q.set('q',String(data.get('q')).trim());go('agenda?'+q.toString());}if(f.id==='access-form'){const name=String(data.get('name')).trim();if(!name){f.elements.name.setCustomValidity('Escribí un nombre o apodo.');f.elements.name.reportValidity();return;}email=String(data.get('email')).trim();pendingProfile={name};go('mail?next='+encodeURIComponent(safeNext(f.dataset.next)));}if(f.id==='booking-form'){const name=String(data.get('name')).trim();if(!name){f.elements.name.setCustomValidity('Escribí un nombre o apodo.');f.elements.name.reportValidity();return;}state.profile={name};if(reserve(state,f.dataset.id)){persist();go('confirmed/'+f.dataset.id);}else toast('No se pudo confirmar. Volvé a la actividad.');}if(f.id==='profile-form'){const name=String(data.get('name')).trim();if(!name){f.elements.name.setCustomValidity('Escribí un nombre o apodo.');f.elements.name.reportValidity();return;}state.profile={name};persist();toast('Nombre actualizado.');}});
document.addEventListener('input',e=>{if(e.target.name==='name')e.target.setCustomValidity('');});
document.addEventListener('change',e=>{if(e.target.id==='reminders'){state.reminders=e.target.checked;persist();toast(state.reminders?'Invitación activada en Mi feria.':'Invitación desactivada.');}});
function shareUrl(id){return location.origin+location.pathname+'#quiz/'+id;}
async function copyLink(url){try{await navigator.clipboard.writeText(url);toast('Enlace copiado.');}catch{modal('Copiá este enlace','Seleccioná el enlace y usá la opción de copiar de tu dispositivo.',`<label class="field">Enlace<input value="${esc(url)}" readonly id="copy-fallback"></label>${btn('Cerrar',null,'','data-action="close"')}`);document.querySelector('#copy-fallback').select();}}
async function downloadCard(id){await document.fonts.ready;const c=document.createElement('canvas');c.width=1080;c.height=1080;const x=c.getContext('2d');x.fillStyle='#332e34';x.fillRect(0,0,1080,1080);if(id==='consumo'){const gradient=x.createLinearGradient(0,1080,1080,840);gradient.addColorStop(0,'#332e34');gradient.addColorStop(1,'#f0eee4');x.fillStyle=gradient;x.fillRect(0,0,1080,1080);const shade=x.createLinearGradient(0,0,0,1080);shade.addColorStop(0,'#332e34');shade.addColorStop(.47,'#332e34e6');shade.addColorStop(.76,'#332e3400');x.fillStyle=shade;x.fillRect(0,0,1080,1080);const figures=new Image();figures.src='./assets/backgrounds/figures.webp';await figures.decode();x.save();x.translate(1048,0);x.scale(-1,1);x.drawImage(figures,0,735,240,340);x.restore();}x.fillStyle='#f0eee4';x.font='500 30px Barlow';x.fillText(id==='consumo'?'BIOFERIA / ROPA':'BIOFERIA / COEXISTENCIA',70,100);x.font='700 94px Barlow';x.fillText(id==='alimentacion'?'MÁS ALLÁ':'¿LO NECESITO',70,330);x.fillStyle='#f34731';x.font='130px Efrancd';x.fillText(id==='alimentacion'?'DEL PLATO.':'O LO DESEO?',70,480);x.fillStyle='#f0eee4';x.font='400 42px Barlow';x.fillText(id==='consumo'?'Otra mirada sobre la ropa que elegís.':'Dale otra vuelta a lo cotidiano.',70,650);const logo=new Image();logo.src='./assets/logo.webp';await logo.decode();x.drawImage(logo,70,920,300,57);const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw Error('canvas');const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='bioferia-otra-mirada-'+id+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
installDetailNavigation(render,captureMapCenter);
window.addEventListener('hashchange',render);
window.addEventListener('storage',e=>{if(!pitchDemo&&e.key===STORAGE_KEY){state=readState(storage);render();}});
const opening=initialRoute(location.hash,state.onboarded);if(location.hash!=='#'+opening)window.history.replaceState(null,'','#'+opening);render();

function charlasPage(){
  const a=find('consumo');
  screen(`<section class="charlas-hero"><img class="charlas-hero-photo" src="./assets/charlas-hero.webp" alt="Espacio de charlas de Bioferia"><img class="charlas-hero-mesh" src="./assets/charlas-mesh.webp" alt="" aria-hidden="true">${header('ESPACIO DE CHARLAS','map')}<h1>IDEAS QUE SE<span class="hand">ENCUENTRAN</span></h1></section><div class="charlas-sheet">${sectionTexture('ong')}<h2>Espacio ONG</h2><article class="charlas-next"><div class="charlas-next-copy"><div class="row"><span class="tag">◷ ${a.time}</span><span class="meta">PRÓXIMA ACTIVIDAD · 45 MIN</span></div><h3>Otras formas<br>de consumir</h3><p>Un encuentro para repensar los hábitos de todos los días.</p></div><img class="charlas-speaker" src="./assets/charlas-speaker.webp" alt="Oradora de Otras formas de consumir">${btn('Ver charla y anotarme →','event/consumo')}</article>${btn('Volver al mapa completo','map','light')}<a class="space-agenda-link" href="#agenda">Ver todas las charlas y horarios →</a></div>`,{active:'map',label:'Espacio de charlas',extra:'charlas-space'});
}

function dismissMapSelection(){
 if(!document.querySelector('.map-popover'))return;
 const center=captureMapCenter(),q=route().query,point=mapPointFor(q.get('place'),q.get('point'));
 q.delete('place');q.delete('point');history.replaceState(history.state,'','#map'+(q.size?'?'+q:''));
 mapPage(q,center);
 const target=point?document.querySelector(`.map-point[data-id="${point.id}"]`):document.querySelector('.fair-map-scroll');
 target?.focus({preventScroll:true});
}
document.addEventListener('click',e=>{if(e.target.closest('[data-action="map-dismiss"]'))dismissMapSelection();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.querySelector('.map-popover')){e.preventDefault();dismissMapSelection();}});

return {};
};
__m['section-textures.js']=function(){
// Reuse verified Figma artwork by section family; never alter the map canvas.
const artwork={
 auxilios:[null,'backgrounds/agenda-filter.svg'],
 descanso:['backgrounds/oak-leaf.webp','backgrounds/oak-leaf.webp'],
 mercado:['backgrounds/oak-leaf.webp','backgrounds/oak-leaf.webp'],
 'no-fumar':['backgrounds/profile-wire.webp','backgrounds/profile-wire.webp'],
 ong:[null,'backgrounds/event-lines.svg'],
 my:[null,'backgrounds/mesh-original.webp'],
 history:[null,'backgrounds/quiz-choice.svg'],
 map:[null,'backgrounds/oak-leaf.webp']
};
function sectionTexture(id,slot='sheet'){
 const file=artwork[id]?.[slot==='hero'?0:1];
 return file?`<div class="section-texture texture-${id} texture-${slot}" aria-hidden="true"><img src="./assets/${file}" alt="" draggable="false"></div>`:'';
}

return {sectionTexture:sectionTexture};
};
__m['material-icons.js']=function(){
// Official Google Material Icons, Round, 24px. Apache-2.0; see assets/material/LICENSE.
const shapes={"add": "<path d=\"M0 0h24v24H0V0z\" fill=\"none\"/><path d=\"M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1z\"/>", "arrow_back": "<path d=\"M0 0h24v24H0V0z\" fill=\"none\"/><path d=\"M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z\"/>", "event": "<path d=\"M0 0h24v24H0V0z\" fill=\"none\"/><path d=\"M16 13h-3c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1zm0-10v1H8V3c0-.55-.45-1-1-1s-1 .45-1 1v1H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-1V3c0-.55-.45-1-1-1s-1 .45-1 1zm2 17H6c-.55 0-1-.45-1-1V9h14v10c0 .55-.45 1-1 1z\"/>", "home": "<path d=\"M0 0h24v24H0V0z\" fill=\"none\"/><path d=\"M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7h1.7c.46 0 .68-.57.33-.87L12.67 3.6c-.38-.34-.96-.34-1.34 0l-8.36 7.53c-.34.3-.13.87.33.87H5v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1z\"/>", "map": "<path d=\"M0 0h24v24H0V0z\" fill=\"none\"/><path d=\"M14.65 4.98l-5-1.75c-.42-.15-.88-.15-1.3-.01L4.36 4.56C3.55 4.84 3 5.6 3 6.46v11.85c0 1.41 1.41 2.37 2.72 1.86l2.93-1.14c.22-.09.47-.09.69-.01l5 1.75c.42.15.88.15 1.3.01l3.99-1.34c.81-.27 1.36-1.04 1.36-1.9V5.69c0-1.41-1.41-2.37-2.72-1.86l-2.93 1.14c-.22.08-.46.09-.69.01zM15 18.89l-6-2.11V5.11l6 2.11v11.67z\"/>", "person": "<path d=\"M0 0h24v24H0V0z\" fill=\"none\"/><path d=\"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-1c0-2.66-5.33-4-8-4z\"/>", "remove": "<path d=\"M0 0h24v24H0V0z\" fill=\"none\"/><path d=\"M18 13H6c-.55 0-1-.45-1-1s.45-1 1-1h12c.55 0 1 .45 1 1s-.45 1-1 1z\"/>"};
const materialIcon=name=>`<svg class="ui-icon" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true" focusable="false">${shapes[name]||shapes.arrow_back}</svg>`;

return {materialIcon:materialIcon};
};
__m['detail-navigation.js']=function(){
// Store the origin per browser-history entry, not per place: the same place
// can be opened from Home, Services, a filtered list, another detail or a map.
const isDetailHash=hash=>/^#(?:place|event)\/[a-z0-9-]+(?:\?|$)/.test(hash||'');
function detailReturn(state){const back=state?.bioferiaNavigation?.back;return typeof back==='string'&&/^#[a-z][a-z0-9/-]*(?:\?.*)?$/.test(back)?back:null;}
const returnView=()=>history.state?.bioferiaNavigation?.view;
function decorateDetailBack(){
 if(!isDetailHash(location.hash))return;
 const back=detailReturn(history.state),link=document.querySelector('.topbar .back');
 if(back&&link)link.setAttribute('href',back);
}
function installDetailNavigation(render,captureMapCenter){
 document.addEventListener('click',e=>{
  if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const link=e.target.closest('a[href]');if(!link||link.target||link.hasAttribute('download'))return;
  const target=link.getAttribute('href');
  if(link.matches('.topbar .back')&&isDetailHash(location.hash)&&detailReturn(history.state)){
   e.preventDefault();history.back();return;
  }
  if(!isDetailHash(target)||target===location.hash)return;
  e.preventDefault();
  const origin=location.hash||'#home';
  const current={...history.state,bioferiaNavigation:{...history.state?.bioferiaNavigation,view:{scroll:scrollY,map:captureMapCenter()}}};
  history.replaceState(current,'',origin);
  history.pushState({bioferiaNavigation:{back:origin}},'',target);
  render();
 },true);
}

return {isDetailHash:isDetailHash,detailReturn:detailReturn,returnView:returnView,decorateDetailBack:decorateDetailBack,installDetailNavigation:installDetailNavigation};
};
__m['editorial-map.js']=function(){
// Extracted from the supplied SVG: leader endpoints in the original 2100x1480 coordinate system.
const MAP_FRAME={x:326,y:200,width:1448,height:1086};
const editorialPoints=[
 {
  "id": "mercado",
  "placeId": "mercado",
  "x": 37.33425414364641,
  "y": 39.41068139963168,
  "color": "#332E34",
  "label": "",
  "tile": "editorial/mercado.svg",
  "sourcePoint": [
   866.6,
   628.0
  ],
  "sourceIndex": 0
 },
 {
  "id": "diseno",
  "placeId": "diseno",
  "x": 63.44613259668509,
  "y": 44.59484346224677,
  "color": "#332E34",
  "label": "",
  "tile": "editorial/diseno.svg",
  "sourcePoint": [
   1244.7,
   684.3
  ],
  "sourceIndex": 1
 },
 {
  "id": "moda",
  "placeId": "moda",
  "x": 80.11049723756905,
  "y": 45.33149171270718,
  "color": "#332E34",
  "label": "",
  "tile": "editorial/moda.svg",
  "sourcePoint": [
   1486.0,
   692.3
  ],
  "sourceIndex": 2
 },
 {
  "id": "comida",
  "placeId": "comida",
  "x": 82.88674033149171,
  "y": 28.296500920810313,
  "color": "#332E34",
  "label": "",
  "tile": "editorial/comida.svg",
  "sourcePoint": [
   1526.2,
   507.3
  ],
  "sourceIndex": 3
 },
 {
  "id": "ong",
  "placeId": "ong",
  "x": 93.99861878453038,
  "y": 51.99815837937385,
  "color": "#332E34",
  "label": "",
  "tile": "editorial/ong.svg",
  "sourcePoint": [
   1687.1,
   764.7
  ],
  "sourceIndex": 4
 },
 {
  "id": "turismo",
  "placeId": "turismo",
  "x": 69.55801104972376,
  "y": 67.55985267034991,
  "color": "#332E34",
  "label": "",
  "tile": "editorial/turismo.svg",
  "sourcePoint": [
   1333.2,
   933.7
  ],
  "sourceIndex": 5
 },
 {
  "id": "bienestar",
  "placeId": "bienestar",
  "x": 38.99861878453039,
  "y": 64.59484346224677,
  "color": "#332E34",
  "label": "",
  "tile": "editorial/bienestar.svg",
  "sourcePoint": [
   890.7,
   901.5
  ],
  "sourceIndex": 6
 },
 {
  "id": "infancia",
  "placeId": "infancia",
  "x": 20.66988950276243,
  "y": 67.55985267034991,
  "color": "#332E34",
  "label": "",
  "tile": "editorial/infancia.svg",
  "sourcePoint": [
   625.3,
   933.7
  ],
  "sourceIndex": 7
 },
 {
  "id": "descanso",
  "placeId": "descanso",
  "x": 47.88674033149171,
  "y": 26.813996316758747,
  "color": "#332E34",
  "label": "",
  "tile": "editorial/descanso.svg",
  "sourcePoint": [
   1019.4,
   491.2
  ],
  "sourceIndex": 8
 },
 {
  "id": "banos",
  "placeId": "banos",
  "x": 57.776243093922645,
  "y": 28.14917127071823,
  "color": "#332E34",
  "label": "",
  "tile": "editorial/banos.svg",
  "sourcePoint": [
   1162.6,
   505.7
  ],
  "sourceIndex": 9
 },
 {
  "id": "accesibilidad",
  "placeId": "accesibilidad",
  "x": 68.88812154696133,
  "y": 53.333333333333336,
  "color": "#332E34",
  "label": "",
  "tile": "editorial/accesibilidad.svg",
  "sourcePoint": [
   1323.5,
   779.2
  ],
  "sourceIndex": 10
 },
 {
  "id": "auxilios",
  "placeId": "auxilios",
  "x": 7.776243093922654,
  "y": 68.88581952117863,
  "color": "#332E34",
  "label": "",
  "tile": "editorial/auxilios.svg",
  "sourcePoint": [
   438.6,
   948.1
  ],
  "sourceIndex": 11
 },
 {
  "id": "agua",
  "placeId": "agua",
  "x": 55.00000000000001,
  "y": 77.03499079189686,
  "color": "#7779DE",
  "label": "",
  "tile": "editorial/agua.svg",
  "sourcePoint": [
   1122.4,
   1036.6
  ],
  "sourceIndex": 12
 },
 {
  "id": "reciclaje",
  "placeId": "reciclaje",
  "x": 57.776243093922645,
  "y": 60.0,
  "color": "#0C6FDC",
  "label": "",
  "tile": "editorial/reciclaje.svg",
  "sourcePoint": [
   1162.6,
   851.6
  ],
  "sourceIndex": 13
 },
 {
  "id": "info",
  "placeId": "info",
  "x": 92.3342541436464,
  "y": 66.07734806629834,
  "color": "#7779DE",
  "label": "",
  "tile": "editorial/info.svg",
  "sourcePoint": [
   1663.0,
   917.6
  ],
  "sourceIndex": 14
 },
 {
  "id": "boleteria",
  "placeId": "boleteria",
  "x": 14.4475138121547,
  "y": 84.44751381215468,
  "color": "#332E34",
  "label": "",
  "tile": "editorial/boleteria.svg",
  "sourcePoint": [
   535.2,
   1117.1
  ],
  "sourceIndex": 15
 },
 {
  "id": "horarios",
  "placeId": "horarios",
  "x": 85.5524861878453,
  "y": 84.44751381215468,
  "color": "#0C6FDC",
  "label": "",
  "tile": "editorial/horarios.svg",
  "sourcePoint": [
   1564.8,
   1117.1
  ],
  "sourceIndex": 16
 },
 {
  "id": "movilidad",
  "placeId": "movilidad",
  "x": 46.222375690607734,
  "y": 78.6648250460405,
  "color": "#332E34",
  "label": "",
  "tile": "editorial/movilidad.svg",
  "sourcePoint": [
   995.3,
   1054.3
  ],
  "sourceIndex": 17
 },
 {
  "id": "no-fumar",
  "placeId": "no-fumar",
  "x": 48.88812154696133,
  "y": 58.51749539594844,
  "color": "#F34731",
  "label": "Centro",
  "tile": "editorial/no-fumar.svg",
  "sourcePoint": [
   1033.9,
   835.5
  ],
  "sourceIndex": 18
 },
 {
  "id": "emergencia",
  "placeId": "emergencia",
  "x": 97.77624309392264,
  "y": 62.219152854511975,
  "color": "#FEFD15",
  "label": "Lateral derecho",
  "tile": "editorial/emergencia.svg",
  "sourcePoint": [
   1741.8,
   875.7
  ],
  "sourceIndex": 19
 },
 {
  "id": "emergencia-2",
  "placeId": "emergencia",
  "x": 7.803867403314917,
  "y": 51.38121546961326,
  "color": "#FEFD15",
  "label": "Lateral izquierdo",
  "tile": "editorial/emergencia-2.svg",
  "sourcePoint": [
   439.0,
   758.0
  ],
  "sourceIndex": 20
 },
 {
  "id": "emergencia-3",
  "placeId": "emergencia",
  "x": 87.29281767955801,
  "y": 17.67955801104972,
  "color": "#FEFD15",
  "label": "Parte superior",
  "tile": "editorial/emergencia-3.svg",
  "sourcePoint": [
   1590.0,
   392.0
  ],
  "sourceIndex": 21
 },
 {
  "id": "emergencia-4",
  "placeId": "emergencia",
  "x": 28.245856353591158,
  "y": 84.25414364640883,
  "color": "#FEFD15",
  "label": "Parte inferior",
  "tile": "editorial/emergencia-4.svg",
  "sourcePoint": [
   735.0,
   1115.0
  ],
  "sourceIndex": 22
 },
 {
  "id": "no-fumar-2",
  "placeId": "no-fumar",
  "x": 94.88950276243095,
  "y": 22.099447513812155,
  "color": "#F34731",
  "label": "Superior derecho",
  "tile": "editorial/no-fumar-2.svg",
  "sourcePoint": [
   1700.0,
   440.0
  ],
  "sourceIndex": 23
 },
 {
  "id": "no-fumar-3",
  "placeId": "no-fumar",
  "x": 77.55524861878453,
  "y": 83.33333333333334,
  "color": "#F34731",
  "label": "Inferior derecho",
  "tile": "editorial/no-fumar-3.svg",
  "sourcePoint": [
   1449.0,
   1105.0
  ],
  "sourceIndex": 24
 },
 {
  "id": "no-fumar-4",
  "placeId": "no-fumar",
  "x": 19.19889502762431,
  "y": 41.62062615101289,
  "color": "#F34731",
  "label": "Superior izquierdo",
  "tile": "editorial/no-fumar-4.svg",
  "sourcePoint": [
   604.0,
   652.0
  ],
  "sourceIndex": 25
 }
];
// User-approved placements on the square 2880px render (screenshots, 2026-11-09).
// Keep the original SVG coordinates as provenance; imagePoint overrides only these markers.
const MAP_IMAGE_SIZE=2880;
const imagePlacements={
 infancia:{imagePoint:[1075,1633]},
 ong:{imagePoint:[552,1692]},
 diseno:{imagePoint:[1580,1224]},
 boleteria:{imagePoint:[884,1974],label:'Acceso izquierdo'},
 info:{imagePoint:[1091,1974],label:'Acceso izquierdo'}
};
const positionOnImage=point=>({...point,x:point.imagePoint[0]/MAP_IMAGE_SIZE*100,y:point.imagePoint[1]/MAP_IMAGE_SIZE*100});
const mapPoints=editorialPoints.map(point=>imagePlacements[point.id]?positionOnImage({...point,...imagePlacements[point.id]}):point);
for(const [placeId,imagePoint] of [['boleteria',[2354,1737]],['info',[2532,1737]]]){
 const {color,tile}=editorialPoints.find(p=>p.id===placeId);
 mapPoints.push(positionOnImage({id:placeId+'-2',placeId,color,tile,label:'Acceso derecho',imagePoint}));
}
const pointsForPlace=id=>mapPoints.filter(p=>p.placeId===id);
const mapPointFor=(id,pointId)=>pointsForPlace(id).find(p=>p.id===pointId)||pointsForPlace(id)[0];

return {MAP_FRAME:MAP_FRAME,MAP_IMAGE_SIZE:MAP_IMAGE_SIZE,mapPoints:mapPoints,pointsForPlace:pointsForPlace,mapPointFor:mapPointFor};
};
__m['data.js']=function(){
const activities=[
 {id:'consumo',title:'Otras formas de consumir',category:'Consumo',kind:'Charla',time:'14:00',end:'14:45',day:1,place:'ong',image:'consumo.webp',booking:true,description:'Una conversación para mirar de nuevo lo que elegimos, lo que usamos y lo que dejamos. Ideas para repensar nuestros hábitos y abrir otras posibilidades.'},
 {id:'diseno',title:'Diseñar para que dure',category:'Diseño',kind:'Taller',time:'16:00',end:'16:45',day:1,place:'diseno',image:'diseno.webp',booking:true,full:true,description:'Reparar, transformar y darle una segunda vida a lo que ya existe. Un encuentro para descubrir el valor de hacer que las cosas duren.'},
 {id:'habitar',title:'Otras formas de habitar',category:'Consumo',kind:'Conversación',time:'17:30',end:'18:15',day:1,place:'ong',image:'habitar.webp',booking:false,description:'Un espacio para compartir preguntas sobre cómo habitamos y cómo nos vinculamos con nuestro entorno. Acercate y sumá tu mirada.'},
 {id:'prendas',title:'Prendas con mirada propia',category:'Diseño',kind:'Experiencia',day:1,place:'moda',image:'prendas.webp',booking:false,description:'Otra forma de mirar lo que vestimos. Descubrí proyectos que recuperan materiales, transforman prendas y proponen nuevas maneras de crear.'},
 {"id":"segunda-vida","title":"Una segunda vida para tu ropa","heading":["UNA SEGUNDA VIDA","PARA TU ROPA."],"category":"Diseño","kind":"Taller","time":"12:00","end":"12:45","day":2,"place":"moda","image":"prendas.webp","booking":true,"description":"Traé una prenda que ya no uses y explorá formas de transformarla. Compartimos técnicas simples de reparación, intercambio y reutilización para volver a elegir lo que ya tenemos."},
 {"id":"cocina-estacion","title":"Cocinar con lo que hay","heading":["COCINAR CON","LO QUE HAY."],"category":"Consumo","kind":"Taller","time":"14:00","end":"14:45","day":2,"place":"comida","image":"map/gastronomia.webp","booking":true,"description":"Un taller participativo para aprovechar ingredientes de estación y reducir los descartes en la cocina. Armamos ideas de platos a partir de lo que queda en la heladera y compartimos maneras de conservarlo."},
 {"id":"materiales-circulares","title":"Materiales que vuelven","heading":["MATERIALES","QUE VUELVEN."],"category":"Diseño","kind":"Charla","time":"16:00","end":"16:45","day":2,"place":"diseno","image":"diseno.webp","booking":false,"description":"Descubrí proyectos que convierten materiales recuperados en objetos cotidianos. Conversamos sobre sus procesos, sus límites y las decisiones que ayudan a diseñar una segunda vida desde el principio."},
 {"id":"habitar-comunidad","title":"Habitar en comunidad","heading":["HABITAR EN","COMUNIDAD."],"category":"Consumo","kind":"Conversación","time":"17:30","end":"18:15","day":2,"place":"arquitectura","image":"habitar.webp","booking":false,"description":"Una ronda para imaginar espacios compartidos: huertas, patios y lugares de encuentro. Traé tus preguntas sobre cómo cuidar el entorno y construir vínculos desde el barrio."},
 {"id":"reparar-juntos","title":"Reparar también es crear","heading":["REPARAR TAMBIÉN","ES CREAR."],"category":"Diseño","kind":"Taller","time":"12:00","end":"12:45","day":3,"place":"diseno","image":"diseno.webp","booking":true,"description":"Probamos reparaciones sencillas y pensamos soluciones para objetos que parecían haber llegado al final de su uso. Un taller para perder el miedo a arreglar y compartir saberes."},
 {"id":"agua-cotidiana","title":"Cada recarga cuenta","heading":["CADA RECARGA","CUENTA."],"category":"Consumo","kind":"Conversación","time":"14:00","end":"14:45","day":3,"place":"agua","image":"map/hidratacion.webp","booking":false,"description":"Nos encontramos junto al punto de hidratación para conversar sobre el agua y los hábitos cotidianos. Exploramos alternativas al envase descartable y pequeñas decisiones que podemos sostener después de la feria."},
 {"id":"guardarropa","title":"Un guardarropa con historia","heading":["UN GUARDARROPA","CON HISTORIA."],"category":"Diseño","kind":"Charla","time":"16:00","end":"16:45","day":3,"place":"moda","image":"prendas.webp","booking":true,"description":"Las prendas cuentan historias de materiales, personas y usos. Conocé propuestas de intercambio y moda circular, y armá criterios para elegir, cuidar y hacer durar lo que vestís."},
 {"id":"mesa-compartida","title":"La próxima mesa","heading":["LA PRÓXIMA","MESA."],"category":"Consumo","kind":"Conversación","time":"17:30","end":"18:15","day":3,"place":"comida","image":"map/gastronomia.webp","booking":false,"description":"Cerramos la feria alrededor de una pregunta: ¿qué hábitos queremos llevarnos a casa? Compartimos ideas sobre alimentación de estación, compras cercanas y encuentros que pueden continuar fuera del predio."}
];
// Distinct festival scenes share the visual direction of the original Bioferia references.
for(const a of activities)if(a.kind!=='Experiencia'){
 a.image='agenda-bioferia/'+a.id+'.webp';
 a.thumbnail='agenda-bioferia/'+a.id+'.thumb.webp';
}
const __x=__r('map-data.js');
const quizzes={consumo:{title:'OTRAS FORMAS',highlight:'DE VESTIR.',label:'01 / ROPA',question:'Cuando vas a comprar ropa, ¿qué pesa más en tu decisión?',options:['Que sea una prenda que necesito.','Que me dure mucho tiempo.','Cómo y quién la fabricó.','Que el precio esté a mi alcance.'],reflections:['Antes de sumar una prenda, mirar tu guardarropa puede abrir otras posibilidades. ¿Ya tenés algo que cumpla esa función o que puedas combinar de otra manera?','Querés una prenda que te acompañe por mucho tiempo. ¿Cómo podrías cuidarla o repararla para seguir usándola?','Cada prenda tiene una historia de materiales y de personas que la hicieron. ¿Qué te gustaría saber sobre la fabricación de la ropa que elegís?','El presupuesto importa. Dentro de tus posibilidades, ¿qué te ayudaría a usar esa prenda por más tiempo?']},alimentacion:{title:'MÁS ALLÁ',highlight:'DEL PLATO.',label:'12 / ALIMENTACIÓN',question:'¿La carne es la única fuente de proteínas?',options:['Sí, es la única','No, hay otras fuentes','Todavía no sé'],reflections:['Podemos ampliar la mirada: las proteínas también están presentes en alimentos de origen vegetal.','Las legumbres, los frutos secos y otros alimentos vegetales también aportan proteínas.','Preguntar es un buen comienzo. Hay distintas fuentes de proteínas, tanto animales como vegetales.']}};
const interests=['Comida','Diseño','Moda','Consumo','Arquitectura','Movilidad'];

return {places:__x.places,activities:activities,quizzes:quizzes,interests:interests};
};
__m['map-data.js']=function(){
const {mapPointFor}=__r('editorial-map.js');
// One point for each of the 22 visible pictograms in czmmLwYftu2I8TuTkXGVFC / 5917:4085.
// Place coordinates below are superseded by the exact editorial source assignments at the end of this file.
const places=[
 {id:'comida',name:'Gastronomía',detail:'Sabores con historia',asset:'map/pic-comida.svg',x:21.61,y:55.02,area:0,description:'Conocé quiénes cocinan y qué hay detrás de cada plato.'},
 {id:'infancia',name:'Infancia',detail:'Descubrir y jugar',asset:'pictos/infancia.svg',x:23.70,y:70.17,area:1,description:'Un espacio para descubrir la feria en familia.'},
 {id:'descanso',name:'Descanso',detail:'Una pausa en el recorrido',asset:'map/pic-descanso.svg',x:39.70,y:66.10,area:2,service:true,description:'Un lugar para hacer una pausa, encontrarte y seguir recorriendo la feria.'},
 {id:'mercado',name:'Mercado',detail:'Proyectos y consumo consciente',asset:'map/pic-mercado.svg',x:65.27,y:69.81,area:3,description:'Conocé los proyectos detrás de cada producto y encontrá nuevas formas de consumir.'},
 {id:'ong',name:'Espacio ONG',detail:'Programación y encuentros',asset:'pictos/ong.svg',x:82.08,y:54.16,area:4,description:'Ideas en vivo, proyectos y conversaciones para pensar el cambio en comunidad.'},
 {id:'turismo',name:'Turismo',detail:'Otras formas de recorrer',asset:'pictos/turismo.svg',x:71.13,y:47.64,area:5,description:'Propuestas para conocer lugares y repensar nuestra forma de viajar.'},
 {id:'moda',name:'Diseño e indumentaria',detail:'Prendas con otra mirada',asset:'pictos/moda.svg',x:75.18,y:30.47,area:6,description:'Materiales recuperados y proyectos que proponen otra relación con la ropa.'},
 {id:'diseno',name:'Diseño y deco',detail:'Reparar y transformar',asset:'pictos/diseno-y-deco.svg',x:59.83,y:47.09,area:7,description:'Procesos, materiales e ideas para darle una segunda vida a lo que tenemos.'},
 {id:'arquitectura',name:'Arquitectura y jardín',detail:'Otras formas de habitar',asset:'pictos/arquitectura-y-jardin.svg',x:37.68,y:42.39,area:8,description:'Ideas para repensar nuestros espacios y su relación con la naturaleza.'},
 {id:'agua',name:'Hidratación',detail:'Recargá y seguí',asset:'map/pic-agua.svg',x:63.3,y:35.2,service:true,description:'Traé tu botella y buscá este símbolo en los carteles del predio.'},
 {id:'banos',name:'Baños',detail:'Servicios para tu recorrido',asset:'map/pic-banos.svg',x:84,y:71,service:true,description:'Ubicá los baños y buscá este mismo símbolo en la señalética del predio.'},
 {id:'accesibilidad',name:'Accesibilidad',detail:'Baño accesible y orientación',asset:'map/pic-accesibilidad.svg',x:83,y:84,service:true,description:'Buscá el símbolo de accesibilidad. Consultá al equipo de información por asistencia durante tu visita.'},
 {id:'info',name:'Información',detail:'Todo para recorrerla',asset:'map/pic-info.svg',x:29,y:84,service:true,description:'Consultá actividades, accesos y servicios en el punto de información.'},
 {id:'auxilios',name:'Primeros auxilios',detail:'Asistencia cerca del acceso',x:16,y:78,service:true,location:'Junto al acceso principal, con llegada directa desde el circuito.',description:'Puesto de asistencia ubicado junto al acceso principal, separado de las filas de ingreso y conectado con el recorrido de la feria.'},
 {id:'movilidad',name:'Movilidad',detail:'Llegar de otra manera',x:44,y:86,area:9,location:'Sobre el paseo de entrada, antes de entrar al circuito.',description:'Un espacio para bicicletas y propuestas de movilidad sustentable. Está junto al paseo de entrada para facilitar la llegada y la salida.'},
 {id:'boleteria',name:'Boletería',detail:'El comienzo de tu recorrido',x:22,y:92,service:true,location:'Antes del acceso principal, junto al punto de información.',description:'El punto de entradas está antes del ingreso al predio. Desde ahí podés acercarte a Información y empezar a recorrer. La demo no vende entradas.'},
 {id:'bienestar',name:'Bienestar',detail:'Un espacio para bajar el ritmo',x:44,y:51,area:10,location:'En el espacio verde central, próximo al área de descanso.',description:'Una zona tranquila para conectar con el cuerpo y hacer una pausa, cerca del descanso y apartada del movimiento del ingreso.'},
 {id:'no-fumar',name:'Espacio sin humo',detail:'Señal de prohibido fumar',x:31,y:67,kind:'signal',location:'Entre Infancias y el área de descanso.',description:'La señal de prohibido fumar acompaña el espacio de Infancias y descanso, para cuidar a quienes comparten ese lugar.'},
 {id:'horarios',name:'Horarios',detail:'Consultá qué pasa en la feria',x:86,y:42,service:true,location:'En el cruce hacia el espacio ONG y las actividades.',description:'Un punto para consultar la programación antes de acercarte a una charla o actividad.',action:{label:'Consultar agenda →',route:'agenda'}},
 {id:'reciclaje',name:'Reciclaje',detail:'Separá antes de seguir',x:33,y:55,service:true,location:'A la salida de Gastronomía, sobre el camino hacia Mercado.',description:'Punto de separación de residuos cerca del área de comida. Buscá los recipientes identificados antes de continuar tu recorrido.'},
 {id:'emergencia',name:'Salida de emergencia',detail:'Salida lateral del predio',x:90,y:81,service:true,kind:'signal',location:'Sobre el borde derecho, conectada con el camino exterior.',description:'Salida lateral propuesta, conectada con el camino perimetral y apartada de la fila de boletería. Ubicación ilustrativa de esta demo.'},
 {id:'recorrido',name:'Dirección del recorrido',detail:'Seguí la señal hacia los sectores',x:35,y:93,kind:'signal',location:'En el paseo de ingreso, indicando el comienzo del circuito.',description:'La doble flecha orienta desde la entrada hacia los sectores de la feria. Seguí el circuito para encontrar gastronomía, diseño, mercado y las actividades.',action:{label:'Ver los sectores →',route:'map?tab=list'}}
];
// Every surface uses the very same original SVG from the supplied catalogue.
for(const p of places)p.asset='catalogo/'+p.id+'.svg';
const serviceIds=['banos','agua','info','accesibilidad','auxilios','boleteria','descanso','mercado','movilidad','horarios','reciclaje','emergencia'];
const areaPlaces=()=>places.filter(p=>Number.isInteger(p.area));
const servicePlaces=()=>serviceIds.map(id=>places.find(p=>p.id===id));
const placeAsset=p=>'./assets/'+p.asset;

const editorialLocations={"mercado": "Sobre el recorrido superior del sector izquierdo.", "diseno": "En el sector central derecho, debajo del cruce superior.", "moda": "En el sector derecho, junto al área de Gastronomía.", "comida": "En la parte superior derecha del predio.", "ong": "Sobre el recorrido lateral derecho.", "turismo": "En la parte inferior del sector derecho.", "bienestar": "En el sector central izquierdo.", "infancia": "En la parte inferior del sector izquierdo.", "descanso": "En el recorrido superior, antes del cruce central.", "banos": "Junto al cruce superior del recorrido central.", "accesibilidad": "En el sector central derecho, junto al cruce intermedio.", "auxilios": "Sobre el lateral izquierdo del predio.", "agua": "Junto al recorrido central, cerca del cruce inferior.", "reciclaje": "Sobre el recorrido central, entre los cruces superior e inferior.", "info": "Sobre el recorrido derecho, debajo del espacio ONG.", "boleteria": "En el acceso inferior izquierdo.", "horarios": "En el acceso inferior derecho.", "movilidad": "En la parte inferior central, junto al sector izquierdo.", "no-fumar": "Cuatro puntos: centro, superior izquierdo, superior derecho e inferior derecho.", "emergencia": "Cuatro puntos: laterales izquierdo y derecho, parte superior y parte inferior.", "arquitectura": "Ubicación a confirmar en el plano.", "recorrido": "Ubicación a confirmar en el plano."};
Object.assign(editorialLocations,{
 infancia:'En la isla verde con toldo blanco, junto al agua en el sector izquierdo.',
 ong:'En el espacio de charlas del sector inferior izquierdo.',
 diseno:'En el primer módulo de expositores del sector central derecho.',
 boleteria:'En ambos accesos: el puesto de Tickets, junto a Información.',
 info:'En ambos accesos: el puesto de Información, al lado de Tickets.'
});
for(const p of places){const point=mapPointFor(p.id);p.location=editorialLocations[p.id];if(point){p.x=point.x;p.y=point.y;}else{delete p.x;delete p.y;}}
const descriptions={auxilios:'Un punto de asistencia sobre el lateral izquierdo. Pedile orientación al equipo de la feria si necesitás llegar al puesto.',movilidad:'Un espacio para bicicletas y propuestas de movilidad sustentable, en la parte inferior central del recorrido.',boleteria:'El punto de entradas está en el acceso inferior izquierdo. La demo no vende entradas.',bienestar:'Una zona para hacer una pausa y conectar con el cuerpo, en el sector central izquierdo.', 'no-fumar':'Respetá las cuatro zonas sin humo señaladas en el plano para cuidar a quienes comparten el predio.',horarios:'Un punto para consultar la programación en el acceso inferior derecho.',reciclaje:'Punto de separación de residuos sobre el recorrido central. Mirá la identificación de cada recipiente.',emergencia:'El plano editorial señala cuatro salidas. Ubicá la más cercana y seguí las indicaciones del equipo del predio.',recorrido:'La doble flecha orienta el recorrido entre los sectores. Su ubicación exacta todavía no está indicada en este plano.'};
descriptions.boleteria='Encontrá Tickets en ambos accesos al predio, junto al puesto de Información. La demo no vende entradas.';
for(const p of places)if(descriptions[p.id])p.description=descriptions[p.id];

return {places:places,serviceIds:serviceIds,areaPlaces:areaPlaces,servicePlaces:servicePlaces,placeAsset:placeAsset};
};
__m['state.js']=function(){
const {activities,quizzes,interests}=__r('data.js');
const STORAGE_KEY='bioferia-demo-v1';
const emptyState=()=>({profile:null,saved:[],reservations:[],answers:{},interests:[],reminders:false,onboarded:false});
function sanitizeState(value){const v=value&&typeof value==='object'?value:{};const ids=new Set(activities.map(a=>a.id));return {...emptyState(),profile:typeof v.profile?.name==='string'?{name:v.profile.name.slice(0,60)}:null,saved:[...new Set(Array.isArray(v.saved)?v.saved.filter(id=>ids.has(id)):[])],reservations:[...new Set(Array.isArray(v.reservations)?v.reservations.filter(id=>activities.some(a=>a.id===id&&a.booking&&!a.full)):[])],answers:Object.fromEntries(Object.entries(v.answers||{}).filter(([id,n])=>quizzes[id]&&Number.isInteger(n)&&n>=0&&n<quizzes[id].options.length)),interests:Array.isArray(v.interests)?v.interests.filter(i=>interests.includes(i)):[],reminders:v.reminders===true,onboarded:v.onboarded===true};}
function readState(storage){try{return sanitizeState(JSON.parse(storage.getItem(STORAGE_KEY)));}catch{return emptyState();}}
function writeState(storage,state){try{storage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;}}
function filterActivities({day=1,category='Todas',search=''}={}){const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return activities.filter(a=>a.kind!=='Experiencia'&&a.day===Number(day)&&(category==='Todas'||a.category===category)&&norm(a.title+' '+a.category).includes(norm(search.trim())));}
function reserve(state,id){const a=activities.find(a=>a.id===id);if(!a||!a.booking||a.full||!state.profile)return false;if(!state.reservations.includes(id))state.reservations.push(id);return true;}

return {STORAGE_KEY:STORAGE_KEY,emptyState:emptyState,sanitizeState:sanitizeState,readState:readState,writeState:writeState,filterActivities:filterActivities,reserve:reserve};
};
__m['scenery.js']=function(){
const {restoredScenery}=__r('restored-scenery.js');
// Decorative assets are independent from text and controls, as in Figma.
function scenery(path,query=new URLSearchParams(),state={}){
  const restored=restoredScenery(path,query,state);
  const page=path.split('/')[0];
  if(page==='welcome')return '';
  const spaces=page==='map'&&query.get('tab')==='list';
  const savedTab=['talks','experiences'].includes(query.get('tab'))?query.get('tab'):'all';
  const leaf=page==='explore'?'explore':spaces?'spaces':page==='saved'?'saved-'+savedTab:'';
  const share=page==='share';
  const access=['access','mail','interests'].includes(page);
  const mesh=['event','booking','confirmed','cancel'].includes(page);
  const dotted=['home','agenda','my','reservations','profile','settings','privacy'].includes(page)||access||mesh||share||(page==='saved'&&savedTab==='all');
  if(!dotted&&!leaf)return restored;
  return `${restored}<div class="scenery scenery-${page}${leaf?' scenery-'+leaf:''}" aria-hidden="true">${leaf?'<div class="scenery-leaf-wrap"><img class="scenery-leaf" src="./assets/backgrounds/oak-leaf.webp" alt=""></div>':''}${dotted?`<img class="scenery-dots" src="./assets/${page==='saved'?'backgrounds/saved-dots.svg':'dots-violet.svg'}" alt="">`:''}${mesh&&!restored?'<img class="scenery-mesh" src="./assets/mesh.webp" alt="">':''}${share?'<img class="scenery-share-mesh" src="./assets/backgrounds/share-mesh.svg" alt="">':''}${access?'<img class="scenery-pencil" src="./assets/backgrounds/pencil-reference.webp" alt="">':''}</div>`;
}
function welcomeContent(step){
  const items=[
    {label:'COEXISTENCIA',title:'DALE<br>VUELTA',copy:'Lo distinto se encuentra.',theme:'dark'},
    {label:'01 / CONECTAR',title:'UNA<br>PREGUNTA',highlight:'POR DÍA.',copy:'Cartas cortas<br>sobre lo que damos<br>por hecho.',theme:''},
    {label:'02 / INTERCAMBIAR',title:'SIN UNA SOLA',highlight:'RESPUESTA.',copy:'Elegís, contrastás fuentes<br>y mirás cómo pensó<br>la comunidad.',theme:'dark'},
    {label:'03 / ACCIONAR',title:'ACTIVÁ<br>ESO QUE',highlight:'PENSÁS.',copy:'Un gesto pequeño puede<br>abrir algo nuevo. Probá,<br>mové, hacé a tu manera.',theme:'dark'}
  ];
  const n=Math.max(0,Math.min(3,Number(step)||0)),item=items[n];
  const finish='data-action="finish-welcome"';
  return {theme:item.theme,n,html:`<div class="welcome-art" aria-hidden="true"><img class="welcome-background" src="./assets/welcome-${n}.webp" alt="">${n===3?'<img class="welcome-fork" src="./assets/welcome-fork.webp" alt="">':''}</div><div class="welcome-layout"><header class="welcome-header">${n===0?'<div class="welcome-brand"><img src="./assets/logo.webp" alt="Bioferia"><span class="meta">COEXISTENCIA</span></div>':`<span class="meta">${item.label}</span>`}<button class="welcome-skip" ${finish}>Saltar</button></header><h1 class="welcome-title">${item.title}${item.highlight?`<span class="hand">${item.highlight}</span>`:''}</h1><footer class="welcome-footer"><p>${item.copy}</p><div class="welcome-progress" aria-label="Presentación ${n+1} de 4">${items.map((_,i)=>`<a href="#welcome/${i}" class="${i===n?'active':''}" aria-label="Presentación ${i+1}" ${i===n?'aria-current="step"':''}></a>`).join('')}</div>${n===3?`<button class="gestural" ${finish}>Empezar →</button>`:`<a class="gestural" href="#welcome/${n+1}">${n===0?'Comenzar →':'Siguiente →'}</a>`}</footer></div>`};
}

return {scenery:scenery,welcomeContent:welcomeContent};
};
__m['restored-scenery.js']=function(){
const {originalArtwork}=__r('original-artwork.js');
const {activities}=__r('data.js');
const {filterActivities}=__r('state.js');
const {sectionTexture}=__r('section-textures.js');

const unit=n=>`${(n/3.9).toFixed(4)}cqw`;
function layer(key){
 const a=originalArtwork[key];
 const box=`left:${unit(a.x)};top:${unit(a.y)};width:${unit(a.w)};height:${unit(a.h)};opacity:${a.opacity};transform:matrix(${a.matrix.join(',')},0,0)`;
 // SVG root dimensions stay untouched; only its external image box is scaled.
 return `<span class="original-art original-art-${key}" style="${box}"><img src="./assets/backgrounds/${a.file}" alt="" draggable="false"></span>`;
}
function restoredScenery(path,query,state={}){
 const [page,id,step]=path.split('/');
 let key;
 if(page==='quiz'&&id==='consumo')key=!step||step==='question'?'quiz-question':['choice','compare','behind','opinion','opinions'].includes(step)?'quiz-choice':step==='reflection'?'quiz-reflection':null;
 if(page==='profile'&&state.profile)key='profile-wire';
 if(page==='settings')key='settings-wire';
 if(page==='privacy')key='mesh-original';
 if(page==='event')key=activities.find(a=>a.id===id)?.full?'full-lines':'agenda-filter';
 if(['booking','confirmed','cancel'].includes(page))key=page+'-lines';
 if(page==='agenda'){
  const category=query.get('category')||'Todas';
  const empty=!filterActivities({day:Number(query.get('day')||1),category,search:query.get('q')||''}).length;
  key=empty?'agenda-empty':'agenda-filter';
 }
 const section=['my','history'].includes(page)?sectionTexture(page):page==='map'&&(!query.get('tab')||query.get('tab')==='map')?sectionTexture('map'):'';
 return section+(key?`<div class="rest-artboard" aria-hidden="true">${layer(key)}</div>`:'');
}
function serviceArtwork(id){
 const key=id==='banos'?'bath-wing':id==='accesibilidad'?'access-wing':null;
 return key?`<div class="rest-artboard service-artboard" aria-hidden="true">${layer(key)}</div>`:'';
}

return {restoredScenery:restoredScenery,serviceArtwork:serviceArtwork};
};
__m['original-artwork.js']=function(){
// Original decorative layers; source nodes and geometry are retained for review.
const originalArtwork = {
  "quiz-question": {
    "file": "quiz-question.svg",
    "node": "112:5032",
    "screen": "39:1767",
    "w": 753.8837280273438,
    "h": 738.2800903320312,
    "x": -66.94186401367188,
    "y": -346.1400451660156,
    "matrix": [
      1,
      0,
      0,
      1
    ],
    "opacity": 1
  },
  "quiz-choice": {
    "file": "quiz-choice.svg",
    "node": "112:5033",
    "screen": "39:1788",
    "w": 624.7068481445312,
    "h": 611.77685546875,
    "x": -242.65283203125,
    "y": 909.7664184570312,
    "matrix": [
      0.0962316170334816,
      -0.995358943939209,
      0.995358943939209,
      0.0962316170334816
    ],
    "opacity": 1
  },
  "quiz-reflection": {
    "file": "quiz-reflection.svg",
    "node": "112:5035",
    "screen": "39:1807",
    "w": 651.7875366210938,
    "h": 638.2970581054688,
    "x": 140.0986328125,
    "y": -286.29705810546875,
    "matrix": [
      1,
      0,
      0,
      1
    ],
    "opacity": 1
  },
  "quiz-history": {
    "file": "quiz-history.svg",
    "node": "112:5036",
    "screen": "112:5036",
    "w": 252.31158447265625,
    "h": 247.0893096923828,
    "x": 318.5219421386719,
    "y": -24.50670051574707,
    "matrix": [
      0.7884594202041626,
      0.6150867342948914,
      -0.6150867342948914,
      0.7884594202041626
    ],
    "opacity": 1
  },
  "profile-wire": {
    "file": "profile-wire.webp",
    "node": "79:1870",
    "screen": "79:1865",
    "w": 463,
    "h": 574,
    "x": -76.5,
    "y": 53,
    "matrix": [
      1,
      0,
      0,
      1
    ],
    "opacity": 0.10000000149011612
  },
  "settings-wire": {
    "file": "settings-wire.webp",
    "node": "112:4392",
    "screen": "79:2003",
    "w": 465.1568298339844,
    "h": 697.7352294921875,
    "x": 848.7080078125,
    "y": -11.008880615234375,
    "matrix": [
      -0.00878554955124855,
      0.9999613761901855,
      -0.9999613761901855,
      -0.00878554955124855
    ],
    "opacity": 0.3499999940395355
  },
  "reservations-poppy": {
    "file": "reservations-poppy.webp",
    "node": "112:4391",
    "screen": "79:1958",
    "w": 259.37554931640625,
    "h": 335.8701477050781,
    "x": 345.7159118652344,
    "y": -57.50266647338867,
    "matrix": [
      0.009344233199954033,
      0.9999563097953796,
      -0.9999563097953796,
      0.009344233199954033
    ],
    "opacity": 1
  },
  "bath-wing": {
    "file": "bath-wing.webp",
    "node": "83:4385",
    "screen": "33:1587",
    "w": 382,
    "h": 285,
    "x": -82.62476348876953,
    "y": 5,
    "matrix": [
      1,
      0,
      0,
      1
    ],
    "opacity": 0.11999999731779099
  },
  "access-wing": {
    "file": "access-wing.webp",
    "node": "99:2083",
    "screen": "33:1877",
    "w": 255,
    "h": 242,
    "x": 84.36991882324219,
    "y": 186.18853759765625,
    "matrix": [
      0.6538903117179871,
      -0.7565893530845642,
      0.7565893530845642,
      0.6538903117179871
    ],
    "opacity": 0.11999999731779099
  },
  "agenda-filter": {
    "file": "agenda-filter.svg",
    "node": "166:2444",
    "screen": "125:2018",
    "w": 526.7081298828125,
    "h": 482.0169677734375,
    "x": -136.01953125,
    "y": -174.54226684570312,
    "matrix": [
      1,
      0,
      0,
      1
    ],
    "opacity": 1
  },
  "agenda-empty": {
    "file": "agenda-empty.svg",
    "node": "166:2520",
    "screen": "125:2165",
    "w": 549.5717163085938,
    "h": 502.9405212402344,
    "x": -159.57171630859375,
    "y": 108.05947875976562,
    "matrix": [
      1,
      0,
      0,
      1
    ],
    "opacity": 1
  },
  "event-lines": {
    "file": "event-lines.svg",
    "node": "205:2486",
    "screen": "125:2297",
    "w": 330.0000915527344,
    "h": 302.00018310546875,
    "x": 227.4219970703125,
    "y": 524.9323120117188,
    "matrix": [
      -0.467730313539505,
      -0.8838712573051453,
      0.8838712573051453,
      -0.467730313539505
    ],
    "opacity": 1
  },
  "booking-lines": {
    "file": "booking-lines.svg",
    "node": "205:2682",
    "screen": "125:2425",
    "w": 537.4274291992188,
    "h": 491.8271179199219,
    "x": -138.9814453125,
    "y": -151.91357421875,
    "matrix": [
      1,
      0,
      0,
      1
    ],
    "opacity": 1
  },
  "confirmed-lines": {
    "file": "confirmed-lines.svg",
    "node": "225:2466",
    "screen": "125:2512",
    "w": 330,
    "h": 302,
    "x": 175,
    "y": 0,
    "matrix": [
      1,
      0,
      0,
      1
    ],
    "opacity": 1
  },
  "full-lines": {
    "file": "full-lines.svg",
    "node": "225:2610",
    "screen": "125:2582",
    "w": 330,
    "h": 301.9999084472656,
    "x": 225.1248321533203,
    "y": 407.5,
    "matrix": [
      0.009234249591827393,
      -0.9999573230743408,
      0.9999573230743408,
      0.009234249591827393
    ],
    "opacity": 1
  },
  "cancel-lines": {
    "file": "cancel-lines.svg",
    "node": "225:2703",
    "screen": "125:2639",
    "w": 330,
    "h": 302,
    "x": 225,
    "y": 33.36581802368164,
    "matrix": [
      1,
      0,
      0,
      1
    ],
    "opacity": 1
  },
  "mesh-original": {
    "file": "mesh-original.webp",
    "node": "99:2590",
    "screen": "99:2590",
    "w": 417,
    "h": 402,
    "x": 75.375,
    "y": -189,
    "matrix": [
      1,
      0,
      0,
      1
    ],
    "opacity": 0.6499999761581421
  }
};

return {originalArtwork:originalArtwork};
};
__m['routing.js']=function(){
const {activities}=__r('data.js');
function initialRoute(hash,onboarded){
  const path=(hash||'').replace(/^#/,'');
  if(!onboarded&&(!path||path==='home'))return 'welcome/0';
  return path||'home';
}
function mapDestination(placeId){return 'place/'+placeId;}
function safeNext(value){
 if(['my','profile'].includes(value))return value;
 const id=typeof value==='string'&&value.startsWith('booking/')?value.slice(8):null;
 return activities.some(a=>a.id===id&&a.booking&&!a.full)?value:'my';
}

return {initialRoute:initialRoute,mapDestination:mapDestination,safeNext:safeNext};
};
__m['map-interactions.js']=function(){
const MIN_MAP_WIDTH=300,DEFAULT_MAP_WIDTH=1800,MAX_MAP_WIDTH=3600,MAP_RATIO=1;
const clamp=(n,min,max)=>Math.max(min,Math.min(n,max));
function viewportPosition(center,world,viewport){return {left:clamp(center.x*world.width-viewport.width/2,0,Math.max(0,world.width-viewport.width)),top:clamp(center.y*world.height-viewport.height/2,0,Math.max(0,world.height-viewport.height))};}
function mapWidthFromQuery(q){const width=Number(q.get('scale'));return width>0&&Number.isFinite(width)?clamp(width,MIN_MAP_WIDTH,MAX_MAP_WIDTH):q.get('zoom')==='1'?2400:DEFAULT_MAP_WIDTH;}
// Buildings grow with the map; pictograms keep their familiar screen size.
function markerScale(width){return Math.min(1,width/900);}
function zoomAt(state,width,anchor,nextAnchor=anchor){
 width=clamp(width,state.minWidth??MIN_MAP_WIDTH,MAX_MAP_WIDTH);const ratio=width/state.width;
 return {width,left:clamp((state.left+anchor.x)*ratio-nextAnchor.x,0,Math.max(0,width-state.viewport.width)),top:clamp((state.top+anchor.y)*ratio-nextAnchor.y,0,Math.max(0,width*MAP_RATIO-state.viewport.height))};
}
const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// Pure pointer state machine shared by real pointer events and gesture tests.
class MapGesture {
 constructor(read,write){this.read=read;this.write=write;this.points=new Map();this.moved=false;}
 rebase(){const points=[...this.points.values()];this.origin={...this.read(),points:points.map(p=>({...p}))};}
 start(id,point){if(!this.points.size)this.moved=false;this.points.set(id,point);this.rebase();if(this.points.size>1)this.moved=true;}
 move(id,point){
  if(!this.points.has(id))return false;this.points.set(id,point);
  const points=[...this.points.values()],o=this.origin;
  if(points.length>=2&&o.points.length>=2){
   const d=distance(o.points[0],o.points[1]);
   if(d>0)this.write(zoomAt(o,o.width*distance(points[0],points[1])/d,midpoint(o.points[0],o.points[1]),midpoint(points[0],points[1])));
   this.moved=true;
  }else if(points.length===1){
   const dx=points[0].x-o.points[0].x,dy=points[0].y-o.points[0].y;
   if(this.moved||Math.hypot(dx,dy)>6){this.moved=true;this.write(zoomAt(o,o.width,{x:0,y:0},{x:dx,y:dy}));}
  }
  return this.moved;
 }
 end(id){this.points.delete(id);if(this.points.size)this.rebase();return this.moved;}
}
function captureMapCenter(){const box=document.querySelector('.fair-map-scroll');if(!box)return null;const width=Number(box.dataset.mapWidth)||DEFAULT_MAP_WIDTH;return {x:(box.scrollLeft+box.clientWidth/2)/width,y:(box.scrollTop+box.clientHeight/2)/(width*MAP_RATIO),width};}
let activeZoom=null;
function changeMapZoom(direction){activeZoom?.(direction==='in'?1.35:1/1.35);}
function mountMap(center={x:.62,y:.45},initialWidth=DEFAULT_MAP_WIDTH){
 const box=document.querySelector('.fair-map-scroll');activeZoom=null;if(!box)return;
 const world=box.querySelector('.fair-map-world'),minWidth=Math.max(MIN_MAP_WIDTH,Math.min(450,box.clientWidth));let width=Math.max(minWidth,center.width||initialWidth),suppressClick=false,wheelTimer;
 const read=()=>({width,minWidth,left:box.scrollLeft,top:box.scrollTop,viewport:{width:box.clientWidth,height:box.clientHeight}});
 const write=next=>{
  width=next.width;box.dataset.mapWidth=String(width);world.style.width=width+'px';world.style.height=width*MAP_RATIO+'px';
  world.style.setProperty('--marker-scale',String(markerScale(width)));
  box.scrollLeft=next.left;box.scrollTop=next.top;
  document.querySelector('[data-action="map-zoom"][data-value="in"]').disabled=width>=MAX_MAP_WIDTH-.5;
  document.querySelector('[data-action="map-zoom"][data-value="out"]').disabled=width<=minWidth+.5;
 };
 const settle=()=>{if(!box.isConnected)return;const q=new URLSearchParams(location.hash.split('?')[1]);q.delete('zoom');if(Math.abs(width-DEFAULT_MAP_WIDTH)>.5)q.set('scale',String(Math.round(width)));else q.delete('scale');history.replaceState(history.state,'','#map'+(q.size?'?'+q:''));};
 write({width,...viewportPosition(center,{width,height:width*MAP_RATIO},read().viewport)});
 const gesture=new MapGesture(read,write);
 const point=e=>{const r=box.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
 box.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;suppressClick=false;gesture.start(e.pointerId,point(e));
  if(gesture.points.size>=2)for(const id of gesture.points.keys())box.setPointerCapture(id);
 });
 box.addEventListener('pointermove',e=>{
  if(!gesture.move(e.pointerId,point(e)))return;
  e.preventDefault();if(!box.hasPointerCapture(e.pointerId))box.setPointerCapture(e.pointerId);box.classList.add('is-dragging');
 },{passive:false});
 const stop=e=>{
  if(!gesture.points.has(e.pointerId))return;
  suppressClick=gesture.end(e.pointerId);
  if(!gesture.points.size){box.classList.remove('is-dragging');settle();}
 };
 box.addEventListener('pointerup',stop);box.addEventListener('pointercancel',stop);
 // Moving implicit touch capture from a marker to its parent is not the end of a gesture.
 box.addEventListener('lostpointercapture',e=>{if(e.target===box)stop(e);});
 box.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch'&&!box.hasPointerCapture(e.pointerId))stop(e);});
 box.addEventListener('click',e=>{
  if(suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false;return;}
  // At overview scales the 48px touch areas may meet. Select the nearest
  // visible symbol instead of whichever overlapping button is later in DOM.
  const hit=e.target.closest('.map-point');if(!hit||!e.detail)return;
  let nearest=hit,best=Infinity;
  for(const button of world.querySelectorAll('.map-point')){
   const r=button.getBoundingClientRect();
   if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)continue;
   const d=Math.hypot(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2));
   if(d<best){best=d;nearest=button;}
  }
  if(nearest!==hit){e.preventDefault();e.stopPropagation();nearest.click();}
 },true);
 activeZoom=factor=>{const s=read();write(zoomAt(s,width*factor,{x:s.viewport.width/2,y:s.viewport.height/2}));settle();};
 box.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();write(zoomAt(read(),width*Math.exp(-e.deltaY*.01),point(e)));clearTimeout(wheelTimer);wheelTimer=setTimeout(settle,120);},{passive:false});
 box.addEventListener('keydown',e=>{
  const delta={ArrowLeft:[-80,0],ArrowRight:[80,0],ArrowUp:[0,-80],ArrowDown:[0,80]}[e.key];
  if(delta){e.preventDefault();box.scrollBy({left:delta[0],top:delta[1]});}
  if(['+','=','-'].includes(e.key)){e.preventDefault();activeZoom(e.key==='-'?1/1.35:1.35);}
 });
}

return {MIN_MAP_WIDTH:MIN_MAP_WIDTH,viewportPosition:viewportPosition,mapWidthFromQuery:mapWidthFromQuery,markerScale:markerScale,zoomAt:zoomAt,MapGesture:MapGesture,captureMapCenter:captureMapCenter,changeMapZoom:changeMapZoom,mountMap:mountMap};
};
__m['place-details.js']=function(){
const {sectionTexture}=__r('section-textures.js');
const {serviceArtwork}=__r('restored-scenery.js');
const {materialIcon}=__r('material-icons.js');
const {mapPointFor,pointsForPlace}=__r('editorial-map.js');
const {placeAsset}=__r('map-data.js');
const {miniMap}=__r('map-views.js');
const placeDetails={
 infancia:{image:'lugares/infancia.webp',title:'DESCUBRIR',highlight:'JUGANDO.',intro:'Pequeñas preguntas, grandes descubrimientos.',tips:['Un espacio para compartir en familia.','Acercate con una persona adulta para acompañar el recorrido.']},
 descanso:{image:'lugares/descanso.webp',title:'HACÉ UNA',highlight:'PAUSA.',intro:'El recorrido también necesita sus momentos de calma.',tips:['Encontrate con tu grupo y tomá un respiro.','Dejá el lugar listo para quien llegue después.']},
 mercado:{image:'lugares/mercado.webp',title:'ELEGÍ CON',highlight:'OTRA MIRADA.',intro:'Detrás de cada objeto hay una historia.',tips:['Conversá con los proyectos sobre sus materiales y procesos.','Traé tu bolsa para llevar lo que elijas.']},
 turismo:{image:'lugares/turismo.webp',title:'OTRAS FORMAS',highlight:'DE RECORRER.',intro:'Viajar también puede ser una forma de cuidar.',tips:['Conocé propuestas vinculadas con la naturaleza.','Preguntá por experiencias y recorridos de cada proyecto.']},
 moda:{image:'prendas.webp',title:'PRENDAS CON',highlight:'HISTORIA.',intro:'Lo que vestís puede tener más de una vida.',tips:['Descubrí materiales recuperados y procesos locales.','Conocé las actividades del espacio y guardá la que te interese.']},
 diseno:{image:'diseno.webp',title:'IDEAS QUE',highlight:'TRANSFORMAN.',intro:'Mirar un material de nuevo abre otras posibilidades.',tips:['Explorá objetos, técnicas y nuevos usos.','Sumate a los talleres y conversaciones de la agenda.']},
 arquitectura:{image:'habitar.webp',title:'OTRAS FORMAS',highlight:'DE HABITAR.',intro:'Espacios que se encuentran con la naturaleza.',tips:['Descubrí ideas para la casa, el jardín y los espacios compartidos.','Conversá con quienes diseñan y construyen estas propuestas.']},
 banos:{image:'lugares/banos-bioferia.webp',title:'TODO PARA',highlight:'SEGUIR.',intro:'Encontrá los servicios durante tu recorrido.',tips:['Seguí el pictograma de baños en el predio.','Para consultar por el baño accesible, acercate a Información.'],action:{label:'Consultar accesibilidad →',route:'place/accesibilidad'}},
 accesibilidad:{image:'lugares/accesibilidad.webp',title:'UNA FERIA',highlight:'COMPARTIDA.',intro:'Orientación para disfrutar el recorrido.',tips:['Consultá al equipo por los accesos y servicios disponibles.','Buscá el pictograma de accesibilidad en el sector central derecho.'],action:{label:'Ir a Información →',route:'place/info'}},
 auxilios:{image:'lugares/auxilios-bioferia.webp',title:'ESTAMOS',highlight:'CERCA.',intro:'Un punto de referencia para pedir asistencia.',tips:['Buscá el pictograma de primeros auxilios.','Pedile orientación al equipo de la feria para llegar al puesto.'],action:{label:'Ver Información →',route:'place/info'}},
 movilidad:{image:'lugares/movilidad.webp',title:'LLEGÁ DE',highlight:'OTRA MANERA.',intro:'El cambio puede empezar antes de entrar.',tips:['Explorá alternativas para moverte por la ciudad.','Ubicá este espacio en la parte inferior central del mapa.']},
 boleteria:{image:'lugares/boleteria.webp',title:'ACÁ EMPIEZA',highlight:'TU RECORRIDO.',intro:'Tu primer encuentro con la feria.',tips:['Ubicá el acceso principal antes de comenzar.','Acercate a Información si necesitás orientación.'],action:{label:'Conocer el predio →',route:'place/info'}},
 bienestar:{image:'lugares/bienestar-bioferia.webp',title:'BAJÁ UN',highlight:'CAMBIO.',intro:'Un momento para conectar con el cuerpo.',tips:['Buscá el espacio del sector central izquierdo.','Acompañá el ritmo tranquilo de quienes comparten el lugar.']},
 'no-fumar':{image:'lugares/sin-humo.webp',title:'COMPARTAMOS',highlight:'EL AIRE.',intro:'Una señal para cuidar el espacio que compartimos.',tips:['Respetá la indicación de no fumar.','Encontrá los cuatro puntos señalados en el mapa.']},
 horarios:{image:'lugares/horarios-bioferia.webp',title:'ENCONTRÁ TU',highlight:'MOMENTO.',intro:'Charlas, talleres y encuentros a lo largo de los tres días.',tips:['Elegí el día en la agenda.','Guardá las actividades para tenerlas a mano en Mi feria.'],action:{label:'Explorar la agenda →',route:'agenda'}},
 reciclaje:{image:'lugares/reciclaje-bioferia.webp',title:'SEPARÁ PARA',highlight:'TRANSFORMAR.',intro:'Cada material puede seguir otro camino.',tips:['Mirá la identificación de cada recipiente.','Consultá al equipo si no sabés dónde dejar un residuo.']},
 emergencia:{image:'lugares/emergencia-bioferia.webp',title:'CONOCÉ LAS',highlight:'SALIDAS.',intro:'Ubicá las señales durante tu visita.',tips:['Mantené libres los accesos y las salidas.','Seguí la señalización del predio y las indicaciones de su equipo.']},
 recorrido:{image:'lugares/recorrido.webp',title:'SEGUÍ TU',highlight:'CURIOSIDAD.',intro:'Un camino, muchas formas de vivir la feria.',tips:['Seguí la doble flecha hacia los sectores.','Elegí una parada en la lista y encontrala en el mapa.'],action:{label:'Explorar los sectores →',route:'map?tab=list'}}
};
function placeDetailView(p,related=[],card=()=> '',pointId){
 const d=placeDetails[p.id];if(!d)return null;
 const action=d.action||p.action,point=mapPointFor(p.id,pointId),siblings=pointsForPlace(p.id);
 const link=(label,route,kind='')=>`<a class="button ${kind}" href="#${route}">${label}</a>`;
 return {html:`<section class="sector-hero place-detail-hero"><img class="sector-photo" src="./assets/${d.image}" alt="${d.intro}">${serviceArtwork(p.id)}${sectionTexture(p.id,'hero')}<header class="topbar"><a class="back" href="#${point?'map?place='+p.id+'&point='+point.id:'map?tab=list'}" aria-label="Volver">${materialIcon('arrow_back')}</a><span class="meta">${p.kind==='signal'?'SEÑALIZACIÓN':p.service?'SERVICIOS':'ESPACIOS'}</span><a class="demo-pill" href="#about">Demo</a></header><h1>${d.title}<span class="hand">${d.highlight}</span></h1></section><div class="place-detail-sheet">${sectionTexture(p.id)}<div class="place-detail-label"><span><img class="map-picto" src="${placeAsset(p)}" alt=""></span><h2>${p.name}</h2></div><p class="place-detail-intro">${d.intro}</p><p>${p.description}</p>${point?`<div class="place-detail-location"><h3>${siblings.length>1?'Sus puntos en la feria':'Encontralo en la feria'}</h3>${miniMap(p.id,true,point.id)}<p>${p.location}</p>${siblings.length>1?`<div class="place-point-links">${siblings.map(m=>link(m.label,'map?place='+p.id+'&point='+m.id+'&zoom=1','secondary')).join('')}</div>`:link('Ver ubicación en el mapa →','map?place='+p.id+'&point='+point.id+'&zoom=1')}</div>`:'<p class="notice location-pending">Ubicación a confirmar en el plano.</p>'}<section class="sector-card"><h3>Para tu visita</h3><ul>${d.tips.map(t=>`<li>${t}</li>`).join('')}</ul>${action?link(action.label,action.route):''}</section>${related.length?`<section class="place-detail-activities"><h2>EN ESTE ESPACIO</h2><div class="stack">${related.map(card).join('')}</div></section>`:''}<div class="spacer"></div>${link('Seguir recorriendo →',p.service?'map?tab=services':'map?tab=list','secondary')}<p class="fine muted center place-photo-note">Imágenes de referencia · Recorrido de muestra</p></div>`,options:{active:'map',label:p.name,extra:'sector-page place-detail-page'}};
}

return {placeDetails:placeDetails,placeDetailView:placeDetailView};
};
__m['map-views.js']=function(){
const {materialIcon}=__r('material-icons.js');
const {places,areaPlaces,servicePlaces,placeAsset}=__r('map-data.js');
const {mapPoints,mapPointFor,pointsForPlace}=__r('editorial-map.js');
const link=(label,dest,kind='')=>`<a class="button ${kind}" href="#${dest}">${label}</a>`;
const head=(label,back='map')=>`<header class="topbar"><a class="back" href="#${back}" aria-label="Volver">${materialIcon('arrow_back')}</a><span class="meta">${label}</span><a class="demo-pill" href="#about">Demo</a></header>`;
const glyph=p=>`<img class="map-picto" draggable="false" src="${placeAsset(p)}" alt="">`;
const tabs=active=>`<nav class="map-tabs" aria-label="Vistas del mapa">${[['map','Mapa'],['list','Lista'],['services','Servicios']].map(([id,label])=>`<a href="#map?tab=${id}" ${active===id?'aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
const pointTitle=point=>places.find(p=>p.id===point.placeId).name+(point.label?' · '+point.label:'');
function marker(point,selected,interactive){
 const p=places.find(p=>p.id===point.placeId),label=pointTitle(point);
 const body=`<span class="map-marker-art">${glyph(p).replace("/catalogo/","/catalogo-map/")}</span>${selected?`<span class="map-marker-label">${label}</span>`:''}`;
 const attrs=`class="map-point ${selected?'is-selected':''} ${point.x>80?'label-left':point.x<20?'label-right':''}" style="left:${point.x}%;top:${point.y}%;--point-tile:url('./assets/${point.tile}');--point-filter:${point.color==='#FEFD15'?'brightness(0)':'brightness(0) invert(1)'}"`;
 return interactive?`<button ${attrs} data-action="map-select" data-id="${point.id}" aria-label="${label}" aria-pressed="${selected}">${body}</button>`:`<span ${attrs}>${body}</span>`;
}
function mapCanvas(selectedId,{interactive=false,zoom=false,pointId}={}){
 const selected=mapPointFor(selectedId,pointId);
 return `<div class="fair-map-world ${zoom?'is-zoomed':''}" ${!interactive?'aria-hidden="true"':''}><img class="fair-map-base" draggable="false" src="./assets/editorial/${interactive?'map-square-signage-2026-11-09.webp':'map-square-signage-preview-2026-11-09.webp'}" width="2880" height="2880" alt="${interactive?'Vista en perspectiva de Bioferia con los espacios de la feria':''}">${mapPoints.map(p=>marker(p,p.id===selected?.id,interactive)).join('')}</div>`;
}
function miniMap(id,large=false,pointId){const p=places.find(p=>p.id===id),point=mapPointFor(id,pointId);if(!point)return '';return `<a href="#map?place=${id}&point=${point.id}&zoom=1" class="sector-mini-map ${large?'large':''}" aria-label="Ver ${p.name} en el mapa ampliado">${mapCanvas(id,{pointId:point.id})}<span class="sr-only">Ver mapa ampliado</span></a>`;}
function mapPopover(p,point,siblings){
 if(!p)return '';
 const heading=point?pointTitle(point):p.name;
 const description=point?(siblings.length>1?`${siblings.length} puntos señalados en el predio.`:p.location):'Este espacio todavía no tiene una ubicación indicada en el plano.';
 return `<section class="map-selection map-popover ${point?'has-selection':''}" role="dialog" aria-modal="false" aria-labelledby="map-popover-title" ${point?`style="--selection-color:${point.color};--selection-text:${point.color==='#FEFD15'?'#332E34':'#F0EEE4'}"`:''}>
 <button class="map-popover-close" data-action="map-dismiss" aria-label="Cerrar información del lugar"><span aria-hidden="true">×</span></button>
 <h2 id="map-popover-title">${heading}</h2><p>${description}</p>
 ${siblings.length>1?`<div class="map-point-options" aria-label="Elegí una ubicación">${siblings.map(m=>`<button data-action="map-select" data-id="${m.id}" aria-pressed="${m.id===point.id}">${m.label}</button>`).join('')}</div>`:''}
 ${link(p.id==='ong'?'Ver espacio de charlas →':p.kind==='signal'?'Ver señal →':p.service?'Ver servicio →':'Ver sector →','place/'+p.id+(point?'?point='+point.id:''),'light')}
 ${p.service?'<a class="map-popover-services" href="#map?tab=services">Ver todos los servicios →</a>':''}</section>`;
}
function mapView(q,zoom){
 const tab=q.get('tab')||'map';if(tab==='services')return servicesView();
 const p=places.find(p=>p.id===q.get('place')),point=mapPointFor(p?.id,q.get('point')),siblings=p?pointsForPlace(p.id):[];
 const title=`<h1 class="map-heading">ENCONTRÁ <br>TU LUGAR.</h1>`;
 const content=tab==='list'?`<p class="map-intro">Los sectores de la feria. Elegí uno para conocerlo.</p><div class="area-list">${areaPlaces().map(p=>`<a class="space-row" href="#place/${p.id}">${glyph(p)}<div class="copy"><h3>${p.name}</h3><p>${p.detail}${pointsForPlace(p.id).length?'':' · Ubicación a confirmar'}</p></div><span aria-hidden="true">→</span></a>`).join('')}</div>`:
 `<div class="fair-map-wrap"><div class="fair-map-scroll" tabindex="0" aria-label="Plano de la feria. Mové con un dedo y ampliá con dos dedos.">${mapCanvas(p?.id,{interactive:true,zoom,pointId:point?.id})}</div>
 <span class="map-drag-hint">Tocá un ícono · mové y ampliá con los dedos</span><div class="map-zoom-controls"><button data-action="map-zoom" data-value="in" aria-label="Ampliar mapa">${materialIcon('add')}</button><button data-action="map-zoom" data-value="out" aria-label="Alejar mapa">${materialIcon('remove')}</button></div>
 ${mapPopover(p,point,siblings)}</div>`;
 return {html:head('MAPA DEL PREDIO','home')+title+tabs(tab)+content,options:{active:'map',label:tab==='list'?'Sectores de la feria':'Mapa',extra:tab==='map'?'map-page map-interactive-page':'map-page'}};
}
function servicesView(){return {html:`<img class="services-lines" src="./assets/map/services-lines.svg" alt="" aria-hidden="true">${head('SERVICIOS')}<h1 class="map-heading">LO QUE<br>NECESITÁS.</h1>${tabs('services')}<p class="map-intro">El mismo símbolo en el mapa y en la feria.</p><div class="service-grid">${servicePlaces().map(p=>`<a class="service-tile ${p.id==='agua'||p.id==='descanso'?'blue':''}" href="#place/${p.id}">${p.id==='agua'?'<img class="service-bottle" src="./assets/map/services-bottle.webp" alt=""><span class="bottle-shade"></span>':''}${glyph(p)}<span class="tile-arrow" aria-hidden="true">→</span><h2>${p.name}</h2></a>`).join('')}</div><div class="map-signs"><h2>Señales del recorrido</h2>${places.filter(p=>p.kind==='signal'&&!p.service).map(p=>`<a class="space-row" href="#place/${p.id}">${glyph(p)}<span>${p.name}</span><span aria-hidden="true">→</span></a>`).join('')}</div>${link('Ver todos en el mapa →','map','light')}<p class="fine center">Elegí un servicio para ubicarlo.</p>`,options:{theme:'dark',active:'map',label:'Servicios',extra:'services-page'}};}
function sectorHero({id,label,title,highlight}){return `<section class="sector-hero"><img class="sector-photo" src="./assets/map/${id}.webp" alt="${label}">${id==='hidratacion'?'<img class="water-mesh" src="./assets/map/water-mesh.webp" alt="" aria-hidden="true">':''}${head(label,id==='hidratacion'?'map?tab=services':'map?tab=list')}<h1>${title}<span class="hand">${highlight}</span></h1></section>`;}
function sectorView(id){
 if(id==='comida')return {html:sectorHero({id:'gastronomia',label:'GASTRONOMÍA',title:'SABORES CON',highlight:'HISTORIA.'})+`<div class="sector-sheet"><nav class="sector-switch" aria-label="Sectores"><a href="#place/comida" aria-current="page">✓ Gastronomía</a><a href="#place/mercado">Mercado</a></nav>${miniMap('comida')}<section class="sector-card"><h2>Un encuentro alrededor de la mesa</h2><p>Conocé quiénes cocinan y qué hay detrás de cada plato.</p><div class="food-options" aria-label="Propuestas gastronómicas"><span>Vegetarianas</span><span>Veganas</span><span>Sin TACC</span></div>${link('Explorar experiencias →','food')}<a class="sector-text-link" href="#map?tab=services">Ver servicios del predio</a></section></div>`,options:{active:'map',label:'Gastronomía',extra:'sector-page food-page'}};
 if(id==='agua')return {html:sectorHero({id:'hidratacion',label:'PUNTO DE HIDRATACIÓN',title:'RECARGÁ',highlight:'Y SEGUÍ.'})+`<div class="water-sheet">${miniMap('agua',true)}<div class="water-label"><span>${glyph(places.find(p=>p.id==='agua'))}</span><h2>Punto de hidratación</h2></div><p>Traé tu botella y buscá este símbolo en los carteles del predio.</p>${link('Ver otros servicios →','map?tab=services')}</div>`,options:{active:'map',label:'Hidratación',extra:'sector-page water-page'}};
 if(id==='info')return {html:`<div class="info-decoration" aria-hidden="true"><img src="./assets/map/info-lines.svg" alt=""></div>${head('INFORMACIÓN','map?tab=services')}<h1 class="map-heading">TODO PARA<br>RECORRERLA.</h1><figure class="info-photo"><img src="./assets/map/informacion.webp" alt="Ingreso a Bioferia"><figcaption>BIOFERIA 2027</figcaption></figure><h2 class="venue-name">RESERVA ECOLÓGICA<br>COSTANERA SUR</h2><p class="venue-location">● Buenos Aires, CABA</p><section class="info-card"><span class="info-symbol">${glyph(places.find(p=>p.id==='info'))}</span><div><h2>Orientación en la feria</h2><p>Consultá actividades, accesos y servicios en el punto de información.</p></div>${link('Ubicar servicios →','map?tab=services','light')}</section><a class="sector-text-link" href="#agenda">Consultar agenda →</a>`,options:{active:'map',label:'Información',extra:'info-page'}};
 return null;
}
function foodView(){return {html:`${head('EXPERIENCIAS GASTRONÓMICAS','place/comida')}<h1 class="map-heading">OTRAS FORMAS<br><span class="hand">DE COMER.</span></h1><img class="detail-image" src="./assets/map/gastronomia.webp" alt="Encuentro alrededor de la mesa"><div class="card stack"><h2>Un encuentro alrededor de la mesa</h2><p>Recorré el sector y conocé quiénes cocinan. En esta demo podés explorar el espacio y seguir con una pregunta sobre alimentación.</p>${link('Explorar el sector en el mapa →','map?place=comida&zoom=1')}${link('Más allá del plato →','quiz/alimentacion','secondary')}</div>`,options:{active:'map',label:'Experiencias gastronómicas'}};}

return {mapCanvas:mapCanvas,miniMap:miniMap,mapView:mapView,sectorView:sectorView,foodView:foodView};
};
function __r(k){if(!__c[k])__c[k]=__m[k]();return __c[k];}
__r('app.js');})();