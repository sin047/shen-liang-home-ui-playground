# Glass Material Kit 0.3 — Stability & Performance Lab

**状态：独立 Playground Draft 实验，等待 CI 和 iPhone Safari 实测。正式「家 ^ ^」UI 暂不接入。**

## 目标与既有基线

用户已在 iPhone Safari 实测 Kit 0.1 及 0.2：GPU 状态为 `GPU · fwidth AA`，多种组件可以使用相同玻璃材质，用户对 0.2 的尺寸适配与透视效果给出正面反馈。因此本轮**冻结光学 Shader 和 0.2 的 compact/control/panel/neutral 预设**，不追加高光、修改圆角、替换正式 UI 或重新设计「家 ^ ^」的布局。

工作只发生在 `sin047/shen-liang-home-ui-playground` 的独立版本 `docs/glass-material-kit-v03.js` 和 `docs/glass-kit-v03.html`。原 `docs/glass-material-kit-v02.js`、`docs/glass-kit-v02.html`、Kit 0.1 与全部早期 4.x 演示**保持不变**。

## 0.3 实现范围

### 1. 画布及纹理预算

- 保留 0.2 的单 scene / 单透明 Canvas / 单 WebGL Context / 单张背景纹理。
- 在旧 DPR 与 `pixelBudget=5,000,000` 上限之外，再应用设备 `MAX_RENDERBUFFER_SIZE` 的宽、高限制，避免长场景申请超过 GPU 支持的渲染目标尺寸。
- 同时限制宽高，保留场景宽高比。超过预算的大场景会**降低有效分辨率**，不是声称保持相同清晰度。
- 背景 `texImage2D` 只在首次加载、更新图片或恢复 WebGL Context 时发生；滚动/调整滑块只触发重新绘制，不重新上传纹理。
- 不新增持续动画。

### 2. 长页面与多组件

- 保持 `data-glass` 为任何 DOM 组件的统一入口。仍使用组件自身的 `getBoundingClientRect` 和共享圆角 SDF。
- 将组件与 scene、可视视口相交情况作为绘制门槛。完全在屏幕外的元素不会发出 `gl.drawArrays`；`gl.scissor` 仍限制单个组件的提交区域。
- `MutationObserver` 继续处理组件增删，同时观察与光学相关的 `data-glass*`、class、style 变更；`ResizeObserver` 用于尺寸变化，保留单个 RAF 合并。
- 如果浏览器支持 `IntersectionObserver`，scene 完全离开视口时暂停 RAF；重新进入视口则安排一次刷新。
- **注意**：首版仍把整个 scene 映射为一张 Canvas。超长场景会受分辨率预算影响；目前不支持在内部嵌套滚动容器中自动裁剪玻璃，这需要单独的容器遮罩/视口 tiling 方案。不能把本轮称为完整的无限聊天历史性能优化。

### 3. 生命周期

- `document.visibilitychange`：隐藏时取消待提交的 RAF；重新可见后合并刷新一次。
- `pagehide/pageshow`：对应页面后台/回退缓存（BFCache）场景暂停或恢复，不主动销毁仍可恢复的页面。
- `webglcontextlost/restored`：保留原恢复逻辑，重新创建程序、纹理并上传现有背景；已有 `CSS fallback` 继续显示失败原因。
- `destroy()` 清理 Canvas、监听器、三个 observer、pending RAF 和激活的 blob URL，避免组件卸载后仍重复绘制。即使 JS 层存在旧 callback，也由 `disposed` 阻止继续操作。
- 不改变 0.2 的背景上传请求序列与资源释放语义。

### 4. 可控诊断而非冒充性能报告

`kit.getDiagnostics()` 返回冻结快照：

| 字段 | 含义 |
|---|---|
| `frames` | 本 Kit 实例提交完成的 JS 绘制轮次 |
| `lastTargets` | 最近一次绘制检查的组件总数 |
| `lastDrawn` | 最近一次执行 `gl.drawArrays` 的组件数 |
| `lastCulled` | 最近一次因尺寸、视口或 scissor 无效而剔除的组件数 |
| `canvasPixels` | 当前 WebGL Canvas backing-store 像素 |
| `texturePixels` | 当前上传背景纹理像素 |
| `estimatedGpuRGBABytes` | `4 × (canvasPixels + texturePixels)` 的粗略 RGBA 存储估算 |
| `suspended` | 是否因页面隐藏、pagehide 或 scene 不可见暂停绘制 |

**限制**：估算不含 GPU 驱动、深度/多重采样、浏览器图片解码、临时贴图与其他资源；`frames` 不是实时帧率，不能据此声称 FPS、耗电或设备显存峰值。

演示页面新增「增加 40 个组件 / 移除 40 个组件」与「更新渲染数据」控件，后者只采样一次，不设置后台计时器。

## 自动验证

- 继承 `tools/check-glass-kit-v02.cjs` 的模拟 DOM/WebGL 基线。
- `tools/check-glass-kit-v03.cjs` 额外验证：RAF 合并、静置时无持续帧、滚动不重复上传纹理、视口外组件剔除、隐藏页面与 scene 暂停、pagehide/pageshow 恢复、Canvas 不超过像素及渲染缓冲限制、Context 恢复与卸载清理。
- GLSL 标识符检查覆盖 0.3 引擎（包括 OES derivative 路径），但光学 Shader 与 0.2 **逐字节相同**。
- GitHub Actions 对 0.1、0.2、0.3 的相关测试按项目工作流运行。
- **模拟 WebGL 不是真实 GPU；没有用这些测试推导 iPhone 实测性能。**

## iPhone Safari 设备验收

1. 使用同一张樱花图，先比较 0.2 和 0.3 的默认版式。重点确认玻璃透明度、边缘和曲面高光没有视觉回退。
2. 确认 GPU 状态为 `GPU · fwidth AA`，且「原图对照」仍可切换。
3. 点击「更新渲染数据」，看组件数/绘制数/Canvas 尺寸是否合理；增加 40 个组件，慢慢上下滚动，再刷新数据。屏幕外元素应该被剔除，长场景可能显得更软（预算限制）。
4. 移除 40 个组件，恢复默认画面。使用导航、输入框、按钮和自定义图片，确认一切交互正常。
5. 快速切换背景、横竖屏、缩放和滚动，观察是否出现错位、空白、纹理闪烁或意外 CSS fallback。
6. 切到其他 App，再返回 Safari，确认 GPU 状态和纹理恢复。
7. 如果需要未来生产级的长对话历史，必须额外设计 **viewport-sized canvas/virtualization/occlusion**，完成持续性能测试才可接入。

**阶段决策：** Kit 0.3 只有在 CI 与 iPhone Safari 均获得肯定结果后才能进入保留基线；正式项目的 UI 外观、Canonical 关系设定及产品定位保持独立、冻结。未来迁移需再审查真实组件层级、背景纹理来源、滚动策略、GPU 预算和无 WebGL fallback。
