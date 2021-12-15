import React from 'react';
import { Json2PageDefine } from '../types';
import { RuntimeContext, useRuntime } from './useRuntime';
import { RuntimeContainer } from './RuntimeContainer';
import {
  HashRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';
import './style.less';

export interface IRuntimeProps<T = any> {
  // deviceId: string;
  json2pageDefine?: Json2PageDefine;
  context: T;
  // Component:
}

export function Runtime<T>({
  // deviceId,
  json2pageDefine,
  context,
}: IRuntimeProps<T>) {
  const [state, methods] = useRuntime({
    // deviceId,
    json2pageDefine,
    context,
  });

  return (
    <RuntimeContext.Provider
      value={[state, methods]}
    >
      <Router>
        <Switch>
          {/* 蓝牙搜索页 */}
          {json2pageDefine.pages.map((pageDefine, index) => (
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
