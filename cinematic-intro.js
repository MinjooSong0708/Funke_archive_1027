/* User-triggered logo handoff into the supplied, unmodified 24 fps film. */
(()=>{
 const overlay=document.querySelector('#filmIntro'),film=document.querySelector('#introFilm'),start=document.querySelector('#beginIntro'),actor=document.querySelector('#introLogoActor'),word=actor.querySelector('.intro-logo-word'),skip=document.querySelector('#skipIntro'),status=document.querySelector('#introStatus');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let state='ready',moving=null,fade=null,leaving=false,loadTimer=null;
 const page=()=>[document.querySelector('.mast'),document.querySelector('main'),document.querySelector('footer')];
 page().forEach(el=>{if(el)el.inert=true;});
 window.scrollTo({top:0,behavior:'instant'});
 function layout(){
  const width=Math.min(620,innerWidth*.72),height=width*324/1310;
  actor.style.width=width+'px';actor.style.height=height+'px';
  if(state==='ready')actor.style.transform=`translate3d(${(innerWidth-width)/2}px,${(innerHeight-height)/2}px,0)`;
 }
 function setState(value){state=value;overlay.dataset.state=value;}
 function finish(){
  if(leaving)return;leaving=true;clearTimeout(loadTimer);film.pause();moving?.cancel();fade?.cancel();
  setState('leaving');document.body.classList.remove('intro-active');document.body.classList.add('intro-reveal');
  page().forEach(el=>{if(el)el.inert=false;});window.scrollTo({top:0,behavior:'instant'});
  window.dispatchEvent(new Event('resize'));
  setTimeout(()=>{overlay.hidden=true;overlay.inert=true;document.body.classList.remove('intro-reveal');document.querySelector('.mast a')?.focus({preventScroll:true});},reduced?160:1000);
 }
 async function begin(){
  if(state!=='ready')return;
  setState('transitioning');start.disabled=true;status.textContent='';
  const width=actor.offsetWidth,height=actor.offsetHeight;
  // object-fit:contain mapping of the source's opening symbol (centre 940,835,
  // 250px high). This same mapping is used for portrait and landscape screens.
  const unit=Math.min(innerWidth/1920,innerHeight/1080),vx=(innerWidth-1920*unit)/2,vy=(innerHeight-1080*unit)/2;
  const scale=250*unit/height,targetX=vx+940*unit-width*.123665*scale,targetY=vy+835*unit-height*scale/2;
  moving=actor.animate([{transform:actor.style.transform,opacity:1},{transform:`translate3d(${targetX}px,${targetY}px,0) scale(${scale})`,opacity:1}],{duration:reduced?0:850,easing:'cubic-bezier(.45,0,.22,1)',fill:'forwards'});
  word.animate([{opacity:1},{opacity:0}],{duration:reduced?0:280,fill:'forwards'});
  try{
   await moving.finished;if(leaving)return;
   // Muted playback is permitted after this single explicit activation, including
   // mobile Safari; no subsequent click is needed for any frame or transition.
   const onFirstFrame=()=>{if(leaving)return;setState('playing');fade=actor.animate([{opacity:1},{opacity:0}],{duration:180,fill:'forwards'});};
   film.addEventListener('playing',onFirstFrame,{once:true});
   loadTimer=setTimeout(()=>{if(!leaving&&film.readyState<2)status.textContent='Loading the film. You can skip the intro at any time.';},3000);
   await film.play();status.textContent='';
  }catch(error){if(leaving)return;status.textContent='The film could not start. Select Skip intro to enter the studio.';}
 }
 start.addEventListener('click',begin);skip.addEventListener('click',finish);
 film.addEventListener('ended',finish);
 film.addEventListener('error',()=>{status.textContent='The film is unavailable. Select Skip intro to enter the studio.';});
 document.addEventListener('keydown',event=>{if(!leaving&&event.key==='Escape')finish();});
 addEventListener('resize',layout);layout();
})();
