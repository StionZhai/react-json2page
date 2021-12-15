import { ActionHandlerConfig, ActionHandlerContext, ActionHandlerFeedbackDefine } from './types';

export function defineData<T extends {
  [feedbackName: string]: ActionHandlerFeedbackDefine;
}>(data: ActionHandlerConfig<T>) {
  return data;
}

export class ActionHandler {
  type: string;
  context: ActionHandlerContext;
  handlers: {
    [actionName: string]: ActionHandlerConfig<any>;
  } = {};

  constructor(context: ActionHandlerContext) {
    this.context = context;
  }
}
