import { createContext, useReducer, useRef, useEffect, useContext } from 'react';
import produce from 'immer';
import { isEmpty, setPropertyFromPath } from '../utils';
import debounce from 'lodash.debounce';
import { Json2PageDefine, ReducerAction } from '../types';
import { ComponentModuleDefine, componentRegistry } from '../Components';
import {
  ActionContext,
  ActionHandler,
  ActionRegistry,
  GetContextEnvApiType, ActionContextOptions
} from '../actionHandler';
import { RuntimeMethods, useRuntimeMethods } from './useRuntimeMethods';
import { RuntimeOptions, useRuntimeOptions } from './useRuntimeOptions';

export const RuntimeContext = createContext<UseRuntimeReturn>(null);

type UseRuntimeContext = () => UseRuntimeReturn;

export const useRuntimeContext: UseRuntimeContext = () => {
  const [state, actions] = useContext(RuntimeContext);

  return [state, actions];
};

export enum ActionTypes {
  SetReady = 'setReady',
  UpdateDatasetsDefine = 'updateDatasetsDefine',
  UpdateState = 'UpdateState',
  UpdateCurrentPage = 'updateCurrentPage',
}

export interface RuntimeData {
  global: Record<string, any>;
  pages: Record<any, Record<string, any>>;
}

export interface RuntimeContextState {
  ready: boolean;
  currentPageId: string;
  data: RuntimeData;
}

export function reducer(state: RuntimeContextState, action: ReducerAction) {
  const { type, payload = {} } = action;

  console.info('[RUNTIME]action', action);
  console.info('[RUNTIME]prev state => ', state);

  const nextState = produce(state, (draft) => {
    switch (type) {
      case ActionTypes.SetReady:
        draft.ready = true;
        break;
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

        if (!isEmpty(json2pageDefine?.dataset)) {
          initDataset(draft.data.global, json2pageDefine.dataset);
        }

        json2pageDefine?.pages?.forEach((pageDefine) => {
          const { id, dataset } = pageDefine;

          if (!draft.data.pages[id]) draft.data.pages[id] = {};

          initDataset(draft.data.pages[id], dataset);
        });
        break;
      }
      // path支持：$page.state/$app.state/$deviceData/$deviceStatus
      case ActionTypes.UpdateState: {
        const { path, data, replace } = payload;

        // TODO: I'm ugly, fix me
        if (path.startsWith('$page.state')) {
          const [, propPath] = path.split('$page.state.');

          setPropertyFromPath(draft.data.pages[draft.currentPageId], propPath, data, replace);
        } else if (path.startsWith('$app.state')) {
          const [, propPath] = path.split('$app.state.');
          setPropertyFromPath(draft.data.global, propPath, data, replace);
        }
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
    ready: false,
    currentPageId: json2PageDefine?.pages?.[0]?.id,
    data: {
      global: {},
      pages: {},
    },
  };

  const packInitDataset = (datasetDefine = {}) => {
    const initState = {};

    try {
      Object.keys(datasetDefine).forEach((datasetKey) => {
        initState[datasetKey] = datasetDefine[datasetKey]?.defaultValue;
      });
    } catch (err) {
      console.warn('parse packInitDataset from define fail', err, datasetDefine);
    }

    return initState;
  };

  runtimeState.data.global = packInitDataset(json2PageDefine?.dataset || {});

  json2PageDefine?.pages?.forEach((pageDefine) => {
    const { id, dataset } = pageDefine;

    runtimeState.data.pages[id] = packInitDataset(dataset);
  });

  return runtimeState;
}

type Reducer = (state: RuntimeContextState, action: ReducerAction<ActionTypes>) => RuntimeContextState;

export interface PageStateData {
  page: any;
  app: any;
  eventDetail?: any;
}

export interface RuntimeActions {
  setState: RuntimeMethods['setState'];
}

export interface UseRuntimeProps<T extends ActionContext = any,
  GlobalExtends = any,
  PageExtends = any,
  NodeExtends = any,
> {
  json2pageDefine?: Json2PageDefine<GlobalExtends, PageExtends, NodeExtends>;
  context: new (options: ActionContextOptions<GetContextEnvApiType<T>>) => T;
  envApi: GetContextEnvApiType<T>;
  actions?: (new (options: T) => ActionHandler<T>)[];
  components?: ComponentModuleDefine[];
  options?: Partial<RuntimeOptions<NodeExtends>>;
}

export type UseRuntimeReturn<NodeExtends = any> = [RuntimeContextState, RuntimeMethods & RuntimeOptions<NodeExtends>];

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
export function useRuntime<T extends ActionContext = any,
  GlobalExtends = any,
  PageExtends = any,
  NodeExtends = any,
>({
  json2pageDefine,
  actions = [],
  components = [],
  context,
  envApi,
  options,
}: UseRuntimeProps<T, GlobalExtends, PageExtends, NodeExtends>): UseRuntimeReturn<NodeExtends> {
  const [state, dispatch] = useReducer<Reducer, Json2PageDefine<GlobalExtends, PageExtends, NodeExtends>>(reducer, json2pageDefine, initState);

  const runtimeOptionMethods = useRuntimeOptions<NodeExtends>(options);

  const runtimeMethods = useRuntimeMethods(state, dispatch, {
    dispatchAction: (...args) => actionRegistryRef.current.dispatchAction(...args),
  });

  const contextRef = useRef<T>(new context({
    envApi,
    runtimeActions: {
      setState: runtimeMethods.setState,
    },
  }));

  useEffect(() => {
    if (typeof contextRef.current?.init === 'function') {
      contextRef.current.init();
    }
  }, []);

  const actionRegistryRef = useRef<ActionRegistry<T>>(new ActionRegistry<T>(contextRef.current));

  const updateJson2PageDefineRef = useRef(debounce((json2pageDefine) => dispatch({
    type: ActionTypes.UpdateDatasetsDefine,
    payload: { json2pageDefine },
  }), 300, { leading: true, trailing: true }));

  const runtimeReadyRef = useRef({
    componentReady: !components.length,
    actionReady: !actions.length,
  });

  const checkReady = () => {
    if (!state.ready
      && runtimeReadyRef.current.componentReady
      && runtimeReadyRef.current.actionReady) {
      dispatch({ type: ActionTypes.SetReady });
    }
  };

  // TODO：编辑器那边，整个数据监听的话，频率太高了？
  useEffect(() => {
    updateJson2PageDefineRef.current(json2pageDefine);
  }, [json2pageDefine]);

  useEffect(() => {
    if (components?.length) {
      components.forEach(component => componentRegistry.register(component));
      runtimeReadyRef.current.componentReady = true;
      checkReady();
    }
  }, [components]);

  useEffect(() => {
    if (actions?.length) {
      actions.forEach(action => actionRegistryRef.current.register(action));
      runtimeReadyRef.current.actionReady = true;
      checkReady();
    }
  }, [actions]);

  return [state, {
    ...runtimeMethods,
    ...runtimeOptionMethods,
  }];
}
