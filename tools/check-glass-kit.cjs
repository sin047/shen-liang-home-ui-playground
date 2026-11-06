"use strict";
const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const kitPath="docs/glass-material-kit.js";
const demoPath="docs/glass-kit.html";
const cssPath="docs/glass-material-kit.css";
const kitSource=fs.readFileSync(kitPath,"utf8");
const demo=fs.readFileSync(demoPath,"utf8");
const css=fs.readFileSync(cssPath,"utf8");
new vm.Script(kitSource,{filename:kitPath});
const window={};
vm.runInNewContext(kitSource,{window});
assert.equal(window.GlassMaterialKit.version,"0.1.0");
assert.equal(typeof window.GlassMaterialKit.mount,"function");
assert.throws(()=>window.GlassMaterialKit.mount(),/requires an Element/);
const required=[
  ["card","class=\"glass-card\""],
  ["navigation","class=\"glass-nav\""],
  ["button","class=\"glass-button\""],
  ["input","class=\"glass-input\""],
  ["status chip","class=\"glass-chip\""],
  ["chat bubble","class=\"chat-bubble\""],
  ["GPU state","id=\"engineStatus\""],
  ["photo upload","id=\"upload\""],
  ["original comparison","id=\"compare\""]
];
for(const [name,token] of required){
  assert.ok(demo.includes(token),"Demo missing "+name);
}
assert.ok(demo.includes("GlassMaterialKit.mount"),"Demo must mount reusable renderer");
assert.ok(demo.includes("setBackgroundFile(file)"),"Demo must support user photos");
assert.ok(demo.includes("kit.destroy()"),"Demo must release renderer on exit");
assert.ok(kitSource.includes("gl.scissor("),"Shared shader must clip to each widget");
assert.ok(kitSource.includes("dataset.glassRadius"),"Per-widget radius missing");
assert.ok(kitSource.includes("dataset.glassMaterial"),"Per-widget material missing");
assert.ok(kitSource.includes("const lensBudget")||kitSource.includes("float lensBudget"),
  "Small and large widgets require scaled displacement");
assert.ok(kitSource.includes("webglcontextrestored"),"Context restore missing");
assert.ok(kitSource.includes("texturePixelBudget"),"GPU memory cap missing");
assert.ok(kitSource.includes("getBoundingClientRect"),"DOM geometry mapping missing");
assert.ok(css.includes("glass-kit-fallback"),"CSS fallback missing");
assert.ok(css.includes("pointer-events:none"),"Canvas must not swallow interactions");
const scriptBlock=demo.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
assert.ok(scriptBlock,"Demo script missing");
new vm.Script(scriptBlock[1],{filename:demoPath});
console.log("PASS: Glass Material Kit export, demo coverage, syntax and component contracts");
