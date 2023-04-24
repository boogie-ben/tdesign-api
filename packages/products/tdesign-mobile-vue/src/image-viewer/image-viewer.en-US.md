:: BASE_DOC ::

## API
### ImageViewer Props

name | type | default | description | required
-- | -- | -- | -- | --
closeBtn | Boolean / Slot / Function | true | Typescript：`boolean \| TNode`。[see more ts definition](https://github.com/Tencent/tdesign-mobile-vue/blob/develop/src/common.ts) | N
deleteBtn | Boolean | false | \- | N
images | Array | [] | Typescript：`Array<string>` | N
initialIndex | Number | 0 | Typescript：`Number` | N
maxZoom | Number | 3 | Typescript：`Number` | N
showIndex | Boolean | false | \- | N
visible | Boolean | false | `v-model` and `v-model:visible` is supported | N
defaultVisible | Boolean | false | uncontrolled property | N
onChange | Function |  | Typescript：`(index: Number) => void`<br/> | N
onClose | Function |  | Typescript：`(context: { trigger: 'close-btn' \| 'overlay' \| 'esc'; e: MouseEvent \| KeyboardEvent }) => void`<br/> | N
onDelete | Function |  | Typescript：`(index: Number) => void`<br/> | N

### ImageViewer Events

name | params | description
-- | -- | --
change | `(index: Number)` | \-
close | `(context: { trigger: 'close-btn' \| 'overlay' \| 'esc'; e: MouseEvent \| KeyboardEvent })` | \-
delete | `(index: Number)` | \-
