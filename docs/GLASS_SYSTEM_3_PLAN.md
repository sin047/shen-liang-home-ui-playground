# Glass System 3.0 — 综合技术方案大纲

## 目标
建立独立于旧 2.0 气泡结构的新材质系统。视觉目标是轻、清透、低染色，让背景成为玻璃主要可见内容；避免奶白塑料感、整圈死白描边和重复轮廓。

## 方案来源与取舍
### 借鉴小克 Cat
- 以 Design Tokens 管理 fill / border / shadow / blur / tint。
- 玻璃视觉层与真实交互内容分层，尤其避免 textarea 与 backdrop-filter 共用合成层。
- CSS fallback 和普通 UI 组件不必全部启用 GPU。
- 按组件场景定义材质，而非全站一个参数。

### 借鉴 whereyanlands
- CSS 定义几何、尺寸、圆角、层级和交互；WebGL 定义折射与方向性光学细节。
- 多个玻璃组件共享一个背景源、一个 WebGL Context 和一套 Shader。
- 以元素屏幕几何映射到统一背景纹理，避免每个组件各自截图造成空间不连续。
- Shader 负责内部折射与局部方向性 edge glint；不绘制完整白色描边。
- 显式处理 resize / scroll / background / visibility 生命周期与资源释放。

## 建议架构
1. Design Tokens：glass fill / tint / blur / border / shadow / radius。
2. Scene / Background Source：统一管理默认渐变与用户本地图片，统一 cover 裁切，变化时刷新 GPU 纹理。
3. Shared Optics Renderer：单一 WebGL Context、共享背景纹理、共享 Shader；多个目标元素只更新几何 uniforms。
4. Geometry & Mask：从 DOM rect 读取位置尺寸；圆角与 CSS 同源；遮罩内缩，防止双线。
5. CSS Shell：唯一负责可见边框、圆角、阴影、轻微 tint/frost 和内容布局；不与 Shader 重复画边。
6. Lifecycle / Fallback：ResizeObserver、IntersectionObserver、scroll、visibility、背景变更；WebGL 不可用或 context lost 时降级到 CSS 材质；明确 dispose。

## 原型范围
- 可自定义背景的独立聊天材质场景。
- 一个共享 WebGL Context 绘制多个圆角气泡内部折射。
- 局部方向性高光，不绘制整圈 Shader 描边。
- 可调折射、厚度、高光、雾面填充。
- DOM 文字保持清晰。
- 不接正式后端、认证、聊天数据，不修改正式 UI 或旧 Playground 首页。

## 验收阶段
### P0 — 视觉原型
确认自定义背景下折射真实改变背景纹理；CSS 只有一层轮廓；低 tint、低 blur；长短气泡圆角自然。

### P1 — 移动端稳定性
在 iPhone Safari 测滚动、尺寸变化、图片更换、后台恢复、WebGL context lost、大图内存。

### P2 — 性能与架构
限制 DPR 与纹理尺寸；只在 dirty 时重绘；可见目标才更新；避免每帧重复上传背景；补充 fallback 与 dispose。

### P3 — 集成评估
只有 P0-P2 通过后，才讨论移植到正式 UI。当前不触碰正式仓库。

## 已知限制
当前原型使用用户选择的图片或程序生成的默认背景纹理。正式页面若有复杂 DOM 背景、动态内容或滚动长列表，需要设计可信的背景源同步方案，不能假定可无成本截取任意 DOM。


## P0 visual refinement — 3.0.1

- Replaced radial-from-center lens normals with a finite-difference gradient of the rounded-rectangle SDF, so edge optics follow the actual rounded geometry.
- Reworked edge glint into broad directional key/fill highlights. The `shine` uniform now directly scales a wider edge band, making the control visibly responsive rather than relying on a narrow one-pixel rim.
- Reduced default frost from 0.08 to 0.03 and reduced CSS white fill/blur to preserve background clarity.
- Kept CSS as the sole border renderer; Shader continues to render only the interior sampled background and local optical highlights.
- Static source checks passed. Actual iPhone Safari appearance and frame-rate remain pending user-device validation.


