# 家 ^ ^ UI Playground

独立视觉实验场，与正式产品仓库分离。

## Glass System 3.0

独立聊天材质原型，支持本地背景图片；CSS 负责圆角外壳、边框和阴影；一个共享 WebGL Context 与背景纹理负责多个气泡内部的背景折射和局部方向性高光；DOM 负责文字。可调整折射、厚度、边缘高光和雾面填充。

预览文件：docs/glass-system-30.html
技术方案：docs/GLASS_SYSTEM_3_PLAN.md

当前不连接正式后端、认证或聊天数据，不修改正式产品仓库，也不覆盖原 Playground 首页。

## GitHub Pages

Settings → Pages → Deploy from a branch → main → /docs。

原首页与 PWA 资源继续保留。