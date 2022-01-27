import React, { useMemo } from 'react';
import { NodeDefine } from '../types';
import { useRuntimeNode } from './useRuntimeNode';

export function RuntimeNode({
  nodeDefine,
}: {
  nodeDefine: NodeDefine;
}) {
  // TODO: style in props
  const [Component, { style, ...props }] = useRuntimeNode({ nodeDefine });
  const { position: { x, y, w, h } } = nodeDefine;

  const componentStyle = useMemo(() => ({
    width: '100%',
    height: '100%',
  }), []);

  const nodeStyle = useMemo(() => {
    const result = {
      ...style,
      boxSizing: 'border-box',
      position: 'absolute',
      top: 0,
      left: 0,
      transform: `translate(${x}px, ${y}px)`,
      width: w,
      height: h,
    };

    if (typeof nodeDefine.zIndex !== 'undefined') {
      result.zIndex = nodeDefine.zIndex;
    }

    return result;
  }, [style, x, y, w, h, nodeDefine.zIndex]);

  if (nodeDefine.hidden || !Component) return null;

  return (
    <div
      className="json2page-node-item"
      data-id={nodeDefine.id}
      style={nodeStyle}
    >
      <Component
        style={componentStyle}
        {...props}
      />
    </div>
  );
}
