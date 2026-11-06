"use strict";
// Structural runtime smoke tests only: uses a fake WebGL1 implementation.
// It validates DOM/API wiring, per-component uniforms, background races
// and lifecycle. It is NOT a real GPU/GLSL compilation test.
const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const source=fs.readFileSync("docs/glass-material-kit-v02.js","utf8");
const demo=fs.readFileSync("docs/glass-kit-v02.html","utf8");
new vm.Script(source);
assert.match(demo,/glass-material-kit-v02\.js/);
assert.match(demo,/id="profileMode"/);

const drawn=[],states=[],urls=[],revoked=[],images=[],listeners={};
let currentUniforms={},shaderInputs=[];
const gl={
  VERTEX_SHADER:35633,FRAGMENT_SHADER:35632,COMPILE_STATUS:35713,
  LINK_STATUS:35714,ARRAY_BUFFER:34962,STATIC_DRAW:35044,
  TEXTURE0:33984,TEXTURE_2D:3553,TEXTURE_MIN_FILTER:10241,
  TEXTURE_MAG_FILTER:10240,LINEAR:9729,TEXTURE_WRAP_S:10242,
  TEXTURE_WRAP_T:10243,CLAMP_TO_EDGE:33071,RGBA:6408,
  UNSIGNED_BYTE:5121,UNPACK_FLIP_Y_WEBGL:37440,
  MAX_TEXTURE_SIZE:3379,NO_ERROR:0,COLOR_BUFFER_BIT:16384,
  DEPTH_TEST:2929,BLEND:3042,SCISSOR_TEST:3089,FLOAT:5126,
  TRIANGLE_STRIP:5
};
for(const name of [
  "attachShader","linkProgram","deleteShader","bindBuffer","bufferData",
  "activeTexture","bindTexture","texParameteri","pixelStorei","texImage2D",
  "viewport","clearColor","clear","disable","useProgram","enableVertexAttribArray",
  "vertexAttribPointer","enable","scissor","deleteTexture","deleteBuffer","deleteProgram"
])gl[name]=()=>{};
gl.getExtension=()=>({});
gl.createShader=()=>({});
gl.shaderSource=(_shader,text)=>{shaderInputs.push(text);};
gl.compileShader=()=>{};
gl.getShaderParameter=()=>true;
gl.getShaderInfoLog=()=>null;
gl.createProgram=()=>({});
gl.getProgramParameter=()=>true;
gl.getProgramInfoLog=()=>null;
gl.createBuffer=()=>({});
gl.createTexture=()=>({});
gl.getAttribLocation=()=>0;
gl.getUniformLocation=(_program,name)=>name;
gl.uniform1f=(name,value)=>{currentUniforms[name]=value;};
gl.uniform1i=(name,value)=>{currentUniforms[name]=value;};
gl.uniform2f=(name,x,y)=>{currentUniforms[name]=[x,y];};
gl.uniform4f=(name,...values)=>{currentUniforms[name]=values;};
gl.drawArrays=()=>{drawn.push({...currentUniforms});};
gl.getParameter=()=>4096;
gl.getError=()=>0;
gl.isContextLost=()=>false;
const classSet=()=>{const v=new Set();return{add:x=>v.add(x),remove:(...xs)=>xs.forEach(x=>v.delete(x)),contains:x=>v.has(x)};};
const createCanvas=()=>({
  style:{},className:"",width:0,height:0,attributes:{},
  handlers:{},
  setAttribute(k,v){this.attributes[k]=v;},
  addEventListener(k,fn){this.handlers[k]=fn;},
  removeEventListener(k){delete this.handlers[k];},
  getContext(type){assert.equal(type,"webgl");return gl;},
  remove(){this.removed=true;}
});
const elements=[
  {dataset:{glassRadius:"24"},width:100,height:44,top:40,left:25},
  {dataset:{glassRadius:"24"},width:220,height:100,top:130,left:25},
  {dataset:{glassRadius:"28"},width:335,height:190,top:260,left:25}
].map(x=>({...x,
  getBoundingClientRect(){return{left:x.left,top:x.top,width:x.width,height:x.height,
    right:x.left+x.width,bottom:x.top+x.height};}
}));
const canvasBag=[],background={
  style:{},
  insertAdjacentElement(_where,canvas){canvasBag.push(canvas);}
};
const scene={
  nodeType:1,classList:classSet(),dataset:{},
  querySelector(selector){return selector===".glass-kit-background"?background:null;},
  querySelectorAll(selector){assert.equal(selector,"[data-glass]");return elements;},
  getBoundingClientRect(){return{left:0,top:0,width:400,height:800};}
};
const doc={
  hidden:false,handlers:{},
  createElement(type){if(type==="canvas")return createCanvas();throw Error("Unexpected "+type);},
  addEventListener(key,fn){this.handlers[key]=fn;},
  removeEventListener(key){delete this.handlers[key];}
};
let nextFrame=0;const frames=new Map();
function flush(){
  let count=0;
  while(frames.size){
    if(++count>12)throw Error("Unbounded render scheduling");
    const calls=[...frames.values()];frames.clear();
    for(const fn of calls)fn();
  }
}
class FakeImage{
  constructor(){this.naturalWidth=1000;this.naturalHeight=800;images.push(this);}
  set src(v){this._src=v;}
  get src(){return this._src;}
}
const browser={
  addEventListener(k,fn){listeners[k]=fn;},
  removeEventListener(k){delete listeners[k];}
};
const urlApi={
  createObjectURL(){const u="blob:local-"+(urls.length+1);urls.push(u);return u;},
  revokeObjectURL(u){revoked.push(u);}
};
const context={
  window:browser,document:doc,devicePixelRatio:2,Image:FakeImage,URL:urlApi,
  getComputedStyle:()=>({borderTopLeftRadius:"24px"}),
  requestAnimationFrame(fn){const id=++nextFrame;frames.set(id,fn);return id;},
  cancelAnimationFrame(id){frames.delete(id);},
  console
};
vm.runInNewContext(source,context);
const kit=browser.GlassMaterialKit;
assert.equal(kit.version,"0.2.0");
assert.deepEqual(Object.keys(kit.profiles).sort(),["compact","control","neutral","panel"]);
const sourceImage={width:1000,height:800};
const api=kit.mount({
  scene,source:sourceImage,backgroundCssURL:"data:image/png;base64,OK",
  onStatus:x=>states.push(x)
});
flush();
assert.equal(api.getState().state,"gpu");
assert.equal(drawn.length,3);
assert.ok(shaderInputs.some(x=>x.includes("fwidth(sd)")));
const eps=0.000001;
const initial=drawn.slice();
assert.ok(Math.abs(initial[0].power-.66*.66)<eps);
assert.ok(Math.abs(initial[1].power-.66*.84)<eps);
assert.ok(Math.abs(initial[2].power-.66*.92)<eps);
assert.ok(initial[0].shine>initial[2].shine,"Compact surfaces need stronger highlights");
assert.throws(()=>kit.mount({scene}),/already mounted/);
drawn.length=0;
api.update({refraction:.8,thickness:.7});
flush();
assert.equal(drawn.length,3);
assert.ok(Math.abs(drawn[0].power-.8*.66)<eps);
assert.ok(Math.abs(drawn[2].power-.8*.92)<eps);
elements[0].dataset.glassRefraction="0.91";
elements[1].dataset.glassProfile="neutral";
drawn.length=0;api.refresh();flush();
assert.ok(Math.abs(drawn[0].power-.91)<eps,"Per-element override wins");
assert.ok(Math.abs(drawn[1].power-.8)<eps,"Neutral uses global strength");
assert.ok(Math.abs(drawn[2].power-.8*.92)<eps);
const canvas=canvasBag[0];
assert.equal(canvas.removed,undefined);

