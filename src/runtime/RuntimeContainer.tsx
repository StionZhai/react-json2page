import React, { useEffect, useState } from 'react';
import { NodeDefine, PageDefine, StyledProps } from '../types';
import { RuntimeNode } from './RuntimeNode';
import { useRuntimeContext } from './useRuntime';
import { useStyle } from './useStyle';
import classNames from 'classnames';

export interface RuntimeContainerProps extends StyledProps {
  pageDefine: PageDefine;
}

function getPageHeight(nodes: NodeDefine[]): number {
  let maxHeight = 0;

  if (nodes?.length) {
    nodes.forEach((node) => {
      switch (node.position.type) {
        case 'absolute':
          const nodeMaxY = node.position.y + node.position.h;

          if (nodeMaxY > maxHeight) maxHeight = nodeMaxY;
          break;
        case 'fixed':
          if (!node.position.b && node.position.t && node.position.h) {
            const nodeMaxY = node.position.t + node.position.h;

            if (nodeMaxY > maxHeight) maxHeight = nodeMaxY;
          }
          break;
      }
    });
  }

  return maxHeight;
}

export function RuntimeContainer({
  pageDefine,
  className: outerClassName,
  style,
}: RuntimeContainerProps) {
  const [, runtimeActions] = useRuntimeContext();
  const [containerHeight, setContainerHeight] = useState<string | number>('100vh');

  useEffect(() => {
    let pageHeight;

    switch (pageDefine.pageHeight) {
      case 'full':
        pageHeight = '100vh';
        break;
      case 'auto':
        pageHeight = getPageHeight(pageDefine.nodes);
        break;
      default:
        pageHeight = pageDefine.pageHeight;
        break;
    }

    if (!pageHeight) pageHeight = '100vh';

    if (pageHeight !== containerHeight) {
      setContainerHeight(pageHeight);
    }
  }, [pageDefine.pageHeight, pageDefine.nodes]);

  useEffect(() => {
    if (pageDefine.id) {
      runtimeActions.updateCurrentPage(pageDefine.id);
    }
  }, [pageDefine?.id]);

  const { styleProps, className } = useStyle(pageDefine.style);

  return (
    <div
      className={classNames('json2page-runtime-container', className, outerClassName)}
      style={{
        height: containerHeight,
        ...styleProps,
        ...style,
      }}
    >
      {pageDefine.nodes.map(item => (
        <RuntimeNode
          key={item.id}
          nodeDefine={item}
        />
      ))}
    </div>
  );
}
