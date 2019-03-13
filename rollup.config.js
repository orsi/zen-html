import typescript from 'rollup-plugin-typescript';
import minify from 'rollup-plugin-babel-minify';

export default {
  input: './src/zen-html.ts',
  output: {
    file: './dist/zen-html.js',
    format: 'esm',
    compact: true
  },
  plugins: [
    typescript(),
    minify({
      comments: false,
      sourceMap: false
    })
  ]
}