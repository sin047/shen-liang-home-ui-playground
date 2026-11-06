# Glass Material Kit 0.2 — 自适应组件材质与稳定性试验

状态：**Playground 独立实验，尚未合并、尚未经 iPhone Safari 视觉/稳定性验收**。

## 方向和冻结边界

用户确认最终需求是一套能用于「家 ^ ^」不同 UI 控件的通用液态玻璃材质，而不只是聊天气泡。用户在 iPhone Safari 上测试了 Kit 0.1，明确说明原图对照和玻璃效果都不错，已有 `GPU · fwidth AA` 的设备截图。

因此 Kit **0.1 必须保留为阶段性基线**。我们先在独立 UI Playground 完成 Kit 的跨组件视觉一致性、背景同步、生命周期和性能验证，再评估接入 `sin047/shen-liang-home`。**本轮未修改正式产品、原有 UI、Canonical 文档或 Kit 0.1 页面。**

## 本轮交付

| 文件 | 职责 |
|---|---|
| `docs/glass-material-kit-v02.js` | 保留一场景共享 GL / 纹理 / Canvas 结构，新增组件尺寸预设与背景加载竞态保护 |
| `docs/glass-kit-v02.html` | 0.2 的独立组件演示，可一键切换「尺寸适配 / 中性强度」 |
| `tools/check-glass-kit-v02.cjs` | 模拟 DOM + WebGL API 的 Node 运行时冒烟测试，不是实际 GPU 编译器 |
| `tools/check-glass-shader-identifiers.cjs` | 同时检验 Kit 0.1、0.2 与早期原型的 GLSL 标识符 |
| `.github/workflows/glass-shader-identifiers.yml` | PR 上运行新旧 Kit 测试 |
| `docs/GLASS_MATERIAL_KIT_02.md` | 本交接及测试门槛 |

基线继续保留：`docs/glass-kit.html`、`docs/glass-material-kit.js`、`docs/glass-material-kit.css`、`docs/glass-system-422.html`。

## 自适应材质的规则

所有设定作用于**同一个 Shader**，并不复制 N 套材质。局部属性只影响该组件实例的 Uniform。

| Profile | 适用组件 | 折射倍率 | 厚度倍率 | 高光倍率 | 波动倍率 |
|---|---|---:|---:|---:|---:|
| `compact` | 状态标签、小按钮、较矮的气泡 | 0.66 | 0.84 | 1.19 | 0.48 |
| `control` | 中等输入框、导航、长内容气泡 | 0.84 | 1.00 | 1.12 | 0.72 |
| `panel` | 大卡片、信息面板 | 0.92 | 1.06 | 1.08 | 0.86 |
| `neutral` | 对照组；不按尺寸调节 | 1.00 | 1.00 | 1.00 | 1.00 |

说明：数值是**实验性系数，不是物理单位或定稿参数**。局部不指定 `data-glass-profile` 时，会按元素 CSS 高度自动选择：不大于 68px 为 compact，69–140px 为 control，更高为 panel。

全局调参先乘对应预设倍率，再截到 0–1。明确提供 `data-glass-refraction="0.9"` 等属性时，**局部绝对值优先**，不再额外乘 Profile。这样一套全局滑块仍然可以控制所有组件，而组件特例不被破坏。

### 示例

```html
<button data-glass data-glass-profile="compact" data-glass-radius="22">
  收藏
</button>
<article data-glass data-glass-profile="panel" data-glass-radius="28">
  卡片
</article>
<input data-glass data-glass-profile="control" data-glass-radius="20">
```

Kit 0.2 的 API 仍为 `GlassMaterialKit.mount()` / `update()` / `setSource()` / `setBackgroundFile()` / `refresh()` / `destroy()`。新增只读 `GlassMaterialKit.profiles`，版本标记 0.2.0。CSS 直接复用 Kit 0.1，不改变其外观布局。

## 背景一致性与资源修正

- `setSource(canvas)` 可从 canvas 本身生成 CSS 背景 URL；`setSource(image)` 从当前图像 URL 取得对应 CSS 背景。
- 对无法确定背景 URL 的来源，明确抛错，而不是让 CSS 显示旧背景、WebGL 采样新纹理造成错位。
- 显式 `setSource()` 会使尚未完成的 `setBackgroundFile()` 请求失效；迟到的上传结果不能覆盖更新的背景。迟到请求产生的 object URL 需要回收。
- 旧背景 object URL 仅在替换后回收，不提前回收正在展示的背景。
- `destroy()` 后拒绝新的背景文件上传；`update()` 不再向已销毁场景调度渲染。
- 这些变化是在 Kit 0.2 单独实现的，并未修改 Kit 0.1。

## 自动验证与实机门槛

**静态/模拟测试目标：**
- 检查库和演示页面的 JS 语法。
- 同时检查两版 Kit 的 GLSL 声明和开启 `fwidth(sd)` 时的 Shader 变体。
- 用模拟 DOM / WebGL1 接口验证每个组件发出的折射 Uniform，global/profile/local 覆盖优先级。
- 验证背景上传与显式换图交错时的结果防竞态、URL 回收、context lost/restored、销毁及重复挂载。
- **模拟 WebGL 不会证明真机 GPU 编译、帧率或光学表现。**

**iPhone Safari 实测：**
1. 先看 `GPU · fwidth AA`，不是 `CSS fallback`。
2. 使用**相同樱花背景**分别打开 Kit 0.1 与 Kit 0.2；用 0.2 的「关闭尺寸适配」开关观察 small/medium/panel 强度差异。
3. 检查按钮、小标签不再像过度扭曲的小透镜；大卡片仍有足够透明折射和局部反光。
4. 拿着相同滑块数值切换 CLEAR/SMOKED、原图对照与独立 SMOKED 标签，确认组件独立覆盖有效。
5. 快速切换相册图片和预设背景，检查玻璃纹理不会与外部背景不一致。
6. 测试导航/输入框、滚动、横竖屏、缩放、App 切后台回前台。
7. 只有经过这些测试，再考虑 Kit 0.2 成为新的保留基线；**仍不因此自动修改正式 UI**。

## 后续边界

0.2 仍只支持统一四角半径的矩形/胶囊形。对任意路径遮罩、多层独立背景、长列表虚拟化和复杂堆叠不是通用产品级解决方案。更多组件数和低端设备上 WebGL 性能，需专门量测。

**一旦真实设备确认 Kit 可用，再进行独立集成设计评审：保持「家 ^ ^」现有 UI 风格和业务行为，采用可回滚/渐进方式逐组件接入；不得因为材质实验而重新设计产品。**
