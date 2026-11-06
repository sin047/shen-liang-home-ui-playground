"use strict";
// Lightweight source-level guard for embedded GLSL ES 1.00 shaders.
// This is NOT a GPU compiler; it catches undeclared identifier regressions
// (such as fwidth(d) in 4.1 and innerRim in 4.2) before phone testing.
const fs = require("node:fs");

const pages = [
  "docs/glass-system-41.html",
  "docs/glass-system-42.html",
  "docs/glass-system-421.html",
  "docs/glass-system-422.html"
];

const known = new Set((
  "precision highp mediump lowp uniform varying attribute void float int bool " +
  "vec2 vec3 vec4 mat2 mat3 mat4 sampler2D if else for while return discard " +
  "const gl_FragColor true false sin cos tan asin acos atan pow exp exp2 log " +
  "log2 sqrt inversesqrt abs sign floor ceil fract mod min max clamp mix " +
  "step smoothstep length distance dot cross normalize faceforward reflect " +
  "refract texture2D fwidth dFdx dFdy main"
).split(/\s+/));

function getShader(html, filename) {
  const match = html.match(/const fs=("(?:\\.|[^"\\])*");function shader/);
  if (!match) throw Error(filename + ": cannot locate embedded fragment shader");
  return JSON.parse(match[1]);
}

function checkIdentifiers(glsl, filename, variant) {
  const code = glsl
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/#[^\n]*/g, "")
    .replace(/\.\s*[A-Za-z_]\w*/g, ""); // Swizzles, not identifiers.
  const declared = new Set();
  const declaration = /\b(?:float|int|bool|vec2|vec3|vec4|sampler2D|void)\s+([A-Za-z_]\w*)\b/g;
  for (const match of code.matchAll(declaration)) declared.add(match[1]);

  const tokens = new Set([...code.matchAll(/[A-Za-z_]\w*/g)].map(m => m[0]));
  const unknown = [...tokens].filter(x => !declared.has(x) && !known.has(x));
  if (unknown.length) {
    throw Error(filename + " (" + variant + "): undeclared GLSL tokens: " + unknown.join(", "));
  }
  if (declared.has("flat")) {
    throw Error(filename + " (" + variant + "): GLSL reserved identifier flat");
  }
}

for (const filename of pages) {
  const html = fs.readFileSync(filename, "utf8");
  const shader = getShader(html, filename);
  checkIdentifiers(shader, filename, "base");
  const injection = html.match(/'float aa=1\.0;'\s*,\s*'([^']+)'/);
  if (!injection) throw Error(filename + ": derivative-AA injection not found");
  if (!injection[1].includes("fwidth(")) {
    throw Error(filename + ": derivative-AA path missing fwidth");
  }
  if (!shader.includes("float aa=1.0;")) {
    throw Error(filename + ": AA injection anchor not present in fragment shader");
  }
  checkIdentifiers(shader.replace("float aa=1.0;", injection[1]),
    filename, "OES_standard_derivatives");
}
// The reusable kit keeps its fragment shader in an external JavaScript asset.
for(const kitFile of ["docs/glass-material-kit.js","docs/glass-material-kit-v02.js",
  "docs/glass-material-kit-v03.js"]){
  const kit = fs.readFileSync(kitFile, "utf8");
  const source = kit.match(/const FRAGMENT_SHADER = ("(?:\\.|[^"\\])*");/);
  if (!source) throw Error(kitFile + ": external fragment shader not found");
  const externalFragment = JSON.parse(source[1]);
  checkIdentifiers(externalFragment, kitFile, "base");
  const replacement = kit.match(/FRAGMENT_SHADER\.replace\("float aa=1\.0;","([^"]+)"\)/);
  if (!replacement) throw Error(kitFile + ": derivative substitution not found");
  checkIdentifiers(externalFragment.replace("float aa=1.0;", replacement[1]),
    kitFile, "OES_standard_derivatives");
}

console.log("PASS: inline and Kit 0.1/0.2/0.3 GLSL declarations");
