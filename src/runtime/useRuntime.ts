import { createContext, useReducer, useRef, useEffect, useContext } from 'react';
import produce from 'immer';
import { isEmpty, isPlainObject, setPropertyFromPath } from '../utils';
import debounce from 'lodash.debounce';
import { Json2PageDefine, NodeDefine, NodeListener, ReducerAction } from '../types';
import { ComponentEvent } from '../Components';
import { getPropertyFromPath, normalizeProperty } from '../utils';
import { ActionHandler, ActionRegistry } from '../actionHandler';

type RuntimeContextValue = [RuntimeContextState, RuntimeStateMethods];

export const RuntimeContext = createContext<RuntimeContextValue>(null);

type UseRuntimeContext = () => RuntimeContextValue;

export const useRuntimeContext: UseRuntimeContext = () => {
  const [state, actions] = useContext(RuntimeContext);

  return [state, actions];
};

export enum ActionTypes {
  UpdateDatasetsDefine = 'updateDatasetsDefine',
  // UpdateDeviceData = 'updateDeviceData',
  // UpdateDeviceStatus = 'updateDeviceStatus',
  UpdateState = 'UpdateState',
  UpdateCurrentPage = 'updateCurrentPage',
}

export interface RuntimeData {
  global: Record<string, any>;
  pages: Record<any, Record<string, any>>;
  // deviceData: Record<string, any>;
  // deviceStatus: 0 | 1;
}

export interface RuntimeContextState {
  currentPageId: string;
  data: RuntimeData;
}

export function reducer(state: RuntimeContextState, action: ReducerAction) {
  const { type, payload = {} } = action;

  console.info('[RUNTIME]action', action);
  console.info('[RUNTIME]prev state => ', state);

  const nextState = produce(state, (draft) => {
    switch (type) {
      // 先这样，editor那边再看怎么优化
      case ActionTypes.UpdateDatasetsDefine: {
        const { json2pageDefine }: { json2pageDefine: Json2PageDefine } = payload;

        const initDataset = (scope, datasetConfig) => {
          Object.keys(datasetConfig).forEach((key) => {
            // TODO: review 策略
            // 只要当前值不等于默认值，就继续赋值
            if (scope[key] !== datasetConfig[key].defaultValue) {
              scope[key] = datasetConfig[key].defaultValue;
            }
          });
        };

        if (!isEmpty(json2pageDefine.dataset)) {
          initDataset(draft.data.global, json2pageDefine.dataset);
        }

        json2pageDefine.pages.forEach((pageDefine) => {
          const { id, dataset } = pageDefine;

          if (!draft.data.pages[id]) draft.data.pages[id] = {};

          initDataset(draft.data.pages[id], dataset);
        });
        break;
      }
      // case ActionTypes.UpdateDeviceData:
      //   draft.data.deviceData = Object.assign({}, draft.data.deviceData, payload.deviceData);
      //   break;
      // case ActionTypes.UpdateDeviceStatus:
      //   draft.data.deviceStatus = payload.deviceStatus;
      //   break;
      // path支持：$page.state/$app.state/$deviceData/$deviceStatus
      case ActionTypes.UpdateState: {
        const { path, data } = payload;

        // TODO: I'm ugly, fix me
        if (path.startsWith('$page.state')) {
          const [, propPath] = path.split('$page.state.');

          setPropertyFromPath(draft.data.pages[draft.currentPageId], propPath, data);
        } else if (path.startsWith('$app.state')) {
          const [, propPath] = path.split('$app.state.');
          setPropertyFromPath(draft.data.global, propPath, data);
        }
        // else if (path.startsWith('$deviceData')) {
        //   const [, propPath] = path.split('$deviceData.');
        //   setPropertyFromPath(draft.data.deviceData, propPath, data);
        // } else if (path === '$deviceStatus') {
        //   draft.data.deviceStatus = data;
        // }
        break;
      }
      case ActionTypes.UpdateCurrentPage:
        draft.currentPageId = payload.pageId;
        break;
    }
  });

  console.info('[RUNTIME]next state => ', nextState);

  return nextState;
}

function initState(json2PageDefine: Json2PageDefine) {
  // 校验数据
  const runtimeState: RuntimeContextState = {
    currentPageId: json2PageDefine.pages[0]?.id,
    data: {
      global: {},
      pages: {},
      // deviceData: {},
      // deviceStatus: 0,
    },
  };

  const packInitDataset = (datasetDefine) => {
    const initState = {};

    Object.keys(datasetDefine).forEach((datasetKey) => {
      initState[datasetKey] = datasetDefine[datasetKey]?.defaultValue;
    });

    return initState;
  };

  runtimeState.data.global = packInitDataset(json2PageDefine.dataset);

  json2PageDefine.pages.forEach((pageDefine) => {
    const { id, dataset } = pageDefine;

    runtimeState.data.pages[id] = packInitDataset(dataset);
  });

  return runtimeState;
}

