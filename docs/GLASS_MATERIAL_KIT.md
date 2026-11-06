# Glass Material Kit 0.1 · 4.2.3 通用液态玻璃材质实验

状态：**独立 Playground 原型，尚未在 iPhone Safari 验收，也未授权接入正式 UI。**

## 1. 我们实际要交付什么

用户强调最终需要的是**通用材质模板**，而不是只针对聊天气泡优化的 Shader。目标是同一套可复用的光学材质，应用于按钮、卡片、导航、输入框、状态标签、弹层、聊天气泡等各种 UI 形状，而不改变它们的文字、交互或原产品结构。

4.2.2 已在用户的 iPhone Safari 上确认 `GPU · fwidth AA` 并保有清透的背景折射，但整体厚度/受光仍不足。4.2.3 采取两个并行步骤：

1. 在 4.2.2 的单峰透镜曲率基础上，小幅增强方向性边缘受光、局部曲面反射及柔和内侧吸光；**不**增大全表面 UV 位移，不引入整圈奶白描边。
2. 将“绘制任意目标形状”的逻辑抽离到独立 `GlassMaterialKit`，以 DOM 属性驱动，而不是在 JS 里写死四个聊天气泡。

视觉参考仍为 `https://github.com/yanceydaisy/liquid-glass-note` 的 CLEAR 材质。该项目公开的材料只作为**视觉目标及光学思路参考**；此 Kit 的 WebGL、CSS、JS 与程序化背景均是独立实现，未复制参考仓库的生产版引擎或素材。

## 2. 文件交付

| 文件 | 职责 |
|---|---|
| `docs/glass-material-kit.js` | 可复用的 WebGL1 光学渲染器，浏览器全局 `window.GlassMaterialKit` |
| `docs/glass-material-kit.css` | 场景层级与 CSS fallback（不定义具体业务组件排版） |
| `docs/glass-kit.html` | 同一场景展示卡片、导航、按钮、输入框、标签、聊天气泡的可交互演示 |
| `docs/GLASS_MATERIAL_KIT.md` | 通用 API、结构契约与验收边界 |
| `tools/check-glass-shader-identifiers.cjs` | 静态检测内嵌 Shader 和新 Kit Shader 的基础/导数扩展两条代码路径 |

旧版 `docs/glass-system-422.html`、`421.html`、`42.html` 等**完全保留**。正式 `sin047/shen-liang-home` 不修改。

## 3. 组件复用契约

### 基础用法

```html
<link rel="stylesheet" href="glass-material-kit.css">
<section id="homeSurface" class="glass-kit-scene">
  <div class="glass-kit-background"></div>
  <div class="glass-kit-foreground">
    <article data-glass data-glass-radius="28">卡片内容</article>
    <button data-glass data-glass-radius="22">原生按钮</button>
    <input data-glass data-glass-radius="18" placeholder="原生输入框">
    <span data-glass data-glass-radius="999" data-glass-material="smoked">标签</span>
  </div>
</section>
<script src="glass-material-kit.js"></script>
<script>
  const kit=GlassMaterialKit.mount({
    scene:document.getElementById("homeSurface"),
    settings:{material:"clear",refraction:.66,thickness:.60,shine:.60,wobble:.12},
    onStatus:({state,aaMode,details})=>console.log(state,aaMode,details)
  });
</script>
```

- `data-glass`：任何需要光学材质的普通 DOM 元素，**不是**特定组件类型。文字、按钮焦点、输入框、可访问性仍由真实 DOM 提供。
- `data-glass-radius`：可选统一圆角（单位 CSS px），`999` 表示胶囊形；不指定时读取 CSS `border-top-left-radius`。首版只支持四角统一半径与圆角矩形。
- `data-glass-material="smoked"`：组件独立材质覆盖；不指定时跟随场景 CLEAR / SMOKED 全局设置。
- `data-glass-refraction` / `data-glass-thickness` / `data-glass-shine` / `data-glass-wobble`：组件独立 0–1 数值覆盖，用于大卡片与小标签分别调节。
- 注意：变更目标属性、动态插入元素后可调用 `kit.refresh()`；组件 ResizeObserver 自动观察新发现的目标。

