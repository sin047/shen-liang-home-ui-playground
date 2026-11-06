# Glass Material Kit 0.5 — Viewport-fixed Wallpaper

状态：**独立 Playground Draft 实验，尚未经过 iPhone Safari 验收。正式「家 ^ ^」界面继续冻结。**

## 用户实测反馈与技术目标

Kit 0.4 的 iPhone Safari 截图确认了 `GPU · fwidth AA`、长页面 49 个目标组件、最近 3 次 GPU 绘制和 46 个剔除组件。长内容不再使单幅背景无限放大，但由于 `background-repeat:repeat-y`，在 Surface 01/29 附近产生了明显的重复接缝。用户提出更合适的目标：**组件滚动，背景图片在屏幕上不动**。

Kit 0.5 改为 **固定单张壁纸 + 滚动 UI + 视口大小 WebGL Canvas + 屏幕坐标折射采样**。不再尝试通过淡入、拼接或重复来隐藏原图接缝。

## 文件与隔离范围

| 文件 | 内容 |
|---|---|
| `docs/glass-material-kit-v05.js` | 0.5 光学引擎，单幅 viewport-fixed 背景与对应的 GPU 采样映射 |
| `docs/glass-material-kit-v05.css` | 外置、固定定位的壁纸层样式 |
| `docs/glass-kit-v05.html` | 独立手机版测试页，保留 40 组件测试、照片上传和诊断 |
| `tools/check-glass-kit-v05.cjs` | 模拟 DOM + WebGL 的屏幕坐标、滚动、材质、资源回归 |
| `tools/check-glass-shader-identifiers.cjs` | 新增 v05 Shader 基础和 OES derivative 变体检查 |
| `.github/workflows/glass-shader-identifiers.yml` | 在 Pull Request 与 main 的相关变动中执行 v05 测试 |

所有旧版 Kit 0.1–0.4 与早期 Glass System 4.x 页面**完整保留**。正式 `sin047/shen-liang-home` 仓库不修改。

## 设计：真正的固定壁纸层

```html
<link rel="stylesheet" href="glass-material-kit.css">
<link rel="stylesheet" href="glass-material-kit-v05.css">
<div id="wallpaper" class="glass-kit-viewport-wallpaper" aria-hidden="true"></div>
<main>
  <section id="scene" class="glass-kit-scene">
    <div class="glass-kit-foreground">
      <article data-glass data-glass-radius="28">卡片</article>
      <button data-glass data-glass-profile="compact">按钮</button>
    </div>
  </section>
</main>
<script src="glass-material-kit-v05.js"></script>
<script>
  const kit=GlassMaterialKit.mount({
    scene: document.getElementById("scene"),
    backgroundElement: document.getElementById("wallpaper"),
    settings: {refraction:.66,thickness:.60,shine:.60,wobble:.12}
  });
</script>
```

**关键约束：**

- `backgroundElement` 必须在滚动 scene **之外**，不被 scene 的 `overflow:hidden` 或 transform 改变固定定位语义。Kit 0.5 在 DOM 上验证 `!scene.contains(backgroundElement)`。
- 外置壁纸是浏览器 CSS `position:fixed; inset:0` 层，不设置 `background-attachment:fixed`，也不依赖 Safari 不稳定的重复背景/固定背景 attachment 处理。
- 一张原图以 **viewport 的 `innerWidth × innerHeight`** 做 cover，`center center` 显示且 `background-repeat:no-repeat`。Scene 高度变化、组件增删、上下滚动均不改变这个缩放比例；设备方向/布局 viewport 尺寸变化才重新计算 cover 尺寸。
- Shader 对组件使用的 `bgScale/bgOffset` 由其当前 `getBoundingClientRect` 和 viewport 中背景图的位置求得。画布滚动后，仍采样对应**屏幕坐标**上的同一张图。不再使用垂直 `fract()` 重复取样。
- 纹理只在初次加载、用户更换图片、WebGL context 恢复时上传；滚动只触发 RAF 和裁剪渲染。
- Canvas 继续限制在可见视口+上下 overscan 区域，继续使用 0.4 的像素预算、可视组件剔除、`requestDiagnostics()`、40 组件压力测试。
- 仍保持同一套 CLEAR/SMOKED 玻璃 SDF、径向折射、厚度/曲面反光和自适应 compact/control/panel/neutral 参数。**仅改变取样坐标，不重画材质外观**。

