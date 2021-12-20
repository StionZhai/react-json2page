import {
  ComponentExportInfo,
  ComponentModuleDefine,
} from './types';
import { NodeType } from '../types';

class ComponentRegistry {
  modules: {
    [module: string]: ComponentModuleDefine;
  } = {};

  // 重复注册也无所谓，覆盖呗
  register(componentModuleDefine: ComponentModuleDefine) {
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

// 目前还是先单例，因为 editor 也要用（其实也可以不用，editor直接取组件来读配置）
export const componentRegistry = new ComponentRegistry();
