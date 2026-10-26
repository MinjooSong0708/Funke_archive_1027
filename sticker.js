/* Browser-only die-cut mockup. No orders or network requests are sent. */
(()=>{
 const $=s=>document.querySelector(s),N=1400,logo=new Image();logo.src='assets/funke-logo.svg';
 let yaw=-16,pitch=12,drag=null,refreshId=0,foil='black',logoCanvas=null;
 const front=$('#stickerFront'),back=$('#stickerBack'),mark=$('#stickerFoil'),card=$('#stickerCard');
 const light=document.createElement('canvas');light.id='stickerLight';light.className='sticker-face sticker-light';light.setAttribute('aria-hidden','true');light.width=light.height=768;card.append(light);let materialMask=null;
 const make=n=>{const c=document.createElement('canvas');c.width=c.height=n;return c;};
 function bounds(shapes){let l=1,t=1,r=-1,b=-1;for(const q of shapes){const c=Math.cos(q.angle),s=Math.sin(q.angle),x=Math.hypot(q.rx*c,q.ry*s),y=Math.hypot(q.rx*s,q.ry*c);l=Math.min(l,q.x-x);r=Math.max(r,q.x+x);t=Math.min(t,q.y-y);b=Math.max(b,q.y+y);}return {l,t,r,b};}
 function silhouette(ctx,shapes,n,margin){ctx.fillStyle='#fff';ctx.strokeStyle='#fff';ctx.lineWidth=margin*2;ctx.lineJoin='round';for(const q of shapes){ctx.beginPath();ctx.ellipse((q.x+1)*n/2,(q.y+1)*n/2,q.rx*n/2,q.ry*n/2,q.angle,0,Math.PI*2);ctx.fill();ctx.stroke();}}
 function spec(){const state=funkeLab.state,shapes=FunkeGeometry.fit(FunkeGeometry.shapes({...state,playing:true},funkeLab.phase),true),box=bounds(shapes),artWidth=+$('#stickerWidth').value;return {state,shapes,box,artWidth};}
 function texture(n,art){const {shapes,box,artWidth}=spec(),c=make(n),g=c.getContext('2d'),artPx=(box.r-box.l)*n/2,margin=artPx*5/artWidth;
  silhouette(g,shapes,n,margin);g.drawImage(art,0,0,n,n);
  // Subtle clear gloss clipped to the actual die-cut backing, never to a rectangle.
  const gloss=make(n),gg=gloss.getContext('2d');silhouette(gg,shapes,n,margin);gg.globalCompositeOperation='source-in';const grad=gg.createLinearGradient(0,n,n,0);grad.addColorStop(0,'#ffffff00');grad.addColorStop(.47,'#ffffff00');grad.addColorStop(.54,'#ffffff0c');grad.addColorStop(.63,'#ffffff00');grad.addColorStop(1,'#ffffff00');gg.fillStyle=grad;gg.fillRect(0,0,n,n);g.drawImage(gloss,0,0);
  return {canvas:c,artPx,margin,box,shapes};
 }
 function logoTexture(n,silverOnly=false){if(!logoCanvas||logoCanvas.width!==n)logoCanvas=make(n);const {box}=spec(),c=logoCanvas,g=c.getContext('2d'),artPx=(box.r-box.l)*n/2,w=artPx*.72,h=w*324/1310,x=(1+(box.l+box.r)/2)*n/2-w/2,y=(1+(box.t+box.b)/2)*n/2-h/2;g.globalCompositeOperation='source-over';g.clearRect(0,0,n,n);
  g.drawImage(logo,x,y,w,h);g.globalCompositeOperation='source-in';
  if(foil==='black'&&!silverOnly){g.fillStyle='#111111';g.fillRect(0,0,n,n);g.globalCompositeOperation='source-over';return c;}
  const k=(yaw/180)*n*.32,j=(pitch/65)*n*.18,grad=g.createLinearGradient(k,j,n-k,n*.65-j);
  const colors=['#343e4c','#e7eef4','#ffffff','#647181','#d8e1eb','#ffffff','#4f5a69'];
  colors.forEach((color,i)=>grad.addColorStop(i/(colors.length-1),color));g.fillStyle=grad;g.fillRect(0,0,n,n);
  // Crisp light edge distinguishes the metallic lettering from the warm print.
  g.globalCompositeOperation='source-over';return c;
 }
 function foilFrame(){if(!logo.complete||!logo.naturalWidth)return;if(mark.width!==N)mark.width=mark.height=N;const g=mark.getContext('2d');g.clearRect(0,0,N,N);g.drawImage(logoTexture(N),0,0);}
 function lighting(){
  const rx=pitch*Math.PI/180,ry=yaw*Math.PI/180,nx=Math.sin(ry),ny=-Math.sin(rx)*Math.cos(ry),nz=Math.cos(rx)*Math.cos(ry);
  const key=Math.max(0,-.4*nx-.5*ny+.76*nz),fill=Math.max(0,.58*nx-.25*ny+.78*nz),ambient=.84+.115*key+.04*fill;
  // At least 84% ambient keeps the artwork readable away from the key light.
  front.style.filter=`brightness(${ambient}) drop-shadow(${3+nx*4}px ${10+Math.abs(ny)*9}px 15px #0003)`;
  back.style.filter=`brightness(${.87+.10*Math.abs(nz)}) drop-shadow(0 12px 16px #0003)`;
  if(!materialMask)return;
  const g=light.getContext('2d'),n=light.width;g.globalCompositeOperation='source-over';g.clearRect(0,0,n,n);g.drawImage(materialMask,0,0,n,n);g.globalCompositeOperation='source-in';
  const specular=Math.pow(Math.max(0,-.2*nx-.25*ny+.947*nz),20)*.205,fresnel=Math.pow(1-Math.abs(nz),2)*.06;
  const cx=(.48-nx*.55)*n,cy=(.25-ny*.55)*n,gradient=g.createRadialGradient(cx,cy,n*.03,cx,cy,n*.86);
  gradient.addColorStop(0,`rgba(255,253,245,${.025+specular+fresnel})`);gradient.addColorStop(.48,`rgba(255,255,255,${.012+specular*.24})`);gradient.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gradient;g.fillRect(0,0,n,n);g.globalCompositeOperation='source-over';
 }
 function orient(){card.style.transform=`rotateX(${pitch}deg) rotateY(${yaw}deg)`;$('#tiltX').value=pitch;$('#tiltY').value=yaw;$('#tiltXValue').textContent=Math.round(pitch)+'°';$('#tiltYValue').textContent=Math.round(yaw)+'°';foilFrame();lighting();}
 async function refresh(){const id=++refreshId;await logo.decode();if(id!==refreshId)return;
  const art=funkeLab.capture(N),result=texture(N,art);front.width=front.height=N;front.getContext('2d').drawImage(result.canvas,0,0);
  back.width=back.height=N;const bg=back.getContext('2d');silhouette(bg,result.shapes,N,result.margin);bg.fillStyle='#777';bg.textAlign='center';bg.font=`${N*.014}px Arial`;bg.fillText('FUNKE  COLLECTIVE EDITION',N/2,N*.53);bg.font=`${N*.010}px Arial`;bg.fillText('PEEL. PLACE. CONNECT.',N/2,N*.555);
  materialMask=make(768);silhouette(materialMask.getContext('2d'),result.shapes,768,result.margin*768/N);
  $('#stickerWidthValue').textContent=$('#stickerWidth').value+' mm';$('#stickerSize').textContent=`ART ${$('#stickerWidth').value} MM  WHITE OFFSET 5 MM`;
  orient();
 }
 for(const axis of ['X','Y'])$('#tilt'+axis).oninput=e=>{if(axis==='X')pitch=+e.target.value;else yaw=+e.target.value;orient();};
 $('#stickerWidth').oninput=()=>{refresh();};
 document.querySelectorAll('[data-foil]').forEach(b=>b.onclick=()=>{foil=b.dataset.foil;document.querySelectorAll('[data-foil]').forEach(x=>x.classList.toggle('selected',x===b));foilFrame();});
 $('#resetView').onclick=()=>{pitch=0;yaw=0;orient();};
 const scene=$('#stickerScene');scene.onpointerdown=e=>{if(e.target.closest('button'))return;drag={x:e.clientX,y:e.clientY,pitch,yaw};scene.setPointerCapture(e.pointerId);};scene.onpointermove=e=>{if(!drag)return;yaw=Math.max(-180,Math.min(180,drag.yaw+(e.clientX-drag.x)*.5));pitch=Math.max(-65,Math.min(65,drag.pitch-(e.clientY-drag.y)*.4));orient();};scene.onpointerup=scene.onpointercancel=()=>drag=null;
 $('#requestPrint').onclick=()=>{const dlg=$('#printDialog');dlg.showModal();};$('#closePrint').onclick=()=>$('#printDialog').close();
 // PNG pHYs stores the intended physical scale, including the 5 mm offset.
 async function physicalPNG(blob,pixelsPerMm){const png=new Uint8Array(await blob.arrayBuffer()),chunk=new Uint8Array(21),v=new DataView(chunk.buffer);v.setUint32(0,9);chunk.set([112,72,89,115],4);v.setUint32(8,Math.round(pixelsPerMm*1000));v.setUint32(12,Math.round(pixelsPerMm*1000));chunk[16]=1;let crc=0xffffffff;for(let i=4;i<17;i++){crc^=chunk[i];for(let b=0;b<8;b++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}v.setUint32(17,(crc^0xffffffff)>>>0);return new Blob([png.slice(0,33),chunk,png.slice(33)],{type:'image/png'});}
 async function snapshot(n){await logo.decode();const art=funkeLab.capture(n),result=texture(n,art);result.canvas.getContext('2d').drawImage(logoTexture(n),0,0);return result;}
 window.funkeSticker={refresh,snapshot,async download(n){const result=await snapshot(n);let blob=await new Promise(resolve=>result.canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG encoding failed');blob=await physicalPNG(blob,result.artPx/(+$('#stickerWidth').value));funkeLab.download(blob,'funke-sticker-'+$('#stickerWidth').value+'mm-'+Date.now()+'.png');funkeLab.toast('Sticker PNG saved. Metallic finish is a visual simulation.');}};
})();
