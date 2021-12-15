import React, { useEffect } from 'react';
import { PageDefine } from '../types';
import { RuntimeNode } from './RuntimeNode';
import { useRuntimeContext } from './useRuntime';
import { useStyle } from './useStyle';
import classNames from 'classnames';

export interface IRuntimeContainer {
  pageDefine: PageDefine;
}

export function RuntimeContainer({
  pageDefine,
}: IRuntimeContainer) {
  const [, runtimeActions] = useRuntimeContext();

  useEffect(() => {
    if (pageDefine.id) {
      runtimeActions.updateCurrentPage(pageDefine.id);
    }
  }, [pageDefine?.id]);

  const { styleProps, className } = useStyle(pageDefine.style);

  return (
    <div
      className={classNames('json2page-runtime-container', className)}
      style={styleProps}
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