type Reducer = (state: RuntimeContextState, action: ReducerAction<ActionTypes>) => RuntimeContextState;

export interface PageStateData {
  page: any;
  app: any;
  // deviceData: any;
  // deviceStatus: any;
  eventDetail?: any;
}

export interface RuntimeStateMethods {
  // controlDeviceData: (data: any) => Promise<any>;
  setState: (path: string, data: any) => any;
  // TODO: 事件是否都在当前页面触发？如果不在当前页面的话无法正确找到对应节点及页面的状态
  dispatchEvent: (eventName: string, event: ComponentEvent, nodeDefine: NodeDefine) => any;
  packStateContextForPage: (pageId?: string) => PageStateData;
  packDataFromState: (dataDefine: Record<string, any>, stateContext?: Partial<PageStateData>) => Record<string, any>;
  updateCurrentPage: (pageId: string) => any;
  // updateDeviceData: (deviceData: any) => any;
  registerAction: (ActionHandlerConstructor: typeof ActionHandler) => any;
  actionRegistry: ActionRegistry;
}

// // 监听设备ws，不关心如何监听，只需要触发后调用回调即可
// export interface DeviceWsListener {
//   onReport?: (callback: (payload: { deviceData: any }) => any) => any;
//   onEventReport?: (callback: (payload: { Payload: any }) => any) => any;
//   onActionReport?: (callback: (payload: { Payload: any }) => any) => any;
//   onStatusChange?: (callback: (payload: { deviceStatus: 0 | 1 }) => any) => any;
// }

export interface IUseRuntimeProps<T = any> {
  json2pageDefine: Json2PageDefine;
  // 上下文环境，包括各环境需要提供的上下文相关api，使用方自行决定
  context: T;
}

/**
 * 负责整个 Runtime 的状态控制
 *
 * 1. state数据管理
 *  (1) 当前激活的页面
 *  (2) 当前激活的节点
 *  (3) 当前的页面（预览页面）的 dataset 数据管理
 *  (4) 物模型管理
 *
 * 2. 监听物模型ws，回调触发直接操作state
 * 3. 请求 AppApi/云api
 * 4. 调用上下文方法（wxjssdk/mock api）
 */
