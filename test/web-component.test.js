import { ZenElement } from '/test/zen-html.js';

class TestElement extends ZenElement {}
customElements.define("zen-test-element", TestElement);

describe('custom element', function () {
  const testElement = new TestElement();

  it('should create a custom element', function () {
    chai.expect(testElement).to.be.instanceOf(ZenElement);
  });

  it('should create a shadow root', function () {
    chai.expect(testElement.shadowRoot).to.be.not.null;
  });
});