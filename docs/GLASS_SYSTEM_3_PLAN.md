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
- Shader 使用单一圆角 SDF 统一绘制可见外轮廓、内部折射与局部方向性 edge glint；高光不再叠加第二条白色描边。
- 显式处理 resize / scroll / background / visibility 生命周期与资源释放。

## 建议架构
1. Design Tokens：glass fill / tint / blur / border / shadow / radius。
2. Scene / Background Source：统一管理默认渐变与用户本地图片，统一 cover 裁切，变化时刷新 GPU 纹理。
3. Shared Optics Renderer：单一 WebGL Context、共享背景纹理、共享 Shader；多个目标元素只更新几何 uniforms。
4. Geometry & Mask：从 DOM rect 读取位置尺寸；圆角与 CSS 同源；Shader 使用同一 SDF 和覆盖率统一处理外轮廓与玻璃内部，避免双线。
5. CSS Shell：负责布局、圆角尺寸、文字排版和交互区域；保留透明 1px 边框用于布局，但不绘制第二条可见轮廓。Shader 是当前唯一可见边缘的绘制者。
6. Lifecycle / Fallback：ResizeObserver、IntersectionObserver、scroll、visibility、背景变更；WebGL 不可用或 context lost 时降级到 CSS 材质；明确 dispose。

## 原型范围
- 可自定义背景的独立聊天材质场景。
- 一个共享 WebGL Context 绘制多个圆角气泡内部折射。
- Shader 统一绘制单一圆角外轮廓；局部方向性高光限制在轮廓内侧，不叠加第二圈白边。
- 可调折射、厚度、高光、雾面填充。
- DOM 文字保持清晰。
- 不接正式后端、认证、聊天数据，不修改正式 UI 或旧 Playground 首页。

## 验收阶段
### P0 — 视觉原型
确认自定义背景下折射真实改变背景纹理；整个气泡只有一套可见轮廓；低 tint、低 blur；长短气泡圆角自然。

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


### Follow-up: native-density canvas trial — 2026-11-02

User device screenshot confirms straight edges look continuous, while the curved outline still shows pronounced stair-stepping. Pixel inspection shows the jagged contour is the outer rasterized edge; the smoother inner contour is consistent with the CSS border overlaying the WebGL-rendered glass edge.

The previous 2.0 DPR ceiling is still below native density on common 3x mobile displays. The canvas is therefore being upscaled by the browser, which can preserve a visibly stepped curve even with derivative-based SDF coverage.

- Raised the DPR ceiling from 2.0 to 3.0.
- Increased the backing-store budget from 2.2 MP to 3.0 MP, enough for a 390–430 CSS px wide, 660–760 px tall mobile stage at 3x in typical layouts.
- Kept derivative-based coverage, SDF geometry, CSS border, refraction, thickness, and glint unchanged.
- This remains an isolated raster-density trial. Verify on the same iPhone/Safari device; if the curve is still stepped, next inspect whether the jagged outer contour is exclusively the WebGL surface or a CSS compositing artifact, and consider a dedicated MSAA/offscreen edge pass only if needed.


## Full edge-rasterization audit — 2026-11-02

User supplied a close-up screenshot after the DPR 3.0 trial. The curved perimeter remains strongly stepped. The previous explanation (device DPR alone) was incomplete.

### Source audit findings

1. The renderer sized its backing store from `devicePixelRatio` only. On iOS Safari, pinch zoom is exposed separately through `visualViewport.scale`; the WebGL canvas can therefore be magnified by the visual viewport without a corresponding increase in its backing-store resolution. This is especially relevant to the user's extreme close-up inspection.
2. Geometry uniforms used the requested scalar DPR, while the actual backing-store dimensions are rounded to integer pixels. The exact effective X/Y scale can differ slightly from the requested DPR, leaving a subpixel mismatch between DOM geometry and the GPU mask.
3. Coverage used only half of `fwidth(d)` as its transition radius. That is narrower than the conventional derivative-based SDF edge transition and can leave a visibly hard pixel staircase on curved contours.
4. The CSS border and Shader glint are separate visual layers. The CSS border is the only explicit outline; the Shader edgeBand also reaches maximum at the inner SDF boundary, so both layers can appear as two closely spaced bright contours. This remains a separate visual-layer issue and should be isolated after raster quality is verified, rather than increasing white edge intensity.