### JS API

```js
const kit=GlassMaterialKit.mount({scene,source,backgroundCssURL,settings,onStatus});
kit.update({refraction:.7,thickness:.5,shine:.6,wobble:.1,material:"clear",compare:false});
kit.refresh();
kit.setSource(imageOrCanvas, matchingCssImageURL);
await kit.setBackgroundFile(file); // 只处理浏览器本地 File
console.log(kit.getState());
kit.destroy();
```

`setSource` 的背景内容**必须与 CSS 实际展示的背景一致**，否则玻璃内外的纹理会错位。无参数时 Kit 会生成一张测试背景，并同步 CSS。相册上传会自动把同一个 object URL 用于 GL 纹理与 CSS 背景。本地上传没有外发网络请求；另行接入远程图像时需考虑同源/CORS 与上传来源。

### 层级模型

- 场景最底层是 `.glass-kit-background`，使用 `background-size:cover;background-position:center`。
- 其次为一张透明 Canvas，含一个 WebGL Context 和该场景共享的背景纹理。
- 原生 DOM 组件放在 `.glass-kit-foreground` 上层；`[data-glass]` 的背景保持透明，WebGL 只负责玻璃区域内的采样、折射和局部受光。
- 每个组件都按自己的边界矩形、圆角半径以及可选独立材质统一绘制。为不同尺寸调整透镜位移预算，避免小按钮被与大卡片一样的像素位移破坏。
- 浏览器不支持 WebGL 或 GPU 上下文丢失时，自动切换到 CSS fallback，并通过 `onStatus` 报告真实状态。**不能拿 fallback 的外观当 GPU 材质验收。**

## 4. 已知限制与下一阶段

这是“可复用材质引擎”的最小垂直切片，不是已经完整适配所有浏览器/任意视觉形状的通用产品组件库。

- **同一 scene 需要共享一个背景坐标系。** 不同背景、滚动容器或复杂叠层的组件，先分别建立场景或扩展背景采样 API，而不是用一张纹理错误地重采样所有页面。
- 首版只支持统一圆角矩形 / 胶囊形；不支持任意 SVG 路径、多层遮挡、不同角半径或真正的系统背景截取。
- 每个 `GlassMaterialKit.mount()` 实例对应一个独立 WebGL Context；**同一实例内**才共享纹理与 Canvas。正式接入时应优先复用单一可见 scene，避免大量 WebGL contexts。
- 结构重排时每次绘制根据 DOM `getBoundingClientRect()` 对齐，支持滚动、视口与 ResizeObserver；尚未测量大列表/低端设备 GPU 开销。
- 原生输入框、按钮可用，样式/排版属于业务代码；本项目不强制替换既有「家 ^ ^」组件或正式 UI 风格。
- 当前只进行源代码、GLSL 标识符检查及 DOM 演示构建；**真实 iPhone Safari 的 WebGL 编译、视觉差异、原生交互与内存性能仍需验证**。不能仅以静态检查声称视觉复刻成功。

## 5. iPhone Safari 验证

1. 打开独立 `glass-kit.html`，先确认页面右下角显示 `GPU · fwidth AA` 而不是 CSS fallback；若失败提供状态和错误详情。
2. 同一张背景下逐一观察导航、卡片、按钮、输入框、标签、聊天气泡是否都有光学折射，是否出现“某些组件透明、另一些像白板”的不一致。
3. 试用卡片/导航按钮、搜索输入框、收藏按钮、独立 SMOKED 标签：UI 保持原生可交互，文字不随背景扭曲。
4. 切换柔和/高对比背景，使用樱花照片上传，验证玻璃边缘与外部图案衔接自然。
5. 改变 CLEAR / SMOKED、原图对照与四个滑块，确认不同大小的组件都能同步更新。
6. 旋转手机、缩放、滚动、切后台再返回；如果资源失败，正确进入 CSS fallback。
7. 与 4.2.2 仅比较**光学方向**，不要因布局/组件尺寸变化断言精确像素差异。视觉基准继续保留 4.2.2。

这一版的目标是证明“相同质感可复用于多种 UI”，而不是向正式主仓库直接发布一个未经验证的全站设计系统。
