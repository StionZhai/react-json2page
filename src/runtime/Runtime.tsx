import React from 'react';
import { UseRuntimeProps, RuntimeContext, useRuntime } from './useRuntime';
import { RuntimeContainer } from './RuntimeContainer';
import {
  HashRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';
import './style.less';
import { ActionContext } from '../actionHandler';

export type RuntimeProps<T extends ActionContext = any,
  GlobalExtends = any,
  PageExtends = any,
  NodeExtends = any,
> = UseRuntimeProps<T, GlobalExtends, PageExtends, NodeExtends>;

export function Runtime<T extends ActionContext = any,
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
}: RuntimeProps<T, GlobalExtends, PageExtends, NodeExtends>) {
  const [state, methods] = useRuntime({
    json2pageDefine,
    actions,
    components,
    context,
    envApi,
    options,
  });

  return (
    <RuntimeContext.Provider
      value={[state, methods]}
    >
      <Router>
        <Switch>
          {/* 蓝牙搜索页 */}
          {state.ready && json2pageDefine?.pages?.map((pageDefine, index) => (
            <Route
              path={[
                index === 0 ? '/' : '',
                `/${pageDefine.id}`
              ].filter(Boolean)}
              key={pageDefine.id}
              exact
            >
              <RuntimeContainer
                key={pageDefine.id}
                pageDefine={pageDefine}
              />
            </Route>
          ))}
        </Switch>
      </Router>
    </RuntimeContext.Provider>
  );
}
