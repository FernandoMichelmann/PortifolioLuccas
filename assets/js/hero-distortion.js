import * as THREE from 'three';

// Ajustes do efeito
const CONFIG = { intensity:0.040, radius:0.24, returnSpeed:4.8, velocityResponse:8, rgbSplit:0.006, maxVelocity:2.2, pixelRatio:2 };
const hero=document.querySelector('#hero'), portrait=document.querySelector('#heroPortrait');
const targets=[
 {element:document.querySelector('#heroWord'),text:'DESIGNER',kind:'designer'},
 {element:document.querySelector('.hero-top-title'),text:'LUCCAS',kind:'title'}
].filter(x=>x.element);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch=matchMedia('(hover: none), (pointer: coarse)').matches;

if(hero && targets.length && !reduced && !touch && 'WebGLRenderingContext' in window){
 const pointer={x:-1,y:-1,active:false,lastX:0,lastY:0,lastTime:0,speed:0};
 let heroVisible=true,pageVisible=!document.hidden,raf=0,lastFrame=0;
 const layers=[];
 const vertexShader='varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
 const fragmentShader=`
 uniform sampler2D uMap; uniform vec2 uMouse; uniform float uTime; uniform float uVelocity;
 uniform float uHover; uniform float uIntensity; uniform float uRadius; uniform float uRgbSplit;
 varying vec2 vUv;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
 void main(){
   vec2 delta=vUv-uMouse; delta.x*=0.82;
   float dist=length(delta);
   float activity=smoothstep(0.015,0.35,uVelocity);
   float falloff=pow(max(1.0-smoothstep(0.0,uRadius,dist),0.0),2.0)*uHover*activity;
   float speed=clamp(uVelocity,0.0,2.2);
   float wave=sin(dist*42.0-uTime*(2.0+speed*3.0));
   float ripple=wave*0.42+sin(vUv.y*24.0+uTime*1.7)*0.18;
   float noise=hash(floor(vUv*95.0+uTime*2.0))-0.5;
   vec2 dir=normalize(delta+vec2(0.0001));
   vec2 displacement=dir*(ripple+noise*0.35)*uIntensity*falloff;
   displacement+=vec2(-dir.y,dir.x)*speed*uIntensity*0.30*falloff;
   vec2 uv=clamp(vUv+displacement,0.001,0.999);
   float chroma=uRgbSplit*speed*falloff;
   float r=texture2D(uMap,clamp(uv+dir*chroma,0.001,0.999)).r;
   float g=texture2D(uMap,uv).g;
   float b=texture2D(uMap,clamp(uv-dir*chroma,0.001,0.999)).b;
   float a=texture2D(uMap,uv).a;
   gl_FragColor=vec4(r,g,b,a);
 }`;

 function waitAnimations(){return Promise.all(targets.flatMap(({element})=>element.getAnimations().map(a=>a.finished.catch(()=>undefined))));}
 function makeTexture(layer,w,h){
  const style=getComputedStyle(layer.element),ratio=Math.min(devicePixelRatio||1,CONFIG.pixelRatio);
  const c=document.createElement('canvas');c.width=Math.max(2,Math.round(w*ratio));c.height=Math.max(2,Math.round(h*ratio));
  const ctx=c.getContext('2d');ctx.scale(ratio,ratio);ctx.clearRect(0,0,w,h);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=style.font;
  if('letterSpacing' in ctx)ctx.letterSpacing=style.letterSpacing;
  ctx.shadowColor='rgba(255,255,255,.72)';ctx.shadowBlur=layer.kind==='designer'?1.2:0;
  if(layer.kind==='designer'){
   const grad=ctx.createLinearGradient(0,0,w,0);
   grad.addColorStop(0,'rgba(255,255,255,.08)');grad.addColorStop(.22,'#fff');grad.addColorStop(.78,'#fff');grad.addColorStop(1,'rgba(255,255,255,.08)');
   ctx.fillStyle=grad;
  }else ctx.fillStyle='#fff';
  const measured=ctx.measureText(layer.text).width;
  const spacing=parseFloat(style.letterSpacing)||0;
  layer.measuredTextWidth=Math.min(w,measured+Math.max(0,layer.text.length-1)*spacing);
  ctx.fillText(layer.text,w/2,h/2,w*.995);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;return texture;
 }
 function createLayer(item){
  const canvas=document.createElement('canvas');canvas.className='hero-distortion-canvas';canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;pointer-events:none;z-index:2;display:block';hero.appendChild(canvas);
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,CONFIG.pixelRatio));renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-.5,.5,.5,-.5,.1,10);camera.position.z=1;
  const material=new THREE.ShaderMaterial({uniforms:{
   uMap:{value:null},uMouse:{value:new THREE.Vector2(.5,.5)},uTime:{value:0},uVelocity:{value:0},
   uHover:{value:0},uIntensity:{value:CONFIG.intensity},uRadius:{value:CONFIG.radius},uRgbSplit:{value:CONFIG.rgbSplit}
  },vertexShader,fragmentShader,transparent:true,depthTest:false,depthWrite:false});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);scene.add(mesh);
  layers.push({...item,canvas,renderer,scene,camera,material,mesh,rect:null,hover:0,velocity:0,texture:null,width:0,height:0,dt:1/60});
 }
 function layout(layer){
  const rect=layer.element.getBoundingClientRect(),heroRect=hero.getBoundingClientRect();
  if(rect.width<1||rect.height<1)return;
  layer.canvas.style.left=(rect.left-heroRect.left)+'px';layer.canvas.style.top=(rect.top-heroRect.top)+'px';
  layer.canvas.style.width=rect.width+'px';layer.canvas.style.height=rect.height+'px';
  if(Math.abs(rect.width-layer.width)>.5||Math.abs(rect.height-layer.height)>.5||!layer.texture){
   layer.width=rect.width;layer.height=rect.height;if(layer.texture)layer.texture.dispose();
   layer.texture=makeTexture(layer,rect.width,rect.height);layer.material.uniforms.uMap.value=layer.texture;
   layer.renderer.setSize(rect.width,rect.height,false);
  }
  layer.rect=rect;
  const textWidth=layer.measuredTextWidth||rect.width;
  layer.hitRect={left:rect.left+(rect.width-textWidth)/2,right:rect.left+(rect.width+textWidth)/2,top:rect.top,bottom:rect.bottom};
  layer.canvas.style.opacity=layer.element.style.opacity||'1';
  const currentFilter=getComputedStyle(layer.element).filter;
  layer.canvas.style.filter=currentFilter==='none'?'none':currentFilter;
 }
 function inside(r,x,y){return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;}
 function updateLayer(layer){
  const overPhoto=portrait&&inside(portrait.getBoundingClientRect(),pointer.x,pointer.y);
  const overText=pointer.active&&!overPhoto&&layer.hitRect&&inside(layer.hitRect,pointer.x,pointer.y);
  if(overText){
   const x=THREE.MathUtils.clamp((pointer.x-layer.rect.left)/layer.rect.width,0,1);
   const y=1-THREE.MathUtils.clamp((pointer.y-layer.rect.top)/layer.rect.height,0,1);
   layer.material.uniforms.uMouse.value.set(x,y);
  }
  const hoverTarget=overText?1:0,velocityTarget=overText?pointer.speed:0,dt=layer.dt;
  const hm=1-Math.exp(-CONFIG.returnSpeed*dt),vm=1-Math.exp(-CONFIG.velocityResponse*dt);
  layer.hover+=(hoverTarget-layer.hover)*hm;layer.velocity+=(velocityTarget-layer.velocity)*vm;
  layer.material.uniforms.uHover.value=layer.hover;layer.material.uniforms.uVelocity.value=layer.velocity;
 }
 function loop(time){
  raf=0;if(!heroVisible||!pageVisible)return;
  const dt=Math.min(.05,lastFrame?(time-lastFrame)/1000:1/60);lastFrame=time;
  layers.forEach(layer=>{layout(layer);layer.dt=dt;updateLayer(layer);layer.material.uniforms.uTime.value=time*.001;layer.renderer.render(layer.scene,layer.camera);});
  pointer.speed*=Math.exp(-7*dt);raf=requestAnimationFrame(loop);
 }
 function start(){if(!raf&&heroVisible&&pageVisible){lastFrame=0;raf=requestAnimationFrame(loop);}}
 function stop(){if(raf)cancelAnimationFrame(raf);raf=0;lastFrame=0;}
 function move(e){
  const now=performance.now(),dx=e.clientX-pointer.lastX,dy=e.clientY-pointer.lastY,elapsed=Math.max(8,now-(pointer.lastTime||now));
  pointer.speed=THREE.MathUtils.clamp(Math.hypot(dx,dy)/elapsed/1.25,0,CONFIG.maxVelocity);
  pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;pointer.lastX=e.clientX;pointer.lastY=e.clientY;pointer.lastTime=now;
 }
 async function init(){
  try{
   await document.fonts.ready;await waitAnimations();
   targets.forEach(createLayer);layers.forEach(layout);
   hero.classList.add('hero-distortion-ready');start();
  }catch(error){
   console.warn('Hero distortion indisponível; mantendo texto HTML.',error);
   layers.forEach(layer=>{layer.texture?.dispose();layer.material?.dispose();layer.mesh?.geometry?.dispose();layer.renderer?.dispose();layer.canvas?.remove();});
  }
 }
 window.addEventListener('pointermove',move,{passive:true});
 window.addEventListener('pointerout',e=>{if(!e.relatedTarget)pointer.active=false;},{passive:true});
 window.addEventListener('scroll',()=>layers.forEach(layout),{passive:true});
 window.addEventListener('resize',()=>layers.forEach(layout),{passive:true});
 document.addEventListener('visibilitychange',()=>{pageVisible=!document.hidden;if(pageVisible)start();else stop();});
 new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;if(heroVisible)start();else stop();},{threshold:.01}).observe(hero);
 init();
}
