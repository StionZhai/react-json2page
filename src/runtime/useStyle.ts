import { NodeStyleDefine } from '../types';
import kebabCase from 'kebab-case';
import { useMemo } from 'react';

export const normalizeStyleDefine = (styleDefine: NodeStyleDefine): Omit<NodeStyleDefine, 'css'> => {
  if (!styleDefine) return { styleProps: null, className: '' };

  const { css, className, styleProps } = styleDefine;

  const extendStyleProps = { ...styleProps };

  if (css && typeof css === 'string') {
    css.replace(/[\r\n\s]/g, '')
      .split(';')
      .forEach((string) => {
        const [key, value] = string.split(':');

        // 正常来说 css 和 styleProps 应该是同步的，如果真有不同步，优先 styleProps
        if (key && value) {
          const propName = kebabCase.reverse(key);

          if (!extendStyleProps[propName]) {
            extendStyleProps[propName] = value;
          }
        }
      });
  }

  let result = {};

  // 过滤掉其他所有background开头的属性
  if (extendStyleProps.background === 'none') {
    Object.keys(extendStyleProps).forEach((key) => {
      if (!key.startsWith('background')) {
        result[key] = extendStyleProps[key];
      }
    });
  } else {
    result = extendStyleProps;
  }

  return { styleProps: result, className };
}

// StyleDefine -> styleProps
export const useStyle = (styleDefine: NodeStyleDefine): Omit<NodeStyleDefine, 'css'> => {
  return useMemo(() => normalizeStyleDefine(styleDefine), [styleDefine]);
};