export function useRuntime<T = any>({
  // deviceId,
  json2pageDefine,
  context,
}: IUseRuntimeProps<T>): [RuntimeContextState, RuntimeStateMethods] {
  const [state, dispatch] = useReducer<Reducer, Json2PageDefine>(reducer, json2pageDefine, initState);
  const actionRegistryRef = useRef<ActionRegistry>(null);
  const updateJson2PageDefineRef = useRef(debounce((json2pageDefine) => dispatch({
    type: ActionTypes.UpdateDatasetsDefine,
    payload: { json2pageDefine },
  }), 300, { leading: true, trailing: true }));

  // TODO：编辑器那边，整个数据监听的话，频率太高了？
  useEffect(() => {
    // dispatch({
    //   type: ActionTypes.UpdateDatasetsDefine,
    //   payload: { panelDefine },
    // });
    updateJson2PageDefineRef.current(json2pageDefine);
  }, [json2pageDefine]);

  // const updateDeviceData = (deviceData) => {
  //   const result = {};
  //
  //   if (typeof deviceData === 'string') {
  //     deviceData = JSON.parse(deviceData);
  //   }
  //
  //   Object.keys(deviceData).forEach((key) => {
  //     // 兼容两种形式： { power_switch: 0 } | { power_switch: : { Value: 0 } }
  //     if (isPlainObject(deviceData[key]) && typeof deviceData[key].Value !== 'undefined') {
  //       result[key] = deviceData[key].Value;
  //     } else {
  //       result[key] = deviceData[key];
  //     }
  //   });
  //
  //   dispatch({
  //     type: ActionTypes.UpdateDeviceData,
  //     payload: { deviceData: result },
  //   });
  // };

  // const initDeviceData = async () => {
  //   let deviceData = {};
  //
  //   try {
  //     const { Data } = await envContext.requestApi('AppGetDeviceData', { DeviceId: deviceId });
  //
  //     deviceData = JSON.parse(Data);
  //   } catch (err) { /* ignore */
  //   }
  //
  //   updateDeviceData(deviceData);
  // };

  useEffect(() => {
    actionRegistryRef.current = new ActionRegistry({
      // deviceId,
      // requestApi: envContext.requestApi,
      context,
      actions: {
        setState,
        // updateDeviceData,
      },
    });
    // initDeviceData();

    // envContext.deviceWsListener.onReport(({ deviceData }) => {
    //   updateDeviceData(deviceData);
    // });
    // envContext.deviceWsListener.onStatusChange(({ deviceStatus }) => {
    //   dispatch(({
    //     type: ActionTypes.UpdateDeviceStatus,
    //     payload: {
    //       deviceStatus,
    //     },
    //   }));
    // });
  }, []);

  // const controlDeviceData = async (Data) => {
  //   try {
  //     await envContext.requestApi('ControlDeviceData', {
  //       DeviceID: deviceId,
  //       Data: typeof Data === 'string' ? Data : JSON.stringify(Data),
  //     });
  //     dispatch({
  //       type: ActionTypes.UpdateDeviceData,
  //       payload: { deviceData: Data },
  //     });
  //   } catch (err) {
  //     console.error('controlDeviceData fail', err);
  //     return Promise.reject(err);
  //   }
  // };

  const setState = (path, data) => {
    dispatch({
      type: ActionTypes.UpdateState,
      payload: { path, data },
    });
  };

  // 事件触发逻辑全在runtime里搞吧，Component里触发后，直接把 nodeDefine.listeners 和触发的 event 传进来，在里面闭环处理事件、handler以及后续feedbacks
  const dispatchEvent: RuntimeStateMethods['dispatchEvent'] = (eventName, event, nodeDefine) => {
    console.log('dispatchEvent', eventName, event, nodeDefine);
    // 1. 找出处理器的输入参数（主要是动态参数）
    // 2. 直接调用事件处理器，去找到对应类型的事件处理器，直接调用即可
    // 3. 调用完后，action中会去查找是否有监听feedback，如果有，还需要再dispatch一次对应的feedback event

    // 所以 action handler 需要的能力：
    // 1. 需要知道 nodeDefine 上还有哪些事件listener
    // 2. 需要能够再次 dispatch feedback event

    // action 传 runtime 一些能力及 evnApi 进去即可，返回结果，以及相应的 fe果返回来就好了，然后继续再 runtime 中处理后续事件分发edback 结

    const feedbackListenerMap: {
      [listenerId: string]: {
        [feedbackName: string]: NodeListener[];
      };
    } = {};
    let eventListeners = [];

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
          eventName,
          handler: {
            type: actionType,
            name: actionName,
            params: actionParams,
          },
        } = listener;

        const params = packDataFromState(actionParams, { eventDetail: event.detail });

        const resp = await actionRegistryRef.current.dispatchAction(actionType, actionName, params);

        if (!resp) return;

        if (resp.feedback?.type) {
          const { type, details } = resp.feedback;

          // 找是否有注册监听 feedback 的 listener，有就行了，直接dispatch，里面重新去处理一遍这个feedback事件，这里后续就无需关注了
          if (feedbackListenerMap[id]?.[type]?.length) {
            dispatchEvent(`${id}.${type}`, { detail: { value: details } }, nodeDefine);
          }
        }
      } catch (err) {
        console.error('dispatch action fail', err);
      }
    });
  };

  const packStateContextForPage = (pageId: string = state.currentPageId) => ({
    page: state.data.pages[pageId],
    app: state.data.global,
    // deviceData: state.data.deviceData,
    // deviceStatus: state.data.deviceStatus,
  });

  // TODO: 事件有否可能延时触发，导致当前page不一致？
  const packDataFromState: RuntimeStateMethods['packDataFromState'] = (dataDefine = {}, stateContext) => {
    stateContext = Object.assign({}, packStateContextForPage(), stateContext);

    const result = {};

    Object.keys(dataDefine).forEach((dataKey) => {
      const { isLinked, value, propKey } = normalizeProperty(dataKey, dataDefine);

      // 如果是对象，往里递归
      if (!isLinked
        && isPlainObject(value)
        && !isEmpty(value)) {
        result[propKey] = packDataFromState(value, stateContext);
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
        // else if (linkedPath.startsWith('$deviceData')) {
        //   const [, propName] = linkedPath.split('$deviceData.');
        //   result[propKey] = getPropertyFromPath(stateContext.deviceData, propName);
        // }
        // else if (linkedPath === '$deviceStatus') {
        //   result[propKey] = stateContext.deviceStatus;
        // }
      } else {
        result[propKey] = value;
      }
    });

    return result;
  };

  const updateCurrentPage = pageId => dispatch({
    type: ActionTypes.UpdateCurrentPage,
    payload: { pageId },
  });

  const registerAction = (ActionHandle) => {
    if (actionRegistryRef.current?.register) {
      actionRegistryRef.current.register(ActionHandle);
    } else {
      console.warn('actionRegistry未就绪，请稍后注册');
    }
  };

  return [state, {
    // controlDeviceData,
    setState,
    dispatchEvent,
    packStateContextForPage,
    packDataFromState,
    updateCurrentPage,
    // updateDeviceData,
    registerAction,
    actionRegistry: actionRegistryRef.current,
  }];
}
