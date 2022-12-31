const chalk = require('chalk');
const { UNIT_TEST_EVENTS_MAP } = require('./const/events-map');

function getItDescription(oneApiData) {
  const type = oneApiData.field_category_text.toLocaleLowerCase();
  return `'${type}.${oneApiData.field_name} works fine'`;
}

function getFullMountCode(framework, componentCode) {
  if (framework === 'Vue(PC)') {
    return [
      `mount({
        render() {
          return (
            ${componentCode}
          );
        }
      })`
    ];
  }
  if (['VueNext(PC)', 'Vue(Mobile)'].includes(framework)) {
    return componentCode.length > 100 ? `mount(\n${componentCode}\n)` : `mount(${componentCode})`;
  }
  if (['React(PC)', 'React(Mobile)'].includes(framework)) {
    return componentCode.length > 100 ? `render(\n${componentCode}\n)` : `render(${componentCode})`;
  }
}

function filterObject(obj) {
  Object.keys(obj).forEach((key) => {
    if (key === undefined) {
      delete obj[key];
    }
  });
}

/**
 * 获取测试组件实例
 * @param {String} framework 框架名称
 * @param {String} component 组件名称
 * @param {Object} props API 属性和对应的值，如：{ disabled: true }。注意：props.events 表示绑定的事件
 * @param {Object} extra 在 API 系统中录入的内容
 *  extra.content 子节点内容，如：{ content: '' }；有的组件存在子节点（如 Button），有的组件不需要子节点（如 Divider）。
 *  extra.wrapper 获取组件实例的方法，复杂组件需要预设测试实例，以便不同的测试用例复用，如：{ wrapper: 'getNormalTableMount' }；
 */
function getMountComponent(framework, component, props, extra = {}) {
  const { content, wrapper } = extra;
  filterObject(props);
  const events = props.events;
  delete props.events;
  let mountComponent = '';
  if (wrapper) {
    const params = [component, getPropsObjectString(props, events), events].filter(v => v).join(', ');
    return `${wrapper}(${params})`;
  } else {
    const properties = props
      ? Object.keys(props).map((key) => {
        const value = typeof props[key] === 'object' ? JSON.stringify(props[key]) : props[key];
        return `${key}={${value}}`;
      }).join(' ')
      : '';
    mountComponent = `<${component} ${properties} ${events || ''}>${content || ''}</${component}>`;
  }
  return getFullMountCode(framework, mountComponent);
}

function getPropsObjectString(props, events) {
  if (!props || !Object.keys(props).length) {
    return events ? '{}' : '';
  }
  const entries = Object.entries(props);
  if (!entries.length) return {};
  const list = entries.map(([name, value]) => `'${name}': ${value}`);
  return `{ ${list.join(', ')} }`;
}

/**
 * 获取快照代码
 * @param {Boolean} snapshot 是否输出快照
 * @param {String} framework 框架名
 * @param {String} wrapperIndex 可选值：'1'/'2'/'3'/'4'/... 同一个函数中，避免重复变量名，给变量名添加下标字符串，如：wrapper1, container2
 * @returns 快照代码
 */
function getSnapshotCase(snapshot, framework, wrapperIndex = '') {
  if (!snapshot) return;
  if (framework.indexOf('Vue') !== -1) {
    return `expect(wrapper${wrapperIndex}.element).toMatchSnapshot();`
  }
  if (framework.indexOf('React') !== -1) {
    return `expect(container${wrapperIndex}).toMatchSnapshot();`
  }
}

/**
 * 或者测试实例定义
 * @param {String} framework 框架名称
 * @param {String} mountCode 测试代码实例，如：<Button disabled={true} /> 或者 getNormalTableMount(BaseTable, { bordered: false })
 * @param {String} wrapperIndex 可选值：'1'/'2'/'3'/'4'/... 同一个函数中，避免重复变量名，给变量名添加下标字符串，如：wrapper1, container2
 * @param {String} goalDom 寻找目标元素的选择器
 * @returns 
 */
function getWrapper(framework, mountCode, wrapperIndex = '', goalDom = '') {
  if (framework.indexOf('Vue') !== -1) {
    const findDomCode = goalDom ? `.find('${goalDom}')` : '';
    return `const wrapper${wrapperIndex} = ${mountCode}${findDomCode};`;
  }
  if (framework.indexOf('React') !== -1) {
    getReactWrapper(mountCode, wrapperIndex = '', goalDom = '');
  }
}

