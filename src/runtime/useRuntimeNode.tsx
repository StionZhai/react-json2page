import { NodeDefine } from '../types';
import React, { useMemo } from 'react';
import { useRuntimeContext } from './useRuntime';
import { componentRegistry, ComponentEvent } from '../Components';
import { useStyle } from './useStyle';

export function useRuntimeNode({
  nodeDefine,
}: {
  nodeDefine: NodeDefine;
}): [React.ElementType, Record<string, any>] {
  const [{ data, currentPageId }, { packDataFromState, dispatchEvent }] = useRuntimeContext();
  const { styleProps, className } = useStyle(nodeDefine.style);

  return useMemo(() => {
    const componentInfo = componentRegistry.find(nodeDefine.type);

    if (!componentInfo) {
      return [null, {}];
    }

    const { Component, config } = componentInfo;

    // TODO: 约束 props 不能声明叫做 events，否则会被覆盖
    const props = packDataFromState(nodeDefine.props, null, currentPageId);

    // console.log('props', props, 'from:', nodeDefine.props, 'in', data);

    if (!props.events) props.events = [];

    config.events.forEach(({
      name,
    }) => {
      // TODO: 事件参数支持多参数不？还是只有 detail.value?
      // TODO：尝试在组件中异步触发事件handler，然后页面切走，看看是否会影响获取正确的page scope
      props.events[name] = (event: ComponentEvent) => {
        console.log('trigger event: ', name, event);
        dispatchEvent(name, event, nodeDefine, currentPageId);
      };
    });

    return [Component, { style: styleProps, className, ...props }];
  }, [data, nodeDefine, currentPageId]);
}
