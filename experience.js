/* One slogan, travelling from the opening spread into the fixed masthead. */
(()=>{
 const heading=document.querySelector('#movingSlogan'),home=document.querySelector('.slogan-home'),dock=document.querySelector('.slogan-dock'),mast=document.querySelector('.mast');
 const hero=document.querySelector('.intro'),field=document.querySelector('.hero-field'),presetSlot=document.querySelector('#presetSlot'),presetDock=document.querySelector('#presetDock'),lab=document.querySelector('.lab');
 const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);},lerp=(a,b,t)=>a+(b-a)*t;
 let metrics=null,scheduled=false;
 function measure(){
  const d=dock.getBoundingClientRect();
  const full=hero.getBoundingClientRect().bottom+scrollY,trayHeight=presetDock.offsetHeight;
  presetSlot.style.height=trayHeight+'px';presetSlot.style.minHeight=trayHeight+'px';document.documentElement.style.setProperty('--preset-height',trayHeight+'px');field.style.height=full+'px';
  const mobile=innerWidth<=650;
  const logoLeft=document.querySelector('.mast .logo').getBoundingClientRect().left;
  const textWidth=mobile?innerWidth*.74:Math.min(innerWidth*.34,650),textHeight=textWidth*584/934;
  const graphicWidth=mobile?innerWidth*.96:innerWidth*.62,graphicHeight=graphicWidth*1518/1792;
  const imageY=mobile?mast.offsetHeight+textHeight+62:mast.offsetHeight+14;
  const picture=document.querySelector('.hero-reference');
  Object.assign(picture.style,{width:graphicWidth+'px',height:graphicHeight+'px',left:'auto',right:'0px',top:imageY+'px'});
  metrics={x:logoLeft,y:mast.offsetHeight+(mobile?34:46),width:textWidth,dx:d.left,dy:d.top-2,scale:Math.min((mobile?27:34)/textHeight,140/textWidth),range:Math.max(1,full-mast.offsetHeight),header:mast.offsetHeight,full,trayHeight,imageY,graphicHeight,picture};
  heading.classList.add('slogan-fixed');heading.style.width=textWidth+'px';heading.style.height=textHeight+'px';draw();
 }
 function draw(){scheduled=false;if(!metrics)return;const m=metrics,p=clamp(scrollY/m.range),t=smooth(p),x=lerp(m.x,m.dx,smooth(p*1.6)),scale=lerp(1,m.scale,t);
  let y=lerp(m.y-scrollY,m.dy,t);
  // The large type stays below the logo until it is small enough to share the masthead.
  if(p<.72)y=Math.max(m.header+12,y);else y=lerp(m.header+12,m.dy,smooth((p-.72)/.28));
  heading.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`;
  mast.classList.toggle('compact',p===1);
  // Clip the viewport, never distort the artwork: uniform zoom anchored right.
  field.style.height=Math.max(m.header,m.full-scrollY)+'px';
  field.style.transform='none';
  const zoom=matchMedia('(prefers-reduced-motion: reduce)').matches?1:lerp(1,2.15,t);
  m.picture.style.transform=`translate3d(0,${-(m.imageY+m.graphicHeight*.16)*t}px,0) scale(${zoom})`;
  const glass=smooth((p-.72)/.28);
  mast.classList.toggle('glass-on',glass>0);
  mast.style.setProperty('--glass-opacity',(glass*.22).toFixed(3));
  mast.style.setProperty('--glass-blur',(glass*6).toFixed(2)+'px');
  mast.style.setProperty('--glass-border',(glass*.12).toFixed(3));
  const tabs=document.querySelector('.tabs'),anchor=document.querySelector('#stepAnchor');
  const steps=clamp((m.header+70-anchor.getBoundingClientRect().top)/70);
  document.documentElement.style.setProperty('--steps-progress',steps.toFixed(3));
  const stepsHeight=tabs.offsetHeight;
  document.documentElement.style.setProperty('--steps-height',stepsHeight+'px');
  const labBox=lab.getBoundingClientRect(),slotBox=presetSlot.getBoundingClientRect();
  const pin=labBox.top<innerHeight*.64&&scrollY>m.range*.25&&slotBox.top>innerHeight-m.trayHeight;
  presetDock.classList.toggle('is-pinned',pin);presetSlot.dataset.mode=pin?'pinned':'flow';document.body.classList.toggle('preset-docked',pin);
  const stageTop=document.querySelector('#stage').getBoundingClientRect().top;
  const room=Math.max(280,innerHeight-m.trayHeight-Math.max(m.header+stepsHeight+16,stageTop)-18);
  document.documentElement.style.setProperty('--stage-room',room+'px');
 }
 addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(draw);}},{passive:true});
 addEventListener('resize',measure);document.fonts.ready.then(measure);measure();

 const dialog=document.querySelector('#finishDialog'),canvas=document.querySelector('#laptopSticker'),status=document.querySelector('#finishStatus');let placement=null;
 function replay(){
  placement?.cancel();status.textContent='Placing your sticker.';
  const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:1900;
  placement=canvas.animate([
   {opacity:0,transform:'translate3d(-170px,-170px,160px) rotateZ(-19deg) scale(1.35)',filter:'drop-shadow(0 28px 20px #0002)',offset:0},
   {opacity:1,transform:'translate3d(-70px,-80px,100px) rotateZ(-6deg) scale(1.12)',filter:'drop-shadow(0 22px 16px #0002)',offset:.35},
   {opacity:1,transform:'translate3d(0,-8px,12px) rotateZ(7deg) scale(1)',filter:'drop-shadow(0 8px 6px #0002)',offset:.8},
   {opacity:1,transform:'translate3d(0,0,.8px) rotateZ(7deg) scale(1)',filter:'drop-shadow(0 1px 1px #0002)',offset:1}
  ],{duration,easing:'cubic-bezier(.2,.65,.25,1)',fill:'both'});
  placement.finished.then(()=>{status.textContent='Yours. On your MacBook.';}).catch(()=>{});
 }
 document.querySelector('#finishSticker').onclick=async()=>{
  const button=document.querySelector('#finishSticker');button.disabled=true;
  try{const result=await funkeSticker.snapshot(1200);canvas.width=canvas.height=1200;canvas.getContext('2d').drawImage(result.canvas,0,0);
   const width=Math.min(48,Math.max(24,(+document.querySelector('#stickerWidth').value+10)/3.12));canvas.style.width=width+'%';canvas.style.left=(96-width)+'%';
   dialog.showModal();requestAnimationFrame(replay);
  }catch(error){console.error(error);funkeLab.toast('Please wait for your artwork to finish rendering and try again.');}finally{button.disabled=false;}
 };
 document.querySelector('#closeFinish').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>placement?.cancel());
 document.querySelector('#replayPlacement').onclick=replay;
 document.querySelector('#saveFinished').onclick=async()=>{const b=document.querySelector('#saveFinished');b.disabled=true;try{await funkeSticker.download(+document.querySelector('#exportSize').value);}finally{b.disabled=false;}};
})();
