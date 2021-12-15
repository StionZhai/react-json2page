import {
  ComponentExportInfo,
  ComponentModuleDefine,
} from './types';
import { NodeType } from '../types';

class ComponentRegistry {
  modules: {
    [module: string]: ComponentModuleDefine;
  } = {};

  register(componentModuleDefine: ComponentModuleDefine) {
    if (this.modules[componentModuleDefine.module]) {
      console.warn(`请勿重复注册组件(${componentModuleDefine.module})`)
      return;
    }

    // 原始模块声明
    this.modules[componentModuleDefine.module] = componentModuleDefine;
  }

  find(nodeType: NodeType): ComponentExportInfo {
    if (this.modules[nodeType.module]) {
      const Component = this.modules[nodeType.module]?.components?.[nodeType.component];

      if (Component) {
        return {
          name: Component.config.name,
          Component,
          config: Component.config,
        };
      }
    }

    console.warn(`无法找到对应组件(module: ${nodeType.module}, component: ${nodeType.component})`);

    return null;
  }

  findModuleDefine(module: string): ComponentModuleDefine {
    return this.modules[module];
  }
}

export const componentRegistry = new ComponentRegistry();