function getReactWrapper(mountCode, wrapperIndex = '', goalDom = '') {
  const i = wrapperIndex;
  if (goalDom) {
    return [
      `const wrapper${i} = ${mountCode};`,
      `const container${i} = wrapper${i}.container.querySelector('${goalDom}');`
    ].join('\n');
  }
  return wrapperIndex
    ? `const { container: container${wrapperIndex} } = ${mountCode};`
    : `const { container } = ${mountCode};`;
}

/**
 * 验证某个 DOM 是否存在
 * @param {String} framework 框架名称
 * @param {String} domSelector DOM Selector
 * @param {String} wrapperIndex 可选值：'1'/'2'/'3'/'4'/... 同一个函数中，避免重复变量名，给变量名添加下标字符串，如：wrapper1, container2
 * @returns 
 */
function getDomExpectTruthy(framework, domSelector, wrapperIndex = '') {
  if (!domSelector) return;
  // 在整个文档范围内查询节点（此时的元素不在组件内部），此时测试用例没有框架差异 `'document.class-name'`
  if (domSelector.indexOf('document') !== -1) {
    const selector = domSelector.replace('document', '');
    return `expect(document.querySelector(${selector})).toBeDefined();`;
  }
  if (framework.indexOf('Vue') !== -1) {
    return `expect(wrapper${wrapperIndex}.find(${domSelector}).exists()).toBeTruthy();`;
  }
  if (framework.indexOf('React') !== -1) {
    return `expect(container${wrapperIndex}.querySelector(${domSelector})).toBeTruthy();`;
  }
}

/**
 * 验证某个 DOM 是否不存在
 * @param {String} framework 框架名称
 * @param {String} domSelector DOM Selector
 * @param {String} wrapperIndex 可选值：'1'/'2'/'3'/'4'/... 同一个函数中，避免重复变量名，给变量名添加下标字符串，如：wrapper1, container2
 * @returns 
 */
function getDomExpectFalsy(framework, domSelector, wrapperIndex = '') {
  if (!domSelector) return;
  // 在整个文档范围内查询节点（此时的元素不在组件内部），此时测试用例没有框架差异
  if (domSelector.indexOf('document') !== -1) {
    const selector = domSelector.replace('document', '');
    return `expect(document.querySelector(${selector})).toBeNull();`;
  }
  if (framework.indexOf('Vue') !== -1) {
    return `expect(wrapper${wrapperIndex}.find(${domSelector}).exists()).toBeFalsy();`;
  }
  if (framework.indexOf('React') !== -1) {
    return `expect(container${wrapperIndex}.querySelector(${domSelector})).toBeFalsy()`;
  }
}

/**
 * 验证某个 DOM 存在的数量
 * @param {String} framework 框架名称
 * @param {Array<Object>} domAndCount { domSelector: number }，示例：{ ".t-table__row--fixed-top": 3}
 * @param {String} wrapperIndex 可选值：'1'/'2'/'3'/'4'/... 同一个函数中，避免重复变量名，给变量名添加下标字符串，如：wrapper1, container2
 * @returns 
 */
function getDomCountExpectCode(framework, domAndCount, wrapperIndex = '') {
  if (framework.indexOf('Vue') !== -1) {
    return Object.entries(domAndCount).map(([className, countOrIndex]) => {
      if (!isNaN(countOrIndex)) {
        return `expect(wrapper${wrapperIndex}.findAll('${className}').length).toBe(${countOrIndex});`;
      }
    }).join('\n');
  }
  if (framework.indexOf('React') !== -1) {
    return Object.entries(domAndCount).map(([className, countOrIndex]) => {
      if (!isNaN(countOrIndex)) {
        return `expect(container${wrapperIndex}.querySelectorAll('${className}').length).toBe(${countOrIndex});`;
      }
    }).join('\n');
  }
}

function getClassNameExpectTruthy(framework, className, wrapperIndex = '') {
  if (framework.indexOf('Vue') !== -1) {
    return `expect(wrapper${wrapperIndex}.classes(${className})).toBeTruthy();`;
  }
  if (framework.indexOf('React') !== -1) {
    return `expect(container${wrapperIndex}.firstChild).toHaveClass(${className});`;
  }
}

