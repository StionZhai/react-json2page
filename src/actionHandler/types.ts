import { RuntimeContext } from '../runtime';
import { ParamDefine } from '../types';

export interface ActionHandlerContext<T = any> {
  // deviceId: string;
  // requestApi: EnvContext['requestApi'];
  context: T;
  actions: {
    setState: (path: string, data: any) => any;
    // updateDeviceData: (deviceData: any) => any;
  };
}

export interface ActionHandlerFeedbackDefine {
  title: string;
}

export interface ActionHandlerParams {
  [paramKey: string]: ParamDefine;
}

export type ActionHandlerResponse<T> = T extends {} ? {
  feedback?: {
    type: (keyof T) & string;
    details?: any;
  };
} : void;

// 每一个行为的后续反馈，无论成功失败，都统一以 feedback 来反应
// 各 handler 需要保证各 feedback 都已处理完毕，具体可参考 controlDeviceData 的实现
export type ActionHandlerApi<T = unknown> = (params: any) => Promise<ActionHandlerResponse<T>> | ActionHandlerResponse<T>;

export interface ActionHandlerConfig<T extends {
  [feedbackName: string]: ActionHandlerFeedbackDefine;
}> {
  title: string;
  params?: ActionHandlerParams;
  feedbacks?: T;
  handler: ActionHandlerApi<T>;
}

export interface ActionModuleConfig<T = any> {
  title: string;
  params?: ActionHandlerParams;
  feedbacks?: ActionHandlerResponse<T>;
}
