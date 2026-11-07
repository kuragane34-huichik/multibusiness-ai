
const slides=[...document.querySelectorAll('.slide')];let index=0;const $=s=>document.querySelector(s);const notes=$('#notes');const progress=$('#progress');
slides.forEach((slide,i)=>{const b=document.createElement('button');b.setAttribute('aria-label',`${i+1}. ${slide.dataset.title}`);b.addEventListener('click',()=>go(i));progress.append(b)});
function fillNotes(){const n=$('#noteNumber');if(!n)return;n.textContent=`\u0421\u041b\u0410\u0419\u0414 ${index+1} / ${slides.length}`;$('#noteTitle').textContent=slides[index].dataset.title||'';$('#noteText').textContent=slides[index].dataset.note||''}
function go(n){index=Math.max(0,Math.min(slides.length-1,n));slides.forEach((s,i)=>{s.classList.toggle('active',i===index);s.setAttribute('aria-hidden',String(i!==index))});[...progress.children].forEach((b,i)=>b.setAttribute('aria-current',String(i===index)));$('#prev').disabled=index===0;$('#next').disabled=index===slides.length-1;if(typeof resetFilm==='function'){if(index===1)resetFilm();else stopFilm();}fillNotes();window.scrollTo(0,0)}
$('#prev').onclick=()=>go(index-1);$('#next').onclick=()=>go(index+1);
document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.target.matches('input,textarea,select'))return;if(document.querySelector('dialog[open]'))return;if(['ArrowRight','PageDown'].includes(e.key)){e.preventDefault();go(index+1)}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();go(index-1)}if(e.key==='Home'){e.preventDefault();go(0)}if(e.key==='End'){e.preventDefault();go(slides.length-1)}});
let touch;document.addEventListener('touchstart',e=>{if(e.target.closest('.surface,button,dialog'))return;touch={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY}},{passive:true});document.addEventListener('touchend',e=>{if(!touch||notes?.open)return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;if(Math.abs(dx)>80&&Math.abs(dx)>Math.abs(dy)*1.7)go(index+(dx<0?1:-1));touch=null},{passive:true});
window.addEventListener('DOMContentLoaded',()=>go((Number(location.hash.match(/slide-(\d+)/)?.[1])||1)-1));

;