## P0 geometry/compositing correction — 3.0.2

Black-background inspection exposed a rounded-mask mismatch: the CSS bubble uses a 25px radius (browser-clamped to half the element height), while the Shader radius was independently clamped to 38% of the height. This let the GPU interior mask become more rectangular than the CSS shell near corners. The Shader now uses the same CSS-derived radius, inset by the 1px CSS border, and the half-size uses the same 1px inset. Removed the bubble drop/inset shadow and backdrop-filter from this optical test surface so they cannot create a second halo or blur layer. CSS remains the only visible border. Source-level checks passed; visual verification on the user's device is still required.


## P0 edge material refinement — 3.0.3

- Added a 2-device-pixel smooth coverage transition at the rounded SDF boundary to reduce hard-discard aliasing at corners; coverage is returned through fragment alpha.
- Replaced the broad linear edge highlight with a compact curved bevel profile (`4t(1-t)`) so the highlight sits within the glass surface rather than reading as a second outline.
- Increased directional contrast between key and fill lighting while keeping a low baseline reflection; the shine control directly scales the bevel response.
- Kept the center optically clear: the bevel/highlight is edge-local, frost remains at the low default, and CSS remains the only visible border.
- Source-level checks passed. Device-side appearance and performance still require visual confirmation.


## P0 directional highlight response — 3.0.4

User validation: no square halo, corner transition natural, center clear, but the edge-glint slider produced no perceptible change. Increased the response curve rather than changing the geometry: widened the inner bevel band, added a tighter directional specular lobe on the key-light side, amplified the normalized shine input by 2x, and raised the highlight blend. The CSS border, rounded SDF coverage, low frost, and clear center remain unchanged. Static source checks confirm the slider remains wired to the shader uniform and the new response terms are present. Recheck on device at min/mid/max; the intended result is a clearly visible but still directional edge-light change, not a full white outline.


## 3.0.4 visual acceptance

User device validation confirms all three edge-glint positions are acceptable: minimum is subdued, midpoint is visibly soft, and maximum is stronger without becoming a continuous white outline. Treat the 3.0.4 edge-glint response as accepted and freeze it during the next iteration. Next P0 focus: refine perceived glass thickness and the spatial falloff of refraction while preserving the accepted rounded geometry, clear center, and edge-glint response. Change one optical variable at a time and request device validation before proceeding.


## P0 thickness profile iteration — 3.0.5

- Started thickness-only refinement after 3.0.4 edge-glint acceptance.
- Thickness now controls the depth of the optical displacement profile (`opticalDepth`) and the displacement path length (`opticalPath`), rather than coupling to the bevel width.
- The bevel width is frozen at the 3.0.4 accepted default-equivalent value, preserving the edge-glint profile while thickness is evaluated.
- Refraction slider, SDF geometry, CSS border, frost and edge-glint curve remain unchanged.
- Source-level checks passed. User-device evaluation is required before changing the refraction falloff profile.


## P0 perceived volume iteration — 3.0.6

User reports geometry and clarity are accepted, but bubbles still visually merge with the background and feel flat. Added restrained interior-only volumetric cues in the Shader: a low-opacity cool body transmission tint that fades inward, a broad key-light face reflection, and a very subtle opposing inner-edge attenuation. These are not additional outlines or CSS shadows. Preserved the accepted edge-glint formula, bevel width, thickness/refraction profile, rounded SDF mask, and CSS-only border. Source checks passed; verify on a bright detailed photo and a dark background before further tuning.


## 3.0.7 visual rollback

