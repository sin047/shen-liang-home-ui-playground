/* Glass Material Kit 0.4 — independent WebGL1 optical material.
   One shared background texture + canvas per scene; any rounded DOM widget
   with data-glass becomes a lens. Text/inputs remain native DOM.
   No code or assets from the visual reference repository are included. */
(function (global) {
  "use strict";
  const VERTEX_SHADER = "attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
  const FRAGMENT_SHADER = "precision highp float;\nvarying vec2 uv;\nuniform sampler2D bg;\nuniform vec2 res;\nuniform vec4 rect;\nuniform float radius;\nuniform float borderWidth;\nuniform float power;\nuniform float thick;\nuniform float shine;\nuniform float wobble;\nuniform float mode;\nuniform float compare;\nuniform vec2 bgScale;\nuniform vec2 bgOffset;\n\n// Shared signed-distance surface: the cover mask and optical field use\n// exactly the same rounded rectangle.\nfloat roundedDistance(vec2 p, vec2 halfExtent, float corner) {\n  vec2 q=abs(p)-(halfExtent-vec2(corner));\n  return length(max(q,0.0))+min(max(q.x,q.y),0.0)-corner;\n}\n\n// Ray intersects the straight sides or a corner arc.\n// Use non-reserved variable names for WebGL1 GLSL ES 1.00 compatibility.\nfloat roundedRayLength(vec2 rayDir, vec2 halfExtent, float corner) {\n  vec2 direction=abs(rayDir);\n  vec2 straightRegion=max(halfExtent-vec2(corner),vec2(0.0));\n  float sideDistance=min(halfExtent.x/max(direction.x,0.00001),\n                         halfExtent.y/max(direction.y,0.00001));\n  vec2 edgePoint=direction*sideDistance;\n  if(edgePoint.x<=straightRegion.x||edgePoint.y<=straightRegion.y){\n    return max(sideDistance,0.01);\n  }\n  float projected=dot(direction,straightRegion);\n  float disc=max(0.0,projected*projected-\n                dot(straightRegion,straightRegion)+corner*corner);\n  return max(projected+sqrt(disc),0.01);\n}\n\nvoid main(){\n  vec2 pixel=vec2(uv.x*res.x,(1.0-uv.y)*res.y);\n  vec2 halfExtent=rect.zw*0.5;\n  vec2 local=pixel-(rect.xy+halfExtent);\n  float sd=roundedDistance(local,halfExtent,radius);\n  float aa=1.0;\n  float alpha=1.0-smoothstep(-aa,aa,sd);\n  if(alpha<=0.0)discard;\n\n  // Only the background coordinate mapping changes in Kit 0.4.\n  vec2 sourceUV=vec2(\n    clamp(bgOffset.x+uv.x*bgScale.x,0.00015,0.99985),\n    fract(bgOffset.y+uv.y*bgScale.y));\n  if(compare>0.5){\n    gl_FragColor=vec4(texture2D(bg,sourceUV).rgb,alpha);\n    return;\n  }\n\n  vec2 rayDir=normalize(local+vec2(0.00001));\n  float boundary=roundedRayLength(rayDir,halfExtent,radius);\n  vec2 p=local/boundary;\n  float r=clamp(length(p),0.0,1.0);\n\n  // One smooth, zero-at-the-outline lens profile replaces the shoulder\n  // window. This avoids local swell and an abrupt sampled-image seam.\n  float dome=max(1.0-r*r,0.0);\n  float opticalProfile=dome*(0.93+0.10*dome);\n  // Scale the lens displacement with each element, not the whole scene.\n  // A small chip and a large card must not distort by the same pixel amount.\n  float lensBudget=min(82.0,min(rect.z,rect.w)*0.40);\n  vec2 displacement=p*opticalProfile*(lensBudget*power);\n\n  // Subpixel, stationary surface irregularity. No localized tangent\n  // ripple, no continuous animation, and no UV displacement at the rim.\n  float calmZone=dome*dome;\n  displacement+=vec2(sin(p.y*2.4+0.25),cos(p.x*2.2-0.4))*\n                (0.48*wobble)*calmZone;\n  vec2 rawWarp=bgOffset+\n     (uv+vec2(displacement.x/res.x,-displacement.y/res.y))*bgScale;\n  vec2 warpedUV=vec2(\n    clamp(rawWarp.x,0.00015,0.99985),\n    fract(rawWarp.y));\n    vec3 col=texture2D(bg,warpedUV).rgb;\n\n  float sampledLum=dot(col,vec3(0.2126,0.7152,0.0722));\n  float bright=smoothstep(0.34,0.86,sampledLum);\n  float edgePixels=max(-sd,0.0)/max(borderWidth,0.001);\n  float bevel=exp(-edgePixels/(4.0+3.8*thick));\n  float shoulderShade=exp(-edgePixels/(11.0+6.0*thick));\n  float hairline=exp(-edgePixels/0.82);\n\n  vec2 delta=vec2(1.25,0.0);\n  vec2 gradient=vec2(\n    roundedDistance(local+delta.xy,halfExtent,radius)-\n    roundedDistance(local-delta.xy,halfExtent,radius),\n    roundedDistance(local+delta.yx,halfExtent,radius)-\n    roundedDistance(local-delta.yx,halfExtent,radius)\n  );\n  vec2 edgeNormal=normalize(gradient+vec2(0.00001));\n\n  // Two soft directional edge reflections. The SDF silhouette is\n  // still the only visible perimeter: no uniform white border.\n  float key=pow(max(dot(edgeNormal,normalize(vec2(-0.63,-0.78))),0.0),4.8);\n  float secondary=pow(max(dot(edgeNormal,normalize(vec2(0.91,0.40))),0.0),7.0);\n  float arc=key*0.89+secondary*0.19;\n  float rimGlint=(bevel*0.21+hairline*0.050)*arc*shine;\n\n  // A separate curved, directional area reflection sits *inside* the\n  // lens, away from the outline; this supplies volume without extra warp.\n  vec3 surfaceNormal=normalize(vec3(-p*0.83,\n                                   0.52+0.48*dome));\n  float areaLobe=pow(max(dot(surfaceNormal,\n                    normalize(vec3(0.61,0.70,0.47))),0.0),15.0);\n  float lightRibbon=exp(-pow(\n     (dot(p,normalize(vec2(0.74,0.68)))+0.51)/0.19,2.0));\n  float reflectionEnvelope=smoothstep(0.25,0.59,r)*\n                           (1.0-smoothstep(0.89,0.99,r));\n  float curvedLight=(areaLobe*0.16+lightRibbon*0.068)*\n                    reflectionEnvelope*shine;\n  float lightRoom=mix(1.0,0.41,bright);\n  col=mix(col,vec3(0.98,0.99,1.0),\n          clamp((rimGlint+curvedLight)*lightRoom,0.0,0.22));\n\n  // The opposite inner edge absorbs a little ambient light. This adds\n  // optical thickness without a full-surface tint or a gray outer shell.\n  float shadeSide=max(dot(edgeNormal,normalize(vec2(0.38,0.93))),0.0);\n  float shading=(bevel*0.082+shoulderShade*0.020)*shadeSide*thick*\n                 mix(0.89,0.40,bright);\n  col*=1.0-shading;\n  vec3 borderTone=mix(vec3(0.93,0.96,0.97),\n                      vec3(0.29,0.36,0.40),bright);\n  col=mix(col,borderTone,hairline*mix(0.12,0.052,bright));\n\n    if(mode>0.5){\n    // SMOKED is a separate, neutral absorption recipe.\n    float absorb=0.18+0.10*bevel;\n    col=mix(col,col*vec3(0.64,0.68,0.73),absorb);\n  }\n\n  gl_FragColor=vec4(clamp(col,0.0,1.0),alpha);\n}";

  const defaults = Object.freeze({
    refraction: 0.66, thickness: 0.60, shine: 0.60,
    wobble: 0.12, material: "clear", compare: false,
    dprCap: 3.5, pixelBudget: 5000000,
    texturePixelBudget: 5000000
  });
  // Multipliers preserve global live controls. A per-element data-glass-*
  // numeric override always takes precedence over the global/profile value.
  const profilePresets = Object.freeze({
    neutral: Object.freeze({refraction:1,thickness:1,shine:1,wobble:1}),
    compact: Object.freeze({refraction:.66,thickness:.84,shine:1.19,wobble:.48}),
    control: Object.freeze({refraction:.84,thickness:1.00,shine:1.12,wobble:.72}),
    panel:   Object.freeze({refraction:.92,thickness:1.06,shine:1.08,wobble:.86})
  });
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const activeScenes = new WeakMap();
  const own = (obj,key) => Object.prototype.hasOwnProperty.call(obj,key);

  function initialBackground() {
    const c=document.createElement("canvas");
    c.width=1200;c.height=800;
    const ctx=c.getContext("2d");
    const grad=ctx.createLinearGradient(0,0,1150,800);
    grad.addColorStop(0,"#bbcbd2");grad.addColorStop(.43,"#f0e8e2");grad.addColorStop(1,"#a6bbc0");
    ctx.fillStyle=grad;ctx.fillRect(0,0,c.width,c.height);
    for(let i=0;i<9;i++){
      ctx.strokeStyle=i%2?"#8f9fa560":"#596f8060";
      ctx.lineWidth=9+i%3;
      ctx.beginPath();ctx.moveTo(-80+i*150,0);
      ctx.bezierCurveTo(160+i*100,160,350+i*75,590,550+i*90,800);
      ctx.stroke();
    }
    for(let i=0;i<45;i++){
      const x=(i*163)%1200,y=(i*211)%800;
      ctx.beginPath();ctx.fillStyle=i%3?"#f6cad07a":"#f9f4e4af";
      ctx.ellipse(x,y,13+(i%5)*3,22+(i%4)*2,i*.3,0,Math.PI*2);ctx.fill();
    }
    return c;
  }

  function createMaterialScene(config) {
    if(!config || !config.scene || config.scene.nodeType!==1){
      throw new Error("GlassKit.mount({scene}) requires an Element");
    }
    const scene=config.scene;
    if(activeScenes.has(scene))throw new Error("GlassKit scene is already mounted");
    const settings={...defaults,...(config.settings||{})};
    scene.classList.add("glass-kit-scene");
    let backdrop=config.backgroundElement||scene.querySelector(".glass-kit-background");
    let insertedBackground=false;
    if(!backdrop){
      backdrop=document.createElement("div");
      backdrop.className="glass-kit-background";
      backdrop.setAttribute("aria-hidden","true");
      scene.insertBefore(backdrop,scene.firstChild);
      insertedBackground=true;
    }
    const canvas=document.createElement("canvas");
    canvas.className="glass-kit-canvas";
    canvas.setAttribute("aria-hidden","true");
    backdrop.insertAdjacentElement("afterend",canvas);
    const status=config.onStatus||function(){};
    let gl=null, program=null, vertexBuffer=null, texture=null;
    let source=null,activeUrl=null,requestId=0;
    let textureWidth=0,textureHeight=0,textureReady=false,ready=false;
    let raf=0,disposed=false,aaMode="fallback AA";
    let scaleX=1,scaleY=1,canvasW=0,canvasH=0;
    let observer=null,mutationObserver=null,sceneObserver=null;
    let suspended=false,sceneVisible=true;
    const metrics={frames:0,lastDrawn:0,lastCulled:0,lastTargets:0,
      canvasPixels:0,texturePixels:0};
    const attached=new Set();
    const handles={};

    function report(state,details){
      scene.dataset.glassState=state;
      status({state,details:details||"",aaMode});
    }
    function fallback(error){
      ready=false;
      scene.classList.add("glass-kit-fallback");
      canvas.style.display="none";
      report("fallback",error&&error.message?error.message:String(error||"WebGL unavailable"));
    }
    function compile(type,text){
      const s=gl.createShader(type);
      if(!s)throw new Error("Cannot allocate shader");
      gl.shaderSource(s,text);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
        const error=gl.getShaderInfoLog(s)||"GLSL compilation failed";
        gl.deleteShader(s);throw new Error(error);
      }
      return s;
    }
    function setup(){
      try{
        gl=canvas.getContext("webgl",{alpha:true,antialias:true,premultipliedAlpha:false});
        if(!gl)throw new Error("WebGL1 context unavailable");
        const supportsDerivatives=!!gl.getExtension("OES_standard_derivatives");
        aaMode=supportsDerivatives?"fwidth AA":"fallback AA";
        const fragment=supportsDerivatives
          ? "#extension GL_OES_standard_derivatives : enable\n"+
            FRAGMENT_SHADER.replace("float aa=1.0;","float aa=max(fwidth(sd),0.75);")
          : FRAGMENT_SHADER;
        const v=compile(gl.VERTEX_SHADER,VERTEX_SHADER);
        const f=compile(gl.FRAGMENT_SHADER,fragment);
        const prog=gl.createProgram();
        if(!prog)throw new Error("Cannot allocate WebGL program");
        gl.attachShader(prog,v);gl.attachShader(prog,f);gl.linkProgram(prog);
        gl.deleteShader(v);gl.deleteShader(f);
        if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){
          throw new Error(gl.getProgramInfoLog(prog)||"GLSL link failed");
        }
        program=prog;
        handles.position=gl.getAttribLocation(program,"p");
        for(const name of ["bg","res","rect","radius","borderWidth","power","thick","shine","wobble","mode","compare","bgScale","bgOffset"]){
          handles[name]=gl.getUniformLocation(program,name);
        }
        vertexBuffer=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
        texture=gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        textureReady=false;ready=true;
        canvas.style.display="block";
        scene.classList.remove("glass-kit-fallback");
        report("gpu","GPU · "+aaMode);
      }catch(error){fallback(error);}
    }
    function textureUpload(){
      if(!ready || !source || !texture)return;
      const sw=source.naturalWidth||source.width,sh=source.naturalHeight||source.height;
      if(!sw||!sh)throw new Error("Background image has no dimensions");
      const maxTextureSize=gl.getParameter(gl.MAX_TEXTURE_SIZE)||4096;
      const ratio=Math.min(1,maxTextureSize/sw,maxTextureSize/sh,
        Math.sqrt(settings.texturePixelBudget/(sw*sh)));
      const tw=Math.max(1,Math.floor(sw*ratio)),th=Math.max(1,Math.floor(sh*ratio));
      let staging=null,toUpload=source;
      textureReady=false;
      try{
        if(sw!==tw||sh!==th){
          staging=document.createElement("canvas");
          staging.width=tw;staging.height=th;
          const ctx=staging.getContext("2d");
          if(!ctx)throw new Error("Cannot create image staging canvas");
          ctx.drawImage(source,0,0,tw,th);
          toUpload=staging;
        }
        gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,toUpload);
        const code=gl.getError();
        if(code!==gl.NO_ERROR)throw new Error("WebGL texture upload failed: "+code);
        textureWidth=tw;textureHeight=th;textureReady=true;
        metrics.texturePixels=tw*th;
      }finally{
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,0);
        if(staging){staging.width=0;staging.height=0;}
      }
    }
    function setSource(image,cssUrl,retainFileRequest=false){
      if(disposed)throw new Error("GlassKit instance already destroyed");
      // Validate and normalize before replacing the active source or URL.
      const resolvedUrl=typeof cssUrl==="string"?cssUrl:
        typeof image.toDataURL==="function"?image.toDataURL("image/jpeg",.86):
        (image.currentSrc||image.src||"");
      if(!resolvedUrl)throw new Error("Provide a background CSS URL with this image source");
      if(!retainFileRequest)requestId++;
      const obsolete=activeUrl&&resolvedUrl!==activeUrl?activeUrl:null;
      source=image;
      backdrop.style.backgroundImage="url("+JSON.stringify(resolvedUrl)+")";
      if(obsolete){URL.revokeObjectURL(obsolete);activeUrl=null;}
      try{
        if(ready)textureUpload();
        schedule();
      }catch(error){fallback(error);}
    }
    function setBackgroundFile(file){
      if(disposed)return Promise.reject(new Error("GlassKit instance already destroyed"));
      if(!file)return Promise.reject(new Error("No image supplied"));
      const sequence=++requestId;
      const url=URL.createObjectURL(file),image=new Image();
      return new Promise((resolve,reject)=>{
        image.onload=()=>{
          if(disposed||sequence!==requestId){URL.revokeObjectURL(url);resolve(false);return;}
          const previous=activeUrl;activeUrl=url;
          setSource(image,url,true);
          if(previous)URL.revokeObjectURL(previous);
          resolve(true);
        };
        image.onerror=()=>{
          URL.revokeObjectURL(url);
          if(sequence===requestId&&!disposed)reject(new Error("Image decode failed"));
          else resolve(false);
        };
        image.src=url;
      });
    }
    function targets(){return [...scene.querySelectorAll("[data-glass]")];}
    function watchTargets(){
      if(!observer)return;
      const all=targets();
      for(const el of attached)if(!all.includes(el)){observer.unobserve(el);attached.delete(el);}
      for(const el of all)if(!attached.has(el)){observer.observe(el);attached.add(el);}
    }
    function radiusPixels(el,box){
      const custom=el.dataset.glassRadius;
      const raw=custom!==undefined?custom:getComputedStyle(el).borderTopLeftRadius;
      const s=String(raw);
      const num=parseFloat(s);
      if(!Number.isFinite(num))return Math.min(box.width,box.height)*.25;
      return clamp(s.includes("%")?num/100*Math.min(box.width,box.height):num,
        0,Math.min(box.width,box.height)*.5);
    }
    function profileFor(el,box){
      const requested=el.dataset.glassProfile;
      const mode=requested&&own(profilePresets,requested)?requested:
        box.height<=68?"compact":box.height<=140?"control":"panel";
      return profilePresets[mode];
    }
    function numeric(el,key,globalName,profile){
      const raw=el.dataset[key];
      // Explicit per-element numeric overrides are absolute (0..1).
      // Without an override, global controls still work under each profile.
      const base=Number(settings[globalName]);
      const validBase=Number.isFinite(base)?base:defaults[globalName];
      const scaled=validBase*profile[globalName];
      const provided=raw!==undefined&&raw!==""?Number(raw):NaN;
      return clamp(Number.isFinite(provided)?provided:scaled,0,1);
    }
    function draw(){
      raf=0;
      if(disposed||!ready||!textureReady||document.hidden||suspended||!sceneVisible)return;
      const root=scene.getBoundingClientRect();
      if(root.width<=0||root.height<=0)return;
      try{
        // Bound both total pixels and the device's largest renderbuffer.
        // Long scenes trade resolution for bounded GPU memory, not crashes.
        const maxRenderbuffer=Number(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE))||4096;
        const budget=Math.max(1,Number(settings.pixelBudget)||defaults.pixelBudget);
        const scale=Math.min(
          Math.max(0.1,Number(settings.dprCap)||defaults.dprCap),
          (devicePixelRatio||1)*(global.visualViewport?.scale||1),
          Math.sqrt(budget/Math.max(1,root.width*root.height)),
          maxRenderbuffer/root.width,maxRenderbuffer/root.height
        );
        const nextW=Math.max(1,Math.floor(root.width*scale));
        const nextH=Math.max(1,Math.floor(root.height*scale));
        if(nextW!==canvasW||nextH!==canvasH){
          canvasW=nextW;canvasH=nextH;canvas.width=canvasW;canvas.height=canvasH;
        }
        metrics.canvasPixels=canvasW*canvasH;
        scaleX=canvasW/root.width;scaleY=canvasH/root.height;
        gl.viewport(0,0,canvasW,canvasH);
        gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);
        gl.enableVertexAttribArray(handles.position);
        gl.vertexAttribPointer(handles.position,2,gl.FLOAT,false,0,0);
        gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.uniform1i(handles.bg,0);
        gl.uniform2f(handles.res,canvasW,canvasH);
        const sourceAspect=textureWidth/textureHeight,rootAspect=root.width/root.height;
        let sx=1,sy=1,ox=0,oy=0;
        if(sourceAspect>rootAspect){sx=rootAspect/sourceAspect;ox=(1-sx)*.5;}
        else{sy=sourceAspect/rootAspect;oy=(1-sy)*.5;}
        gl.uniform2f(handles.bgScale,sx,sy);
        gl.uniform2f(handles.bgOffset,ox,oy);
        gl.uniform1f(handles.borderWidth,Math.min(scaleX,scaleY));
        gl.enable(gl.SCISSOR_TEST);
        const all=targets();
        let visibleDraws=0,culled=0;
        // The canvas is bounded to the scene, but a long scene can have
        // hundreds of widgets. Draw only those intersecting the viewport.
        const vw=Number(global.innerWidth),vh=Number(global.innerHeight);
        const hasViewport=Number.isFinite(vw)&&vw>0&&Number.isFinite(vh)&&vh>0;
        for(const el of all){
          const b=el.getBoundingClientRect();
          if(b.width<=0||b.height<=0||
             b.right<=root.left||b.left>=root.right||
             b.bottom<=root.top||b.top>=root.bottom||
             (hasViewport&&(b.right<=0||b.left>=vw||b.bottom<=0||b.top>=vh))){
            culled++;continue;
          }
          const left=(b.left-root.left)*scaleX,top=(b.top-root.top)*scaleY;
          const width=b.width*scaleX,height=b.height*scaleY;
          const x0=clamp(Math.floor(left)-2,0,canvasW);
          const y0=clamp(Math.floor(canvasH-top-height)-2,0,canvasH);
          const x1=clamp(Math.ceil(left+width)+2,0,canvasW);
          const y1=clamp(Math.ceil(canvasH-top)+2,0,canvasH);
          if(x1<=x0||y1<=y0){culled++;continue;}
          gl.uniform4f(handles.rect,left,top,width,height);
          gl.uniform1f(handles.radius,clamp(radiusPixels(el,b)*Math.min(scaleX,scaleY),0,Math.min(width,height)*.5));
          const profile=profileFor(el,b);
          gl.uniform1f(handles.power,numeric(el,"glassRefraction","refraction",profile));
          gl.uniform1f(handles.thick,numeric(el,"glassThickness","thickness",profile)*1.5);
          gl.uniform1f(handles.shine,numeric(el,"glassShine","shine",profile));
          gl.uniform1f(handles.wobble,numeric(el,"glassWobble","wobble",profile));
          const mat=el.dataset.glassMaterial||settings.material;
          gl.uniform1f(handles.mode,mat==="smoked"?1:0);
          gl.uniform1f(handles.compare,settings.compare?1:0);
          gl.scissor(x0,y0,x1-x0,y1-y0);
          gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
          visibleDraws++;
        }
        gl.disable(gl.SCISSOR_TEST);
        metrics.frames++;
        metrics.lastDrawn=visibleDraws;
        metrics.lastCulled=culled;
        metrics.lastTargets=all.length;
      }catch(error){
        try{gl.disable(gl.SCISSOR_TEST);}catch(_){}
        fallback(error);
      }
    }
    function schedule(){
      if(disposed||raf||document.hidden||suspended||!sceneVisible)return;
      raf=requestAnimationFrame(draw);
    }
    function pause(){
      if(raf){cancelAnimationFrame(raf);raf=0;}
    }
    function update(changes){
      if(disposed)return;
      for(const name of ["refraction","thickness","shine","wobble"]){
        if(own(changes,name)&&Number.isFinite(Number(changes[name]))){
          settings[name]=clamp(Number(changes[name]),0,1);
        }
      }
      if(own(changes,"material"))settings.material=changes.material==="smoked"?"smoked":"clear";
      if(own(changes,"compare"))settings.compare=!!changes.compare;
      schedule();
    }
    function onVisibility(){
      if(document.hidden)pause();
      else schedule();
    }
    function onPageHide(){suspended=true;pause();}
    function onPageShow(){suspended=false;schedule();}
    function onContextLost(event){
      event.preventDefault();
      ready=false;textureReady=false;
      program=texture=vertexBuffer=null;
      pause();
      fallback(new Error("WebGL context lost"));
    }
    function onContextRestored(){
      program=texture=vertexBuffer=null;
      setup();
      if(ready){try{textureUpload();schedule();}catch(error){fallback(error);}}
    }
    function destroy(){
      if(disposed)return;
      disposed=true;requestId++;
      pause();
      global.removeEventListener("pagehide",onPageHide);
      global.removeEventListener("pageshow",onPageShow);
      global.removeEventListener("resize",schedule);
      global.removeEventListener("scroll",schedule,true);
      global.visualViewport?.removeEventListener("resize",schedule);
      global.visualViewport?.removeEventListener("scroll",schedule);
      document.removeEventListener("visibilitychange",onVisibility);
      canvas.removeEventListener("webglcontextlost",onContextLost);
      canvas.removeEventListener("webglcontextrestored",onContextRestored);
      observer?.disconnect();mutationObserver?.disconnect();sceneObserver?.disconnect();
      attached.clear();
      if(gl&&!gl.isContextLost()){
        if(texture)gl.deleteTexture(texture);
        if(vertexBuffer)gl.deleteBuffer(vertexBuffer);
        if(program)gl.deleteProgram(program);
      }
      if(activeUrl){URL.revokeObjectURL(activeUrl);activeUrl=null;}
      canvas.remove();
      if(insertedBackground)backdrop.remove();
      scene.classList.remove("glass-kit-scene","glass-kit-fallback");
      delete scene.dataset.glassState;
      activeScenes.delete(scene);
    }

    canvas.addEventListener("webglcontextlost",onContextLost);
    canvas.addEventListener("webglcontextrestored",onContextRestored);
    global.addEventListener("pagehide",onPageHide);
    global.addEventListener("pageshow",onPageShow);
    global.addEventListener("resize",schedule,{passive:true});
    global.addEventListener("scroll",schedule,{passive:true,capture:true});
    global.visualViewport?.addEventListener("resize",schedule,{passive:true});
    global.visualViewport?.addEventListener("scroll",schedule,{passive:true});
    document.addEventListener("visibilitychange",onVisibility);
    if("ResizeObserver" in global){
      observer=new global.ResizeObserver(schedule);
      observer.observe(scene);watchTargets();
    }
    if("MutationObserver" in global){
      mutationObserver=new global.MutationObserver(()=>{watchTargets();schedule();});
      mutationObserver.observe(scene,{childList:true,subtree:true,
        attributes:true,attributeFilter:["data-glass","data-glass-profile",
          "data-glass-radius","data-glass-refraction","data-glass-thickness",
          "data-glass-shine","data-glass-wobble","data-glass-material",
          "class","style"]});
    }
    if("IntersectionObserver" in global){
      sceneObserver=new global.IntersectionObserver(entries=>{
        const entry=entries[0];
        if(!entry)return;
        sceneVisible=entry.isIntersecting;
        if(sceneVisible)schedule();
        else pause();
      },{root:null,threshold:0});
      sceneObserver.observe(scene);
    }
    setup();
    if(config.source){setSource(config.source,config.backgroundCssURL);}
    else{
      const initial=initialBackground();
      setSource(initial,initial.toDataURL("image/jpeg",.87));
    }
    const api={setSource,setBackgroundFile,update,refresh:schedule,destroy,
      getState:()=>({state:ready?"gpu":"fallback",aaMode,settings:{...settings}}),
      getDiagnostics:()=>Object.freeze({...metrics,
        estimatedGpuRGBABytes:4*(metrics.canvasPixels+metrics.texturePixels),
        suspended:suspended||document.hidden||!sceneVisible})};
    activeScenes.set(scene,api);
    return api;
  }
  global.GlassMaterialKit={version:"0.4.0",profiles:profilePresets,mount:createMaterialScene};
})(window);