// A deterministic, seekable 38-second 2D story. No video API or network required.
let filmTime=0,filmPlaying=false,filmRaf=0,filmLast=0,firstFilm=true;
const duration=33;const cinema=document.querySelector('#cinema'),peopleWrap=document.querySelector('.person-wrap'),worried=document.querySelector('.worried'),happy=document.querySelector('.happy'),tile=document.querySelector('#productTile'),shopImgs=[...document.querySelectorAll('.shop')],problemEls=[...document.querySelectorAll('.problem')],growth=document.querySelector('.growth-track'),finalScene=document.querySelector('.final-scene');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};const lerp=(a,b,t)=>a+(b-a)*t;const easeIO=x=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
const phases=[0,5.5,9,13,17,21,25,29];
const captions=['Когда всё держится на одном человеке.','Появляется команда, которая всегда под рукой.','Задачи не исчезают — у них появляются исполнители.','Контроль остаётся в руках владельца.','Начинаем с небольшой торговой точки.','Больше порядка — больше возможностей развиваться.','Новые процессы помогают работать в большем масштабе.','Помощник для работы. Пространство для развития.'];
const kickers=['АКТ 01 / РУТИНА','АКТ 02 / ПОМОЩНИК','АКТ 03 / РАСПРЕДЕЛЕНИЕ ЗАДАЧ','АКТ 04 / КОНТРОЛЬ','АКТ 05 / НЕБОЛЬШОЙ МАГАЗИН','АКТ 06 / РАЗВИТИЕ','АКТ 07 / НОВЫЙ МАСШТАБ','MultiBusinessAI / ШЕСТЬ АГЕНТОВ'];
const ropeCanvas=document.createElement('canvas'),dustCanvas=document.createElement('canvas');
ropeCanvas.className='rope-canvas';dustCanvas.className='dust-canvas';
for(const can of [ropeCanvas,dustCanvas])can.setAttribute('aria-hidden','true');
cinema.prepend(ropeCanvas);cinema.append(dustCanvas);
const ropeCtx=ropeCanvas.getContext('2d'),dustCtx=dustCanvas.getContext('2d');let dustLayout=null;
const gpuDustCanvas=document.createElement('canvas');gpuDustCanvas.className='dust-canvas';gpuDustCanvas.style.zIndex='8';gpuDustCanvas.setAttribute('aria-hidden','true');cinema.append(gpuDustCanvas);
const dustGPU=(()=>{
 const gl=gpuDustCanvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:true,powerPreference:'high-performance'});if(!gl)return null;
 const vs=`precision highp float;
 attribute vec2 aLocal;attribute vec2 aTiming;attribute vec4 aMotion;attribute vec4 aSample;attribute float aKind;
 uniform vec2 uViewport;uniform vec2 uAnchor;uniform float uCardWidth;uniform float uLength;uniform float uIndex;uniform float uStart;uniform float uElapsed;uniform float uDensity;
 varying vec4 vSample;varying float vAlpha;varying float vAngle;varying float vFill;
 float sm(float x){x=clamp(x,0.,1.);return x*x*(3.-2.*x);}
 void main(){
 float age=uElapsed-aTiming.x,life=aTiming.y,q=age/life;
 vSample=aSample;vAlpha=0.;vAngle=0.;vFill=.70710678;
 if(age<0.||age>life){gl_Position=vec4(3.,3.,0.,1.);gl_PointSize=1.;return;}
 float bt=min(uStart+aTiming.x,uStart+.6),omega=sqrt(750./uLength);
 float theta=sin(omega*bt+uIndex*1.12)*(.032+uIndex*.002)+sin(bt*.7+uIndex)*.008;
 float ca=cos(-theta),sa=sin(-theta);
 vec2 local=vec2(aLocal.x-uCardWidth*.5,aLocal.y);
 vec2 pos=uAnchor+vec2(sin(theta)*uLength,uLength*(cos(theta)-1.))+vec2(local.x*ca-local.y*sa,local.x*sa+local.y*ca);
 float drift=(1.-exp(-age*4.))/4.;
 pos.x+=aMotion.x*(age-drift*.7)+sin(age*3.1+aMotion.w)*age*age*9.;
 pos.y+=aMotion.y*age-13.*age*age+sin(age*3.8+aMotion.w)*age*7.;
 if(aKind>.5){pos+=vec2(sin(aMotion.w+age*4.),cos(aMotion.w+age*3.))*age*8.;}
 float shrink=1.-sm(q)*.82;
 float size=mix(2.,.65,aKind)*shrink;
 gl_PointSize=max(1.,size*1.41421356*uDensity);
 gl_Position=vec4(pos.x/uViewport.x*2.-1.,1.-pos.y/uViewport.y*2.,0.,1.);
 vAlpha=(1.-sm((q-.35)/.65))*mix(1.,.55,aKind);vAngle=-theta+aMotion.z*age;
 }
 `;
 const fs=`precision mediump float;
 uniform sampler2D uTexture;varying vec4 vSample;varying float vAlpha;varying float vAngle;varying float vFill;
 void main(){
 if(vAlpha<=0.)discard;
 vec2 p=(gl_PointCoord-.5)*1.41421356;float c=cos(vAngle),s=sin(vAngle);
 vec2 q=vec2(c*p.x+s*p.y,-s*p.x+c*p.y);
 if(abs(q.x)>.5||abs(q.y)>.5)discard;
 vec4 color=texture2D(uTexture,vSample.xy+q*vSample.zw);
 gl_FragColor=vec4(color.rgb,color.a*vAlpha);
 }
 `;
 function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
 let program;try{program=gl.createProgram();const v=shader(gl.VERTEX_SHADER,vs),f=shader(gl.FRAGMENT_SHADER,fs);gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program))}catch(error){console.warn('GPU dust unavailable; using canvas renderer',error);return null}
 const attrs={aLocal:[2,0],aTiming:[2,2],aMotion:[4,4],aSample:[4,8],aKind:[1,12]},loc={};for(const key of ['uViewport','uAnchor','uCardWidth','uLength','uIndex','uStart','uElapsed','uDensity','uTexture'])loc[key]=gl.getUniformLocation(program,key);
 const attrLocations={};for(const key in attrs)attrLocations[key]=gl.getAttribLocation(program,key);
 let resources=[];
 function setup(layout){
  for(const r of resources){gl.deleteBuffer(r.buffer);gl.deleteTexture(r.texture)}resources=[];
  gpuDustCanvas.width=Math.round(layout.w*layout.density);gpuDustCanvas.height=Math.round(layout.h*layout.density);gpuDustCanvas.style.width=layout.w+'px';gpuDustCanvas.style.height=layout.h+'px';gl.viewport(0,0,gpuDustCanvas.width,gpuDustCanvas.height);
  for(const card of layout.cards){
   const data=[];for(const p of card.parts){
    const record=kind=>{data.push(p.x+p.w/2,p.y+p.h/2,p.birth+(kind?.16:0),p.life*(kind?.88:1),p.vx,p.vy,p.spin,p.phase,(p.x+p.w/2)/card.w,(p.y+p.h/2)/card.h,p.w/card.w,p.h/card.h,kind)};record(0);if(randomSeed(p.seed+11)>.45)record(1);
   }
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
   const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,card.tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);resources.push({buffer,texture,count:data.length/13});
  }
 }
 function begin(layout){gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.uniform2f(loc.uViewport,layout.w,layout.h);gl.uniform1f(loc.uDensity,layout.density);gl.uniform1i(loc.uTexture,0);gl.activeTexture(gl.TEXTURE0)}
 function paint(card,i,start,elapsed){if(elapsed<0||elapsed>4.8)return;const r=resources[i];gl.bindBuffer(gl.ARRAY_BUFFER,r.buffer);for(const key in attrs){const[size,offset]=attrs[key],l=attrLocations[key];gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,13*4,offset*4)}gl.bindTexture(gl.TEXTURE_2D,r.texture);gl.uniform2f(loc.uAnchor,card.x,card.y);gl.uniform1f(loc.uCardWidth,card.w);gl.uniform1f(loc.uLength,card.length);gl.uniform1f(loc.uIndex,i);gl.uniform1f(loc.uStart,start);gl.uniform1f(loc.uElapsed,elapsed);gl.drawArrays(gl.POINTS,0,r.count)}
 return{setup,begin,paint,info:()=>({renderer:'webgl',particles:resources.reduce((n,r)=>n+r.count,0),error:gl.getError()})};
})();

