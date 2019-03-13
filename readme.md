<img alt="zen-HTML" width="140" src="https://github.com/jorsi/zen-html/raw/master/docs/zen-html.svg?sanitize=true">

An enlightened html template library to create custom web elements.

[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)
- - -

## Example

```js
import { zen, render } from './zen-html.js';
const zenTemplate = zen`<h1 class="zen-element">Hi!</div>`;
render(zenTemplate, document.querySelector('#root'));
```

## Features

  * ***Zero*** dependencies
  * *Really small*, <4kB bundled/minified
  * Uses native and shadow DOM, no virtual DOM

### Installation

```js
// NodeJS
$ npm install zen-html
```
```js
// ES6
import { zen, render } from './path/to/zen-html.js';
```

## Compatibility

Works in at least Chrome 72.