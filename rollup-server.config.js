import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  plugins: [ nodeResolve() ],
  sourceMap: true,
  entry: 'lib/server.js',
  dest: './index.js',
  format: 'cjs'
};
