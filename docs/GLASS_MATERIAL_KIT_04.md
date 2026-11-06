# Glass Material Kit 0.4 — Long Page Architecture

**状态：独立 Playground 实验，等待 CI + iPhone Safari 真机验收；不修改正式「家 ^ ^」UI。**

## 1. 实测问题与范围

用户在 Kit 0.3 实机截图中确认 GPU 为 `GPU · fwidth AA`，40 个组件能正常显示和滚动；但添加内容后，樱花背景被明显放大，同时诊断栏仍显示 `目标 9 / 绘制 6 / 剔除 3`。当时只凭截图无法断言 40 个组件没有被剔除，因为读数可能来自添加前的旧帧。

根因来自 0.3 的两个设计：

- CSS 背景使用整个 scene 的 `background-size:cover`，GPU 的采样 UV 同样用 scene 总高度。长页面变高时，cover 比例及图案显著改变。
- Canvas 的坐标和像素预算覆盖完整 scene，即使组件在视口外被剔除，也要为长页面创建低分辨率的完整绘图区。
- 诊断读取独立于新一帧的完成时刻，不能区分当前 DOM 数量和上次成功绘制的组件数量。

本轮只改**背景取样/画布布局/诊断**。继承 0.3 全部 CLEAR/SMOKED 光学参数与组件预设，**不额外增强高光、不修改气泡形状、不变动业务排版**。

## 2. 新增文件与基线

- `docs/glass-material-kit-v04.js`：独立的 0.4 版本。
- `docs/glass-kit-v04.html`：长页面测试和可等待真实绘制的诊断栏。
- `tools/check-glass-kit-v04.cjs`：Node 假 WebGL / 假 DOM 结构测试。
- `tools/check-glass-shader-identifiers.cjs` 与 Actions 工作流：增列 0.4。
- `docs/GLASS_MATERIAL_KIT_04.md`：本交接文档。

旧版 `docs/glass-material-kit-v03.js`、`docs/glass-kit-v03.html`、0.2、0.1 和全部 4.x 原型**不修改**。正式仓库 `sin047/shen-liang-home` **未接入**。

## 3. 长页面背景：可预测的稳定尺寸

**采用 scene 自身为锚点、固定参考高度、垂直重复的背景方案**，而不是声称能直接抓取系统壁纸或任意滚动层背后像素。

- 初始参考高度为 `min(scene 初始高度, 当前可见视口高度)`。
- 用背景原图宽高与 `scene 宽度 × 参考高度` 求 cover 缩放，CSS 背景设为固定像素宽高、`background-position:center top; background-repeat:repeat-y`。
- 内容增长/收缩不修改原始 cover 缩放；只有容器宽度显著变化（如横竖屏切换）会重设参考高度。
- GPU 的 `bgScale/bgOffset` 使用 scene 内当前 Canvas 窗口的偏移、固定背景尺寸，并在 V 方向循环取样，使玻璃内折射的图案和页面外背景处于同一背景坐标系。
- 因为是重复原图，**每个背景周期的接缝可能可见**，特别是用户上传了非无缝图片时。这是原型阶段明确接受的取舍，不是最终壁纸策略；正式接入应评估背景锚点、淡入/延展方式，或使用单独稳定背景层。
- 0.4 的片元 Shader **改变了背景取样坐标和垂直环绕方式**，但保留折射位移曲线、圆角 SDF、内侧吸光、曲面受光及材质参数本身。不能声称整个 Shader 逐字节相同。

## 4. GPU 画布：视口尺寸、而不是整段内容

- Canvas 仍为 scene 的透明子元素，但 CSS 高度只覆盖 `min(scene高度, 可见视口高度 + 192px)`，顶部相对于 scene 随滚动更新。
- 每次滚动根据 scene 相对视口坐标更新 Canvas `top`，重新映射每个可见组件的相对像素位置、scissor 裁剪和源图 UV。
- DPR 仍受设备像素比、既有 500 万像素预算、`MAX_RENDERBUFFER_SIZE` 约束。场景高度不再直接增加 Canvas 的像素需求。
- 仍按需 RAF 合并绘制、不持续动画；组件若完全在当前视口或 Canvas 带外则剔除。
- 已知边界：这是一张 JS 跟随滚动移动的 absolute Canvas，**不是原生 sticky/fixed canvas**。快速惯性滚动可能出现一帧位置滞后；滚动容器内多级 clipping/transform、跨 scene 遮挡、任意形状和不同角半径仍未支持。

## 5. 诊断：当前总数和最近一次绘制分开

`kit.getDiagnostics()` 添加：

- `currentTargets`：调用时立即读取当前 DOM 中的 `[data-glass]` 数量。
- `stale`：最近一帧尚未完成，或当前 DOM 总数与上次成功绘制数量不同，标记为 `true`。
- `viewportTop`：Canvas 在 scene 内的相对起点（CSS px）。
- `canvasCssHeight`：本次 Canvas 的 CSS 高度。
- `wallpaperTileHeight/wallpaperTileWidth`：固定参考的背景重复周期尺寸。

新增 `await kit.requestDiagnostics()`：请求合并到下一次正常 RAF，**等该次绘制结束之后**返回诊断快照。如果页面处于隐藏/离屏/失败/销毁状态，则立即返回带旧数据与 `stale` 状态的快照，不会无限等待；页面 `pagehide` 会取消 RAF 并结束悬挂的诊断请求。旧的 `getDiagnostics()` 保留同步调用方式。

新的页面在增加或移除 40 组件时会主动要求刷新诊断。假 WebGL 测试验证增至 43 个目标后，`currentTargets=lastTargets=43`，最近绘制数与剔除数合计为 43。**这些计数反映 JS 提交的绘制调用，不是 GPU 的最终像素输出或设备 FPS。**

## 6. 设备验证门槛

1. iPhone Safari 打开独立 `glass-kit-v04.html` 后，先确认 `GPU · fwidth AA`。
2. 在默认 9 个组件时上传同一樱花背景，记录花枝/桥梁的位置。新增 40 个组件后，上方背景**不再明显放大**。
3. 滚到 Surface 23–40，观察壁纸是否有明显重复接缝、折射图案错位或闪白；按需录制短视频比静态截图更适合判断滚动滞后。
4. 新增 40 个组件后点击「更新渲染数据」，预期 `当前目标 49 / 上次处理 49`（若仍在绘制/暂停则会标明旧数据）。根据视口位置，绘制和剔除之和应为 49。
5. 观察 Canvas 像素是否仍在视口尺寸量级，页面长度增长不再大幅增加 Canvas 分辨率。
6. 移除 40 个组件，再测背景尺寸、组件数、CLEAR/SMOKED、原图对照、输入和导航交互。
7. 切后台返回、横竖屏切换、多次更换本地图片，确认 WebGL 恢复/图片 URL 释放均正常。

**不能以模拟测试宣称真实 iPhone 流畅度、内存峰值或最终壁纸方案完成**。在真正进入「家 ^ ^」之前还需要长聊天列表、动态输入法高度及多层遮挡的架构验证，最后由用户独立确认材质和正式界面的集成范围。