function getClassNameExpectFalsy(framework, className, wrapperIndex = '') {
  if (framework.indexOf('Vue') !== -1) {
    return `expect(wrapper${wrapperIndex}.classes(${className})).toBeFalsy();`;
  }
  if (framework.indexOf('React') !== -1) {
    return `expect(container${wrapperIndex}.querySelector(\`.\${${className}}\`)).toBeFalsy();`;
  }
}

/**
 * 获取属性测试代码（不包含 DOM 查询）
 * @param {*} framework 框架名称
 * @param {*} attributes { attributeName: attributeValue }
 * @param {*} wrapperIndex 
 * @returns 
 */
function getAttributeExpect(framework, attributes, wrapperIndex = '') {
  if (framework.indexOf('Vue') !== -1) {
    return Object.entries(attributes).map(([attribute, value]) => {
      return `expect(wrapper${wrapperIndex}.attributes(${attribute})).toBe(${value});`;
    }).join('\n');
  }
  if (framework.indexOf('React') !== -1) {
    return Object.entries(attributes).map(([attribute, value]) => {
      return `expect(container${wrapperIndex}.firstChild.getAttribute(${attribute})).toBe(${value});`;
    }).join('\n');
  }
}

function getAttributeValue(attributeValue) {
  const isNotToBe = attributeValue.includes('not.');
  const value = isNotToBe ? attributeValue.slice(4) : attributeValue;
  const toBeOrNotToBe = isNotToBe ? 'not.' : '';
  // 如果是关键词，直接返回
  if (['toBeUndefined'].includes(value)) {
    return `${toBeOrNotToBe}${attributeValue}()`;
  }
  return `${toBeOrNotToBe}toBe('${attributeValue}')`;
}

/**
 * 获取属性测试代码（包含 DOM 查询）
 * @param {String} framework 框架名称
 * @param {Array} expectAttributes [{"dom":"tbody > tr","attribute":{"data-level":"level-1"}}]
 */
function getDomAttributeExpect(framework, expectAttributes, wrapperIndex = '') {
  let arr = [];
  if (framework.indexOf('Vue') !== -1) {
    expectAttributes.forEach(({ dom, attribute }, index) => {
      const oneExpect = [
        `const domWrapper${index || ''} = wrapper${wrapperIndex}.find('${dom}');`,
        Object.entries(attribute).map(([attributeName, attributeValue]) => {
          return `expect(domWrapper${index || ''}.attributes('${attributeName}')).${getAttributeValue(attributeValue)};`;
        }).join('\n'),
      ];
      arr = arr.concat(oneExpect);
    });
  }
  if (framework.indexOf('React') !== -1) {
    expectAttributes.forEach(({ dom, attribute }, index) => {
      const oneExpect = [
        `const domWrapper${index || ''} = container${wrapperIndex}.querySelector('${dom}');`,
        Object.entries(attribute).map(([attributeName, attributeValue]) => {
          return `expect(domWrapper${index || ''}.getAttribute('${attributeName}')).${getAttributeValue(attributeValue)};`;
        }).join('\n'),
      ];
      arr = arr.concat(oneExpect);
    });
  }
  return arr.join('\n');
}

/**
 * 校验类名（支持子元素类名查询和验证）
 * @param {*} framework 框架名称
 * @param {*} expect "expect": [{ "dom": "tbody > tr", "className": { "tdesign-class": true } }]
 * @param {*} wrapperIndex 
 */
function getDomClassNameExpect(framework, expect, wrapperIndex = '') {
  let arr = [];
  if (framework.indexOf('Vue') !== -1) {
    expect.forEach(({ dom, className }, index) => {
      const oneExpect = [
        `const domWrapper${index || ''} = wrapper${wrapperIndex}.find('${dom}');`,
        Object.entries(className).map(([className, exist]) => {
          const truthyOrFalsy = exist ? 'toBeTruthy' : 'toBeFalsy';
          return `expect(domWrapper${index || ''}.classes('${className}')).${truthyOrFalsy}();`;
        }).join('\n'),
      ];
      arr = arr.concat(oneExpect);
    });
  }
  if (framework.indexOf('React') !== -1) {
    expect.forEach(({ dom, className }, index) => {
      const kidDomVariable = `domWrapper${index || ''}`;
      const oneExpect = [
        `const ${kidDomVariable} = container${wrapperIndex}.querySelector('${dom}');`,
        Object.entries(className).map(([className, exist]) => {
          if (exist) {
            return `expect(${kidDomVariable}).toHaveClass('${className}');`;
          } else {
            return `expect(${kidDomVariable}.classList.contains('${className}')).toBeFalsy();`;
          }
        }).join('\n'),
      ];
      arr = arr.concat(oneExpect);
    });
  }
  return arr.join('\n');
}

