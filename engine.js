/* Pure geometry shared by the renderer and vector export. No external services. */
(function(root){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function shapes(s,phase=0){
  const out=[],n=clamp(Math.round(s.count),2,24),a=s.aspect/100;
  const overlap=clamp(s.overlap+(s.playing&&s.motion==='pulse'?Math.sin(phase)*s.amplitude:0),0,100)/100;
  const rot=(s.rotation+(s.playing&&s.motion==='rotate'?phase*18:0))*Math.PI/180;
  function add(x,y,rx,ry,ang,level){const scale=Math.pow(.48,level);out.push({x:(x*Math.cos(rot)-y*Math.sin(rot))*scale,y:(x*Math.sin(rot)+y*Math.cos(rot))*scale,rx:Math.max(.008,rx*scale),ry:Math.max(.008,ry*scale),angle:ang+rot});}
  for(let l=0;l<s.layers;l++){
   if(s.layout==='orbit'){
    const spread=.15+(1-overlap)*.8;
    for(let i=0;i<n;i++){const u=i/(n-1),r=.07+.93*Math.pow(u,.65+overlap*2.2);add(0,0,r*(.55+a*.45),1,0,l);if(i<n-1)add(0,0,r*(.55+a*.45),1,Math.PI/2,l);}
   }else if(s.layout==='meridian'){
    for(let i=0;i<n;i++){const u=(i/(n-1))*2-1;const stretch=1.15-overlap*.65;add(u*stretch,0,(.35+.72*Math.sin(Math.PI*Math.abs(u)))*a,Math.sqrt(1-u*u*.83),0,l);}
   }else{
    for(let i=0;i<n;i++){const t=i/n*Math.PI*2-Math.PI/2,d=(1-overlap)*.95;add(Math.cos(t)*d,Math.sin(t)*d,(s.layout==='cluster'?.65:.32)+a*.35,s.layout==='cluster'?.72:1,s.layout==='cluster'?t: t+Math.PI/2,l);}
   }
  }
  return out;
 }
 function fit(list,stable=false){let m=0;for(const q of list){const c=Math.cos(q.angle),s=Math.sin(q.angle);m=Math.max(m,stable?Math.hypot(q.x,q.y)+Math.max(q.rx,q.ry):Math.max(Math.abs(q.x)+Math.sqrt(q.rx*q.rx*c*c+q.ry*q.ry*s*s),Math.abs(q.y)+Math.sqrt(q.rx*q.rx*s*s+q.ry*q.ry*c*c)));}return list.map(q=>({...q,x:q.x/m*.79,y:q.y/m*.79,rx:q.rx/m*.79,ry:q.ry/m*.79}));}
 root.FunkeGeometry={shapes,fit,clamp};
})(typeof self!=='undefined'?self:globalThis);
