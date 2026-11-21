import { SITE_PHOTOS } from './photos.js';
import * as THREE from 'three';
const canvas=document.querySelector('#world'),loading=document.querySelector('#loading'),fallback=document.querySelector('#fallback');
const heroPhoto=SITE_PHOTOS.hero;
const portrait=document.querySelector('#heroPortrait');
let heroImage=null;
async function prepareHeroImage(){
 if(!heroPhoto)return;
 heroImage=new Image();heroImage.alt='Foto de perfil';heroImage.decoding='async';
 heroImage.style.cssText='position:absolute;left:0;bottom:0;width:100%;height:91%;object-fit:contain;object-position:center bottom;';heroImage.src=heroPhoto;
 try{if(heroImage.decode)await heroImage.decode();else await new Promise((resolve,reject)=>{heroImage.onload=resolve;heroImage.onerror=reject;});const placeholder=portrait.querySelector('svg');if(placeholder)placeholder.style.display='none';heroImage.classList.add('is-decoded');portrait.appendChild(heroImage);}catch(error){console.warn('Foto do Hero não carregou:',heroPhoto,error);}
}
const projects=[
{name:'Nathan Riley',sub:'Portfólio criativo digital · Direção de arte / 3D',kind:0,slug:'project-one'},
{name:'Casa Di Solare',sub:'Uma tipografia variável de Nikolas Type',kind:1,slug:'project-two'},
{name:'The Lookback',sub:'Uma cápsula digital para Better Off®',kind:2,slug:'project-three'},
{name:'Book of Happiness',sub:'Uma nova perspectiva sobre bem-estar',kind:3,slug:'project-four'},
{name:'Dogelon Mars',sub:'Uma experiência de marca interplanetária',kind:4,slug:'project-five'},
{name:'Gil Huybrecht',sub:'Portfólio · Direção de arte e tipografia',kind:5,slug:'project-six'},
{name:'Discoveryland',sub:'Experiências imersivas em diferentes destinos',kind:6,slug:'project-seven'},
{name:'Griflan',sub:'Estúdio criativo · Design e estratégia',kind:7,slug:'project-eight'}
];
let renderer,scene,camera,raycaster,meshes=[],target=0,position=0,velocity=0,dragging=false,startX=0,lastX=0,lastTime=0,pointerMoved=false,activeIndex=0,clock=new THREE.Clock(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const current=document.querySelector('#current'),progress=[...document.querySelectorAll('.top-progress span')],hint=document.querySelector('#hint');
function makeArtwork(p){if(p.image){const texture=new THREE.TextureLoader().load(p.image);texture.colorSpace=THREE.SRGBColorSpace;return texture;}const c=document.createElement('canvas');c.width=1000;c.height=625;const x=c.getContext('2d');const palettes=[['#1b1023','#be8eaa','#f0a9cf'],['#211c17','#bd8d4e','#f2d49b'],['#f1eee8','#a5a1a0','#171717'],['#e5d8cb','#bd8d70','#28211d'],['#151c2c','#b8a4ed','#efcf8b'],['#d6d1c8','#252323','#b64d37'],['#16242b','#9fb7a5','#e6d9b8'],['#dedbd2','#242b27','#b0c68c']][p.kind];const g=x.createLinearGradient(0,0,1000,625);g.addColorStop(0,palettes[0]);g.addColorStop(1,palettes[1]);x.fillStyle=g;x.fillRect(0,0,1000,625);
if(p.kind===0){const portrait=x.createLinearGradient(500,70,900,625);portrait.addColorStop(0,'#d9a6bc');portrait.addColorStop(1,'#82778f');x.fillStyle=portrait;x.beginPath();x.ellipse(735,300,190,260,-.12,0,Math.PI*2);x.fill();x.fillStyle='#1c1820';x.beginPath();x.ellipse(735,270,112,150,-.08,0,Math.PI*2);x.fill();x.fillStyle='#c6b5a1';x.beginPath();x.moveTo(620,420);x.quadraticCurveTo(735,350,850,420);x.lineTo(930,625);x.lineTo(540,625);x.closePath();x.fill();x.fillStyle='#f0a9cf';x.font='italic 78px Georgia';x.fillText('Um mundo de',55,490);x.fillText('criatividade.',55,570)}
else if(p.kind===1){const glow=x.createRadialGradient(520,290,20,520,290,330);glow.addColorStop(0,'#f5d28b');glow.addColorStop(1,'#38291e');x.fillStyle=glow;x.fillRect(0,0,1000,625);x.fillStyle='#c99b56';x.beginPath();x.arc(590,270,155,0,Math.PI*2);x.fill();x.fillStyle='#51402e';for(let i=0;i<5;i++)x.fillRect(90+i*175,355,35,180);x.fillStyle='#fff0d0';x.font='italic 145px Georgia';x.fillText('Solare',65,540)}
else if(p.kind===2){x.fillStyle='#f4f1e9';x.fillRect(0,0,1000,625);for(let i=0;i<5;i++){x.save();x.translate(420+i*54,140+i*28);x.rotate(-.16);x.fillStyle=['#c4b9ad','#8d9a9c','#d1c3b7'][i%3];x.fillRect(-100,-65,230,150);x.fillStyle='#222';x.fillRect(-75,-45,90,80);x.restore()}x.fillStyle='#151515';x.font='700 86px Arial';x.fillText('O',55,450);x.fillText('OLHAR',55,535)}
else{const orb=x.createRadialGradient(650,210,10,650,210,280);orb.addColorStop(0,palettes[2]);orb.addColorStop(1,palettes[0]);x.fillStyle=orb;x.fillRect(0,0,1000,625);for(let i=0;i<8;i++){x.strokeStyle='rgba(255,255,255,.25)';x.lineWidth=2;x.beginPath();x.arc(620,300,80+i*32,0,Math.PI*2);x.stroke()}x.fillStyle='#fff';x.font='600 75px Arial';x.fillText(p.name.toUpperCase(),55,500)}
x.fillStyle='rgba(0,0,0,.22)';x.fillRect(0,0,1000,625);x.fillStyle='rgba(255,255,255,.7)';x.font='15px Arial';x.fillText('PROJETO DIGITAL INDEPENDENTE / 2026',55,55);return new THREE.CanvasTexture(c)}
function roundedMaterial(texture){return new THREE.ShaderMaterial({uniforms:{map:{value:texture},uDim:{value:0},uTime:{value:0},uVelocity:{value:0}},vertexShader:`varying vec2 vUv;uniform float uTime;uniform float uVelocity;void main(){vUv=uv;vec3 p=position;float edge=abs(uv.x-.5)*2.0;p.z+=edge*edge*(sin(uv.y*6.283+uTime*2.0)*.035+uVelocity*.018);p.y+=sin(uv.x*6.283+uTime)*.008*edge;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,fragmentShader:`uniform sampler2D map;uniform float uDim;varying vec2 vUv;void main(){vec2 p=vUv*2.0-1.0;vec2 q=abs(p)-vec2(.91,.87);float d=length(max(q,0.0))+min(max(q.x,q.y),0.0)-.075;float alpha=1.0-smoothstep(-.012,.012,d);vec4 color=texture2D(map,vUv);color.rgb*=1.0-uDim*.48;gl_FragColor=vec4(color.rgb,color.a*alpha);if(gl_FragColor.a<.01)discard;}`,transparent:true,side:THREE.DoubleSide})}
function init(){try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;scene=new THREE.Scene();scene.background=new THREE.Color(0x000000);camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.1,180);camera.position.set(0,2.0,innerWidth<=700?13.2:13.8);camera.lookAt(0,0,0);const floor=new THREE.Mesh(new THREE.PlaneGeometry(180,180),new THREE.ShaderMaterial({vertexShader:`varying vec3 vWorld;void main(){vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,fragmentShader:`varying vec3 vWorld;float grid(vec2 p,float scale){vec2 q=abs(fract(p*scale-.5)-.5)/fwidth(p*scale);return 1.-min(min(q.x,q.y),1.); }void main(){float a=grid(vWorld.xz,.55);float fade=1.-smoothstep(4.,48.,abs(vWorld.z));float sideFade=1.-smoothstep(8.,45.,abs(vWorld.x));float line=max(a,grid(vWorld.xz,.11)*.35);float alpha=line*.14*fade*sideFade;gl_FragColor=vec4(vec3(.58),alpha);}`,transparent:true,depthWrite:false}));floor.rotation.x=-Math.PI/2;floor.position.y=-2.15;scene.add(floor);
projects.forEach((p,i)=>{p.image=SITE_PHOTOS.projects[i]||'';const tex=makeArtwork(p);tex.colorSpace=THREE.SRGBColorSpace;const mat=roundedMaterial(tex);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(innerWidth<=700?8.0:11.76,innerWidth<=700?5.0:7.35,32,12),mat);mesh.userData={index:i,slug:p.slug};scene.add(mesh);meshes.push(mesh)});raycaster=new THREE.Raycaster();window.addEventListener('resize',resize);canvas.addEventListener('wheel',onWheel,{passive:false});canvas.addEventListener('pointerdown',onDown);window.addEventListener('pointermove',onMove);window.addEventListener('pointerup',onUp);window.addEventListener('keydown',onKey);canvas.addEventListener('click',onClick);animate();setTimeout(()=>loading.classList.add('done'),550)}catch(e){fallback.style.display='flex';loading.classList.add('done');console.error(e)}}
function resize(){if(!renderer)return;renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<700?48:38;camera.position.set(0,2.0,innerWidth<=700?15.5:13.8);camera.lookAt(0,0,0);camera.updateProjectionMatrix()}
function onWheel(e){const verticalDominant=Math.abs(e.deltaY)>=Math.abs(e.deltaX);if(verticalDominant&&e.deltaY<0){return}e.preventDefault();const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;target+=Math.sign(delta)*Math.min(1.25,Math.abs(delta)*.0018)}
function onDown(e){dragging=true;pointerMoved=false;startX=lastX=e.clientX;lastTime=performance.now();canvas.setPointerCapture?.(e.pointerId)}
function onMove(e){if(!dragging)return;const dx=e.clientX-lastX;if(Math.abs(e.clientX-startX)>4)pointerMoved=true;target-=dx/(innerWidth*.34);const now=performance.now();velocity=-(dx/Math.max(1,now-lastTime))*16;lastX=e.clientX;lastTime=now}
function onUp(){if(!dragging)return;dragging=false;if(!reduced)target=Math.round(target)}
function onKey(e){if(e.key==='ArrowRight'){target=Math.round(target)+1}if(e.key==='ArrowLeft'){target=Math.round(target)-1}if(e.key==='Enter')openProject(activeIndex)}
function onClick(e){if(pointerMoved)return;const r=canvas.getBoundingClientRect();const mouse=new THREE.Vector2((e.clientX/r.width)*2-1,-(e.clientY/r.height)*2+1);raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(meshes);if(hits.length){const i=hits[0].object.userData.index;if(i===activeIndex)openProject(i);else{const count=projects.length;const delta=((i-(Math.round(position)%count)+count*2+count/2)%count)-count/2;target=position+delta}}}
function openProject(i){location.href='projects/'+projects[i].slug+'/'}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);if(!dragging){const diff=target-position;position+=diff*(reduced?.22:.075);if(Math.abs(diff)<.001){position=target;velocity*=.82}else velocity+=(diff-velocity)*.08}const count=projects.length;const nearest=((Math.round(position)%count)+count)%count;if(nearest!==activeIndex){activeIndex=nearest;current.textContent=String(nearest+1).padStart(2,'0');progress.forEach((el,i)=>el.classList.toggle('active',i===Math.floor(nearest/2)))}meshes.forEach((m,i)=>{const d=((i-position+count/2)%count+count)%count-count/2;const mobile=innerWidth<=700;const angle=d*(mobile?.68:.9);const radius=mobile?8.2:12.5;m.position.set(Math.sin(angle)*radius,0.05+Math.abs(d)*-.015,Math.cos(angle)*radius-radius);m.rotation.y=-angle*.88;m.rotation.z=-Math.sign(d)*Math.min(.045,Math.abs(d)*.012);const scale=1-Math.min(.2,Math.abs(d)*.095);m.scale.setScalar(scale);m.material.uniforms.uDim.value=Math.min(.8,Math.abs(d)*.19);m.material.uniforms.uVelocity.value=reduced?0:Math.min(2,Math.abs(velocity));m.material.uniforms.uTime.value=clock.elapsedTime*(reduced?.0:1)});if(Math.abs(position)>.25)hint.style.opacity='0';renderer.render(scene,camera)}
// Hero-to-gallery scroll choreography (reversible).
const heroScroll=document.querySelector('#heroScroll'),hero=document.querySelector('#hero'),heroWord=document.querySelector('#heroWord'),heroPortrait=document.querySelector('#heroPortrait');
const hudItems=[...document.querySelectorAll('.hud,.top-progress,.scene-hint')];
const heroFramePath=document.querySelector('.hero-frame path');
// Mantém a margem superior da moldura igual à margem lateral em pixels.
function alignHeroFrame(){
  if(!heroFramePath||!hero)return;
  const rect=hero.getBoundingClientRect();
  const ratio=rect.width/Math.max(1,rect.height);
  const top=30*ratio,corner=48*ratio;
  heroFramePath.setAttribute('d',`M30 310V${corner}L48 ${top}H240 M760 ${top}H952L970 ${corner}V310`);
}
alignHeroFrame();
let heroProgress=0,heroPointerX=0,heroPointerY=0;
function updateHeroScroll(){if(!heroScroll)return;const rect=heroScroll.getBoundingClientRect();const span=Math.max(1,heroScroll.offsetHeight-innerHeight);heroProgress=THREE.MathUtils.clamp(-rect.top/span,0,1);const p=heroProgress;const fade=1-THREE.MathUtils.clamp(p/.25,0,1);const zoom=THREE.MathUtils.clamp((p-.1)/.5,0,1);const dissolve=THREE.MathUtils.clamp((p-.45)/.4,0,1);if(!reduced){heroWord.style.transform='scale('+(1+zoom*3.2)+') translateY('+(zoom*-4)+'vh)';heroWord.style.filter='blur('+(zoom*34)+'px)';heroPortrait.style.transform='translateX(-50%) translateY('+(-zoom*8)+'vh) scale('+(1+zoom*.15)+')';heroPortrait.style.filter='brightness('+(1-zoom*.98)+')';}heroWord.style.opacity=String(1-THREE.MathUtils.clamp((p-.55)/.28,0,1));hero.querySelectorAll('.hero-frame,.hero-top-title,.hero-copy,.hero-signature,.hero-mark,.hero-scroll-hint,.hero-photo-note').forEach(el=>{el.style.opacity=String(fade);});hero.style.backgroundColor='rgba(0,0,0,'+dissolve+')';document.body.classList.toggle('gallery-ready',p>.82);if(reduced){hero.style.opacity=String(1-THREE.MathUtils.clamp((p-.7)/.3,0,1));}}