### Corrections in this pass

- Effective target scale now includes `visualViewport.scale`, capped at 4x and constrained by a 5-megapixel backing-store budget.
- Added visualViewport resize / scroll listeners so the canvas rerenders when pinch zoom or visual viewport position changes.
- Geometry uniforms now use the exact effective X and Y backing-store scales after integer canvas sizing, rather than the requested scalar DPR.
- Increased SDF coverage transition from `0.5 * fwidth(d)` to `1.0 * fwidth(d)` (with a 0.75px floor).
- The renderer status now reports effective DPR, derivative-AA mode, and whether the WebGL context actually received MSAA.

### Preserved

- CSS border color, width, and radius.
- 3.0.5 thickness / refraction profile.
- Soft directional edge-glint response.
- Background upload, bubble layout, and typography.
- No change to the production UI or the main project repository.

### Validation

Static checks passed for viewport-scale tracking, exact X/Y geometry mapping, derivative coverage, and preserved optical parameters. Runtime values and visual output must still be checked on the user's iPhone Safari; the status line now exposes DPR / AA / MSAA for that purpose.


## P0 unified perimeter compositing — 2026-11-02

User's latest device screenshot shows the lower gray/optical contour is now smooth, but a brighter white contour above it remains stepped and does not fully coincide with the gray edge.

### Confirmed layer relationship in the current DOM

- The WebGL canvas is a lower stacking layer (`z-index: 0`).
- Each message element is above it (`z-index: 1`) and paints its own semi-transparent white CSS border.
- The Shader and CSS border therefore rasterize the same rounded perimeter independently, in different compositing layers. The canvas now responds to visual viewport zoom, but the CSS border is still separately rasterized/composited by Safari. This explains why the gray Shader contour can look smoother while the brighter white CSS contour remains stepped or offset.
- The CSS border's 70% white alpha also lets the underlying optical gray show through. This is not a missing-pixel bug in the Shader mask; it is a two-layer edge/compositing mismatch.

### Isolated correction

- Removed the visible CSS border paint while retaining a transparent 1px CSS border so DOM layout and text insets remain unchanged.
- Moved that same 1 CSS px / 70%-white border treatment into the shared WebGL Shader, using the exact same outer rounded-rectangle SDF and derivative-based coverage as the glass surface.
- The Shader now rasterizes the outer silhouette and the border from one geometry / one antialiasing field. There is no separately composited white CSS contour to drift away from the gray optical edge.
- The accepted directional glint is gated to begin inside the border band, avoiding a second bright line on top of the border.
- Removed the old 1px inward SDF inset: the Shader now owns the outer border-box geometry and uses the CSS outer radius. This avoids the previous CSS-inner-mask / Shader-inner-mask mismatch.

### Preserved

- Visible border thickness, white opacity, radius, and overall visual intent.
- 3.0.5 refraction / thickness profile and soft directional glint response.
- DOM text layout, bubble sizes, stage layout, background sampling, and user controls.
- No production UI changes.

### Validation

Static source checks passed for single-owner perimeter rendering, shared SDF coverage, derivative-AA replacement, and preserved CSS layout dimensions. Actual iPhone Safari visual confirmation remains required. If the single Shader contour is smooth but still too translucent, adjust only the border mix after reviewing the next screenshot; do not restore a second CSS outline.



## P1 mobile resilience pass — 2026-11-02

### Frozen visual reference

- This pass branches from the accepted Playground snapshot at main commit `94b3cdeca4652b76b986143ff5291eef45f2bbfa`.
- Baseline HTML blob: `ecf6dbce86f1b942073961fb4dfd5a40f4134f9c`.
- The branch changes renderer lifecycle and fallback behavior only. The Shader's refraction, thickness, frost and directional-glint formulas are unchanged.
- No changes are made to the main `shen-liang-home` product repository or the Playground `main` branch.

### Source audit findings

1. When WebGL initialization failed, the canvas was hidden but message surfaces retained transparent backgrounds and borders. The page therefore had no real CSS fallback, despite the status text claiming one.
2. There were no `webglcontextlost` / `webglcontextrestored` handlers. After a context loss, GPU resources would remain invalid and the renderer would not rebuild them.
3. Replacing a user-selected background image did not revoke the previous object URL, and the file input was not reset to allow selecting the same file again.
4. `ResizeObserver` was assumed to exist without a fallback path.

