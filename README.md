# 家 ^ ^ UI Playground

独立视觉实验场，与正式产品仓库分离。

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
