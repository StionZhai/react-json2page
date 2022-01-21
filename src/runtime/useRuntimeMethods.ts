import { isEmpty, isPlainObject } from '../utils';
import { NodeDefine, NodeListener } from '../types';
import { ComponentEvent, ComponentExportInfo, componentRegistry } from '../Components';
import { getPropertyFromPath, normalizeProperty } from '../utils';
import {
  ActionRegistry,
} from '../actionHandler';
import { ActionTypes, IUseRuntimeProps, PageStateData, RuntimeContextState } from './useRuntime';

export interface RuntimeMethods {
  setState: (path: string, data: any, replace?: boolean) => any;
  // TODO: 事件是否都在当前页面触发？如果不在当前页面的话无法正确找到对应节点及页面的状态
  dispatchEvent: (eventName: string, event: ComponentEvent, nodeDefine: NodeDefine, pageId?: string) => any;
  packStateContextForPage: (pageId?: string) => PageStateData;
  packDataFromState: (params: {
    pageId?: string;
    dataDefines: Record<string, any>;
    stateContext?: Partial<PageStateData>;
    extendStateContext?: Partial<PageStateData>;
  }) => Record<string, any>;
  updateCurrentPage: (pageId: string) => any;
  mapNodePropDefinesBeforeLink?: (params: {
    stateContext: PageStateData;
    nodeDefine: NodeDefine;
    propDefines: NodeDefine['props'];
    componentInfo: ComponentExportInfo;
  }) => any;
  mapNodeProps?: (params: {
    nodeDefine: NodeDefine;
    propDefines: NodeDefine['props'];
    stateContext: PageStateData;
    componentInfo: ComponentExportInfo;
    props: any;
  }) => any;
}

