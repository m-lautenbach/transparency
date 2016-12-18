import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  plugins: [ nodeResolve() ],
  sourceMap: true,
  entry: 'lib/client.js',
  dest: 'public/js/index.js',
  format: 'cjs'
};
