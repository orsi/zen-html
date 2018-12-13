import typescript from 'rollup-plugin-typescript';

export default {
  input: './src/index.ts',
  output: {
    file: './dist/zen-html.js',
    format: 'esm'
  },
  plugins: [
    typescript()
  ]
}