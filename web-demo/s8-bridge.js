/* Puente de la pantalla "Web y app": recibe órdenes del pitch por postMessage (funciona también abriendo el HTML con doble clic). */
(function(){
  if(window.parent===window) return;
  function post(m){ try{ parent.postMessage(m,'*'); }catch(e){} }
  var run=0, hand=null;
  function mkHand(){ if(hand) return hand; var st=document.createElement('style'); st.textContent='.s8hand{position:fixed;left:0;top:0;width:44px;height:53px;z-index:99999;pointer-events:none;opacity:0;transition:transform .5s cubic-bezier(.22,1,.36,1),opacity .2s;filter:drop-shadow(2px 4px 2px #0006)}.s8hand svg{width:44px;height:53px;transform-origin:11px 4px;transition:transform .15s}.s8hand.press svg{transform:scale(.82)}.s8hand:before{content:"";position:absolute;left:-11px;top:-11px;width:26px;height:26px;border:3px solid #f44530;border-radius:50%;opacity:0;transform:scale(.4)}.s8hand.press:before{opacity:1;transform:scale(1.25);transition:transform .35s,opacity .15s}'; document.head.appendChild(st); hand=document.createElement('div'); hand.className='s8hand'; hand.innerHTML='<svg viewBox="0 0 48 58"><path d="M12 30V7c0-6 8-6 8 0v15c1-5 8-5 8 1v2c1-5 8-4 8 1v3c2-4 8-2 8 3v9c0 7-5 10-5 14H18c0-7-8-12-12-19l-3-5c-3-6 3-9 7-4l6 7" fill="white" stroke="#332e34" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/></svg>'; document.body.appendChild(hand); hand.style.transform='translate(700px,420px)'; return hand; }
  (function ready(){ if(document.querySelector('#inicio')) post({s8:'ready',who:'web'}); else setTimeout(ready,100); })();
  addEventListener('message',function(ev){
    var m=ev.data||{}; if(!m.s8) return;
    if(m.s8==='web-prep'){
      document.documentElement.style.scrollBehavior='auto';
      var st=document.createElement('style'); st.textContent='html{scrollbar-width:none}::-webkit-scrollbar{display:none}.leaf-fly{display:none!important}'; document.head.appendChild(st);
      var am=document.createElement('style'); am.textContent='.card4:nth-child(odd),.xcard:nth-child(odd){clip-path:polygon(2% 0,98% 1.5%,100% 12%,98.5% 96%,95% 100%,3% 98.5%,0 90%,1% 6%)}.card4:nth-child(even),.xcard:nth-child(even){clip-path:polygon(0 2%,96% 0,100% 8%,99% 92%,97% 100%,4% 99%,1% 94%,0 10%)}.sheet{clip-path:polygon(1% 0,99% 1%,100% 8%,99% 97%,96% 100%,2% 99%,0 93%,.5% 5%)}'; document.head.appendChild(am);
    }else if(m.s8==='web-scroll'){
      scrollTo(0,0); var id=++run, last=performance.now(), dir=1, spd=m.speed||230;
      (function loop(){
        if(id!==run) return;
        var now=performance.now(), max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
        var y=scrollY+dir*spd*(now-last)/1000; last=now;
        if(y>max){ y=Math.max(0,2*max-y); dir=-1; } else if(y<0){ y=Math.min(max,-y); dir=1; }
        scrollTo(0,y); setTimeout(loop,16);
      })();
    }else if(m.s8==='web-goto'){
      var id2=++run, el=document.getElementById(m.id); if(!el) return;
      var from=scrollY, to=Math.max(0,el.getBoundingClientRect().top+scrollY-(m.offset||70)), dur=m.dur||2200, t0=performance.now(), drift=m.drift||0, last2=performance.now();
      (function go2(){
        if(id2!==run) return;
        var now=performance.now(), p=Math.min(1,(now-t0)/dur), e=p*p*(3-2*p);
        if(p<1){ scrollTo(0,from+(to-from)*e); setTimeout(go2,16); return; }
        /* llegó: sigue bajando muy despacio, como leyendo */
        last2=performance.now(); var y=scrollY; (function rd(){ if(id2!==run) return; var n2=performance.now(); y+=drift*(n2-last2)/1000; last2=n2; var mx=Math.max(0,document.documentElement.scrollHeight-innerHeight); scrollTo(0,Math.min(mx,y)); setTimeout(rd,16); })();
      })();
    }else if(m.s8==='web-click'){
      /* una mano va al botón del menú de arriba, lo toca y la web va a esa sección */
      var a=document.querySelector(m.sel), h=mkHand(); if(!a) return;
      var idc=++run, r=a.getBoundingClientRect();
      h.style.opacity='1'; h.style.transform='translate('+(r.left+r.width*.55)+'px,'+(r.top+r.height*.5)+'px)';
      setTimeout(function(){ if(idc!==run) return; h.classList.add('press'); },560);
      setTimeout(function(){
        if(idc!==run) return; h.classList.remove('press');
        var el=document.getElementById(m.id); if(!el) return;
        var from=scrollY, to=Math.max(0,el.getBoundingClientRect().top+scrollY-70), dur=m.dur||1300, t0=performance.now(), drift=m.drift||0, last3;
        (function go3(){
          if(idc!==run) return;
          var now=performance.now(), p=Math.min(1,(now-t0)/dur), e=p*p*(3-2*p);
          if(p<1){ scrollTo(0,from+(to-from)*e); setTimeout(go3,16); return; }
          last3=performance.now(); var y=scrollY; (function rd(){ if(idc!==run) return; var n3=performance.now(); y+=drift*(n3-last3)/1000; last3=n3; scrollTo(0,Math.min(Math.max(0,document.documentElement.scrollHeight-innerHeight),y)); setTimeout(rd,16); })();
        })();
        setTimeout(function(){ h.style.opacity='0'; },900);
      },760);
    }else if(m.s8==='stop'){ run++; }
  });
})();
