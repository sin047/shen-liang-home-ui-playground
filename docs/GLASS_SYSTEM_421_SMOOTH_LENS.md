# Glass System 4.2.1 — Smooth Lens Pass

状态：**独立、未验收的玻璃材质试验**。用户在 2026-11-06 的 iPhone Safari 截图已证明 4.2 WebGL 光学路径运行（`GPU · fwidth AA`），但反馈中外侧折射偶尔显出局部“鼓包/水波”，与追求的平滑、连续 CLEAR 光学体积感仍有差距。

## 目标与约束

- 只修改折射曲线、轻微切向扰动、曲面局部高光、内侧暗部及两层 CSS 柔软投影。
- **保留** 4.2 原页面、圆角形状、气泡布局、文字、透明背景、照片上传、原图对照、CLEAR/SMOKED 切换、GPU 状态提示、生命周期与 WebGL 恢复。
- **不引入** 均匀奶白/粉色填充、整圈高光或全局时间动画。用户已有的 4.2 不会被覆盖。
- 正式产品仓库 `sin047/shen-liang-home` 继续冻结，本实验只在 `sin047/shen-liang-home-ui-playground` 进行。
- 视觉参考方向仍是 `yanceydaisy/liquid-glass-note` 的 CLEAR 效果。此实现是独立的 Shader 调整，没有复制对方未授权的引擎代码或图片素材。

## 相比 4.2 的五项材质调整

1. **折射肩部柔化**：`lensBody` 从 `1.07*(1-r^1.7)` 调整为 `1.02*(1-r^1.85)`，肩部幅值从 `0.43` 收至 `0.22`、区间移动至 `0.46–0.78` / `0.90–0.985`，边缘缓冲从 `0.07` 收至 `0.035`，整体位移倍率 `102→98`。
2. **低频切向扰动更轻**：振幅从 `11→5.5` 与 `1.6→0.7`，并缩小波动区间与覆盖强度，缓解局部凸点。
3. **边缘高光收敛**：rim 系数从 `0.24/0.10` 改为 `0.18/0.06`。
4. **曲面反光与内侧阴影收敛**：surface 系数从 `0.20→0.11`，混合上限从 `0.29→0.18`；内侧吸光从 `0.097/0.025` 收至 `0.072/0.018`，亮背景明暗权重更柔和。
5. **CSS 仅降低柔性投影的强度**：`0 9px 22px rgba(...,.12), 0 3px 6px rgba(...,.055)` → `0 7px 16px rgba(...,.09), 0 2px 4px rgba(...,.04)`。

这些调整的目的是降低视觉上的“为了产生效果而出现的凸起”，保留透明度与连续透镜形变。**不承诺任何光照强度或折射程度已获用户认可**。

## 已做/计划中的验证

- HTML 中的 JavaScript 可解析。
- 已扩展 `tools/check-glass-shader-identifiers.cjs` 到 `docs/glass-system-421.html`，覆盖无导数和 `OES_standard_derivatives` 两种片元 Shader 版本，以防止 `fwidth(d)` / `innerRim` 等未声明变量错误。
- 4.2.1 的 `roundedDistance` / `roundedRayLength` / `alpha` 蒙版、SMOKED 分支、背景及上传逻辑与 4.2 相同。
- 若 GitHub Actions 的 Shader identifier guard 实际运行通过，记录其运行 ID；静态脚本不是完整 GLSL GPU 编译器。
- **尚待 iPhone Safari 真机验证：** WebGL 是否显示 `GPU · fwidth AA`，使用相同樱花背景比较 4.2 与 4.2.1；对照开启/关闭光学、短气泡和长气泡的边缘是否不再鼓包；观察更柔和高光是否仍足够立体。
- 若视觉效果反而变薄或丢失原有光学体积，应直接保留 4.2 做基线再调，不要悄悄覆盖已测过的版本。

## 交付

- 新版：`docs/glass-system-421.html`
- 上一版：`docs/glass-system-42.html`
- 本记录：`docs/GLASS_SYSTEM_421_SMOOTH_LENS.md`
- 只有在用户授权合并独立 Playground Draft PR 后，GitHub Pages 才会公开新版实验页面。
