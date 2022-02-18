import React, { useEffect, useState } from 'react';
import { NodeDefine, PageDefine, StyledProps } from '../types';
import { RuntimeNode } from './RuntimeNode';
import { useRuntimeContext } from './useRuntime';
import { useStyle } from './useStyle';
import classNames from 'classnames';

export interface RuntimeContainerProps extends StyledProps {
  pageDefine: PageDefine;
}

export function getMaxNodesY(nodes: NodeDefine[]): number {
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

export function getPageHeight(pageDefine: PageDefine): string | number {
  let result;

  switch (pageDefine.pageHeight) {
    case 'full':
      result = '100vh';
      break;
    case 'auto':
      result = getMaxNodesY(pageDefine.nodes);

      if (pageDefine.pagePaddingBottom) {
        result += pageDefine.pagePaddingBottom;
      }
      break;
    default:
      result = pageDefine.pageHeight;
      break;
  }

  return result;
}

export function RuntimeContainer({
  pageDefine,
  className: outerClassName,
  style,
}: RuntimeContainerProps) {
  const [, runtimeActions] = useRuntimeContext();
  const [containerHeight, setContainerHeight] = useState<string | number>('100vh');

  useEffect(() => {
    const pageHeight = getPageHeight(pageDefine);

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
        minHeight: '100vh',
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
