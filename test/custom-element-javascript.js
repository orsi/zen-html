import { ZenElement } from '/test/zen-html.js';

class TestCustomJsElement extends ZenElement {}
customElements.define("zen-test-js-element", TestCustomJsElement);

describe('javascript custom element', function () {
  const testCustomJsElement = new TestCustomJsElement();

  it('should create a custom element', function () {
    chai.expect(testCustomJsElement).to.be.instanceOf(ZenElement);
  });

  it('should create a shadow root', function () {
    chai.expect(testCustomJsElement.shadowRoot).to.be.not.null;
  });
});