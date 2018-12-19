import { zen, ZenElement } from '/test/zen-html.js';

const testElementTemplate = zen`<span>zen-test-element</span>`;
class ZenTestElement extends ZenElement {
  render () {
    return testElementTemplate;
  }
}
customElements.define("zen-test-element", ZenTestElement);

describe('zen element', function () {
  const testCustomJsElement = new ZenTestElement();
  it('should create a custom element', function () {
    chai.expect(testCustomJsElement).to.be.instanceOf(ZenElement);
  });

  it('should create a shadow root', function () {
    chai.expect(testCustomJsElement.shadowRoot).to.be.not.null;
  });

  it('should find zen element in playground', function () {
    const testCustomHtmlElement = document.querySelector('zen-test-element');
    chai.expect(testCustomHtmlElement).to.exist;
  });

  it('should render in it\'s shadow root', function () {
    const testCustomHtmlElement = document.querySelector('zen-test-element');
    chai.expect(testCustomHtmlElement.shadowRoot.innerHTML).to.contains('<span>zen-test-element</span>');
  });
});