import { NodeDefine } from '../types';
import { ComponentExportInfo } from '../Components';
import { PageStateData } from './useRuntime';

export interface RuntimeOptions<NodeExtends = any> {
  // 关联动态属性之前执行的映射
  mapNodePropDefinesBeforeLink: (params: {
    stateContext: PageStateData;
    nodeDefine: NodeDefine<NodeExtends>;
    propDefines: NodeDefine<NodeExtends>['props'];
    componentInfo: ComponentExportInfo;
  }) => any;
  mapNodeProps: (params: {
    nodeDefine: NodeDefine<NodeExtends>;
    propDefines: NodeDefine<NodeExtends>['props'];
    stateContext: PageStateData;
    componentInfo: ComponentExportInfo;
    props: any;
  }) => any;
  mapNodeStyle: (params: {
    style: React.CSSProperties;
    nodeDefine: NodeDefine<NodeExtends>;
    propDefines: NodeDefine<NodeExtends>['props'];
    stateContext: PageStateData;
    componentInfo: ComponentExportInfo;
    props: any;
  }) => React.CSSProperties;
}

export function useRuntimeOptions<NodeExtends = any>({
  mapNodeProps = ({ props }) => props,
  mapNodePropDefinesBeforeLink = ({ nodeDefine, propDefines }) => propDefines || nodeDefine.props,
  mapNodeStyle = ({ style }) => style,
}: Partial<RuntimeOptions<NodeExtends>> = {}): RuntimeOptions<NodeExtends> {
  return {
    mapNodeProps,
    mapNodePropDefinesBeforeLink,
    mapNodeStyle,
  };
}
