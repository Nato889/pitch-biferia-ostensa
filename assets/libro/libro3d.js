/* Librito en 3D (three.js): hojas con textura que giran alrededor del lomo, cámara que se mueve y se detiene.
   Lee la línea de tiempo de <script type="application/json" class="b3cfg"> y dibuja en el <canvas class="b3c"> de la pantalla.
   Las texturas vienen en libro-tex.js (data:), porque WebGL no puede leer imágenes sueltas abriendo el archivo con doble clic. */
(function(){
  if(!window.THREE||!window.LIBRO_TEX) return;
  var T=THREE, DEG=Math.PI/180;
  var cv=document.querySelector('canvas.b3c'); if(!cv) return;
  var cfgEl=document.querySelector('script.b3cfg'); if(!cfgEl) return;
  var CFG=JSON.parse(cfgEl.textContent);
  var slide=cv.closest('.slide');
  var W=1920,H=1080,PERSP=2600;
  var renderer=new T.WebGLRenderer({canvas:cv,alpha:true,antialias:true,premultipliedAlpha:true});
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1)); renderer.setSize(W,H,false); renderer.setClearColor(0x000000,0); renderer.outputEncoding=T.sRGBEncoding;
  var scene=new T.Scene();
  var cam=new T.PerspectiveCamera(2*Math.atan(H/2/PERSP)/DEG,W/H,100,9000); cam.position.set(0,0,PERSP);
  var book=new T.Group(); scene.add(book);
  var aniso=renderer.capabilities.getMaxAnisotropy();
  var texCache={};
  function img(name){ if(texCache[name]) return texCache[name]; var d=window.LIBRO_TEX[name]; var im=new Image(); var t=new T.Texture(im); im.onload=function(){t.needsUpdate=true;}; im.src=d[0]; texCache[name]={im:im,w:d[1],h:d[2]}; return texCache[name]; }
  function tex(name,half){
    var c=img(name); var t=new T.Texture(c.im); t.anisotropy=aniso; t.encoding=T.sRGBEncoding; t.minFilter=T.LinearMipmapLinearFilter;
    if(half==='L'){t.repeat.set(.5,1);t.offset.set(0,0);} else if(half==='R'){t.repeat.set(.5,1);t.offset.set(.5,0);}
    if(c.im.complete) t.needsUpdate=true; else c.im.addEventListener('load',function(){t.needsUpdate=true;});
    return t;
  }
  function face(f,back){
    var g=new T.PlaneGeometry(f.w,630);
    var m=new T.MeshBasicMaterial({map:tex(f.file,f.half),side:T.FrontSide});
    var mesh=new T.Mesh(g,m); mesh.position.x=f.w/2; if(back) mesh.rotation.y=Math.PI; return mesh;
  }
  var leaves=CFG.leaves.map(function(L){
    var g=new T.Group(); g.add(face(L.front,false)); var b=face(L.back,true); g.add(b); book.add(g); return g;
  });
  function ease(t){ return t*t*(3-2*t); }
  function seg(arr,t,key,smooth){            // arr: [[t,...]] ordenado
    var n=arr.length; if(t<=arr[0][0]) return arr[0];
    if(t>=arr[n-1][0]) return arr[n-1];
    var i=1; while(arr[i][0]<t) i++;
    var a=arr[i-1], b=arr[i], u=(t-a[0])/(b[0]-a[0]); if(smooth) u=ease(u);
    var out=[t]; for(var k=1;k<a.length;k++) out.push(a[k]+(b[k]-a[k])*u); return out;
  }
  function pose(t){
    var c=seg(CFG.cam,t,0,true);            // [t, tx, rx, ry, rz, s, tz]
    book.position.set(c[1],0,c[6]||0);
    book.rotation.set(-c[2]*DEG,c[3]*DEG,-c[4]*DEG,'XYZ'); book.scale.setScalar(c[5]);
    for(var k=0;k<leaves.length;k++){ var p=seg(CFG.leafk[k],t,k,false); leaves[k].rotation.y=p[1]*DEG; leaves[k].position.z=p[2]; }
    var o=seg(CFG.op,t,0,false); cv.style.opacity=o[1];
  }
  window.__libroPose=function(t){ pose(t); renderer.render(scene,cam); };
  window.__libroSet=function(c,ang){ book.position.set(c.tx||0,0,c.tz||0); book.rotation.set(-c.rx*DEG,c.ry*DEG,-c.rz*DEG,'XYZ'); book.scale.setScalar(c.s||1); for(var k=0;k<leaves.length;k++){ leaves[k].rotation.y=ang[k]*DEG; leaves[k].position.z=0; } cv.style.opacity=1; renderer.render(scene,cam); };
  var t0=null, raf=0;
  function loop(now){
    raf=requestAnimationFrame(loop);
    if(window.__libroFrozen) return;
    var on=slide&&slide.classList.contains('on');
    if(!on){ t0=null; return; }
    if(t0===null) t0=now;
    var t=(now-t0)/1000; if(t>CFG.lt) t=CFG.lt;
    pose(t); renderer.render(scene,cam);
  }
  raf=requestAnimationFrame(loop);
})();
