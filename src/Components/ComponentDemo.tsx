// import React, { useMemo } from 'react';
// import { ComponentConfig } from './types';
// import { StyledProps } from '../types';
//
// export interface IComponentDemoProps extends StyledProps {
//   Component: React.ElementType;
//   config: ComponentConfig;
// }
//
// export const ComponentDemo: React.FC<IComponentDemoProps> = ({
//   Component,
//   config,
//   style,
//   className,
// }: IComponentDemoProps) => {
//   const props = useMemo(() => {
//     const result: any = {
//       events: [],
//       style: {},
//     };
//     const { props, events, defaultStyle } = config;
//
//     Object.keys(props).forEach((key) => {
//       result[key] = props[key].defaultValue;
//     });
//
//     events.forEach((event) => {
//       result.events[event.name] = (...args) => console.log(`trigger event: ${event.name}`, ...args);
//     });
//
//     result.style = defaultStyle || {};
//
//     if (className) {
//       result.className = `${result.className ? `${result.className} ` : ''}${className}`;
//     }
//
//     if (style) {
//       result.style = Object.assign({}, result.style, style);
//     }
//
//     return result;
//   }, [config]);
//
//   return <Component {...props}/>;
// };
