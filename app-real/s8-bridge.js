/* Puente de la pantalla "Web y app": el recorrido de la app (mano que toca el quiz) corre acá adentro y el pitch solo le avisa cuándo empezar. */
(function(){
  if(window.parent===window) return;
  function post(m){ try{ parent.postMessage(m,'*'); }catch(e){} }
  var run=0, epoch=0;
  (function ready(){ if(document.querySelector('.page-home')) post({s8:'ready',who:'app'}); else setTimeout(ready,100); })();
  addEventListener('message',function(ev){
    var m=ev.data||{}; if(!m.s8) return;
    if(m.s8==='app-run'){ epoch=m.epoch; go(++run); } else if(m.s8==='stop'){ run++; }
  });
  async function go(id){
    function S(){ if(id!==run) throw new Error('stopped'); }
    function wait(ms){ return new Promise(function(res,rej){ setTimeout(function(){ if(id!==run) rej(new Error('stopped')); else res(); },ms); }); }
    async function until(check){ for(var i=0;i<200;i++){ S(); var v=check(); if(v) return v; await wait(100); } throw new Error('No se pudo cargar la demostracion'); }
    var K=0.5;
    function at(ms){ return wait(Math.max(0,epoch+ms*K-Date.now())); }
    async function scroll(y,duration){
      var from=scrollY, begin=performance.now();
      do{ S(); var p=Math.min(1,(performance.now()-begin)/duration), e=p*p*(3-2*p); scrollTo(0,from+(y-from)*e); if(p===1) break; await wait(16); }while(true);
    }
    var hand=document.querySelector('.pitch-hand');
    async function tap(selector,clickAt){
      var el=await until(function(){ return document.querySelector(selector); });
      var rect=el.getBoundingClientRect();
      if(rect.top<55||rect.bottom>innerHeight-90){
        hand.classList.remove('visible');
        await scroll(Math.max(0,scrollY+rect.top-innerHeight*.45),300); await wait(60); rect=el.getBoundingClientRect();
      }
      hand.classList.add('visible');
      hand.style.left=(rect.left+rect.width*.62)+'px'; hand.style.top=(rect.top+rect.height*.5)+'px';
      await wait(330); await at(clickAt-120); hand.classList.add('press'); await wait(120);
      if(el.disabled) throw new Error('La opcion todavia no esta disponible');
      el.click(); hand.classList.remove('press'); await wait(180);
    }
    function step(n){ post({s8:'step',n:n}); }
    var sel=function(q){ return function(){ return document.querySelector(q); }; };
    async function slow(y,dur){ await scroll(y,dur); }
    try{
      /* 1 · todos los días hay una pregunta que lleva dos minutos */
      step(1); await at(1800);
      await tap('a[href="#quiz/consumo"]',3600);
      /* 2 · tocás tu respuesta */
      step(2); await until(sel('[data-action="answer"]')); hand.classList.remove('visible'); await at(5200);
      await tap('[data-action="answer"][data-value="1"]',7000); await at(8000);
      await tap('[data-action="quiz-next"]',9400);
      await until(sel('a[href="#quiz/consumo/compare"]')); hand.classList.remove('visible'); await at(10600);
      /* 3 · ves qué contestó el resto */
      step(3); await tap('a[href="#quiz/consumo/compare"]',12000);
      var comparison=await until(sel('.quiz-comparison')); hand.classList.remove('visible'); await at(13200);
      var bottom=comparison.getBoundingClientRect().bottom;
      if(bottom>innerHeight-40) await scroll(scrollY+bottom-innerHeight+60,420);
      await at(16200);
      /* 4 · si te quedaste con ganas, mirás qué hay detrás: qué dice la ley en cada país */
      step(4); await tap('a[href="#quiz/consumo/behind"]',18000);
      await until(sel('.law-list')); hand.classList.remove('visible'); await at(19600);
      await slow(Math.max(0,document.documentElement.scrollHeight-innerHeight)*.55,1300); await at(23200);
      await slow(Math.max(0,document.documentElement.scrollHeight-innerHeight),1100); await at(26000);
      /* 5 · das tu opinión y recibís las de los demás */
      step(5); await tap('a[href="#quiz/consumo/opinion"]',27600);
      await until(sel('[data-action="op"]')); hand.classList.remove('visible'); await at(29000);
      await tap('[data-action="op"][data-value="1"]',30800); await at(31800);
      await tap('[data-action="op-next"]',33200);
      await until(sel('.op-list')); hand.classList.remove('visible'); await at(36000);
      post({s8:'done'});
    }catch(e){ if(id===run) post({s8:'error',msg:String(e.message||e)}); }
  }
})();
