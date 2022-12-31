const camelCase = require('lodash/camelCase');
const upperFirst = require('lodash/upperFirst');
const kebabCase = require('lodash/kebabCase');
const {
  getWrapper,
  getMountComponent,
  getDomExpectTruthy,
  getItDescription,
  formatToTriggerAndDom,
  getFireEventCode,
} = require("./utils");

/**
 * 人机交互测试
 * React fireEvent: // fireEvent https://github.com/testing-library/dom-testing-library/blob/main/src/event-map.js
 * Vue 会根据 React 命名自动转换
 */
function generateEventUnitCase(test, oneApiData, framework, component) {
  const arr = generateVueAndReactEventCase(test, oneApiData, framework, component);
  return arr && arr.filter(v => v);
}

function generateVueAndReactEventCase(test, oneApiData, framework, component) {
  const { event, content, wrapper } = test;
  const extraCode = { content, wrapper };
  // click/blur/mouseEnter/...
  if (typeof event === 'object' && !Array.isArray(event)) {
    const eventKeys = Object.keys(event);
    const firstEvent = eventKeys[0];
    // Vue2 和 Vue3/React 事件绑定方式不同
    const attachEventToDom = getEventsCode(framework, { [firstEvent]: 'fn' });
    const mountCode = getMountComponent(framework, component, { events: attachEventToDom }, extraCode);
    const isVue = framework.indexOf('Vue') !== -1;
    const arr = [
      `it('${component} Event: ${firstEvent}', ${isVue ? 'async' : ''} () => {
        const fn = vi.fn();`,
        getWrapper(framework, mountCode),
        getFireEventCode(framework, { dom: 'self', event: firstEvent, component }),
        `expect(fn).toHaveBeenCalled();`,
        `${getEventArguments(event[firstEvent].arguments)}
      });`,
    ];
    return arr;
  } else if (Array.isArray(event)) {
    let arr = [];
    event.forEach((oneEventUnitCase) => {
      const { props, expect, description } = oneEventUnitCase;
      const codeProps = {
        ...(props || {}),
        events: getEventFunctions(expect, framework),
      };
      if (oneApiData.field_type_text[0] === 'Boolean' && !codeProps[oneApiData.field_name]) {
        codeProps[oneApiData.field_name] = true;
      }
      const mountCode = getMountComponent(framework, component, codeProps, extraCode);
      const async = framework.indexOf('Vue') !== -1 ? 'async' : '';
      const itDescription = description ? `'props.${oneApiData.field_name}: ${description}'` : getItDescription(oneApiData);
      const oneEventArr = [
        `it(${itDescription}, ${async} () => {`,
        getEventsDefinition(expect),
        getWrapper(framework, mountCode),
        expect.map((p, index) => getEventExpectCode(p, index, framework, component)).join('\n'),
        `});`
      ];
      arr = arr.concat(oneEventArr);
    });
    return arr;
  }
}

function getEventFnName(eventName, index) {
  return `${getEventName(eventName)}Fn${index || ''}`;
}

// 事件对应的函数依次为：fn,fn1,fn2,fn3...
function getEventFunctions(expect, framework) {
  const fns = [];
  expect.forEach((item, index) => {
    if (!item.event) return;
    Object.keys(item.event).forEach((eventName) => {
      const formattedEventname = getEventNameByFramework(eventName, framework);
      fns.push(`${formattedEventname}: ${getEventFnName(eventName, index)}`);
    })
  });
  return fns.length ? `{ ${fns.join(', ')} }` : undefined;
}

function getEventsDefinition(expect) {
  return expect.map(({ event }, index) => {
    if (!event) return '';
    const arr = Object.keys(event).map((eventName) => {
      return `const ${getEventFnName(eventName, index)} = vi.fn();`;
    })
    return arr && arr.join('\n');
  }).filter(v => v).join('\n');
}

function getEventExpectCode(p, index, framework, component) {
  const { exist, event } = p;
  const { triggerDom = 'self', trigger } = formatToTriggerAndDom(p);
  const tmpExist = (Array.isArray(exist) || !exist ? exist : [exist]) || [];
  return [
    getFireEventCode(framework, { dom: triggerDom, event: trigger, component }),
    tmpExist.map((domSelector) => getDomExpectTruthy(framework, `'${domSelector}'`)).join('\n'),
    event && Object.entries(event).map(([eventName, arguments]) => {
      const fnName = getEventFnName(eventName, index);
      return [
        `expect(${fnName}).toHaveBeenCalled();`,
        getEventArguments(arguments, fnName).join(''),
      ].join('\n');
    }).join('\n'),
  ].join('');
}

function getEventArguments(arguments, fnName = 'fn') {
  return arguments.map((oneArgument, index) => {
    if (typeof oneArgument === 'string') {
      return `expect(${fnName}.mock.calls[0][${index}]).toBe('${oneArgument}');\n`;
    }
    if (typeof oneArgument === 'object' && !Array.isArray(oneArgument)) {
      return Object.keys(oneArgument).map(oneProperty => {
        const value = oneArgument[oneProperty];
        if (value === true) {
          return `expect(${fnName}.mock.calls[0][${index}].${oneProperty}).toBeTruthy();`;
        }
        const expectVal = typeof value === 'string' ? `'${value}'` : value;
        return `expect(${fnName}.mock.calls[0][${index}].${oneProperty}).toBe(${expectVal});`;
      }).join('\n');
    }
    return `expect(${fnName}.mock.calls[0][${index}]).toBe(${oneArgument});\n`;
  })
}

// 获取事件监听代码
function getEventsCode(framework, events) {
  if (framework === 'Vue(PC)') {
    const arr = [];
    Object.entries(events).forEach(([event, fn]) => {
      arr.push(`'${kebabCase(event)}': ${fn},`);
    });
    return `on={{ ${arr.join(' ')} }}`;
  }
  const tmpEventsCode = [];
  Object.entries(events).forEach(([event, fn]) => {
    tmpEventsCode.push(`${getEventName(event)}={${fn}}`);
  });
  return tmpEventsCode.join('\n');
}

function getEventName(eventName) {
  return `on${upperFirst(camelCase(eventName))}`;
}

function getEventNameByFramework(eventName, framework) {
  if (framework === 'Vue(PC)') {
    return `'${kebabCase(eventName)}'`;
  }
  return getEventName(eventName);
}

module.exports = {
  generateEventUnitCase,
};
