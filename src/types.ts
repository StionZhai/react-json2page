import React from 'react';

export function defineParamConfig<C = any, T extends keyof C = any, E = any>(componentType: T, config: Omit<ParamDefine<E, C, T>, 'component'>) {
  return {
    ...config,
    component: componentType,
  };
}

// C -> FormConfigMap
// T -> FormComponentType
// E -> ExtendsDefine
export interface ParamDefine<E = any, C = any, T extends keyof C = any> {
  title: string;
  defaultValue?: any;
  value?: any;
  type: string; // 数据类型 'string' | 'boolean' | 'number' | 'array' | 'object'
  component: T;
  componentParams?: C[T];
  disabled?: boolean; // 禁用该配置
  visible?: boolean; // 是否渲染该选项
  // 新增了组件属性相关的 hooks
  // 目前支持的 hooks 为：
  //  - onChange => 当本属性变更时触发
  // hooks?: {
  //   [hookName: string]: (newValue, oldValue, nodeDefine, editorAction) => void;
  // };
  extends?: E;
  // 用于属性配置表单联动，比如：当 A 属性变为 a，则当前配置 disabled 设为 true
  mapParamDefineOnFormChange?: (formData: any, currentParamDefine?: ParamDefine<E, C, T>) => Partial<ParamDefine<E, C, T>>;
}

export interface StateVariable {
  dataType: 'boolean' | 'string' | 'number' | 'array' | 'object';
  defaultValue: any;
}

export type Dataset = Record<string, StateVariable>;

export interface NodeType {
  module: string;
  component: string;
}

// 通用样式属性、类名、css
export interface NodeStyleDefine {
  styleProps?: React.CSSProperties;
  className?: string;
  css?: string;
}

export interface NodePosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface NodeListenerHandler {
  type: 'platform' | 'lowcode'; // 'platform' | 'lowcode'
  name: string;
  params?: Record<string, any>; // 动作定义的参数
}

export interface NodeListener {
  id: string;
  eventName: string; // 组件暴露的事件
  handler: NodeListenerHandler;
  extends?: any;
}

export interface NodeDefine {
  id: string;
  type: NodeType;
  position: NodePosition;
  props: { [propKey: string]: any }; // 透传给组件渲染，editor需要处理业务逻辑，runtime不关注
  listeners?: NodeListener[];
  zIndex?: number;
  style?: NodeStyleDefine;
  hidden?: boolean;
  extends?: any;
}

export interface PageDefine {
  id: string;
  title: string;
  nodes: NodeDefine[];
  dataset: Dataset;
  style?: NodeStyleDefine;
  extends?: any;
}

export interface Json2PageDefine {
  pages: PageDefine[];
  dataset: Dataset;
  extends?: any;
}

/**
 * 表示组件支持通过 className 和 style 进行样式定制
 */
export interface StyledProps {
  /**
   * 组件自定义类名
   */
  className?: string;

  /**
   * 组件自定义样式
   */
  style?: React.CSSProperties;
}

export interface ReducerAction<T = any> {
  payload?: any;
  type: T;
}