(async()=>{
  const pending=api.setBackgroundFile({name:"stale.jpg"});
  assert.equal(images.length,1);
  api.setSource({width:900,height:700},"data:image/png;base64,NEW");
  images[0].onload();
  assert.equal(await pending,false,"Manual background must invalidate pending file");
  assert.ok(revoked.includes("blob:local-1"));
  const accepted=api.setBackgroundFile({name:"accepted.jpg"});
  assert.equal(images.length,2);
  images[1].onload();
  assert.equal(await accepted,true);
  assert.ok(background.style.backgroundImage.includes("blob:local-2"));
  assert.ok(!revoked.includes("blob:local-2"),"Active background URL must stay alive");
  assert.rejects?null:null; // asynchronous negative cases tested below
  const previous=canvas.handlers.webglcontextlost;
  assert.equal(typeof previous,"function");
  let prevented=false;
  previous({preventDefault(){prevented=true;}});
  assert.equal(prevented,true);
  assert.equal(api.getState().state,"fallback");
  canvas.handlers.webglcontextrestored();
  flush();
  assert.equal(api.getState().state,"gpu");
  api.destroy();
  assert.equal(canvas.removed,true);
  assert.ok(revoked.includes("blob:local-2"),"Destroy must revoke current URL");
  assert.equal(scene.dataset.glassState,undefined);
  await assert.rejects(api.setBackgroundFile({name:"after-destroy"}),/already destroyed/);
  assert.doesNotThrow(()=>api.update({refraction:.2}));
  const again=kit.mount({scene,source:sourceImage,backgroundCssURL:"data:image/png;base64,OK"});
  flush();
  again.destroy();
  console.log("PASS: adaptive Glass Kit profiles, per-widget overrides, source race, GL restoration and cleanup");
})().catch(error=>{console.error(error);process.exitCode=1;});