### Changes in this pass

- Added a restrained CSS-only fallback surface, activated only when WebGL is unavailable, initialization fails, rendering fails, or the context is lost. It uses a low-opacity fill and modest blur; it does not alter the normal WebGL appearance.
- Added context-loss handling: prevent the default loss behavior, stop pending animation frames, and switch to CSS fallback.
- Added context-restoration handling: recreate the program, shaders, buffer and texture, then resize and re-upload the retained background source.
- Revoke the previous background object URL only after a replacement image has loaded; reset the file input after success or failure so the same image can be selected again.
- Added a `ResizeObserver` feature check and a window-resize fallback.
- Revoke the active object URL on a non-BFCache page exit; preserve it when the page is being kept for back/forward cache.

### Preserved

- Current accepted visual snapshot and all optical formulas.
- Single WebGL context and shared background texture.
- One shared SDF for the visible perimeter and the interior glass surface.
- DOM text, bubble geometry, control ranges, default background and user image crop behavior.
- Main Playground page and production UI.

### Static validation

- JavaScript syntax parsed successfully.
- Source checks confirm one WebGL context, context-lost and context-restored handlers, CSS fallback activation, object-URL cleanup, same-file reselection, and a ResizeObserver fallback.
- Source comparison confirms the optical depth/path equations and Shader glint/refraction formulas are unchanged.

### Device validation still required

On iPhone Safari, verify initial WebGL rendering, background replacement (including selecting the same image twice), scroll/pinch zoom, app background/foreground recovery, and orientation/viewport changes. Context-loss recovery and CSS fallback should be tested separately where browser tooling allows. Static checks do not prove runtime behavior or frame rate.



## P1 mobile acceptance — 2026-11-02

User completed the normal-path iPhone Safari validation (A–F) and reported all checks passing.

- Initial page load: all four bubbles render; screenshot reports `WebGL · DPR 3.00 · fwidth AA · MSAA on`.
- Custom background: selected image appears correctly and the shared WebGL sampling/refraction follows it.
- Re-selecting the same image and replacing backgrounds: confirmed working.
- Scroll, pinch zoom, and viewport/orientation changes: confirmed aligned and responsive.
- App background/foreground and lock-screen return: confirmed renderer recovers without manual refresh.
- No visual regression was reported in the accepted bubble appearance.

### P1 result

The normal iPhone Safari mobile path is accepted. This is a user-device validation result, not a claim that every exceptional browser/GPU path is covered.

Still optional / not yet device-injected:
- Explicit WebGL context-loss and context-restoration simulation.
- Deliberately invalid/corrupt image load.

The source-level fallback and context lifecycle checks remain recorded above. Do not block ordinary P1 acceptance on the optional context-loss injection; retain it as a targeted resilience check if desktop browser tooling becomes available.

### Next phase: P2 performance and lifecycle audit

Proceed without changing the accepted visual profile. Audit and measure:
1. Avoid redundant full-background texture uploads on geometry-only redraws.
2. Coalesce scroll / resize / visualViewport events into one animation-frame update.
3. Avoid drawing off-screen glass targets where practical without breaking scroll re-entry.
4. Bound GPU texture and canvas memory for large photos / high-DPR screens.
5. Add explicit renderer disposal and recovery checks.
6. Measure frame time and memory on representative mobile conditions before changing defaults.

No production integration is authorized by this phase. P2 remains isolated in the UI Playground; only after evidence-based P2 acceptance should integration into the frozen product UI be discussed.



## P2 renderer scheduling — first isolated pass — 2026-11-02

### Audit finding

- Scroll-driven `draw()` already coalesces repeated calls into one animation frame.
- Stage ResizeObserver, window resize, and visualViewport resize called `resize()` directly. On mobile Safari these signals can arrive in bursts or overlap, causing repeated backing-store sizing and full background texture uploads.
- The window resize listener was registered separately from the ResizeObserver fallback, so the fallback path could register the same resize work twice.
- Geometry-only scroll redraws do not upload the background texture; texture upload is currently confined to `resize()`.

### Change

- Added a single `scheduleResize()` requestAnimationFrame gate for stage ResizeObserver, window resize, visualViewport resize, background-image completion, and visibility restoration.
- Removed the duplicate direct window resize registration. The ResizeObserver fallback is now simply the window resize listener routed through the same scheduler.
- When the document becomes hidden, cancel both pending draw and resize frames; schedule one fresh resize on return.
- On a non-BFCache page exit, cancel pending frames before releasing the selected background object URL.