function randomSeed(n){let x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)}
function dustNoise(x,y,seed){const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);return lerp(lerp(randomSeed(ix*37+iy*173+seed),randomSeed((ix+1)*37+iy*173+seed),fx),lerp(randomSeed(ix*37+(iy+1)*173+seed),randomSeed((ix+1)*37+(iy+1)*173+seed),fx),fy)}
function prepareDust(){
 const w=cinema.clientWidth,h=cinema.clientHeight;if(!w||!h)return;
 const density=Math.min(devicePixelRatio||1,2);
 if(dustLayout&&dustLayout.w===w&&dustLayout.h===h&&dustLayout.density===density)return;
 for(const can of [ropeCanvas,dustCanvas]){can.width=Math.round(w*density);can.height=Math.round(h*density);can.style.width=w+'px';can.style.height=h+'px';can.getContext('2d').setTransform(density,0,0,density,0,0)}
 dustLayout={w,h,density,cards:problemEls.map((p,i)=>{
  const pw=p.offsetWidth,ph=p.offsetHeight,cx=p.offsetLeft+pw/2,cy=p.offsetTop,scale=2;
  const tex=document.createElement('canvas');tex.width=pw*scale;tex.height=ph*scale;
  const ctx=tex.getContext('2d'),cs=getComputedStyle(p);ctx.scale(scale,scale);
  ctx.fillStyle=cs.backgroundColor;ctx.beginPath();ctx.roundRect(.5,.5,pw-1,ph-1,parseFloat(cs.borderRadius));ctx.fill();ctx.strokeStyle=cs.borderColor;ctx.lineWidth=1;ctx.stroke();
  const symbol=p.querySelector('span'),ss=getComputedStyle(symbol),sx=symbol.offsetLeft,sy=symbol.offsetTop;
  ctx.fillStyle=ss.backgroundColor;ctx.beginPath();ctx.roundRect(sx,sy,symbol.offsetWidth,symbol.offsetHeight,4);ctx.fill();
  ctx.fillStyle=ss.color;ctx.textBaseline='middle';ctx.textAlign='center';ctx.font=ss.font;ctx.fillText(symbol.textContent.trim(),sx+symbol.offsetWidth/2,sy+symbol.offsetHeight/2+.4);
  ctx.textAlign='left';ctx.font=cs.font;ctx.fillStyle=cs.color;
  const text=p.textContent.replace(symbol.textContent,'').trim(),tx=sx+symbol.offsetWidth+parseFloat(cs.gap);
  let lines=[],line='';for(const word of text.split(' ')){let next=line?line+' '+word:word;if(ctx.measureText(next).width>pw-tx-parseFloat(cs.paddingRight)-1&&line){lines.push(line);line=word}else line=next}lines.push(line);
  const lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.2;
  lines.forEach((line,j)=>ctx.fillText(line,tx,ph/2+(j-(lines.length-1)/2)*lh+.4));
  const rem=document.createElement('canvas');rem.width=tex.width;rem.height=tex.height;const remCtx=rem.getContext('2d');remCtx.drawImage(tex,0,0);
  const image=ctx.getImageData(0,0,tex.width,tex.height).data,parts=[],step=2;
  for(let py=0;py<ph;py+=step)for(let px=0;px<pw;px+=step){
   const tw=Math.min(step,pw-px),th=Math.min(step,ph-py),k=(Math.min(tex.height-1,Math.floor((py+th/2)*scale))*tex.width+Math.min(tex.width-1,Math.floor((px+tw/2)*scale)))*4;
   if(image[k+3]<8)continue;
   const seed=i*100003+py*pw+px,n=dustNoise(px/19,py/19,i*159.7);
   const birth=.06+n*1.18+randomSeed(seed+1)*.42;
   parts.push({x:px,y:py,w:tw,h:th,seed,birth,life:1.65+randomSeed(seed+2)*1.10,vx:((i%2)?1:-1)*(25+randomSeed(seed+4)*64)+(randomSeed(seed+8)-.5)*42,vy:-12-randomSeed(seed+5)*42,spin:(randomSeed(seed+6)-.5)*6,phase:randomSeed(seed+7)*Math.PI*2,color:`rgb(${image[k]},${image[k+1]},${image[k+2]})`});
  }
  parts.sort((a,b)=>a.birth-b.birth);
  return {w:pw,h:ph,x:cx,y:cy,length:Math.max(35,cy),parts,tex,rem,remCtx,scale,removed:0,lastElapsed:-Infinity};
 })};
 if(dustGPU)dustGPU.setup(dustLayout);
}
function swing(i,t,card){const omega=Math.sqrt(750/card.length);return Math.sin(omega*t+i*1.12)*(.032+i*.002)+Math.sin(t*.7+i)*.008}
function dustPose(i,t,card){const theta=swing(i,t,card);return{x:card.x+Math.sin(theta)*card.length,y:card.y+card.length*(Math.cos(theta)-1),angle:-theta}}
function paintProblems(t){
 prepareDust();if(!dustLayout)return;const{w,h,cards}=dustLayout;
 ropeCtx.clearRect(0,0,w,h);dustCtx.clearRect(0,0,w,h);if(dustGPU)dustGPU.begin(dustLayout);
 problemEls.forEach((p,i)=>{
  const card=cards[i],entry=smooth((t-i*.22)/1.2),start=9+randomSeed(i+520)*.28,elapsed=t-start,pose=dustPose(i,Math.min(t,start+.6),card);
  const dx=pose.x-card.x,dy=pose.y-card.y+lerp(-24,0,entry);
  p.style.clipPath='none';p.style.opacity=(elapsed<0?entry:0).toFixed(3);p.style.transformOrigin='50% 0';p.style.transform=`translate(${dx}px,${dy}px) rotate(${pose.angle*180/Math.PI}deg)`;
  const ropeOpacity=entry*(1-smooth(Math.max(0,elapsed-.6)/1.1));
  if(ropeOpacity>.001){ropeCtx.save();ropeCtx.globalAlpha=ropeOpacity;ropeCtx.strokeStyle='#6d7569';ropeCtx.lineWidth=.9;ropeCtx.beginPath();ropeCtx.moveTo(card.x,0);ropeCtx.lineTo(pose.x,pose.y+lerp(-24,0,entry)+1);ropeCtx.stroke();ropeCtx.restore()}
  if(elapsed<0){card.lastElapsed=elapsed;return}
  if(elapsed<card.lastElapsed||card.lastElapsed<0){card.remCtx.clearRect(0,0,card.rem.width,card.rem.height);card.remCtx.drawImage(card.tex,0,0);card.removed=0}
  while(card.removed<card.parts.length&&card.parts[card.removed].birth<=elapsed){const part=card.parts[card.removed++];card.remCtx.clearRect(part.x*card.scale,part.y*card.scale,part.w*card.scale,part.h*card.scale)}
  card.lastElapsed=elapsed;
  if(card.removed<card.parts.length){dustCtx.save();dustCtx.translate(pose.x,pose.y);dustCtx.rotate(pose.angle);dustCtx.drawImage(card.rem,-card.w/2,0,card.w,card.h);dustCtx.restore()}
  if(dustGPU){dustGPU.paint(card,i,start,elapsed);return}
  for(let j=0;j<card.removed;j++){
   const part=card.parts[j],age=elapsed-part.birth;if(age>part.life)continue;
   const q=age/part.life,bp=dustPose(i,Math.min(start+part.birth,start+.6),card),lx=part.x+part.w/2-card.w/2,ly=part.y+part.h/2,ca=Math.cos(bp.angle),sa=Math.sin(bp.angle);
   const lift=age*age,drift=(1-Math.exp(-age*4))/4;
   const px=bp.x+lx*ca-ly*sa+part.vx*(age-drift*.7)+Math.sin(age*3.1+part.phase)*lift*9;
   const py=bp.y+lx*sa+ly*ca+part.vy*age-13*lift+Math.sin(age*3.8+part.phase)*age*7;
   const fade=1-smooth((q-.35)/.65),shrink=1-smooth(q)*.82;
   dustCtx.globalAlpha=fade;dustCtx.save();dustCtx.translate(px,py);dustCtx.rotate(bp.angle+part.spin*age);dustCtx.drawImage(card.tex,part.x*card.scale,part.y*card.scale,part.w*card.scale,part.h*card.scale,-part.w*shrink/2,-part.h*shrink/2,part.w*shrink,part.h*shrink);dustCtx.restore();
   if(q>.12&&q<.9&&randomSeed(part.seed+11)>.45){dustCtx.globalAlpha=fade*.55;dustCtx.fillStyle=part.color;const r=.35+(1-q)*.35;dustCtx.fillRect(px+Math.sin(part.phase+age*4)*age*8,py+Math.cos(part.phase+age*3)*age*6,r,r)}
  }
 });dustCtx.globalAlpha=1;
}

