/* Slide 8: la web y la app reales, en una demostracion local reproducible. */
(function(){
  'use strict';
  let current=null;
  function stop(){
    if(!current)return;
    current.abort(); current=null;
  }
  async function start(slide){
    stop();
    const scene=slide.querySelector('.s8-sequence');
    if(!scene)return;
    const run=new AbortController();current=run;
    const started=performance.now();
    const signal=run.signal, web=scene.querySelector('.s8-web'), app=scene.querySelector('.s8-app');
    const typed=scene.querySelector('.s8-typed'), enter=scene.querySelector('.s8-enter'), status=scene.querySelector('.s8-status');
    const pills=[].slice.call(scene.querySelectorAll('.s8-q')), steps=[].slice.call(scene.querySelectorAll('.s8-step'));
    scene.classList.remove('web-open','split','app-on');slide.classList.remove('app-dim');delete scene.dataset.finished;if(typed)typed.textContent='';if(enter)enter.classList.remove('pressed');status.textContent='';
    pills.concat(steps).forEach(e=>e.classList.remove('on'));
    function wait(ms){return new Promise((resolve,reject)=>{
      if(signal.aborted){reject(new Error('stopped'));return;}
      const cancel=()=>{clearTimeout(timer);reject(new Error('stopped'));};
      const timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve();},ms);
      signal.addEventListener('abort',cancel,{once:true});
    });}
    async function until(check){
      for(let i=0;i<200;i++){if(signal.aborted)throw new Error('stopped');const value=check();if(value)return value;await wait(100);}
      throw new Error('No se pudo cargar la demostracion');
    }
    const at=ms=>wait(Math.max(0,started+ms-performance.now()));
    /* La web y la app se manejan con mensajes (postMessage): así funciona aunque el HTML se abra con doble clic. */
    const ready={web:false,app:false};
    function setStep(list,n){ list.forEach((e,i)=>e.classList.toggle('on',i===n-1)); }
    function onMsg(ev){
      const m=ev.data||{}; if(!m.s8) return;
      if(m.s8==='ready'){ if(web&&ev.source===web.contentWindow&&m.who==='web') ready.web=true; if(app&&ev.source===app.contentWindow&&m.who==='app') ready.app=true; }
      else if(m.s8==='step'&&app&&ev.source===app.contentWindow){ setStep(steps,m.n); }
      else if(m.s8==='error'&&app&&ev.source===app.contentWindow&&!signal.aborted){ status.textContent='Volvé a esta slide para reiniciar la experiencia.';console.error('Slide 8 (app):',m.msg); }
    }
    window.addEventListener('message',onMsg);
    function send(frame,msg){ try{ frame.contentWindow.postMessage(msg,'*'); }catch(e){} }
    function unload(){ window.removeEventListener('message',onMsg); [web,app].forEach(f=>{ if(f){ send(f,{s8:'stop'}); f.src='about:blank'; } }); }
    signal.addEventListener('abort',unload,{once:true});
    if(web) web.src='web-demo/index.html';
    if(app) app.src='app-real/pitch.html#home';
    try{
      if(web){
        /* pantalla de la web: se escribe la dirección, se abre y recorre las tres preguntas */
        await at(350);
        for(const letter of 'www.bioferia.com.ar'){typed.textContent+=letter;await wait(letter==='.'?100:65);}
        await at(2100);enter.classList.add('pressed');await wait(180);enter.classList.remove('pressed');
        await until(()=>ready.web);
        send(web,{s8:'web-prep'});
        await at(2500);send(web,{s8:'web-scroll',speed:430});scene.classList.add('web-open');
        /* la web se scrollea sola a una velocidad que se ve; ~7 s después una mano toca los botones de arriba y la web va a cada respuesta */
        await at(7800);setStep(pills,1);send(web,{s8:'web-click',sel:'.bf-nav a[href="#quienes"]',id:'quienes',dur:900,drift:210});
        await at(11300);setStep(pills,2);send(web,{s8:'web-click',sel:'.bf-nav a[href="#experiencias"]',id:'experiencias',dur:900,drift:210});
        await at(14800);setStep(pills,3);send(web,{s8:'web-click',sel:'.bf-nav a.nav-cta',id:'participar',dur:900,drift:210});
        await at(19000);
        scene.dataset.finished='true';
      }else if(app){
        /* pantalla de la app: el recorrido corre dentro de la app y avisa en qué paso va */
        await until(()=>ready.app);
        /* primero se ve el video de la chica caminando; a los 4 s baja al 20 % y aparece el celular con todo el recorrido */
        await at(4000);
        slide.classList.add('app-dim');scene.classList.add('app-on');
        send(app,{s8:'app-run',epoch:Date.now()});
        await at(4000+20500);
        scene.dataset.finished='true';
      }
    }catch(error){
      if(!signal.aborted){status.textContent='Volvé a esta slide para reiniciar la experiencia.';console.error('Slide 8:',error);}
    }
  }
  window.BioferiaSlide8={start,stop};
})();
