/* Analytic, device-resolution boolean surfaces. No per-frame component relabelling. */
class FunkeSurface {
 constructor(canvas){
  this.canvas=canvas;const gl=this.gl=canvas.getContext('webgl2',{alpha:true,antialias:true,preserveDrawingBuffer:true,premultipliedAlpha:false});
  if(!gl)throw new Error('WebGL 2 unavailable');
  const vs=`#version 300 es
  in vec2 position;void main(){gl_Position=vec4(position,0,1);}`;
  const fs=`#version 300 es
  precision highp float;
  uniform vec2 resolution;uniform int number;uniform vec4 shape[192];uniform float angle[192];
  uniform int operation;uniform int fillMode;uniform vec3 core,heat,edge;uniform float gradient,softness,gap;
  out vec4 outputColor;
  void main(){
   vec2 p=(gl_FragCoord.xy/resolution*2.-1.)*vec2(1.,-1.);
   float nearest=10., united=10., intersected=-10., first=10., other=10., radial=1.;int count=0;
   for(int i=0;i<192;i++){if(i>=number)break;vec4 q=shape[i];float c=cos(angle[i]),s=sin(angle[i]);vec2 d=p-q.xy;vec2 v=vec2(d.x*c+d.y*s,-d.x*s+d.y*c);
    float k0=length(v/q.zw),k1=length(v/(q.zw*q.zw));
    float sd=k0<.00001?-min(q.z,q.w):k0*(k0-1.)/max(k1,.00001);
    nearest=min(nearest,abs(sd));united=min(united,sd);intersected=max(intersected,sd);
    if(i==0)first=sd;else other=min(other,sd);
    if(sd<=0.){count++;radial=k0;}
   }
   float field=united;
   if(operation==2)field=(count%2==1?-nearest:nearest)+gap;
   if(operation==3)field=intersected;
   if(operation==4)field=max(first,-other);
   float aa=max(fwidth(field),2./resolution.x);
   float alpha=1.-smoothstep(-aa*.6,aa*.6,field);
   float width=(.018+gradient*.22)*1.4/pow(float(number),.55);
   float t=operation==0?radial:exp(-max(0.,-field)/width);
   if(fillMode==1)t=gl_FragCoord.y/resolution.y;
   float coreStop=min(.85,.5+gradient);
   vec3 col=mix(core,heat,smoothstep(0.,coreStop,t));
   col=mix(col,edge,smoothstep(1.-softness,1.,t));
   if(fillMode==2)col=heat;
   outputColor=vec4(col,alpha);
  }`;
  const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  const program=this.program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);this.uniforms={};
 }
 draw(state,phase=0,size=1200){
  const gl=this.gl;if(gl.isContextLost())return;
  if(this.canvas.width!==size){this.canvas.width=this.canvas.height=size;}
  gl.viewport(0,0,size,size);gl.useProgram(this.program);
  const u=n=>this.uniforms[n]??(this.uniforms[n]=gl.getUniformLocation(this.program,n));
  const shapes=FunkeGeometry.fit(FunkeGeometry.shapes(state,phase),true),qs=new Float32Array(192*4),angles=new Float32Array(192);
  shapes.forEach((q,i)=>{qs.set([q.x,q.y,q.rx,q.ry],i*4);angles[i]=q.angle;});
  gl.uniform4fv(u('shape[0]'),qs);gl.uniform1fv(u('angle[0]'),angles);gl.uniform1i(u('number'),shapes.length);gl.uniform2f(u('resolution'),size,size);
  gl.uniform1i(u('operation'),['layer','union','xor','intersect','subtract'].indexOf(state.mode));gl.uniform1i(u('fillMode'),['radial','linear','solid'].indexOf(state.fill));
  for(const k of ['core','heat','edge'])gl.uniform3fv(u(k),state[k].slice(1).match(/../g).map(n=>parseInt(n,16)/255));
  gl.uniform1f(u('gradient'),state.gradient/100);gl.uniform1f(u('softness'),Math.max(.001,state.softness/100));gl.uniform1f(u('gap'),state.gap/100*.16);gl.drawArrays(gl.TRIANGLES,0,6);
  return shapes.length;
 }
}
window.FunkeSurface=FunkeSurface;
