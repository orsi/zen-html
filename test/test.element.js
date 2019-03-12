import { zen, ZenElement } from './zen-html.js';
export class ZenTestElement extends ZenElement {
  static get styles() {
    return `
      :host {
        display: block;
        padding: 1px;
        text-align: center;
        background-color: #333;
        color: #eee;
      }
    `;
  }
  static get properties() {
    return {
      test: String,
      message: String
    };
  }

  paragraphClass = 'testing-class';
  render () {
    return  zen`
      <header>
        <h2>ZEN TEST ELEMENT</h2>
      </header>
      <main>
        <p class="${ this.paragraphClass }">${ this.properties.message }</p>
        <p>${ this.properties.test }</p>
      </main>
    `;
  }
}
customElements.define("zen-test", ZenTestElement);
