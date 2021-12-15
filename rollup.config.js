import commonjs from 'rollup-plugin-commonjs';
import external from 'rollup-plugin-peer-deps-external';
import resolve from 'rollup-plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';
import { terser } from "rollup-plugin-terser";
import image from '@rollup/plugin-image';

const getRollupConfig = (environment = 'development', opts = {}) => {
  const isProduction = environment === 'production';
  return {
    input: 'src/index.ts',
    output: [
      {
        file: 'lib/index.js',
        name: 'index',
        format: 'umd',
      },
      {
        file: 'es/index.js',
        name: 'index',
        format: 'es',
      }
    ],
    external: ['react', 'react-dom', 'immer', 'react-router-dom', 'classnames'],
    // globals: {
    //   'react': 'React',
    //   'react-dom': 'ReactDOM',
    // },
    plugins: [
      external(),
      postcss({
        minimize: isProduction,
        // extract: true,
        plugins: [
          // require('postcss-inline-svg'),
          // require('postcss-svgo')
        ]
      }),
      image(),
      // url(),
      // svgr(),
      resolve(),
      builtins(),
      commonjs({
        include: [
          // /node_modules\/prop-types/,
          // /node_modules\/hoist-non-react-statics/,
          // /node_modules\/invariant/,
          // /node_modules\/react-is/,
          // /node_modules\/warning/,
          // /node_modules\/path-to-regexp/,
        ],
        exclude: [
          // /node_modules\/react\//,
          // /node_modules\/react-dom\//,
        ],
        namedExports: {
          // 'react-is': ['isValidElementType'],
        }
      }),
      typescript({
        tsconfig: 'tsconfig.json',
        exclude: ['*.d.ts'],
      }),
      isProduction && terser(),
    ].filter(Boolean),
    ...opts,
  };
};


export default (env, argus) => {
  return getRollupConfig(env.environment, {
    external: ['react', 'react-dom', 'immer', 'react-router-dom', 'classnames'],
  });
}
