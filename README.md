# 家 ^ ^ UI Playground

独立视觉实验场，与正式产品仓库分离。

## Glass Material Kit 0.4 · Long Page Architecture（待验收）

新建独立页面 `docs/glass-kit-v04.html` 与引擎 `docs/glass-material-kit-v04.js`。针对 Kit 0.3 真机长页面截图出现的背景放大与诊断旧数据问题，使用**固定参考大小、垂直重复的背景**及随可见区域移动的 viewport-sized Canvas；同时提供 `requestDiagnostics()` 等待实际绘制完成，显示当前 DOM 组件总数与上次绘制状态。

**注意**：背景重复周期的拼接可能明显，快速滚动仍可能出现画布位置滞后一帧；这些均需 iPhone Safari 测试。光学材质参数及原 Kit 0.1/0.2/0.3 全部保留，不修改正式「家 ^ ^」仓库。技术边界见 `docs/GLASS_MATERIAL_KIT_04.md`。

## Glass Material Kit 0.3 · Stability & Performance（待实机验收）

独立 0.3 测试页：`docs/glass-kit-v03.html`，引擎：`docs/glass-material-kit-v03.js`。在**不改 0.2 CLEAR Shader、组件尺寸预设和正式 UI**的前提下，新增 Canvas 渲染缓冲/像素上限、屏幕外组件剔除、可见性与 BFCache 生命周期控制、40 组件压力实验与按需诊断；扩展模拟 WebGL CI 验证。

原 0.1 / 0.2 及全部 4.x 实验页完整保留。性能指标目前属于模拟测试和 RGBA 粗略估算，**真实 iPhone Safari 性能仍待验证**。详见：`docs/GLASS_MATERIAL_KIT_03.md`。

## Glass Material Kit 0.2 · 自适应组件材质（待验收）

基于用户已在 iPhone Safari 验证的 Kit 0.1，新建独立可对照页面：`docs/glass-kit-v02.html`，使用 `docs/glass-material-kit-v02.js`。新增 compact/control/panel/neutral 组件尺寸适配、显式属性优先级及背景图片竞态保护，并加入模拟 WebGL 生命周期回归测试。可在页面内切换适配模式，对比不同尺寸组件的折射与局部受光。

**稳定的 Kit 0.1 页面、Shader、CSS 原样保留；正式产品仓库暂不修改。** 测试与接入边界：`docs/GLASS_MATERIAL_KIT_02.md`。

## Glass Material Kit 0.1 · 4.2.3（跨组件实验）

**最终方向不是专用聊天气泡，而是一套通用液态玻璃材质模板。** 这一版独立抽出 `docs/glass-material-kit.js`、`docs/glass-material-kit.css`，统一驱动 DOM 上的 `data-glass` 按钮、卡片、导航、原生输入框、状态标签和聊天气泡。一个场景共享 WebGL Context / 背景纹理，可分别设置圆角、CLEAR/SMOKED、折射及光照参数；文字和交互仍由业务 DOM 保留。

手机演示：`docs/glass-kit.html`。接入方法、复用边界、源项目授权说明与实机验证计划：`docs/GLASS_MATERIAL_KIT.md`。

**这是未验收的独立 Playground 研究版本，不改变现有 4.2.2 页面、正式 UI 或原有产品设计。**

## Glass System 4.2.2 — Continuous Optics（待验收实验）

独立页面：`docs/glass-system-422.html`。基于 4.2.1 清透玻璃，将容易出现局部水波的肩部折射改为在边界归零的连续单峰透镜，并增加局部曲面反光而不增加整圈白边。保留相册背景、GPU 状态、原图对照和圆角形状；**4.2.1 与所有旧版均完整保留，正式 UI 不变。**

技术说明与 iPhone Safari 对照步骤：`docs/GLASS_SYSTEM_422_CONTINUOUS_OPTICS.md`。

## Glass System 4.2.1 — Smooth Lens Pass（待验收实验）

独立版本：`docs/glass-system-421.html`。基于 iPhone Safari 已运行的 4.2，收敛局部鼓包、切向扰动、局部高光与内侧厚度，保留清透 CLEAR、圆角、相册背景与原图对照功能。**原 4.2 保留**，不改变正式产品 UI。技术修改与测试计划：`docs/GLASS_SYSTEM_421_SMOOTH_LENS.md`。

## Glass System 4.2 — Optical Volume（未验收实验）

新页面：`docs/glass-system-42.html`，在 4.1 的清透基础上独立试验更有层次的透镜曲率、局部曲面反光与柔和的内侧厚度。保留照片上传、原图对照和 GPU 状态提示，可随时返回 4.1 比较。**这版尚未经过 iPhone Safari 视觉验收，不能视为最终外观。**

技术设计与测试清单：`docs/GLASS_SYSTEM_42_OPTICAL_VOLUME.md`。旧版 4.1、4.0、3.0 全部保留；正式产品仓库不变。

## Glass System 4.1 — CLEAR Lens & Light（未验收实验）

独立页面：`docs/glass-system-41.html`，在 4.0 的基础上重新调整全表面折射、局部高光与自适应内侧明暗。页面右下角直接显示 WebGL / CSS fallback 状态，并提供「原图对照」来核对实际透镜效果，避免把 CSS 兼容样式误认为玻璃渲染。

本轮的技术变更、参考许可边界与 iPhone Safari 验收清单：`docs/GLASS_SYSTEM_41_MATERIAL_PASS.md`。

**原 4.0、3.0 页面完整保留，正式产品仓库未修改。当前 4.1 还需要手机实测，不能标记为视觉通过。**

## Glass System 4.0 — CLEAR Optical Study（实验版）

新页面：`docs/glass-system-40.html`

以公开的 [Layered Liquid Glass Notes](https://github.com/yanceydaisy/liquid-glass-note) 技术说明和 CLEAR 材质示例为视觉参考，独立实现**全表面**圆角透镜折射、亮度自适应边缘与 CLEAR / SMOKED 试验预设。保持原聊天排版和本地背景选择；默认使用自生成、可观察折射的背景，不打包参考作者的图片或代码。原 3.0 页面完整保留。

研究说明及移动端验证要点：`docs/GLASS_SYSTEM_4_STUDY.md`。

本版为未验收视觉实验，不代表玻璃质感已达到目标；正式 UI 仍保持冻结。

## Glass System 3.0

独立聊天材质原型，支持本地背景图片。CSS 负责布局、圆角尺寸与文字排版；一个共享 WebGL Context 和背景纹理服务多个气泡，Shader 使用同一套圆角 SDF 统一绘制可见轮廓、内部背景折射与局部方向性高光；DOM 负责文字。

当 WebGL 不可用、初始化失败或上下文丢失时，气泡会降级为轻量 CSS 玻璃表面。正常 WebGL 路径的材质参数与视觉效果不受 fallback 影响。

预览文件：docs/glass-system-30.html  
技术方案与开发记录：docs/GLASS_SYSTEM_3_PLAN.md  
移动端验证清单：docs/GLASS_SYSTEM_3_MOBILE_CHECKLIST.md

当前不连接正式后端、认证或聊天数据，不修改正式产品仓库，也不覆盖原 Playground 首页。

## GitHub Pages

Settings → Pages → Deploy from a branch → main → /docs。

原首页与 PWA 资源继续保留。
