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