export function useRuntimeMethods(state: RuntimeContextState, dispatch, {
  dispatchAction,
  mapNodeProps = ({ props }) => props,
  mapNodePropDefinesBeforeLink = ({ nodeDefine, propDefines }) => propDefines || nodeDefine.props,
}: {
  dispatchAction: ActionRegistry['dispatchAction'];
  mapNodeProps?: IUseRuntimeProps['mapNodeProps'];
  mapNodePropDefinesBeforeLink?: IUseRuntimeProps['mapNodePropDefinesBeforeLink'];
}): RuntimeMethods {
  const setState: RuntimeMethods['setState'] = (path, data, replace = true) => dispatch({
    type: ActionTypes.UpdateState,
    payload: { path, data, replace },
  });

  // 事件触发逻辑全在runtime里搞吧，Component里触发后，直接把 nodeDefine.listeners 和触发的 event 传进来，在里面闭环处理事件、handler以及后续feedbacks
  const dispatchEvent: RuntimeMethods['dispatchEvent'] = (eventName, event, nodeDefine, pageId) => {
    console.log('dispatchEvent', eventName, event, nodeDefine);
    // 1. 找出处理器的输入参数（主要是动态参数）
    // 2. 直接调用事件处理器，去找到对应类型的事件处理器，直接调用即可
    // 3. 调用完后，action中会去查找是否有监听feedback，如果有，还需要再dispatch一次对应的feedback event

    // 所以 action handler 需要的能力：
    // 1. 需要知道 nodeDefine 上还有哪些事件listener
    // 2. 需要能够再次 dispatch feedback event

    // action 传 runtime 一些能力及 evnApi 进去即可，返回结果，以及相应的 feedback 结果返回来就好了，然后继续再 runtime 中处理后续事件分发 feedback 结果
    const componentInfo = componentRegistry.find(nodeDefine.type);

    const eventDefine = componentInfo?.config?.events?.find(item => item.name === eventName);

    const feedbackListenerMap: {
      [listenerId: string]: {
        [feedbackName: string]: NodeListener[];
      };
    } = {};
    let eventListeners: NodeListener[] = [];

    nodeDefine.listeners.forEach((listener) => {
      if (listener.eventName === eventName) {
        eventListeners.push(listener);
      }

      if (listener.eventName.includes('.')) {
        const [listenerId, feedbackName] = listener.eventName.split('.');

        if (!feedbackListenerMap[listenerId]) feedbackListenerMap[listenerId] = {};
        if (!feedbackListenerMap[listenerId][feedbackName]) feedbackListenerMap[listenerId][feedbackName] = [];

        feedbackListenerMap[listenerId][feedbackName].push(listener);
      }
    });

    eventListeners.forEach(async (listener) => {
      try {
        const {
          id,
          handler: {
            type: actionType,
            name: actionName,
            params: actionParams,
          },
        } = listener;

        const extendStateContext: any = {};

        if (eventDefine?.withDetails && event) {
          extendStateContext.eventDetail = event.detail;
        }

        const params = packDataFromState({
          pageId,
          dataDefines: actionParams,
          extendStateContext,
        });

        const resp = await dispatchAction(actionType, actionName, params);

        if (!resp) return;

        if (resp.feedback?.type) {
          const { type, details } = resp.feedback;

          // 找是否有注册监听 feedback 的 listener，有就行了，直接dispatch，里面重新去处理一遍这个feedback事件，这里后续就无需关注了
          if (feedbackListenerMap[id]?.[type]?.length) {
            dispatchEvent(`${id}.${type}`, { detail: { value: details } }, nodeDefine, pageId);
          }
        }
      } catch (err) {
        console.error('dispatch action fail', err);
      }
    });
  };

  const packStateContextForPage: RuntimeMethods['packStateContextForPage'] = (pageId: string) => {
    pageId = pageId || state.currentPageId;

    return {
      page: state.data.pages[pageId] || {},
      app: state.data.global || {},
    };
  };

  // TODO: 事件有否可能延时触发，导致当前page不一致？
  const packDataFromState: RuntimeMethods['packDataFromState'] = ({
    pageId,
    dataDefines = {},
    stateContext,
    extendStateContext,
  }) => {
    if (!pageId) pageId = state.currentPageId;

    if (!stateContext) {
      stateContext = packStateContextForPage(pageId);
    }

    stateContext = Object.assign({}, stateContext, extendStateContext);

    const result = {};

    // if (typeof mapNodePropsBeforeLink === 'function') {
    //   dataDefine = mapNodePropsBeforeLink({
    //     nodeId,
    //     props: { ...dataDefine },
    //     stateContext,
    //     dataDefine,
    //   });
    // }

    Object.keys(dataDefines).forEach((dataKey) => {
      const { isLinked, value, propKey } = normalizeProperty(dataKey, dataDefines);

      // 如果是对象，往里递归
      if (!isLinked
        && isPlainObject(value)
        && !isEmpty(value)) {
        result[propKey] = packDataFromState({
          dataDefines: value,
          stateContext,
          pageId,
        });
        return;
      }

      if (isLinked) {
        const linkedPath = value;

        // TODO: I'm ugly, fix me
        if (linkedPath.startsWith('$page.state')) {
          const [, propPath] = linkedPath.split('$page.state.');
          result[propKey] = getPropertyFromPath(stateContext.page, propPath);
        } else if (linkedPath.startsWith('$app.state')) {
          const [, propName] = linkedPath.split('$app.state.');
          result[propKey] = getPropertyFromPath(stateContext.app, propName);
        } else if (linkedPath === '$event.detail.value') {
          result[propKey] = stateContext.eventDetail?.value;
        }
      } else {
        result[propKey] = value;
      }
    });

    return result;
  };

  const updateCurrentPage: RuntimeMethods['updateCurrentPage'] = pageId => dispatch({
    type: ActionTypes.UpdateCurrentPage,
    payload: { pageId },
  });

  return {
    setState,
    dispatchEvent,
    packStateContextForPage,
    packDataFromState,
    updateCurrentPage,
    mapNodeProps,
    mapNodePropDefinesBeforeLink,
  };
}
