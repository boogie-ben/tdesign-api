:: BASE_DOC ::

## API
### ImageViewer Props

名称 | 类型 | 默认值 | 说明 | 必传
-- | -- | -- | -- | --
closeBtn | Boolean / Slot / Function | true | 是否展示关闭按钮，值为 `true` 显示默认关闭按钮；值为 `false` 则不显示关闭按钮；也可以完全自定义关闭按钮。TS 类型：`boolean \| TNode`。[通用类型定义](https://github.com/Tencent/tdesign-mobile-vue/blob/develop/src/common.ts) | N
deleteBtn | Boolean | false | 是否显示删除操作 | N
images | Array | [] | 图片数组。TS 类型：`Array<string>` | N
initialIndex | Number | 0 | 初始化页码。TS 类型：`Number` | N
maxZoom | Number | 3 | 最大放大比例。TS 类型：`Number` | N
showIndex | Boolean | false | 是否显示页码 | N
visible | Boolean | false | 隐藏/显示预览。支持语法糖 `v-model` 或 `v-model:visible` | N
defaultVisible | Boolean | false | 隐藏/显示预览。非受控属性 | N
onChange | Function |  | TS 类型：`(index: Number) => void`<br/>翻页时回调 | N
onClose | Function |  | TS 类型：`(context: { trigger: 'close-btn' \| 'overlay' \| 'esc'; e: MouseEvent \| KeyboardEvent }) => void`<br/>关闭时触发，事件参数包含触发关闭的来源：关闭按钮、遮罩层、ESC 键 | N
onDelete | Function |  | TS 类型：`(index: Number) => void`<br/>点击删除操作按钮时触发 | N

### ImageViewer Events

名称 | 参数 | 描述
-- | -- | --
change | `(index: Number)` | 翻页时回调
close | `(context: { trigger: 'close-btn' \| 'overlay' \| 'esc'; e: MouseEvent \| KeyboardEvent })` | 关闭时触发，事件参数包含触发关闭的来源：关闭按钮、遮罩层、ESC 键
delete | `(index: Number)` | 点击删除操作按钮时触发
