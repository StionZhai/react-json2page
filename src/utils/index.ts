import { ComponentConfig } from '../Components';

export * from './isPlainObject';

export const checkIsLinkedProperty = (propKey: string): boolean => (
  propKey?.startsWith(':')
);

export const normalizeProperty = (propKey: string, props: any = {}): {
  propKey: string;
  linkedPropKey: string;
  value: any;
  isLinked: boolean;
} => {
  const result = {
    propKey: '',
    linkedPropKey: '',
    value: undefined,
    isLinked: false,
  };

  if (checkIsLinkedProperty(propKey)) {
    result.propKey = propKey.substring(1);
    result.linkedPropKey = propKey;
  } else {
    result.linkedPropKey = `:${propKey}`;
    result.propKey = propKey;
  }

  if (result.linkedPropKey in props) {
    result.isLinked = true;
    result.value = props[result.linkedPropKey];
  } else if (result.propKey in props) {
    result.value = props[result.propKey];
  }

  return result;
};

export const getPropertyFromPath = (props, path) => {
  try {
    const pathArr = path.split('.');

    return pathArr.reduce((scope, next) => {
      return typeof scope === 'undefined' ? undefined : scope[next];
    }, props);
  } catch (err) {
    return null;
  }
};

export const setPropertyFromPath = (props, path, value, replace = true) => {
  try {
    const pathArr = path.split('.');

    let depth = 0;
    let currentStack = props;

    while (currentStack) {
      if (depth === pathArr.length - 1) {
        if (replace) {
          currentStack[pathArr[depth]] = value;
        } else {
          currentStack[pathArr[depth]] = Object.assign({}, currentStack[pathArr[depth]], value);
        }
        break;
      }

      currentStack = currentStack[pathArr[depth]];
      depth++;
    }
  } catch (err) {
    console.warn('setPropertyFromPath err', err);
    return null;
  }
};

export function isEmpty(obj) {
  if (!obj) return true;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  for (const key in obj) {
    return false;
  }

  return true;
}

export function getDefaultProps(componentConfig: ComponentConfig) {
  const { props = {}, defaultStyle = {} } = componentConfig;

  let { height, width, ...style } = defaultStyle;

  height = height || 80;
  width = width || 200;

  const result: any = {
    style: {
      ...style,
      height,
      width,
    },
  };

  Object.keys(props).forEach((key) => {
    if ('defaultValue' in props[key]) {
      result[key] = props[key].defaultValue;
    }
  });

  return result;
}
