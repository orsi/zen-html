import { zen, ZenElement } from './zen-html.js';
export class ZenTestElement extends ZenElement {
  testProperty = 'testing';
  static get properties() {
    return {
      test: String
    };
  }
  render () {
    return  zen`<span>zen-test</span>`;
  }
}
customElements.define("zen-test", ZenTestElement);
