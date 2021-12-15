import React from 'react';
// import { ComponentDemo } from './ComponentDemo';
import { ParamDefine } from '../types';

// // 每个分类下的组件集合的定义，如：开关
// export interface ComponentTypeDefine {
//   title: string;
//   icon: string;
//   components: Record<string, Component>;
// }
//
// // 一个模块下的分类的定义。一个模块下有若干分类，如：控制组件
// export interface ComponentCategoryDefine {
//   title: string;
//   components: ComponentTypeDefine[];
// }

export interface ComponentEventDefine {
  name: string;
  title: string;
  withDetails?: boolean; // 事件是否会暴露详情，如为true，则设置事件监听器时触发的行为可取事件详情作为参数
}

export interface ComponentExportInfo<P = any, T = any> {
  name: string;
  Component: Component<P, T>;
  config: ComponentConfig<T>;
  // Demo: typeof ComponentDemo;
  // componentType: string;
  // componentIcon: string;
}

export interface ComponentEvent<T = any> {
  // 如果事件声明了 withDetails，则必须包含此对象
  detail?: {
    value: T;
  };
  event?: Event; // 如果事件为原生事件触发，则需包含此原始对象，可能是 SyntheticEvent，也可能是 Dom 原生事件
}

export interface ComponentConfig<T = any> {
  name?: string;
  title?: string;
  props: {
    [propKey: string]: ParamDefine;
  };
  events: ComponentEventDefine[];
  defaultStyle?: React.CSSProperties;
  extends?: T;
}

// 每个组件集合下有多重组件，如开关有若干种
// P -> 组件接收的props声明
// T -> ComponentConfig 的 extends 声明
export interface Component<P = any, T = any> extends React.FC<P> {
  // Demo: React.FC<P>;
  config: ComponentConfig<T>;
}

// 一个模块的定义，如 platform
export interface ComponentModuleDefine {
  module: string;
  components: {
    [componentName: string]: Component;
  };
}
