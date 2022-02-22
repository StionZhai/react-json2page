import { FixedPositionValue, NodePosition, StyleDefine } from '../types';
import { useMemo } from 'react';
import { cssTextToCssObject } from '../utils';

export const normalizeStyleDefine = (styleDefine: StyleDefine, nodePosition?: NodePosition): Omit<StyleDefine, 'css'> => {
  if (!styleDefine) return { styleProps: null, className: '' };

  const { css, className, styleProps: { background, ...styleProps } = {} } = styleDefine;

  const style: React.CSSProperties = {
    boxSizing: 'border-box',
    ...styleProps
  };

  let result = {};

  // background 比较特殊，为了避免切换为"无背景"后丢失原背景设置
  // 设为 none 后仍保留其他背景属性在 styleProps 中，在这里渲染时再去做特殊处理
  // （TODO：其实这样不好，框架应该尽量通用，不应该揉这种特殊逻辑，想办法放在控制台去做这个留缓存值的处理）
  if (background === 'none') {
    Object.keys(style).forEach((key) => {
      // 过滤掉其他所有background开头的属性
      if (!key.startsWith('background')) {
        result[key] = style[key];
      }
    });
  } else {
    result = style;
  }

  if (css && typeof css === 'string') {
    try {
      const cssObject = cssTextToCssObject(css);

      if (cssObject && cssObject.self) {
        Object.assign(result, cssObject.self);
      }
    } catch (err) {
      console.warn('parse css fail', err);
    }
  }

  return {
    className,
    styleProps: {
      ...result,
      // 如果有，应该更高优先级，除非用的position.type:custom
      ...handlePositionStyle(nodePosition),
    },
  };
}

export const normalizeFixedPositionValue = (customPositionValue: FixedPositionValue) => (customPositionValue === '' ? 'auto' : customPositionValue);

export const handlePositionStyle = (nodePosition: NodePosition): React.CSSProperties => {
  const style = {};

  if (nodePosition) {
    switch (nodePosition.type) {
      case 'fixed':
        Object.assign(style, {
          position: 'absolute',
          top: normalizeFixedPositionValue(nodePosition.t),
          left: normalizeFixedPositionValue(nodePosition.l),
          right: normalizeFixedPositionValue(nodePosition.r),
          bottom: normalizeFixedPositionValue(nodePosition.b),
          height: normalizeFixedPositionValue(nodePosition.h),
          width: normalizeFixedPositionValue(nodePosition.w),
        });
        break;
      case 'custom':
        break;
      case 'absolute':
      default:
        Object.assign(style, {
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translate(${nodePosition.x}px, ${nodePosition.y}px)`,
          width: nodePosition.w,
          height: nodePosition.h,
        });
        break;
    }
  }

  return style;
};

// StyleDefine -> styleProps
export const useStyle = (styleDefine: StyleDefine, nodePosition?: NodePosition): Omit<StyleDefine, 'css'> => {
  return useMemo(() => normalizeStyleDefine(styleDefine, nodePosition), [styleDefine, nodePosition]);
};
