import { zen, ZenElement } from './zen-html.js';
export class ZenTestElement extends ZenElement {
  render () {
    return  zen`<span>zen-test-element</span>`;
  }
}
customElements.define("zen-test-element", ZenTestElement);
