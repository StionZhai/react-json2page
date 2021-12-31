import { NodeStyleDefine } from '../types';
import kebabCase from 'kebab-case';
import { useMemo } from 'react';

export const normalizeStyleDefine = (styleDefine: NodeStyleDefine): Omit<NodeStyleDefine, 'css'> => {
  if (!styleDefine) return { styleProps: null, className: '' };

  const { css, className, styleProps: { background, ...styleProps } = {} } = styleDefine;

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

  // background 比较特殊，为了避免切换为"无背景"后丢失原背景设置
  // 设为 none 后仍保留其他背景属性在 styleProps 中，在这里渲染时再去做特殊处理
  // （TODO：其实这样不好，框架应该尽量通用，不应该揉这种特殊逻辑，想办法放在控制台去做这个留缓存值的处理）
  if (background === 'none') {
    Object.keys(extendStyleProps).forEach((key) => {
      // 过滤掉其他所有background开头的属性
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
  return useMemo(() => {
    return normalizeStyleDefine(styleDefine);
  }, [styleDefine]);
};
