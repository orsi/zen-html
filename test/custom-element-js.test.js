import { ZenTestElement } from './zen-test-element.js';
import { ZenElement } from './zen-html.js';

describe('custom-element-js', function () {
  const testCustomJsElement = new ZenTestElement();
  it('should create a custom element', function () {
    chai.expect(testCustomJsElement).to.be.instanceOf(ZenElement);
  });

  it('should create a shadow root', function () {
    chai.expect(testCustomJsElement.shadowRoot).to.be.not.null;
  });
});