history.scrollRestoration='manual';
async function boot(){
 try{
  await new Promise(resolve=>{if(document.readyState==='complete')resolve();else window.addEventListener('load',resolve,{once:true});});
  await Promise.all([document.fonts?.ready||Promise.resolve(),prepareHeroImage()]);
  const hash=location.hash;const hashTarget=hash?document.getElementById(decodeURIComponent(hash.slice(1))):null;
  window.scrollTo({top:hashTarget?hashTarget.getBoundingClientRect().top+window.scrollY:0,behavior:'instant'});
  init();alignHeroFrame();updateHeroScroll();
  window.addEventListener('scroll',updateHeroScroll,{passive:true});
  // Assistência de rolagem só é ativada depois da restauração da posição inicial.
  let heroSnapTimer=null;
  window.addEventListener('wheel',e=>{
   if(!heroScroll||e.deltaY<=0||Math.abs(e.deltaY)<Math.abs(e.deltaX)){clearTimeout(heroSnapTimer);return;}
   const span=Math.max(1,heroScroll.offsetHeight-innerHeight);
   const progress=THREE.MathUtils.clamp(-heroScroll.getBoundingClientRect().top/span,0,1);
   if(progress<=.015||progress>=.985)return;
   clearTimeout(heroSnapTimer);
   heroSnapTimer=setTimeout(()=>{
    const p=THREE.MathUtils.clamp(-heroScroll.getBoundingClientRect().top/span,0,1);
    if(p>.015&&p<.985)window.scrollTo({top:heroScroll.offsetTop+heroScroll.offsetHeight-innerHeight,behavior:'smooth'});
   },180);
  },{passive:true});
  window.addEventListener('resize',()=>{alignHeroFrame();updateHeroScroll()});
  window.addEventListener('pageshow',()=>{const t=location.hash?document.getElementById(decodeURIComponent(location.hash.slice(1))):null;window.scrollTo({top:t?t.getBoundingClientRect().top+window.scrollY:0,behavior:'instant'});alignHeroFrame();updateHeroScroll();});
  window.addEventListener('pointermove',e=>{if(reduced||heroProgress>.2)return;heroPointerX=(e.clientX/innerWidth-.5)*2;heroPointerY=(e.clientY/innerHeight-.5)*2;heroWord.style.marginLeft=(-heroPointerX*12)+'px';heroPortrait.style.marginLeft=(heroPointerX*7)+'px';heroPortrait.style.marginTop=(heroPointerY*5)+'px';},{passive:true});
  document.body.classList.remove('page-loading');document.body.classList.add('is-ready');
 }catch(error){console.error('Falha na inicialização do portfólio:',error);document.body.classList.remove('page-loading');document.body.classList.add('is-ready');}
}
boot();
