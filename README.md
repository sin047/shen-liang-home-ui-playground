# 家 ^ ^ UI Playground

独立的视觉实验场，与正式产品仓库 `sin047/shen-liang-home` 分离。

## 当前预览：Liquid Glass 2.0

打开 GitHub Pages 部署地址后即可在手机 Safari 中体验。当前原型保留 v1 的页面结构与交互，只叠加 CSS 液态玻璃视觉皮肤；不连接正式后端、认证或聊天数据，也不实现真实光学 Shader 折射。

## 发布设置

在 GitHub 仓库 Settings → Pages：
- Build and deployment → Deploy from a branch
- Branch：`main`
- Folder：`/docs`
- Save

发布完成后访问：`https://sin047.github.io/shen-liang-home-ui-playground/`

## 文件

- `docs/index.html`：独立预览页面
- `docs/manifest.webmanifest`：独立 PWA 身份
- `docs/assets/icons/`：本实验使用的图标副本

正式仓库和冻结 UI 不会被此仓库修改。

## GPU experiment: Liquid Glass 2.3

- `docs/lab/liquid-glass-23.html`: one shared WebGL context renders multiple rounded chat-bubble glass regions over a background texture; HTML text remains above the GPU layer.
- This is an isolated material prototype, not integrated into the 2.0 page or production UI.
- Test with a custom image on iPhone Safari before considering integration. DOM capture, dynamic app backgrounds, scrolling/keyboard edge cases, context-loss recovery, and performance validation remain open.

- `docs/lab/liquid-glass-231.html`: follow-up to 2.3 with stronger lens displacement, SDF-derived edge normals, reduced white wash, and visible CSS edge fallback.

## Liquid Glass 2.4 rebuild

The 2.2 and 2.3 experimental pages were superseded after review found that their GPU layer was a translucent white overlay rather than a clean replacement of the background pixels inside each bubble. The 2.4 rebuild uses one WebGL context and directly re-samples the background texture within rounded bubble masks; outside each mask the shader is transparent. Bubble DOM backgrounds are transparent and text remains above the GPU layer. Real-device Safari verification is still required.

- `docs/lab/liquid-glass-243.html`: single-frame correction. Removes the extra inner CSS pseudo-element and insets the GPU refraction mask by 2 CSS pixels so the original 2.0 CSS frame is the only visible outline.
