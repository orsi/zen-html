import './test.element.js';

describe('zen-element.ts', function () {
  let container;
  let i = 0;
  beforeEach(function() {
    container = document.createElement('div');
    container.id = 'container-' + i++;
    document.body.appendChild(container);
  });

  afterEach(function() {
    container.remove();
  });

  it('should find custom zen-test element in dom', function () {
    const zenTestElement = document.createElement('zen-test');
    container.appendChild(zenTestElement);
    chai.expect(document.querySelector('zen-test')).to.exist;
  });

  it('should have a shadow root', function () {
    const zenTestElement = document.createElement('zen-test');
    container.appendChild(zenTestElement);
    chai.expect(document.querySelector('zen-test').shadowRoot).to.not.be.null;
  });

  it('should render html in it\'s shadow root', function () {
    const zenTestElement = document.createElement('zen-test');
    container.appendChild(zenTestElement);
    chai.expect(document.querySelector('zen-test').shadowRoot.innerHTML).to.contain('<span>zen-test</span>');
    zenTestElement.remove();
  });

  it('should have properties property', function () {
    const zenTestElement = document.createElement('zen-test');
    chai.expect(zenTestElement.properties).to.exist;
  });

  it('should have state property', function () {
    const zenTestElement = document.createElement('zen-test');
    chai.expect(zenTestElement.state).to.exist;
  });

  it('should have test property', function () {
    const zenTestElement = document.createElement('zen-test');
    chai.expect(zenTestElement.properties.test).to.exist;
  });

  it('should have test property with given value', function () {
    const zenTestElement = document.createElement('zen-test');
    zenTestElement.setAttribute('test', 'test');
    chai.expect(zenTestElement.properties.test).to.contain('test');
  });

  it('should have styles property', function () {
    const zenTestElement = document.createElement('zen-test');
    chai.expect(zenTestElement.styles).to.exist;
  });

  it('should have styles backgroundColor property set', function () {
    const zenTestElement = document.createElement('zen-test');
    chai.expect(zenTestElement.styles.backgroundColor).to.contain('red');
  });

  it('should reflect styles to element style', function () {
    const zenTestElement = document.createElement('zen-test');
    chai.expect(zenTestElement.style.backgroundColor).to.contain('red');
  });

});