## 透明玻璃与背景的一致性

CSS 背景显示来自用户照片或程序化同一原图；GPU 上传同一图片到共享纹理。CSS 外部像素保持固定，玻璃内的 Shader 从它的视口对应位置重新采样并做折射。只有这两个映射同源才能达到“背景不动，玻璃在上面移动”的效果。

实验页面将固定图展示在整个 viewport，包括 Playground 页面空白区域，而不是只放在原来的圆角场景内部。这是对通用「家」全屏背景的一种集成示意，**并非授权更改正式 UI 的背景样式**。

## 已知风险与限制

- `position:fixed` 可能受其父级 transform/filter/contain 影响，因此应放在普通 body 层级，避免套在变换容器内。
- Safari 快速惯性滚动时，DOM 和固定背景由浏览器合成，但 WebGL viewport-strip 的位置仍由 JS RAF 更新，**可能出现一帧延迟**。这需要实机录屏测试；如明显，下一版应使用合成器驱动的 fixed/viewport overlay Canvas 加场景裁剪，而不是简单无限加 overscan。
- `window.innerHeight` 的变化（Safari 地址栏、键盘、横竖屏）可能触发 viewport cover 的重新裁剪。用户要求的是滚动保持不动，而不是在键盘/视口尺寸变化时强行锁死显示比例。
- 首版背景固定在**页面的布局视口**，对于多个独立固定壁纸、嵌套滑动区、不同组件独立背景图、跨场景遮挡仍需后续设计。
- 部分业务界面如果给 `.glass-kit-scene` 设了非透明背景，会遮挡外置壁纸；集成时应将需要透视背景的场景设为透明，同时保持原组件的排版/圆角。
- 对于已上传但不再使用的 Object URL，沿用原有生命周期和异步图片竞争保护；卸载时恢复外部壁纸之前的 CSS 图像声明。

## 自动测试与设备验收

**代码/模拟验证：**
- JavaScript 语法与所有 GLSL 变量检查（常规及 `fwidth(sd)` 扩展）。
- 新旧材质光学计算逻辑的代码比对：径向折射和光照不变。
- 背景 `no-repeat`、固定 `background-position:center center`、同一 viewport 下 Scene 变长不改变 `backgroundSize`。
- 模拟滚动 1800px 后，取相同屏幕 Y，GPU UV 应保持一致；Canvas viewport strip 仍跟随可视区域。
- 新增 40 个组件后，诊断数据 `currentTargets/lastTargets=43`（模拟基础 3 个，而真机演示为 49）；保留暂停/恢复/纹理上传、清理与上传竞争测试。

**iPhone Safari 真机验收建议：**
1. 先看 `GPU · fwidth AA`，避免把 CSS fallback 当成玻璃引擎。
2. 上传相同樱花照片，保持 0.4 与 0.5 同一材质参数值。查看页面顶部的伞骨和桥梁位置。
3. 增加 40 个 Surface，缓慢滚动到 Surface 25–40：**屏幕背景的花枝位置不应该跟着页面移动，也不能出现图片重复接缝**。观察经过玻璃表面时是否有一致折射。
4. 检查上滑和下滑是否有 Canvas 错位、闪白、玻璃短暂消失；最快的惯性滑动最好用短视频评估。
5. 测试原图对照、CLEAR/SMOKED、导航和输入、图片更换、切后台恢复；尤其是打开键盘后背景是否突然重新裁剪。
6. 40 个组件的诊断应该读 `当前目标 49 / 上次处理 49`，绘制数加剔除数约等于 49。
7. 与保留的 Kit 0.4 对照：如 0.5 虽无接缝但滚动出现严重一帧延迟，则不能将其视为正式产品级解决方案。

**没有 iPhone 实机测试前，0.5 只可作为独立实验，绝不修改正式家的 UI。**
