import React from 'react';
import { NodeDefine } from '../types';
import { useRuntimeNode } from './useRuntimeNode';

export function RuntimeNode({
  nodeDefine,
}: {
  nodeDefine: NodeDefine;
}) {
  // TODO: style in props
  const [Component, { componentStyle, nodeStyle, ...props }] = useRuntimeNode({ nodeDefine });

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
