/* BioFeria · El hecho · EXPRESS — motor de pantallas */
(function(){
  var slides=[].slice.call(document.querySelectorAll('.slide')), N=slides.length, cur=-1, t0=null;
  var root=document.documentElement;
  var cnt=document.getElementById('cnt'), tm=document.getElementById('tm');
  var notes=document.getElementById('notes'), mute=document.getElementById('mute');
  var TARGET=15*60;

  /* ---- escala del lienzo ---- */
  function fit(){ root.style.setProperty('--s',Math.min(innerWidth/1920,innerHeight/1080)); }
  addEventListener('resize',fit); fit();

  /* ---- letras sueltas: <… class="sp"> se parte en <i> con trayectorias al azar ---- */
  function rnd(seed){ var x=Math.sin(seed*9999.13)*10000; return x-Math.floor(x); }
  function splitNode(node,ctr){
    [].slice.call(node.childNodes).forEach(function(ch){
      if(ch.nodeType===3){
        var f=document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(function(tok){
          if(!tok) return;
          if(/^\s+$/.test(tok)){ f.appendChild(document.createTextNode(' ')); return; }
          var w=document.createElement('span'); w.style.cssText='display:inline-block;white-space:nowrap';
          tok.split('').forEach(function(c){
            var i=document.createElement('i'); i.textContent=c;
            var k=ctr.n++;
            i.style.setProperty('--k',k);
            i.style.setProperty('--ox',Math.round((rnd(k+1)-.5)*900)+'px');
            i.style.setProperty('--oy',Math.round(-300-rnd(k+7)*700)+'px');
            i.style.setProperty('--or',Math.round((rnd(k+3)-.5)*220)+'deg');
            w.appendChild(i);
          });
          f.appendChild(w);
        });
        node.replaceChild(f,ch);
      }else if(ch.nodeType===1&&ch.tagName!=='I'&&ch.tagName!=='BR'){ splitNode(ch,ctr); }
    });
  }
  [].forEach.call(document.querySelectorAll('.sp'),function(el){ splitNode(el,{n:0}); });

  /* ---- contadores ---- */
  function runCount(el){
    var to=parseFloat(el.dataset.to||'0'), dur=parseFloat(el.dataset.dur||'1800'), s=null;
    function step(ts){ if(s===null) s=ts; var p=Math.min(1,(ts-s)/dur), e=1-Math.pow(1-p,3);
      el.textContent=Math.round(to*e); if(p<1&&el._on) requestAnimationFrame(step); }
    el._on=true; el.textContent='0'; requestAnimationFrame(step);
  }

  /* ---- montaje final ---- */
  var mtgTimer=null;
  var mtgDelay=null;
  function runMontage(sl){
    var box=sl.querySelector('.mtg'); if(!box) return;
    var im=[].slice.call(box.querySelectorAll('img')), k=0;
    sl.classList.remove('fin-on'); im.forEach(function(x){x.classList.remove('on');});
    clearInterval(mtgTimer); clearTimeout(mtgDelay);
    mtgDelay=setTimeout(function(){
      if(!sl.classList.contains('on')) return;
      mtgTimer=setInterval(function(){
        if(!sl.classList.contains('on')){ clearInterval(mtgTimer); return; }
        im.forEach(function(x){x.classList.remove('on');});
        if(k<im.length){ im[k].classList.add('on'); k++; }
        else{ clearInterval(mtgTimer); im[im.length-1].classList.add('on'); sl.classList.add('fin-on'); }
      },105);
    },(parseFloat(box.dataset.start)||0)*1000);
  }

  /* ---- pantalla 01: logo rebotando (tipo DVD) + grilla amorfa que se prende y se apaga ---- */
  var dvdRun=new WeakMap();
  function stopPhaseB(sl){
    sl.classList.remove('after');
    var st=sl.querySelector('.dvd-stage'); if(!st) return;
    var r=dvdRun.get(st); if(r){ cancelAnimationFrame(r.raf); clearInterval(r.iv); (r.to||[]).forEach(clearTimeout); dvdRun.delete(st); }
    [].forEach.call(st.querySelectorAll('.gc.lit'),function(c){ c.classList.remove('lit'); });
    var lg=st.querySelector('.dvd-logo'); if(lg) lg.style.opacity='0';
  }
  function startPhaseB(sl){
    var st=sl.querySelector('.dvd-stage'); if(!st||dvdRun.get(st)) return;
    sl.classList.add('after');
    var run={to:[]}; dvdRun.set(st,run);
    var logo=st.querySelector('.dvd-logo'), cells=[].slice.call(st.querySelectorAll('.gc'));
    /* grilla: una imagen se prende, se apaga, otra se prende en otro lado… (a veces dos a la vez) */
    var pool=st.dataset.pool, N=parseInt(st.dataset.n,10)||1, last=-1, nxt=1+Math.floor(Math.random()*N);
    function src(n){ return pool.replace('%02d',String(n).padStart(2,'0')); }
    function pre(n){ var im=new Image(); im.src=src(n); }
    pre(nxt);
    function lightOne(){
      var k; do{ k=Math.floor(Math.random()*cells.length); }while(k===last||cells[k].classList.contains('lit')); last=k;
      var c=cells[k], img=c.querySelector('img'); img.src=src(nxt); c.classList.add('lit');
      nxt=1+Math.floor(Math.random()*N); pre(nxt);
      run.to.push(setTimeout(function(){ c.classList.remove('lit'); },900+Math.random()*500));
    }
    if(cells.length){ lightOne(); run.iv=setInterval(lightOne,150); }
    /* logo: entra grande con rebote en el medio, se achica y rebota contra los bordes */
    var T0=performance.now(), W=0, H=0, ar=2430/460, x=0, y=0, vx=0, vy=0, big=0, small=0, started=false;
    function meas(){ var r=st.getBoundingClientRect(); W=r.width; H=r.height; big=Math.min(W*.5,H*.7*ar); small=Math.min(W*.27,520*(W/1920)); }
    function easeOutBack(t){ var c1=1.9, c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); }
    meas(); logo.style.opacity='1';
    (function f(now){
      var t=(now-T0)/1000; meas();
      var w, px, py;
      if(t<1.1){ var k=easeOutBack(Math.min(1,t/1.1)); w=big*Math.max(.001,k); px=(W-w)/2; py=(H-w/ar)/2; }
      else if(t<2.9){ w=big; px=(W-w)/2; py=(H-w/ar)/2; }
      else if(t<3.8){ var u=(t-2.9)/.9; var e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2; w=big+(small-big)*e; px=(W-w)/2; py=(H-w/ar)/2; }
      else{
        w=small; var h=w/ar;
        if(!started){ started=true; x=(W-w)/2; y=(H-h)/2; var sp=Math.max(W,H)*.13; vx=sp*(Math.random()<.5?-1:1); vy=sp*.75*(Math.random()<.5?-1:1); run.last=now; }
        var dt=Math.min(.05,(now-run.last)/1000); run.last=now;
        x+=vx*dt; y+=vy*dt;
        if(x<=0){ x=0; vx=Math.abs(vx); } else if(x+w>=W){ x=W-w; vx=-Math.abs(vx); }
        if(y<=0){ y=0; vy=Math.abs(vy); } else if(y+h>=H){ y=H-h; vy=-Math.abs(vy); }
        px=x; py=y;
      }
      logo.style.width=Math.round(w)+'px';
      logo.style.transform='translate('+Math.round(px)+'px,'+Math.round(py)+'px)';
      run.raf=requestAnimationFrame(f);
    })(T0);
  }

  /* ---- pantalla 07 · Instagram "en uso": un dedo scrollea el feed, abre una foto, da me gusta, comenta y entra al perfil ---- */
  var igRun=new WeakMap();
  function igStop(sl){
    var r=igRun.get(sl); if(r){ r.to.forEach(clearTimeout); igRun.delete(sl); }
    var ig=sl.querySelector('.ig'); if(!ig) return;
    var q=function(s){ return ig.querySelector(s); };
    [q('.igfeed'),q('.pbody')].forEach(function(e){ e.style.transition='none'; e.style.transform=''; });
    q('.igfing').style.opacity='0'; q('.igfing').classList.remove('down');
    ['.igview','.igshade','.igsheet','.igkb','.igprof'].forEach(function(s){ q(s).classList.remove('on','kb','done'); });
    q('.igsheet').classList.remove('kb'); q('.igbig').classList.remove('pop');
    q('.ignav .nv').classList.remove('on');
    [].forEach.call(ig.querySelectorAll('.igp.liked'),function(p){ p.classList.remove('liked'); });
    [].forEach.call(sl.querySelectorAll('.igfly.on'),function(e){ e.classList.remove('on'); });
    q('.ty').textContent=''; q('.ctx').textContent=''; q('.igin').classList.remove('typing','has');
    [].forEach.call(ig.querySelectorAll('.igkr u.press'),function(u){ u.classList.remove('press'); });
  }
  function igStart(sl){
    igStop(sl);
    var ig=sl.querySelector('.ig'); if(!ig) return;
    var r={to:[]}; igRun.set(sl,r);
    var q=function(s){ return ig.querySelector(s); };
    var feed=q('.igfeed'), fing=q('.igfing'), view=q('.igview'), big=q('.igbig'), sheet=q('.igsheet'), kb=q('.igkb'), shade=q('.igshade'),
        inp=q('.igin'), ty=q('.ty'), prof=q('.igprof'), pbody=q('.pbody'), nv=q('.ignav .nv'), posts=ig.querySelectorAll('.igp');
    var P=783, TXT='¡Nos vemos ahí!';
    function at(ms,fn){ r.to.push(setTimeout(fn,ms)); }
    function FT(x,y){ fing.style.transition='none'; fing.style.transform='translate('+x+'px,'+y+'px)'; void fing.offsetWidth; fing.style.transition=''; }
    function FM(x,y,ms){ fing.style.transitionDuration=(ms||600)+'ms,.25s,.12s'; fing.style.transform='translate('+x+'px,'+y+'px)'; }
    function show(v){ fing.style.opacity=v?'1':'0'; }
    function tap(){ fing.classList.add('down'); at2(140,function(){ fing.classList.remove('down'); }); }
    var base=0; function at2(ms,fn){ r.to.push(setTimeout(fn,ms)); }
    function swipe(t,el,toY,dur){
      at(t,function(){ FT(247,780); show(1); });
      at(t+90,function(){ FM(247,430,dur*.8); el.style.transition='transform '+dur+'ms cubic-bezier(.2,.8,.2,1)'; el.style.transform='translateY('+toY+'px)'; });
      at(t+90+dur*.8,function(){ show(0); });
    }
    function tapAt(t,x,y,fn){
      at(t,function(){ if(fing.style.opacity!=='1'){ FT(x,y-60); show(1); } FM(x,y,420); });
      at(t+470,function(){ tap(); if(fn) at2(90,fn); });
    }
    function kbPos(ch){
      var u=kb.querySelector('u[data-k="'+ch+'"]'); if(!u) return null;
      return [u.offsetLeft+u.offsetWidth/2, 696+u.offsetTop+u.offsetHeight/2, u];
    }
    var fl=sl.querySelectorAll('.igfly');
    function fly(n,src){ if(!fl[n]) return; if(src) fl[n].src=src; fl[n].classList.add('on'); }
    var viewImg=view.querySelector('img');
    function openView(src){ if(src) viewImg.src=src; view.classList.add('on'); }
    /* 1 · scrollea el feed (rápido), una publicación sale volando al costado */
    swipe(500,feed,-P,700);
    swipe(1700,feed,-2*P,480); at(2300,function(){ fly(0); });
    /* 2 · toca una foto: se abre; la cierra con la X */
    tapAt(3000,247,492,function(){ openView('assets/ig/feed/f04.jpg'); });
    at(3500,function(){ show(0); });
    tapAt(4700,35,91,function(){ view.classList.remove('on'); });
    at(5200,function(){ show(0); });
    /* 3 · otra foto: doble toque, me gusta */
    swipe(5500,feed,-3*P,520);
    tapAt(6600,247,492,function(){ tap(); });
    at(7230,function(){ posts[3].classList.add('liked'); big.classList.add('pop'); });
    at(7800,function(){ show(0); fly(1); });
    /* 4 · otra foto: comentario */
    swipe(8100,feed,-4*P,480);
    var T4=9200;
    tapAt(T4,96,831,function(){ shade.classList.add('on'); sheet.classList.add('on'); });
    tapAt(T4+1000,200,984,function(){ sheet.classList.add('kb'); kb.classList.add('on'); inp.classList.add('typing'); });
    at(T4+1400,function(){
      for(var i=0;i<TXT.length;i++){ (function(i){ at2(i*95,function(){
        ty.textContent=TXT.slice(0,i+1); inp.classList.add('has');
        var k=kbPos(TXT[i].normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase());
        if(k){ FM(k[0],k[1],110); show(1); k[2].classList.add('press'); at2(90,function(){ k[2].classList.remove('press'); }); }
      }); })(i); }
    });
    tapAt(T4+1400+TXT.length*95+400,440,654,function(){
      sheet.classList.add('done'); ty.textContent=''; inp.classList.remove('typing','has'); q('.ctx').textContent=TXT;
      kb.classList.remove('on'); sheet.classList.remove('kb');
    });
    var T5=T4+1400+TXT.length*95+1700;
    at(T5-300,function(){ show(0); shade.classList.remove('on'); sheet.classList.remove('on'); });
    /* 5 · otra más, rápido, y vuelve atrás al perfil */
    swipe(T5,feed,-5*P,460); at(T5+700,function(){ fly(2); });
    var T6=T5+1500;
    tapAt(T6,445,978,function(){ nv.classList.add('on'); prof.classList.add('on'); });
    at(T6+500,function(){ show(0); });
    /* 6 · el perfil: se ve toda la grilla de BioFeria, scrollea rápido, abre una y vuelve a subir */
    var max=function(){ return Math.max(0,pbody.offsetHeight-(prof.offsetHeight-120)); };
    var cells=pbody.querySelectorAll('.pgrid img');
    function cellPos(n,sy){ var c=cells[n]; return [c.offsetLeft+c.offsetWidth/2, 120+c.offsetTop+c.offsetHeight/2+sy]; }
    swipe(T6+1100,pbody,-330,700);
    swipe(T6+2200,pbody,-Math.min(max(),700),650);
    var cp=cellPos(10,-Math.min(max(),700));
    tapAt(T6+3300,cp[0],cp[1],function(){ openView(cells[10].getAttribute('src')); });
    at(T6+3800,function(){ show(0); });
    tapAt(T6+5000,35,91,function(){ view.classList.remove('on'); });
    at(T6+5500,function(){ show(0); });
    swipe(T6+5700,pbody,-max(),520); at(T6+6300,function(){ fly(3,cells[16].getAttribute('src')); });
    swipe(T6+7100,pbody,0,700);
    swipe(T6+8300,pbody,-max(),900);
    at(T6+9900,function(){ if(slides[cur]===sl&&!sl.querySelector('.ig-nonext')) next(); });
  }

  function revealAfter(sl){
    sl.classList.add('after');
    [].forEach.call(sl.querySelectorAll('video[data-wait="after"]'),function(w){ try{w.currentTime=0;}catch(e){} w.playbackRate=parseFloat(w.dataset.rate)||1; var q=w.play(); if(q&&q.catch) q.catch(function(){}); });
  }
  [].forEach.call(document.querySelectorAll('video[data-after-end]'),function(v){
    v.addEventListener('ended',function(){
      var sl=v.closest('.slide'); if(!sl||!sl.classList.contains('on')) return;
      if(sl.querySelector('.ph2')){ sl.classList.add('after'); [].forEach.call(sl.querySelectorAll('video[data-wait="after"]'),function(w){ try{w.currentTime=0;}catch(e){} var q=w.play(); if(q&&q.catch) q.catch(function(){}); }); }
      else startPhaseB(sl);
    });
  });

  /* ---- video / iframes ---- */
  [].forEach.call(document.querySelectorAll('.video-start'),function(button){
    var v=button.parentNode.querySelector('video'), slide=button.closest('.slide');
    button.addEventListener('click',function(e){
      e.stopPropagation();
      if(!slide.classList.contains('on')) return;
      var p=v.play(); if(p&&p.catch) p.catch(function(){});
    });
    button.addEventListener('keydown',function(e){
      if(e.key===' '||e.key==='Enter') e.stopPropagation();
    });
    v.addEventListener('playing',function(){
      if(slide.classList.contains('on')){ button.hidden=true; button.blur(); }
    });
  });
  function media(i){
    if(window.BioferiaSlide8){
      window.BioferiaSlide8.stop();
      if(slides[i].querySelector(".s8-sequence")) window.BioferiaSlide8.start(slides[i]);
    }
    var _mf=function(s,k){
      var on=(k===i); stopPhaseB(s);
      s.classList.remove('stories-on'); clearTimeout(s._rv); clearTimeout(s._ab);
      if(on){ var am=s.querySelector('[data-after-ms]'); if(am) s._ab=setTimeout(function(){ if(slides[cur]===s) revealAfter(s); },parseInt(am.dataset.afterMs,10)); }
      if(on&&s.querySelector('.dvd-stage[data-auto]')) startPhaseB(s);
      if(s.querySelector('.ig')){
        clearInterval(s._igw); clearTimeout(s._igt); s.classList.remove('ig-on'); igStop(s);
        if(on){
          var gv=s.querySelector('video[data-ig-half]'), th=gv?parseFloat(gv.dataset.igHalf):0; if(isNaN(th)) th=0;
          var goIg=function(){ clearInterval(s._igw); clearTimeout(s._igt); if(slides[cur]!==s||s.classList.contains('ig-on')) return; s.classList.add('ig-on'); igStart(s); };
          if(th===0){ goIg(); } else if(gv) s._igw=setInterval(function(){ if(gv.currentTime>=th) goIg(); },80);
          s._igt=setTimeout(goIg,th*1000+3000);
        }
      }
      if(on){ var sc7=s.querySelector('.sc7[data-reveal-ms]'); if(sc7) s._rv=setTimeout(function(){
        if(slides[cur]!==s) return; s.classList.add('stories-on');
        [].forEach.call(s.querySelectorAll('video[data-wait="feed"]'),function(story){ var p=story.play(); if(p&&p.catch) p.catch(function(){}); });
      },parseInt(sc7.dataset.revealMs,10)); }
      [].forEach.call(s.querySelectorAll('video.av'),function(v){
        v.onended=null;
        if(on){
          if(!v.getAttribute('src')&&v.dataset.src){
            v.setAttribute('src',v.dataset.src);
            if(v.dataset.src2){ v.addEventListener('error',function(){ if(v.getAttribute('src')!==v.dataset.src2){ v.setAttribute('src',v.dataset.src2); try{v.load();}catch(e){} var q=v.play(); if(q&&q.catch) q.catch(function(){}); } },{once:true}); }
          }
          v.muted=v.dataset.autosound!=='1';
          if(v.dataset.autosound==='1') v.volume=Math.min(1,Math.max(0,isNaN(parseFloat(v.dataset.vol))?1:parseFloat(v.dataset.vol)));
          try{v.currentTime=parseFloat(v.dataset.start||0);}catch(e){}
          if(v.dataset.next==='1') v.onended=function(){ if(cur===k) next(); };
          if(v.dataset.reveal==='stories') v.onended=function(){
            if(cur!==k) return;
            s.classList.add('stories-on');
            [].forEach.call(s.querySelectorAll('video[data-wait="feed"]'),function(story){
              var p=story.play(); if(p&&p.catch) p.catch(function(){});
            });
          };
          if(v.dataset.rate) v.playbackRate=parseFloat(v.dataset.rate);
          clearTimeout(v._at);
          if(v.dataset.manual==='1'){
            v.pause(); v.parentNode.querySelector('.video-start').hidden=false; return;
          }
          if(v.dataset.wait==='feed'||v.dataset.wait==='after'){ v.pause(); return; }
          if(v.dataset.at){ v.pause(); v._at=setTimeout(function(){ try{v.currentTime=parseFloat(v.dataset.from||0);}catch(e){} var q=v.play(); if(q&&q.catch) q.catch(function(){}); },parseFloat(v.dataset.at)*1000); }
          else{ var p=v.play(); clearInterval(v._un);
            if(v.dataset.until){ var un=parseFloat(v.dataset.until); v._un=setInterval(function(){
              if(slides[cur]!==s){ clearInterval(v._un); return; }
              if(v.currentTime>=un){ clearInterval(v._un); v.pause(); if(v.dataset.afterEnd==='1') v.dispatchEvent(new Event('ended')); if(v.dataset.next==='1') next(); }
            },40); }
            if(p&&p.catch) p.catch(function(){
            if(cur!==k||v.dataset.autosound!=='1') return;
            // Al abrir #22 directamente el navegador puede exigir un gesto para el audio.
            v.muted=true; mute.textContent='🔇 M · activar sonido';
            var fallback=v.play(); if(fallback&&fallback.catch) fallback.catch(function(){});
          }); }
        }else{ clearTimeout(v._at); clearInterval(v._un); v.pause(); }
      });
      if(Math.abs(k-i)<=1){
        /* el juego del oso va EMBEBIDO (srcdoc): con archivos sueltos (file://) Chrome trata cada archivo como un origen distinto y bloquea cosas entre marcos */
        [].forEach.call(s.querySelectorAll('iframe[data-gamedoc]'),function(f){
          if(f.getAttribute('srcdoc')) return;
          var el=document.getElementById('gamedoc'); if(!el) return;
          try{ var bin=atob(el.textContent.trim()), by=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) by[i]=bin.charCodeAt(i); f.setAttribute('srcdoc',new TextDecoder('utf-8').decode(by)); }catch(e){ if(window.console) console.error('juego del oso:',e); }
        });
        [].forEach.call(s.querySelectorAll('iframe[data-src]:not([data-ld])'),function(f){ if(f.getAttribute('src')!==f.getAttribute('data-src')) f.setAttribute('src',f.getAttribute('data-src')); });
      }
      /* videos de la pantalla que viene: se pide solo el primer cuadro para que no haya un destello negro al entrar (sobre todo desde internet) */
      if(k===i+1){
        [].forEach.call(s.querySelectorAll('video[data-src]'),function(v,n){
          if(n>0&&!v.closest('.av')&&v.parentNode&&(v.parentNode.classList.contains('vch')||v.parentNode.classList.contains('chain'))) return;
          if(!v.getAttribute('src')){ v.preload=v.dataset.start?'auto':'metadata'; v.setAttribute('src',v.dataset.src); if(v.dataset.start) v.addEventListener('loadedmetadata',function(){ try{v.currentTime=parseFloat(v.dataset.start);}catch(e){} },{once:true}); }
        });
      }
      /* iframes pesados (web y app): se cargan escalonados recién cuando la pantalla está activa y se descargan al salir */
      [].forEach.call(s.querySelectorAll('iframe[data-ld]'),function(f){
        clearTimeout(f._ld);
        if(on){
          if(f.getAttribute('src')!==f.getAttribute('data-src')){
            f._ld=setTimeout(function(){
              f.onload=function(){ if(s.classList.contains('on')){ try{f.contentWindow.postMessage('pitch-start','*');}catch(e){} } };
              f.setAttribute('src',f.getAttribute('data-src'));
            },parseFloat(f.dataset.ld)||0);
          }
        }else if(f.getAttribute('src')&&f.getAttribute('src')!=='about:blank'){ f.onload=null; f.setAttribute('src','about:blank'); }
      });
      /* juego en vivo (pantalla interactiva): se carga al entrar, toma el foco para que la barra espaciadora funcione, y se descarga al salir */
      /* música de fondo de una pantalla (audio.bgm): suena bajito mientras la pantalla está activa */
      [].forEach.call(s.querySelectorAll('audio.bgm'),function(au){
        clearInterval(au._fd);
        if(on){
          if(!au.getAttribute('src')) au.setAttribute('src',au.dataset.src);
          au.loop=true; au.volume=0; try{au.currentTime=0;}catch(e){}
          var pp=au.play(); if(pp&&pp.catch) pp.catch(function(){});
          var tv=Math.min(1,Math.max(0,parseFloat(au.dataset.vol)||.2));
          au._fd=setInterval(function(){ if(au.volume<tv-.01) au.volume=Math.min(tv,au.volume+.02); else clearInterval(au._fd); },100);
        }else{ au.pause(); }
      });
      [].forEach.call(s.querySelectorAll('iframe.live'),function(f){
        clearTimeout(f._lv);
        if(on){
          if(f.getAttribute('src')!==f.dataset.live){
            f._lv=setTimeout(function(){ if(!s.classList.contains('on')) return; f.onload=function(){ try{f.contentWindow.focus();}catch(e){} }; f.setAttribute('src',f.dataset.live); },450);
          }
        }else if(f.getAttribute('src')){ f.onload=null; f.setAttribute('src','about:blank'); }
      });
      [].forEach.call(s.querySelectorAll('iframe.pitch-web'),function(f){
        clearTimeout(f._dl);
        var send=function(){ try{f.contentWindow.postMessage(on?'pitch-start':'pitch-stop','*');}catch(e){} };
        if(on && f.dataset.delay){ f._dl=setTimeout(send,parseFloat(f.dataset.delay)); } else { send(); }
      });
      if(!on){ [].forEach.call(s.querySelectorAll('.ophone'),function(e){e.classList.remove('tilt');}); [].forEach.call(s.querySelectorAll('.dlimg'),function(e){e.classList.remove('on');}); }
      [].forEach.call(s.querySelectorAll('video.dv'),function(v){
        // video que arranca DESDE EL PRINCIPIO recién cuando aparece (data-play-after = segundos desde que entra la pantalla)
        clearTimeout(v._pt); v.ontimeupdate=null; v.pause(); try{ v.currentTime=parseFloat(v.dataset.start)||0; }catch(e){}
        if(!on) return;
        if(!v.getAttribute('src')&&v.dataset.src) v.setAttribute('src',v.dataset.src);
        v.muted=true; v.preload='auto'; try{ v.load(); }catch(e){}
        if(v.dataset.start){ var st0=parseFloat(v.dataset.start)||0; v.addEventListener('loadedmetadata',function(){ try{ v.currentTime=st0; }catch(e){} },{once:true}); }
        if(v.dataset.next==='1') v.onended=function(){ if(cur===k) next(); };
        v._pt=setTimeout(function(){ if(!s.classList.contains('on')) return; try{ if(Math.abs(v.currentTime-(parseFloat(v.dataset.start)||0))>.15) v.currentTime=parseFloat(v.dataset.start)||0; }catch(e){} var q=v.play(); v.playbackRate=parseFloat(v.dataset.rate)||1; if(q&&q.catch) q.catch(function(){}); if(v.dataset.stop){ var stp=parseFloat(v.dataset.stop); v.ontimeupdate=function(){ if(v.currentTime>=stp){ v.ontimeupdate=null; v.pause(); } }; } },(parseFloat(v.dataset.playAfter)||0)*1000);
      });
      [].forEach.call(s.querySelectorAll('.later'),function(box){
        clearTimeout(box._tl); box.style.display='none';
        if(on) box._tl=setTimeout(function(){ if(s.classList.contains('on')) box.style.display='block'; },(parseFloat(box.dataset.after)||0)*1000);
      });
      [].forEach.call(s.querySelectorAll('svg[data-morph]'),function(svg){
        // polígono que se deforma (forma -> forma) y texto que lo sigue: se recalcula el trazado en cada cuadro para que el texto acompañe siempre la forma
        var cfg=JSON.parse(svg.dataset.morph), fp=svg.querySelector('[data-m="fill"]'), tp=svg.querySelector('[data-m="txt"]');
        if(svg._mr){ cancelAnimationFrame(svg._mr); svg._mr=0; }
        function dstr(pts,k){ var cx=cfg.cx, cy=cfg.cy, o='M'; for(var i=0;i<pts.length;i++){ o+=(i?' L':'')+(cx+(pts[i][0]-cx)*k).toFixed(1)+','+(cy+(pts[i][1]-cy)*k).toFixed(1); } return o+'Z'; }
        function ease(u){ return u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2; }
        function hex(h){ return [parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)]; }
        function draw(p){
          var T=cfg.t, S=cfg.s, j=0; while(j<T.length-2 && p>T[j+1]) j++;
          var u=Math.max(0,Math.min(1,(p-T[j])/(T[j+1]-T[j]))), e=ease(u), a=S[j], b=S[j+1], pts=[];
          for(var i=0;i<a.length;i++) pts.push([a[i][0]+(b[i][0]-a[i][0])*e, a[i][1]+(b[i][1]-a[i][1])*e]);
          if(fp){ fp.setAttribute('d',dstr(pts,1)); var c0=hex(cfg.fills[j]), c1=hex(cfg.fills[j+1]); fp.setAttribute('fill','rgb('+Math.round(c0[0]+(c1[0]-c0[0])*e)+','+Math.round(c0[1]+(c1[1]-c0[1])*e)+','+Math.round(c0[2]+(c1[2]-c0[2])*e)+')'); }
          if(tp) tp.setAttribute('d',dstr(pts,cfg.k));
        }
        draw(0);
        if(!on) return;
        var t0=performance.now();
        (function f(now){
          var p=((now-t0)/1000-cfg.delay)/cfg.dur*100; if(p<0) p=0;
          if(p>=100){ draw(100); svg._mr=0; return; }
          draw(p); svg._mr=requestAnimationFrame(f);
        })(t0);
      });
      [].forEach.call(s.querySelectorAll('.runner'),function(box){
        if(box._raf){ cancelAnimationFrame(box._raf); box._raf=0; }
        if(!on) return;
        var d=box.dataset, cx=+d.cx, cy=+d.cy, rx=+d.rx, ry=+d.ry, per=(+d.per)*1000, w=+d.w, feet=+d.feet;
        var im=[].slice.call(box.querySelectorAll('img.rb')), bear=box.querySelector('.bear'), t0=performance.now(), seq=[0,1,0,2];
        (function f(now){
          var a=2*Math.PI*(now-t0)/per, x=cx+rx*Math.cos(a), y=cy+ry*Math.sin(a), dir=(-Math.sin(a))>=0?1:-1;
          var fr=Math.floor((now-t0)/105)%4, bob=(fr%2===0)?0:-10;
          im.forEach(function(e,k){ e.style.opacity=(k===seq[fr])?1:0; });
          bear.style.transform='translate('+Math.round(x-w/2)+'px,'+Math.round(y-feet+bob)+'px) scaleX('+dir+')';
          box._raf=requestAnimationFrame(f);
        })(t0);
      });
      [].forEach.call(s.querySelectorAll('canvas.wgrid'),function(cv){
        if(cv._wr){ cancelAnimationFrame(cv._wr); cv._wr=0; } if(!on) return;
        var ctx=cv.getContext('2d'), t0=performance.now(), ty=cv.dataset.type||'waves', ink=cv.dataset.ink||'rgba(240,238,228,.13)', acc=cv.dataset.acc||'rgba(253,255,26,.28)', seed=7, nodes=null;
        function rnd(){ seed=(seed*16807)%2147483647; return seed/2147483647; }
        (function f(now){
          var W=cv.clientWidth, H=cv.clientHeight, t=(now-t0)/1000; if(!W||!H){ cv._wr=requestAnimationFrame(f); return; }
          if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; nodes=null; }
          var mx=W*(.5+.36*Math.sin(t*.37)), my=H*(.5+.3*Math.sin(t*.53+1.2)), R=260, P=new Path2D(), i,j,x,y;
          function wp(x,y){ var dx=x-mx, dy=y-my, fo=Math.exp(-(dx*dx+dy*dy)/(R*R)); return [x+dx*fo*.55+Math.sin(y*.01+t)*1.4, y+dy*fo*.55+Math.cos(x*.01+t*.8)*1.4]; }
          function poly(pts){ pts.forEach(function(q,k){ var a=wp(q[0],q[1]); if(k) P.lineTo(a[0],a[1]); else P.moveTo(a[0],a[1]); }); }
          ctx.clearRect(0,0,W,H); ctx.lineWidth=1; ctx.strokeStyle=ink; ctx.fillStyle=ink;
          if(ty==='waves'){
            var N=62, top=20, span=H-40, RX=Math.min(330,W*.42), RY=Math.min(190,H*.38);
            for(i=0;i<N;i++){ var by=top+span*(i/(N-1));
              for(x=0;x<=W+8;x+=8){ y=by+Math.sin(x*.0042+t*.6+i*.05)*(24+18*Math.sin(i*.09+t*.2))+Math.sin(x*.011-t*.9+i*.12)*7;
                var ddx=(x-mx)/RX, ddy=(y-my)/RY; y+=(my-y)*Math.exp(-(ddx*ddx+ddy*ddy)*1.3)*.78; if(x===0) P.moveTo(x,y); else P.lineTo(x,y); } }
            ctx.stroke(P);
          }else if(ty==='grid'||ty==='cross'||ty==='dots'){
            var c=ty==='grid'?150:(ty==='cross'?64:34);
            if(ty==='grid'){ for(x=0;x<=W+c;x+=c){ var pt=[]; for(y=0;y<=H+20;y+=20) pt.push([x,y]); poly(pt); } for(y=0;y<=H+c;y+=c){ var pt2=[]; for(x=0;x<=W+20;x+=20) pt2.push([x,y]); poly(pt2); } ctx.stroke(P); }
            else { for(x=c/2;x<W+c;x+=c) for(y=c/2;y<H+c;y+=c){ var a=wp(x,y); if(ty==='dots'){ P.moveTo(a[0]+1.6,a[1]); P.arc(a[0],a[1],1.6,0,6.3); } else { P.moveTo(a[0]-5,a[1]); P.lineTo(a[0]+5,a[1]); P.moveTo(a[0],a[1]-5); P.lineTo(a[0],a[1]+5); } } if(ty==='dots') ctx.fill(P); else ctx.stroke(P); }
          }else if(ty==='diag'){
            for(var cc=-H;cc<=W+H;cc+=86){ var pd=[]; for(y=-20;y<=H+20;y+=20) pd.push([cc+y,y]); poly(pd); } ctx.stroke(P);
          }else if(ty==='hlines'){
            for(y=0;y<=H+30;y+=30){ var ph=[]; for(x=0;x<=W+20;x+=20) ph.push([x,y+Math.sin(x*.006+y*.02+t*.5)*8]); poly(ph); } ctx.stroke(P);
          }else if(ty==='radial'){
            var cx=W/2, cy=H/2, RM=Math.hypot(W,H)/2;
            for(var rr=78;rr<RM;rr+=78){ var pr=[]; for(j=0;j<=72;j++){ var an=j/72*6.2832; pr.push([cx+Math.cos(an)*rr,cy+Math.sin(an)*rr*.8]); } poly(pr); }
            for(j=0;j<18;j++){ var an2=j/18*6.2832, ps=[]; for(var q=0;q<=RM;q+=30) ps.push([cx+Math.cos(an2)*q,cy+Math.sin(an2)*q*.8]); poly(ps); } ctx.stroke(P);
          }else if(ty==='weave'){
            var NH=16, NV=28, DOT=new Path2D(), DOT2=new Path2D();
            function fyw(xx,ii){ return H*(.08+.84*ii/(NH-1))+Math.sin(xx*.0042+t*.6+ii*.4)*(22+14*Math.sin(ii*.5+t*.2))+Math.sin(xx*.011-t*.9+ii*.7)*6; }
            function fxw(yy,jj){ return W*(.03+.94*jj/(NV-1))+Math.sin(yy*.005+t*.5+jj*.35)*(20+12*Math.sin(jj*.4+t*.17))+Math.sin(yy*.012-t*.8+jj*.6)*5; }
            for(i=0;i<NH;i++){ var ph2=[]; for(x=-20;x<=W+20;x+=12) ph2.push([x,fyw(x,i)]); poly(ph2); }
            for(j=0;j<NV;j++){ var pv=[]; for(y=-20;y<=H+20;y+=12) pv.push([fxw(y,j),y]); poly(pv); }
            ctx.stroke(P);
            if(!cv.dataset.nodots) for(i=0;i<NH;i++) for(j=0;j<NV;j++){   // cruce de cada línea horizontal con cada vertical (iteración de punto fijo)
              var cx2=W*(.03+.94*j/(NV-1)), cy2=fyw(cx2,i); for(var it=0;it<4;it++){ cx2=fxw(cy2,j); cy2=fyw(cx2,i); }
              var q3=wp(cx2,cy2), D=((i*7+j*3)%11===0)?DOT2:DOT; D.moveTo(q3[0]+3,q3[1]); D.arc(q3[0],q3[1],3,0,6.3);
            }
            ctx.fillStyle='rgba(240,238,228,.42)'; ctx.fill(DOT); ctx.fillStyle='rgba(253,255,26,.6)'; ctx.fill(DOT2);
          }else if(ty==='depth'){
            var NX=28, cs=W/NX, NY=Math.ceil(H/cs)+1, KZ=.22, ZM=5, pool=cv.dataset.pool, NP=parseInt(cv.dataset.n,10)||1;
            if(!cv._hh){ cv._hh=[]; for(i=0;i<NX*NY;i++) cv._hh.push(rnd()); cv._fl=[]; cv._ls=-9; cv._im={}; }
            // el logo de BioFeria es quien provoca la profundidad: se hunde la grilla donde pasa y queda un eco que se va aplanando
            var lg=cv.parentNode.querySelector('.dvd-logo'), cr=cv.getBoundingClientRect(), lr=lg?lg.getBoundingClientRect():null,
                lx=(lr&&lr.width>4)?lr.left+lr.width/2-cr.left:W/2, ly=(lr&&lr.width>4)?lr.top+lr.height/2-cr.top:H/2;
            if(!cv._hs) cv._hs=[]; cv._hs.push({t:t,x:lx/cs,y:ly/cs}); while(cv._hs.length>2&&cv._hs[1].t<t-3) cv._hs.shift();
            function hat(age){ var r=cv._hs[0]; for(var q2=0;q2<cv._hs.length;q2++){ if(cv._hs[q2].t<=t-age) r=cv._hs[q2]; } return r; }
            var h1=hat(1.1), h2=hat(2.2), gw=Math.min(1,.2+t/.6);
            var pits=[{cx:lx/cs,cy:ly/cs,hw:6.4*gw,hh:3.6*gw,L:5,sw:1.0*gw,sh:.62*gw},
                      {cx:h1.x,cy:h1.y,hw:5,hh:2.9,L:4,sw:.9,sh:.55},
                      {cx:h2.x,cy:h2.y,hw:3.4,hh:2.0,L:2,sw:.8,sh:.5}];
            pits.forEach(function(q){ q.vx=q.cx*cs; q.vy=q.cy*cs; });
            var Zc=new Array(NX*NY), Pc=new Array(NX*NY);
            for(j=0;j<NY;j++) for(i=0;i<NX;i++){
              var best=0, bp=-1;
              pits.forEach(function(q,qi){ var ddx=Math.abs(i+.5-q.cx), ddy=Math.abs(j+.5-q.cy), d=0;
                for(var k=0;k<q.L;k++){ if(ddx<q.hw-k*q.sw&&ddy<q.hh-k*q.sh) d=k+1; else break; }
                if(d&&cv._hh[j*NX+i]<.2) d--; if(d>best){ best=d; bp=qi; } });
              Zc[j*NX+i]=best; Pc[j*NX+i]=bp;
            }
            function zat(a,b){ return (a<0||b<0||a>=NX||b>=NY)?0:Zc[b*NX+a]; }
            function pj(x2,y2,z2,q){ var sc=1/(1+KZ*z2); return [q.vx+(x2-q.vx)*sc, q.vy+(y2-q.vy)*sc]; }
            var DK=cv.dataset.line||'#332e34', CR='#f0eee4';
            ctx.lineWidth=1; ctx.strokeStyle=DK; ctx.fillStyle=CR;
            var G=new Path2D(); for(i=0;i<=NX;i++){ G.moveTo(i*cs,0); G.lineTo(i*cs,H); } for(j=0;j<=NY;j++){ G.moveTo(0,j*cs); G.lineTo(W,j*cs); } ctx.stroke(G);
            var B=new Path2D(); for(j=0;j<NY;j++) for(i=0;i<NX;i++) if(Zc[j*NX+i]) B.rect(i*cs,j*cs,cs,cs); ctx.fill(B);
            var fl=[], wl=[]; for(i=0;i<=ZM;i++){ fl.push([]); wl.push([]); }
            var DIRS=[[-1,0],[1,0],[0,-1],[0,1]];
            for(j=0;j<NY;j++) for(i=0;i<NX;i++){ var zb=Zc[j*NX+i]; if(!zb) continue; fl[zb].push([i,j]);
              for(var dd=0;dd<4;dd++){ var za=zat(i+DIRS[dd][0],j+DIRS[dd][1]); if(za<zb) wl[zb].push([i,j,dd,za]); } }
            for(var L=ZM;L>=1;L--){
              var FP=new Path2D();
              fl[L].forEach(function(c){ var q=pits[Pc[c[1]*NX+c[0]]], a=pj(c[0]*cs,c[1]*cs,L,q), b=pj((c[0]+1)*cs,(c[1]+1)*cs,L,q); FP.rect(a[0],a[1],b[0]-a[0],b[1]-a[1]); });
              ctx.fill(FP); ctx.stroke(FP);
              if(L>=1){ var DP=new Path2D(); fl[L].forEach(function(c){ var q=pits[Pc[c[1]*NX+c[0]]], a2=pj(c[0]*cs,c[1]*cs,L,q); DP.moveTo(a2[0]+3.6,a2[1]); DP.arc(a2[0],a2[1],3.6,0,6.3); }); ctx.fillStyle='#332e34'; ctx.fill(DP); ctx.fillStyle=CR; }
              var WP=new Path2D(), WL=new Path2D();
              wl[L].forEach(function(w){ var q=pits[Pc[w[1]*NX+w[0]]], c0=w[0]*cs, r0=w[1]*cs, e1,e2;
                if(w[2]===0){ e1=[c0,r0]; e2=[c0,r0+cs]; } else if(w[2]===1){ e1=[c0+cs,r0]; e2=[c0+cs,r0+cs]; } else if(w[2]===2){ e1=[c0,r0]; e2=[c0+cs,r0]; } else { e1=[c0,r0+cs]; e2=[c0+cs,r0+cs]; }
                var za=w[3], a1=pj(e1[0],e1[1],za,q), a2=pj(e2[0],e2[1],za,q), b1=pj(e1[0],e1[1],L,q), b2=pj(e2[0],e2[1],L,q);
                WP.moveTo(a1[0],a1[1]); WP.lineTo(a2[0],a2[1]); WP.lineTo(b2[0],b2[1]); WP.lineTo(b1[0],b1[1]); WP.closePath();
                for(var sz=za+1;sz<L;sz++){ var m1=pj(e1[0],e1[1],sz,q), m2=pj(e2[0],e2[1],sz,q); WL.moveTo(m1[0],m1[1]); WL.lineTo(m2[0],m2[1]); } });
              ctx.fill(WP); ctx.stroke(WP); ctx.stroke(WL);
            }
            // cuadrados 2x2 que se dan vuelta mostrando las imágenes del montaje
            if(pool&&t-cv._ls>.8&&cv._fl.length<8){ cv._ls=t;
              for(var tr=0;tr<10;tr++){   // imágenes de 3×3 celdas: se busca un lugar donde las 9 estén a la misma profundidad
                var fi=Math.floor(Math.random()*(NX-2)), fj=Math.floor(Math.random()*(NY-3)), z0=zat(fi,fj), okk=(z0<=2);
                for(var di=0;di<3&&okk;di++) for(var dj=0;dj<3;dj++) if(zat(fi+di,fj+dj)!==z0){ okk=false; break; }
                if(okk) for(var qq=0;qq<cv._fl.length;qq++){ if(Math.abs(cv._fl[qq].i-fi)<4&&Math.abs(cv._fl[qq].j-fj)<4){ okk=false; break; } }   // que no se pisen: siempre una celda de aire entre imágenes
                if(okk){ var nn=1+Math.floor(Math.random()*NP); if(!cv._im[nn]){ var im=new Image(); im.src=pool.replace('%02d',String(nn).padStart(2,'0')); cv._im[nn]=im; } cv._fl.push({i:fi,j:fj,t0:t,n:nn,z:z0}); break; }
              } }
            cv._fl=cv._fl.filter(function(fx){ return t-fx.t0<2.6; });
            cv._fl.forEach(function(fx){
              var a=t-fx.t0, pp=a<.45?a/.45:(a<2.1?1:1-(a-2.1)/.5); if(pp<0) pp=0;
              var q=pits[Pc[fx.j*NX+fx.i]>=0?Pc[fx.j*NX+fx.i]:0], p1=pj(fx.i*cs,fx.j*cs,fx.z,q), p2=pj((fx.i+3)*cs,(fx.j+3)*cs,fx.z,q),
                  cxm=(p1[0]+p2[0])/2, cym=(p1[1]+p2[1])/2, hw2=(p2[0]-p1[0])/2*Math.abs(Math.cos(pp*Math.PI)), hh2=(p2[1]-p1[1])/2;
              if(pp<.5||!cv._im[fx.n]||!cv._im[fx.n].complete){ ctx.fillStyle=CR; ctx.fillRect(cxm-hw2,cym-hh2,hw2*2,hh2*2); ctx.strokeRect(cxm-hw2,cym-hh2,hw2*2,hh2*2); }
              else { var im2=cv._im[fx.n], sr=Math.min(im2.naturalWidth,im2.naturalHeight); ctx.drawImage(im2,(im2.naturalWidth-sr)/2,(im2.naturalHeight-sr)/2,sr,sr,cxm-hw2,cym-hh2,hw2*2,hh2*2); }
            });
          }else if(ty==='nodes'){
            if(!nodes){ nodes=[]; for(i=0;i<Math.round(W*H/20000);i++) nodes.push({x:rnd()*W,y:rnd()*H,a:rnd()*6.28,b:rnd()*6.28,s:.15+rnd()*.25,r:20+rnd()*50,y2:rnd()<.14}); }
            var pos=nodes.map(function(n){ var x0=n.x+Math.cos(t*n.s+n.a)*n.r, y0=n.y+Math.sin(t*n.s*1.3+n.b)*n.r, dx=x0-mx, dy=y0-my, d=Math.hypot(dx,dy)||1;
              if(d<R){ var k=(1-d/R)*170; x0+=dx/d*k; y0+=dy/d*k; } return [x0,y0]; });   // el cursor empuja y rompe la red
            ctx.lineWidth=1;
            for(i=0;i<pos.length;i++) for(j=i+1;j<pos.length;j++){ var d2=Math.hypot(pos[i][0]-pos[j][0],pos[i][1]-pos[j][1]); if(d2<260){ ctx.globalAlpha=1-d2/260; ctx.beginPath(); ctx.moveTo(pos[i][0],pos[i][1]); ctx.lineTo(pos[j][0],pos[j][1]); ctx.stroke(); } }
            ctx.globalAlpha=1;
            nodes.forEach(function(n,k){ ctx.fillStyle=n.y2?acc:ink; ctx.beginPath(); ctx.arc(pos[k][0],pos[k][1],n.y2?4:3,0,6.3); ctx.fill(); });
          }
          cv._wr=requestAnimationFrame(f);
        })(performance.now());
      });
      [].forEach.call(s.querySelectorAll('.pxp'),function(box){
        var cv=box.querySelector('canvas'), ctx=cv.getContext('2d'), iv=box.querySelector('.ivp'), half=box.dataset.half==='b'?1:0, NC=5, NR=4, STEP=280, t0=performance.now()+250, seed=half?7:3;
        function rnd(){ seed=(seed*16807)%2147483647; return seed/2147483647; }
        var cnt=[4,8,5,12,7,15,9,17,12,20], sets=cnt.map(function(n,k){ if(n>=NC*NR) return null; var ids=[],a=[]; for(var q=0;q<NC*NR;q++) a.push(q); a.sort(function(){ return rnd()-.5; }); var o={}; a.slice(0,n).forEach(function(q){ o[q]=1; }); return o; });
        if(box._pr){ cancelAnimationFrame(box._pr); box._pr=0; }
        cv.style.display='none'; iv.style.visibility=''; if(!on) return;
        cv.style.display='block'; iv.style.visibility='hidden';
        (function f(now){
          var k=Math.floor((now-t0)/STEP), set=k<0?sets[0]:(k>=sets.length?null:sets[k]);
          if(k>=sets.length-1||set===null){ cv.style.display='none'; iv.style.visibility=''; box._pr=0; return; }
          var v=box.querySelector('video.act')||box.querySelector('video'), W=box.clientWidth, H=box.clientHeight;
          if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; }
          ctx.clearRect(0,0,W,H);
          if(v&&v.readyState>=2&&v.videoWidth){
            var cw=W/NC, ch=H/NR; ctx.save(); ctx.beginPath();
            for(var q=0;q<NC*NR;q++) if(set[q]) ctx.rect(Math.floor((q%NC)*cw),Math.floor(Math.floor(q/NC)*ch),Math.ceil(cw),Math.ceil(ch));
            ctx.clip();
            try{ ctx.drawImage(v,0,half===1?v.videoHeight/2:v.videoHeight*.09,v.videoWidth,v.videoHeight/2,0,0,W,H); }catch(e){}
            ctx.restore();
          }
          box._pr=requestAnimationFrame(f);
        })(performance.now());
      });
      [].forEach.call(s.querySelectorAll('.vch'),function(box){
        var vs=[].slice.call(box.querySelectorAll('video,.vimg')), rate=parseFloat(box.dataset.rate)||1, rates=(box.dataset.rates||'').split(',').map(parseFloat), lens=(box.dataset.lens||'').split(',').map(parseFloat);
        vs.forEach(function(v){ v.onended=null; }); clearTimeout(box._lt); clearTimeout(box._fade);
        vs.forEach(function(v){ if(v.tagName!=='VIDEO'&&!v.pause){ v.pause=function(){ if(!this.classList.contains('keep')) this.classList.remove('run'); }; v.play=function(){ var e=this; e.classList.remove('run'); void e.offsetWidth; e.classList.add('run'); return null; }; } });
        if(!on){ box.classList.remove('fullscreen'); var pc=box.querySelector('canvas.pxc'); if(pc) pc.style.display='none'; vs.forEach(function(v){ v.pause(); v.classList.remove('act'); }); return; }
        vs.forEach(function(v){ if(!v.getAttribute('src')) v.setAttribute('src',v.dataset.src); v.muted=true; v.preload='auto'; v.pause(); try{v.currentTime=parseFloat(v.dataset.start)||0;}catch(e){} v.classList.remove('act'); });
        var cur=-1; function nxt(k){ if(box.dataset.noloop==='1'&&k+1>=vs.length){ if(lens[k]&&vs[k].tagName==='VIDEO') vs[k].pause(); return; }   /* un video se congela en su último cuadro; las fotos (stop motion) se quedan como están */ go((k+1)%vs.length); }
        function go(k){
          if(!s.classList.contains('on')) return;
          cur=k;
          vs.forEach(function(w,n){ if(n!==k) w.pause(); });
          var v=vs[k], fullscreen=v.dataset.fullscreen==='1';
          if(v.dataset.px==='1'&&box.querySelector('canvas.pxc')&&k>0){
            // entrada en cuadrados (como la ovejita): el video se arma por celdas sobre el cuadro anterior
            clearTimeout(box._fade);
            var cv=box.querySelector('canvas.pxc'), ctx=cv.getContext('2d'), NC=5, NR=4, STEP=300, t0=performance.now()+150, seed=11, sets=[];
            function rnd(){ seed=(seed*16807)%2147483647; return seed/2147483647; }
            // cuadrados grandes (5×4) que aparecen y desaparecen de principio a fin, siempre con el video a resolución completa; al final se completan
            var nst=Math.max(8,Math.round(7800/STEP)), prev=0;
            for(var z=0;z<nst;z++){ var base=4+Math.round((z/nst)*9), n=z>=nst-2?(z===nst-1?NC*NR:18):Math.max(3,Math.min(17,base+Math.round((rnd()-.5)*8)));
              if(n===prev) n+=(n<12?2:-2); prev=n; var a2=[]; for(var q=0;q<NC*NR;q++) a2.push(q); a2.sort(function(){ return rnd()-.5; }); var o={}; a2.slice(0,n).forEach(function(q){ o[q]=1; }); sets.push(o); }
            if(box._pr) cancelAnimationFrame(box._pr);
            cv.style.display='block';
            (function f(now){
              if(!s.classList.contains('on')){ cv.style.display='none'; box._pr=0; return; }
              if(cur!==k){ v.classList.add('act'); cv.style.display='none'; box._pr=0; return; }   // al terminar queda el cuadro real del video
              var W=box.clientWidth, H=box.clientHeight;
              if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; }
              ctx.fillStyle='#332e34'; ctx.fillRect(0,0,W,H);
              var i=Math.min(sets.length-1,Math.max(0,Math.floor((now-t0)/STEP))), set=sets[i];
              if(v.readyState>=2&&v.videoWidth){
                var cw=W/NC, chh=H/NR, sc=Math.max(W/v.videoWidth,H/v.videoHeight), sx0=(v.videoWidth-W/sc)/2, sy0=(v.videoHeight-H/sc)/2;
                for(var c=0;c<NC*NR;c++) if(set[c]){ var cx=c%NC, cy=Math.floor(c/NC), dx=Math.floor(cx*cw), dy=Math.floor(cy*chh), dw=Math.ceil(cw), dh=Math.ceil(chh);
                  try{ ctx.drawImage(v,sx0+dx/sc,sy0+dy/sc,dw/sc,dh/sc,dx,dy,dw,dh); }catch(e){} }
              }
              box._pr=requestAnimationFrame(f);
            })(performance.now());
          }else{
          if(box.classList.contains('fullscreen')!==fullscreen) vs.forEach(function(w){ w.classList.remove('act'); });
          box.classList.toggle('fullscreen',fullscreen); v.classList.add('act'); if(box.dataset.cut==='1') vs.forEach(function(w,n){ if(n!==k) w.classList.remove('act'); });
          clearTimeout(box._fade);
          box._fade=setTimeout(function(){ vs.forEach(function(w,n){ if(n!==k) w.classList.remove('act'); }); },380);
          }
          try{v.currentTime=parseFloat(v.dataset.start)||0;}catch(e){} v.playbackRate=rates[k]||rate;
          clearTimeout(box._lt);
          if(lens[k]) box._lt=setTimeout(function(){ nxt(k); },lens[k]*1000);
          var q=v.play(); if(q&&q.catch) q.catch(function(){});
        }
        vs.forEach(function(v,n){ v.onended=function(){ if(cur===n) nxt(n); }; });
        go(0);
      });
      [].forEach.call(s.querySelectorAll('.chain'),function(box){
        var c1=box.querySelector('.c1'), c2=box.querySelector('.c2');
        if(on){
          [c1,c2].forEach(function(v){ if(!v.getAttribute('src')) v.setAttribute('src',v.dataset.src); v.muted=true; v.preload='auto'; });
          box.classList.remove('p2'); c2.pause(); try{c2.currentTime=0;}catch(e){}
          c1.onended=function(){ box.classList.add('p2'); try{c2.currentTime=0;}catch(e){} var q=c2.play(); if(q&&q.catch) q.catch(function(){}); };
          c2.onended=function(){ box.classList.remove('p2'); try{c1.currentTime=0;}catch(e){} var q=c1.play(); if(q&&q.catch) q.catch(function(){}); };
          try{c1.currentTime=0;}catch(e){} var p1=c1.play(); if(p1&&p1.catch) p1.catch(function(){});
        }else{ c1.onended=c2.onended=null; c1.pause(); c2.pause(); }
      });
      [].forEach.call(s.querySelectorAll('.vseq'),function(box){
        clearInterval(box._iv);
        var v=box.querySelector('video'), lab=box.querySelector('.vlab'), num=box.querySelector('.vnum'), list=(box.dataset.seq||'').split('|'), names=(box.dataset.names||'').split('|'), k=0;
        function show(n){ v.setAttribute('src',list[n]); v.muted=true; try{v.currentTime=0;}catch(e){} var p=v.play(); if(p&&p.catch) p.catch(function(){}); if(lab) lab.textContent=names[n]||''; if(num) num.textContent=String(n+1).padStart(2,'0')+' / '+String(list.length).padStart(2,'0'); }
        if(on){ show(0); box._iv=setInterval(function(){ k=(k+1)%list.length; show(k); },(parseFloat(box.dataset.each)||4)*1000); }
        else{ v.pause(); }
      });
      [].forEach.call(s.querySelectorAll('.cnt-n'),function(el){ if(on) runCount(el); else el._on=false; });
      if(on) runMontage(s); else s.classList.remove('fin-on');
    };
    slides.forEach(function(s,k){ if(k!==i&&s.classList.contains('out')){ clearTimeout(s._fz); s._fz=setTimeout(function(){ if(cur!==k) _mf(s,k); },900); return; } clearTimeout(s._fz); _mf(s,k); });   /* la pantalla que se va se queda tal cual mientras dura la transición (si no, volvía a mostrarse su estado inicial) */
    var has=slides[i].querySelector('video.av[data-snd]');
    mute.classList.toggle('show',!!has&&has.dataset.hideSound!=='1');
    if(has) mute.textContent=has.muted?'🔇 M · activar sonido':'🔊 M · silenciar';
  }

  /* ---- navegación ---- */
  function go(i){
    i=Math.max(0,Math.min(N-1,i)); if(i===cur) return;
    var old=cur; cur=i;
    slides.forEach(function(s,k){
      if(k===i){ s.classList.remove('out'); s.classList.add('on'); }
      else if(k===old){ s.classList.remove('on'); s.classList.add('out'); clearTimeout(s._t); s._t=setTimeout(function(){s.classList.remove('out');},950); }
      else{ s.classList.remove('on','out'); }
    });
    document.body.classList.toggle('clean',slides[i].classList.contains('clean'));document.body.classList.toggle('nologo',slides[i].classList.contains('nologo'));document.body.dataset.tone=slides[i].classList.contains('tone-b')?'b':'a';
    cnt.textContent=String(i+1).padStart(2,'0');
    // Recuperar el teclado si una demo embebida habia tomado el foco.
    if(document.activeElement&&document.activeElement.tagName==='IFRAME'){
      document.getElementById('stage').focus({preventScroll:true});
    }
    var a=slides[i].querySelector('aside.n'); notes.innerHTML=a?a.innerHTML:'';
    media(i);
    if(i>0&&t0===null){ t0=Date.now(); }
    try{history.replaceState(null,'','#'+(i+1));}catch(e){}
  }
  function next(){ go(cur+1); } function prev(){ go(cur-1); }

  addEventListener('message',function(ev){
    var d=ev.data; if(!d||!d.pitchKey) return; var k=d.pitchKey;
    if(k==='ArrowRight'||k==='PageDown') next(); else if(k==='ArrowLeft'||k==='PageUp') prev();
  });
  addEventListener('keydown',function(e){
    var k=e.key;
    if(k==='ArrowRight'||k==='PageDown'||k===' '||k==='Enter'){e.preventDefault();next();}
    else if(k==='ArrowLeft'||k==='PageUp'||k==='Backspace'){e.preventDefault();prev();}
    else if(k==='Home'){go(0);} else if(k==='End'){go(N-1);}
    else if(k==='f'||k==='F'){ if(!document.fullscreenElement) document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen(); else document.exitFullscreen(); }
    else if(k==='n'||k==='N'){ notes.classList.toggle('show'); }
    else if(k==='t'||k==='T'){ tm.classList.toggle('show'); if(t0===null) t0=Date.now(); }
    else if(k==='m'||k==='M'){ toggleSound(); }
  });
  function toggleSound(){
    var v=slides[cur].querySelector('video.av[data-snd]'); if(!v) return;
    v.muted=!v.muted; if(!v.muted){ v.volume=v.dataset.autosound==='1'?1:.35; var p=v.play(); if(p&&p.catch)p.catch(function(){}); }
    mute.textContent=v.muted?'🔇 M · activar sonido':'🔊 M · silenciar';
  }
  mute.addEventListener('click',function(e){e.stopPropagation();toggleSound();});
  document.getElementById('stage').addEventListener('click',function(e){
    if(e.target.closest('video[controls],a,button,input,textarea,select')) return;
    var edge=innerWidth*.15;
    if(e.clientX<edge) prev();
    else if(e.clientX>innerWidth-edge) next();
  });
  var sx=null; addEventListener('touchstart',function(e){sx=e.touches[0].clientX;},{passive:true});
  addEventListener('touchend',function(e){ if(sx===null)return; var dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>50){dx<0?next():prev();} sx=null; },{passive:true});

  /* ---- cronómetro (T) ---- */
  setInterval(function(){
    if(t0===null){ tm.textContent='00:00 / 15:00'; return; }
    var s=Math.floor((Date.now()-t0)/1000), m=Math.floor(s/60), r=s%60;
    tm.textContent=String(m).padStart(2,'0')+':'+String(r).padStart(2,'0')+' / 15:00';
    tm.classList.toggle('over',s>TARGET);
  },500);

  var h=parseInt((location.hash||'').slice(1),10);
  go(isNaN(h)?0:h-1);
})();

window.addEventListener('message',function(ev){
  if(ev.data!=='oso-dl'&&ev.data!=='oso-dl-off') return;
  var on=(ev.data==='oso-dl');
  [].forEach.call(document.querySelectorAll('.slide.on .ophone'),function(e){e.classList.toggle('tilt',on);});
  [].forEach.call(document.querySelectorAll('.slide.on .dlimg'),function(e){e.classList.toggle('on',on);});
});
