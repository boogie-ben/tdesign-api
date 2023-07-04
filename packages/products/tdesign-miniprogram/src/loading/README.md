:: BASE_DOC ::

## API
### Loading Props

名称 | 类型 | 默认值 | 说明 | 必传
-- | -- | -- | -- | --
delay | Number | 0 | 延迟显示加载效果的时间，用于防止请求速度过快引起的加载闪烁，单位：毫秒 | N
duration | Number | 800 | 加载动画执行完成一次的时间，单位：毫秒 | N
external-classes | Array | - | 组件类名，分别用于设置加载组件外层元素，加载组件文本，加载组件指示符，加载指示符内侧同心圆等元素类名。`['t-class', 't-class-text', 't-class-indicator']` | N
indicator | Boolean / Slot | true | 加载指示符，值为 true 显示默认指示符，值为 false 则不显示，也可以自定义指示符。[通用类型定义](https://github.com/Tencent/tdesign-miniprogram/blob/develop/src/common/common.ts) | N
inherit-color | Boolean | false | 是否继承父元素颜色 | N
layout | String | horizontal | 对齐方式。可选项：horizontal/vertical | N
loading | Boolean | true | 是否处于加载状态 | N
pause | Boolean | false | 是否暂停动画 | N
reverse | Boolean | - | 加载动画是否反向 | N
size | String | '20px' | 尺寸，示例：20px | N
text | String / Slot | - | 加载提示文案。[通用类型定义](https://github.com/Tencent/tdesign-miniprogram/blob/develop/src/common/common.ts) | N
theme | String | circular | 加载组件类型。可选项：circular/spinner/dots | N