User device review of 3.0.6: depth became too abrupt/plasticky and the edge appeared rough/thick. Reverted only the 3.0.6 volumetric body tint, broad face reflection and opposing inner shade. Preserved the accepted 3.0.5 thickness/refraction profile, 3.0.4 directional glint, rounded SDF coverage, and single CSS border. Do not reintroduce broad interior whitening/shading as a proxy for depth. Next exploration should focus on subtle optical separation (very low-contrast Fresnel/transmission) and edge antialias/compositing diagnosis, tested separately. Static checks passed; device recheck needed.


## P0 subtle Fresnel separation — 3.0.8

- Added a low-contrast, edge-local Fresnel-like transmission tint. Its falloff follows the interior distance to the rounded SDF boundary and its intensity varies with the directional key-light angle.
- Kept the tint deliberately restrained (2.8% maximum blend toward a cool neutral), with no broad face whitening, extra outline, CSS shadow, or additional border.
- Preserved accepted 3.0.4 glint curve, 3.0.5 thickness/refraction profile, SDF geometry and CSS-only border.
- Source checks passed. Device-side review on bright floral and dark/high-contrast backgrounds is required; do not increase the tint unless it remains invisible in both.


## 3.0.9 optical whitening cleanup

User screenshot still showed a strong milky/plastic rim. Clarification: 3.0.7 had removed the three 3.0.6 volume cues, but 3.0.8 then added a new Fresnel tint, and the earlier frost-fill control remained active. Removed the residual Fresnel tint and frost-fill shader contribution and removed the now-misleading frost slider/control/binding. The only remaining white shader mix is the previously accepted directional edge-glint. Preserved thickness/refraction, rounded SDF geometry and CSS-only 1px border. Static checks passed; verify on device. If the rim remains rough, next isolate edge-glint versus CSS border rather than adding more shading.


## User decision — restore 3.0.6 baseline

User explicitly chose to return the live playground to the exact 3.0.6 implementation and discard the later visual experiments (3.0.7–3.0.9) from the active preview. The HTML was restored byte-for-byte from the 3.0.6 page commit `74d7ed75f044c6541d7faf86a23bb119e1d51bee`. Later Git commits remain in repository history for audit/recovery; they are no longer part of the deployed page. Do not reintroduce 3.0.7–3.0.9 effects unless the user explicitly asks.


## User decision — restore 3.0.5 baseline

User clarified that the desired visual baseline is 3.0.5 (not 3.0.6). Restored `docs/glass-system-30.html` byte-for-byte from the 3.0.5 page commit `7f2b5390ddd297de041cb4e34195c46f74343605`. This keeps the 3.0.5 optical thickness/refraction profile and the already accepted 3.0.4 directional glint response, while excluding the later 3.0.6 volumetric body shading and 3.0.7–3.0.9 experiments. The live page should now be treated as 3.0.5. Later commits remain in Git history but are not in the deployed HTML.


## Reference review + isolated edge-glint rollback trial — 2026-11-02

### whereyanlands《液态玻璃技术方案 v3》

- Its primary architecture is CSS geometry / WebGL optics / lifecycle synchronization, separated into scene state, background sampling, optics, geometry-mask, and UI layers.
- Multiple glass elements should sample one shared background coordinate system and share one WebGL context / shader; element rectangles are mapped from DOM geometry. Scroll, resize, theme, and background changes must refresh the source. The optics lifecycle should expose refresh and dispose, and observe target size / visibility.
- The shader proposal is materially different from the current prototype: rounded-rectangle masking, refraction across the surface, low-frequency interior waves, and localized directional edge glints. Its example edge formula is a narrow hairline near the boundary multiplied by upper-left / lower-right angular lobes; it explicitly avoids a continuous white outline.
- Its baseline preset is restrained (refract 26, tint 0, blur 0, edge 25, shine 13, wobble 15). These are reference values, not directly interchangeable with this prototype's current slider units.

### 小克Cat《专属前端·玻璃材质代码摘要》

