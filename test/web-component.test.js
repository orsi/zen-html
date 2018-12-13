import { ZenElement } from '/test/zen-html.js';

class TestElement extends ZenElement {}
customElements.define("zen-test-element", TestElement);

describe('custom element', function () {
  it('should create a custom element', function () {
    const testElement = new TestElement();
    chai.expect(testElement).to.be.instanceOf(ZenElement);
  });
});