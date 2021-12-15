import { ActionHandler } from './ActionHandler';
import { ActionHandlerConfig, ActionHandlerContext } from './types';

export class ActionRegistry {
  context: ActionHandlerContext;
  handlerMap: {
    [actionHandlerType: string]: ActionHandler;
  } = {};

  constructor(context: ActionHandlerContext) {
    this.context = context;
  }

  register(ActionHandlerConstructor: typeof ActionHandler) {
    const actionHandler = new ActionHandlerConstructor(this.context);

    if (!actionHandler.type || !actionHandler.handlers) {
      throw new Error('非法的事件处理器，缺少 type 或 handlers');
    }

    this.handlerMap[actionHandler.type] = actionHandler;
  }

  dispatchAction(type, actionName, params) {
    console.log('dispatching action', type, actionName, params);
    const actionDefine = this.getActionDefine(type, actionName);

    if (!actionDefine) {
      return;
    }

    return actionDefine?.handler(params);
    // 以下代码同上
    // 路径太长了，此处保留一下，方便阅读理解
    // return this.handlerMap[type]?.handlers[actionName]?.handler(params, runtimeStateMethods);
  }

  getActionTypeHandlers(actionType: string): ActionHandler {
    const actionTypeDefine = this.handlerMap[actionType];

    if (!actionTypeDefine) {
      console.warn(`不存在 type 为 ${actionType} 的事件处理器，事件将被忽略`);
      return null;
    }

    return actionTypeDefine;
  }

  getActionDefine(actionType: string, actionName: string): ActionHandlerConfig<any> {
    const actionTypeDefine = this.getActionTypeHandlers(actionType);

    if (!actionTypeDefine) {
      console.warn(`不存在 type 为 ${actionType} 的事件处理器`);
      return null;
    }

    if (!actionTypeDefine.handlers[actionName]) {
      console.warn(`type 为 ${actionType} 的处理器列表下不存在 name 为 ${actionName} 的事件处理器`);
      return null;
    }

    return actionTypeDefine.handlers[actionName];
  }
}