- This is a CSS frosted-glass / theme-token implementation, not a WebGL refraction model. Its useful contribution is the component-scoped token system for fill, border, shadow, blur, and theme-specific variants.
- The composer puts its glass surface on a separate `::before` layer while keeping actual text input on a separate compositing layer, with `isolation:isolate`. The source documents an iOS cursor-position issue when editable content and `backdrop-filter` share a compositing layer.
- Its visual recipe uses a translucent gradient, border, outer ring, inset highlight, and `backdrop-filter: blur() saturate()`. This is appropriate for frosted controls and panels, but copying the full ring + inset highlight onto these bubbles would risk recreating the multiple bright outlines the user rejected.

### Audit of the current 3.0.5 prototype

- It already has one WebGL context, one shared stage texture, a rounded SDF mask, DOM-rect mapping for multiple bubbles, a user-selected background, and resize / scroll / visibility refresh hooks.
- Its current refraction is edge-weighted (`exp(-inside / opticalDepth)`), not the full-surface refraction field described by whereyanlands; there is also no interior-wave term yet.
- The visible rim has two possible contributors: the CSS 1px `rgba(255,255,255,.70)` border and the Shader's broad bevel highlight. The 3.0.4 change amplified the latter with a tighter specular lobe, a 2x multiplier, and an 0.82 white blend. These should not be conflated.
- The canvas DPR is capped at 1.5. That is a plausible contributor to rough edges on high-density mobile screens, but it is deliberately left unchanged in this isolated visual trial so edge brightness and antialiasing can be evaluated separately.

### This trial: restore the softer pre-3.0.4 glint response

- Replaced only the amplified 3.0.4 bevel/specular glint curve with the earlier, softer directional edge-band response (`glint * 0.34`, without the added specular lobe or 2x amplification).
- Preserved the 3.0.5 thickness/refraction profile (`opticalDepth` / `opticalPath`), SDF coverage, CSS border, background sampling, controls, and layout.
- This is an isolated rollback trial, not a new visual baseline until the user checks it on-device.
- If a continuous white ring remains, next isolate the CSS border from Shader glint. After that, test the whereyanlands narrow angular hairline formula as a separate change. DPR / antialiasing is another separate follow-up.
- Do not copy the Xiaokecat outer 1px ring + inset highlight onto the bubbles. Keep its tokenization and content-layer isolation ideas for later component integration.


## P0 edge rasterization correction — 2026-11-02

User device screenshot after the softer glint rollback: the edge brightness is now softer, but the rounded outline still shows obvious stair-stepping / jagged pixels.

### Diagnosis from source inspection

- The CSS border is 1 CSS px, and the Shader radius already subtracts `1 * dpr` to match the inner border radius.
- However, the Shader's rounded-rectangle half-size was subtracting a fixed `1.0` framebuffer pixel. At DPR 1.5 this disagreed with the radius inset by 0.5 device pixels; at DPR 2 it would disagree by 1 device pixel. The two parts of the SDF mask therefore described slightly different inner geometry.
- Coverage antialiasing used a fixed `smoothstep(-1, 1, d)` width instead of adapting to the actual fragment footprint.
- The canvas DPR was capped at 1.5, below the native DPR of many current mobile screens.

### Isolated correction

- Added a shared `insetPx` uniform and use `dpr` for both the SDF half-size inset and rounded radius inset, aligning the Shader mask to the 1 CSS px CSS border.
- When `OES_standard_derivatives` is available, coverage now uses `fwidth(d)` for fragment-footprint-aware antialiasing. Browsers without the extension retain the prior fixed-width coverage fallback.
- Raised the DPR ceiling to 2.0 with a 2.2-megapixel backing-store budget, preventing unnecessarily large render targets on wide stages.
- Kept the soft pre-3.0.4 edge-glint response, 3.0.5 thickness/refraction profile, CSS border appearance, tint, and layout unchanged.

### Validation status

- Static source checks passed for derivative and fallback paths, matching geometry inset, adaptive DPR budget, and unchanged optical parameters.
- Actual iPhone Safari shader compilation and visual smoothness remain pending user-device validation.
- This is a rasterization correction, not a new visual baseline until the user confirms the result.
