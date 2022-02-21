import { ParamDefine } from '../types';
import { RuntimeActions } from '../runtime';

export function defineActionHandleConfig<P extends ParamDefine, T extends {
  [feedbackName: string]: ActionHandlerFeedbackDefine;
}>(data: ActionHandlerConfig<P, T>) {
  return data;
}

export interface ActionHandlerFeedbackDefine {
  title: string;
}

export interface ActionHandlerParams<T extends ParamDefine> {
  [paramKey: string]: T;
}

export type ActionHandlerResponse<T> = T extends {} ? {
  feedback?: {
    type: (keyof T) & string;
    details?: any;
  };
} : void;

// 每一个行为的后续反馈，无论成功失败，都统一以 feedback 来反应
// 各 handler 需要保证各 feedback 都已处理完毕，具体可参考 controlDeviceData 的实现
export type ActionHandlerApi<Feedbacks = unknown> = (params: any) => Promise<ActionHandlerResponse<Feedbacks | void>> | ActionHandlerResponse<Feedbacks | void>;

export interface ActionHandlerConfig<T extends ParamDefine, Feedbacks extends {
  [feedbackName: string]: ActionHandlerFeedbackDefine;
}> {
  title: string;
  params?: ActionHandlerParams<T>;
  feedbacks?: Feedbacks;
  handler: ActionHandlerApi<Feedbacks>;
}

export type GetContextEnvApiType<C extends ActionContext> = C extends ActionContext<infer T> ? T : unknown;

export interface ActionContextOptions<T = any> {
  envApi: T;
  runtimeActions: RuntimeActions;
}

export abstract class ActionContext<T = any> {
  envApi: T;
  runtimeActions: RuntimeActions;

  constructor({
    envApi,
    runtimeActions,
  }: ActionContextOptions<T>) {
    this.envApi = envApi;
    this.runtimeActions = runtimeActions;
  }

  abstract init(): any;
}

export class ActionHandler<Context = any> {
  type: string;
  context: Context;
  handlers: {
    [actionName: string]: ActionHandlerConfig<any, any>;
  } = {};

  constructor(context: Context) {
    this.context = context;
  }
}
