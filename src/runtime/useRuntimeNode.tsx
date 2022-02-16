import { NodeDefine } from '../types';
import React, { useMemo } from 'react';
import { useRuntimeContext } from './useRuntime';
import { componentRegistry, ComponentEvent } from '../Components';
import { useStyle } from './useStyle';

export function useRuntimeNode<NodeExtends = any>({
  nodeDefine,
}: {
  nodeDefine: NodeDefine<NodeExtends>;
}): [React.ElementType, {
  nodeStyle?: React.CSSProperties;
  componentStyle?: React.CSSProperties;
  children?: NodeDefine[];

  // ...props
  [propKey: string]: any;
}] {
  const [{ data, currentPageId }, {
    packDataFromState,
    packStateContextForPage,
    dispatchEvent,
    mapNodeProps,
    mapNodePropDefinesBeforeLink,
    mapNodeStyle,
  }] = useRuntimeContext();

  const { styleProps, className } = useStyle(nodeDefine.style, nodeDefine.position);

  return useMemo(() => {
    const componentInfo = componentRegistry.find(nodeDefine.type);

    if (!componentInfo) {
      return [null, {}];
    }

    const { Component, config } = componentInfo;

    let {
      props: propDefines,
      children,
    } = nodeDefine;

    const stateContext = packStateContextForPage(currentPageId);

    if (typeof mapNodePropDefinesBeforeLink === 'function') {
      propDefines = mapNodePropDefinesBeforeLink({
        stateContext,
        nodeDefine,
        propDefines,
        componentInfo,
      });
    }

    // TODO: 约束 props 不能声明叫做 events，否则会被覆盖

    let props = packDataFromState({
      pageId: currentPageId,
      dataDefines: propDefines,
      stateContext,
    });

    if (typeof mapNodeProps === 'function') {
      props = mapNodeProps({
        stateContext,
        nodeDefine,
        propDefines,
        componentInfo,
        props,
      });
    }

    if (!props.events) props.events = {};

    if (config.events?.length) {
      config.events.forEach(({
        name,
      }) => {
        // TODO: 事件参数支持多参数不？还是只有 detail.value?
        // TODO：尝试在组件中异步触发事件handler，然后页面切走，看看是否会影响获取正确的page scope
        // TODO: 事件参数的声明？
        props.events[name] = (event: ComponentEvent) => {
          console.log('trigger event: ', name, event);
          dispatchEvent(name, event, nodeDefine, currentPageId);
        };
      });
    }

    const nodeStyle: React.CSSProperties = { ...styleProps };

    if (typeof nodeDefine.zIndex !== 'undefined') {
      nodeStyle.zIndex = nodeDefine.zIndex;
    }

    const componentStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
    };

    return [Component, {
      componentStyle,
      nodeStyle: mapNodeStyle({
        style: nodeStyle,
        stateContext,
        nodeDefine,
        propDefines,
        componentInfo,
        props,
      }),
      className,
      children,
      ...props,
    }];
  }, [data, nodeDefine, currentPageId, styleProps, className, mapNodeStyle]);
}
