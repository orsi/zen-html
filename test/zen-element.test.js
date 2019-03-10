import './zen-test-element.js';
const renderContainer = document.querySelector('#render-container');

describe('zen-element.ts', function () {
  it('should find custom zen-test-element in dom', function () {
    const zenTestElement = document.createElement('zen-test-element');
    renderContainer.appendChild(zenTestElement);
    chai.expect(document.querySelector('zen-test-element')).to.exist;
    zenTestElement.remove();
  });

  it('should have a shadow root', function () {
    const zenTestElement = document.createElement('zen-test-element');
    renderContainer.appendChild(zenTestElement);
    chai.expect(document.querySelector('zen-test-element').shadowRoot).to.not.be.null;
    zenTestElement.remove();
  });

  it('should render html in it\'s shadow root', function () {
    const zenTestElement = document.createElement('zen-test-element');
    renderContainer.appendChild(zenTestElement);
    chai.expect(document.querySelector('zen-test-element').shadowRoot.innerHTML).to.contain('<span>zen-test-element</span>');
    zenTestElement.remove();
  });

  it('should have an attribute property', function () {
    const zenTestElement = document.createElement('zen-test-element');
    zenTestElement.setAttribute('message', 'test');
    chai.expect(zenTestElement.message).to.exist;
  });

  it('should have an attribute property with value given', function () {
    const zenTestElement = document.createElement('zen-test-element');
    zenTestElement.setAttribute('message', 'test');
    chai.expect(zenTestElement.message).to.contain('test');
  });
});