### Preserved

- Shader source and all visual/material formulas are byte-for-byte unchanged.
- No change to DPR cap, backing-store budget, background crop, bubble geometry, CSS, text, or controls.
- Scroll redraw remains requestAnimationFrame-coalesced.
- No production repository changes.

### Static validation

- JavaScript syntax parsed successfully.
- Exactly one WebGL context remains.
- Stage, window, and visualViewport resize paths use the shared scheduler.
- Duplicate direct window resize registration is absent.
- Background replacement and visibility restoration use the scheduler.
- Pending frames are cancelled on hidden/page-exit lifecycle paths.
- Shader source comparison against the P1-accepted main snapshot is identical.

### Device validation

This pass is intentionally limited to scheduling/lifecycle behavior. Re-run iPhone Safari checks for orientation, pinch zoom, background replacement, and app foreground recovery before merging. Do not infer frame-rate improvement without profiling on device.



## P2.2 background texture caching and lifecycle — 2026-11-02

### Audit finding

- P2.1 coalesced resize events, but every resulting `resize()` still created a temporary canvas at the full WebGL backing-store dimensions and called `texImage2D` again.
- The background image itself had not changed during ordinary resize / orientation / viewport updates, so those uploads were redundant.
- The upload canvas could temporarily duplicate several megapixels of pixel storage. The selected image also remained decoded in memory, as required for background display and context restoration.
- Rapidly selecting images could allow an older asynchronous image load to finish after a newer selection and replace it unexpectedly.

### Change

- Upload the selected background as one source texture, capped by the lesser of `MAX_TEXTURE_SIZE` and a 5-megapixel pixel budget.
- Only create a downscaling canvas when the source exceeds that GPU texture budget. Clear the staging canvas dimensions immediately after `texImage2D` completes so its backing store can be reclaimed.
- Move the centered `background-size: cover` crop into two Shader uniforms (`bgScale` / `bgOffset`). Refraction displacement is scaled in the same cropped coordinate system and clamped to the visible cover region.
- Keep the selected source image dimensions and derive cover coordinates from the current stage aspect ratio. Resizing now updates the canvas viewport and geometry only; it does not re-upload the unchanged background texture.
- Upload only for initial texture creation, a successfully loaded replacement image, or WebGL context restoration.
- Guard asynchronous image selection with a monotonically increasing request token; stale loads are ignored and their object URLs are revoked.
- On a non-BFCache page exit, explicitly delete the texture, vertex buffer, and program, release the canvas backing store, cancel pending frames, and revoke the active object URL.

### Preserved

- No changes to the rounded SDF, edge glint, thickness, refraction strength curve, frost contribution, CSS border, message geometry, typography, controls, or layout.
- The cover crop remains centered and follows the same `cover` aspect-ratio rule as the CSS background. The shader change only maps stage UVs into the source image's visible crop.
- Still one WebGL context, one shared background texture, and one shared shader for all bubbles.
- No production repository changes.

### Static validation

- JavaScript syntax parsed successfully.
- The material shader formulas compare identical to the pre-P2.2 version after normalizing only the new cover-coordinate mapping.
- Resize no longer calls `texImage2D` when the texture is already valid.
- Upload call sites are limited to initial creation, background replacement, and context restoration.
- Texture dimensions are bounded by both the device maximum texture size and the 5-megapixel budget.
- Staging canvas backing dimensions are cleared after upload.
- Stale image loads are ignored and their object URLs released.
- Context-loss state clears invalid WebGL object references; non-BFCache page exit disposes live GL resources.
- CSS, controls, and DOM message markup are unchanged.
- Numerical center-cover mapping spot checks for portrait, landscape, and near-matching aspect ratios agree with the previous CPU-cropped mapping to floating-point precision.

### Device validation

This is a texture ownership / sampling-coordinate change, so verify on iPhone Safari with:
1. Initial default gradient.
2. A portrait background and a landscape background (center-cover crop).
3. Replacing the background several times quickly.
4. Orientation change and pinch zoom without changing the selected background.
5. App background / foreground recovery and, if possible, context restoration.

Do not claim a measured frame-rate or memory improvement until profiled on device. No visual material redesign is included in this pass.
