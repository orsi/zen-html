import typescript from 'rollup-plugin-typescript';

export default {
  input: './src/zen-html.ts',
  output: {
    file: './test/zen-html.js',
    format: 'esm',
    sourcemap: 'inline'
  },
  plugins: [
    typescript()
  ]
}