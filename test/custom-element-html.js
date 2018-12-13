import { ZenElement } from '/test/zen-html.js';

class TestCustomHtmlElement extends ZenElement {}
customElements.define("zen-test-html-element", TestCustomHtmlElement);

describe('html custom element', function () {
  it('should find custom element in playground', function () {
    const testCustomHtmlElement = document.querySelector('zen-test-html-element');
    chai.expect(testCustomHtmlElement).to.exist;
  });
});