function getArrayCode(arr) {
  return `[${arr.map(val => typeof val === 'string' ? `'${val}'` : JSON.stringify(val)).join(', ')}]`;
}

function getObjectCode(obj) {
  const arr = [];
  Object.entries(obj).forEach(([key, value]) => {
    const finalKey = key.indexOf('-') !== -1 ? `'${key}'` : key;
    const finalValue = typeof value === 'string' ? `'${value}'` : value;
    arr.push(`${finalKey}: ${finalValue}`);
  });
  return `{ ${arr.join(', ')} }`;
}

function parseJSON(json, error = '') {
  try {
    return JSON.parse(json);
  } catch (e) {
    console.log(chalk.red(error || `${json} is not a JSON.`));
    return {};
  }
}

/**
 * 分离事件和对应的 DOM
 * 如分离 trigger: 'click(.t-input__suffix-clear)' 为 trigger: 'click' 和 triggerDom: '.t-input__suffix-clear'
 */
function formatToTriggerAndDom(oneExpect) {
  const [trigger, tmpTriggerDom] = oneExpect.trigger.split('(');
  const triggerDom = oneExpect.triggerDom || tmpTriggerDom?.slice(0, -1);
  return { trigger, triggerDom };
}

function getFireEventName(event, framework) {
  const eventInfo = framework.indexOf('Vue') !== -1 ? event : UNIT_TEST_EVENTS_MAP[event];
  if (!eventInfo) {
    console.log(chalk.error(`can not recognize Event Name: ${event}. Check Event Name in https://github.com/vuejs/test-utils/blob/main/src/constants/dom-events.ts#L109`));
    return;
  }
  if (typeof eventInfo === 'object') {
    return {
      eventName: eventInfo.event,
      eventModifier: getObjectCode(event.modifier),
    };
  }
  return { eventName: eventInfo };
}

/**
 * 获取事件触发代码，如：trigger('click')
 * @param {*} framework 框架名
 * @param {*} param1
 *  params1.dom 触发事件的元素，dom = self 表示组件自身触发。event 触发事件名。component 仅 Vue 需要
 *  params1.event 事件名称，可选值：@vue/test-utils 的 trigger 函数的参数
 * @param {*} wrapperIndex 可选值：'1'/'2'/'3'/'4'/... 同一个函数中，避免重复变量名，给变量名添加下标字符串，如：wrapper1, container2
 */
 function getFireEventCode(framework, { dom, event, component }, wrapperIndex = '') {
  if (!event) return;
  const { eventName, eventModifier } = getFireEventName(event, framework);
  if (framework.indexOf('Vue') !== -1) {
    let eventFireCode = '';
    if (dom === 'self') {
      eventFireCode = `wrapper${wrapperIndex}.findComponent(${component}).trigger('${eventName}');`;
    } else {
      eventFireCode = `wrapper${wrapperIndex}.find('${dom}').trigger('${eventName}');`;
    }
    return [eventFireCode, `await wrapper${wrapperIndex}.vm.$nextTick();`].join('\n');
  }
  if (framework.indexOf('React') !== -1) {
    const tmpDom = dom === 'self'
      ? `container${wrapperIndex}.firstChild`
      : `container.querySelector('${dom}')`;
    const params = [tmpDom, eventModifier].filter(v => v).join(', ');
    return `fireEvent.${eventName}(${params});`;
  }
}

// 判断一个字符串是否为正则表达式
function isRegExp(str) {
  return /\/(.+)\//.test(str);
}

module.exports = {
  isRegExp,
  getItDescription,
  getWrapper,
  getMountComponent,
  getSnapshotCase,
  getArrayCode,
  getObjectCode,
  parseJSON,
  formatToTriggerAndDom,
  getDomExpectTruthy,
  getDomExpectFalsy,
  getClassNameExpectTruthy,
  getClassNameExpectFalsy,
  getDomCountExpectCode,
  getAttributeExpect,
  getDomAttributeExpect,
  getDomClassNameExpect,
  getFireEventCode,
};