import typescript from 'rollup-plugin-typescript';

export default {
  input: './src/zen-html.ts',
  output: {
    file: './dist/zen-html.js',
    format: 'esm'
  },
  plugins: [
    typescript()
  ]
}