function renderFilm(t){filmTime=clamp(t,0,duration);const mobile=matchMedia('(max-width:560px)').matches;const phase=phases.reduce((a,x,i)=>filmTime>=x?i:a,0);const arrival=easeIO((filmTime-5.5)/2.8),sweep=smooth((filmTime-9)/3),catchP=easeIO((filmTime-13)/3.8),growthP=smooth((filmTime-16.7)/.8);const stressed=1-smooth((filmTime-10.6)/.9);const bob=Math.sin(Math.max(0,filmTime-8.3)*1.5)*1.1*(1-smooth((filmTime-12.1)/.9));const dip=Math.sin(clamp(catchP)*Math.PI);cinema.classList.toggle('rescued',filmTime>=9);document.querySelector('#sceneKicker').textContent=kickers[phase];document.querySelector('#sceneCaption').textContent=captions[phase];
paintProblems(filmTime);
peopleWrap.style.opacity=1-growthP;peopleWrap.style.transform=`translateY(${Math.sin(filmTime*1.6)*2*stressed+dip*4}px) rotate(${Math.sin(filmTime*.8)*.65*stressed}deg)`;worried.style.opacity=stressed;happy.style.opacity=1-stressed;
let y=lerp(-15,18,arrival)+bob,x=50,angle=lerp(-24,5,arrival)+dip*2,scale=lerp(1+Math.sin(filmTime*2)*.025*(1-catchP),.8,catchP);if(filmTime>=13){y=lerp(18,mobile?57:43,catchP);x=lerp(50,mobile?44:47,catchP);angle=lerp(5,-7,catchP)+dip*2}tile.style.opacity=arrival*(1-growthP);tile.style.top=y+'%';tile.style.left=x+'%';tile.style.transform=`translate(-50%,-50%) rotate(${angle}deg) scale(${scale})`;

shopImgs.forEach((img,i)=>{const start=17+i*4,end=start+4;let a=smooth((filmTime-start)/.7)*(1-smooth((filmTime-end+.1)/.6));img.style.opacity=a;const q=clamp((filmTime-start)/4);img.style.transform=`translate(-50%,-50%) translateY(${(1-smooth(q/.25))*20}px) scale(${lerp(.91,1.025,smooth(q))})`});growth.style.opacity=smooth((filmTime-17)/.7)*(1-smooth((filmTime-29)/.5));[...growth.children].forEach((s,i)=>s.classList.toggle('current',phase===i+4));const fin=smooth((filmTime-29)/1);finalScene.style.opacity=fin;finalScene.style.transform=`translateY(${(1-fin)*12}px)`;

}
function stopFilm(){filmPlaying=false;cancelAnimationFrame(filmRaf);const b=document.querySelector('#storyPlay');if(b)b.textContent=filmTime>=duration?'▶ Ещё раз':'▶ Продолжить';}
function tickFilm(now){if(!filmPlaying)return;if(filmLast)renderFilm(filmTime+(now-filmLast)/1000);filmLast=now;if(filmTime>=duration){stopFilm();return}filmRaf=requestAnimationFrame(tickFilm)}
function playFilm(){if(filmPlaying){stopFilm();return}if(firstFilm||filmTime>=duration){renderFilm(0);firstFilm=false}filmPlaying=true;filmLast=0;document.querySelector('#storyPlay').textContent='Ⅱ Пауза';filmRaf=requestAnimationFrame(tickFilm)}
function resetFilm(){stopFilm();firstFilm=false;renderFilm(0);playFilm();}
document.querySelector('#storyPlay').onclick=playFilm;document.querySelector('#storyRestart').onclick=resetFilm;
window.addEventListener('resize',()=>renderFilm(filmTime));document.addEventListener('visibilitychange',()=>{if(document.hidden)stopFilm()});
window.addEventListener('message',e=>{if(e.source!==parent)return;if(e.data?.type==='phone-resume'&&index===1)resetFilm();if(e.data?.type==='phone-suspend')stopFilm()});
// Re-number old headings without touching the content of the story.
slides.forEach((s,i)=>{if(i===0)return;const e=s.querySelector('.eyebrow');if(e)e.textContent=e.textContent.replace(/^\d+\s*\//,String(i+1).padStart(2,'0')+' /')});
renderFilm(0);

;
addEventListener('message',e=>{if(e.source===parent&&e.data?.type==='phone-suspend'){if(typeof stopFilm==='function')stopFilm();if(typeof stopStory==='function')stopStory();}});