describe('custom-element-html', function () {
  it('should find custom zen-test-element in playground', function () {
    const testCustomHtmlElement = document.querySelector('#zen-test-element-1');
    chai.expect(testCustomHtmlElement).to.exist;
  });

  it('should render html in it\'s shadow root', function () {
    const testCustomHtmlElement = document.querySelector('#zen-test-element-1');
    chai.expect(testCustomHtmlElement.shadowRoot.innerHTML).to.contains('<span>zen-test-element</span>');
  });

  it('should have a message property with attribute value given', function () {
    const testCustomHtmlElement = document.querySelector('#zen-test-element-2');
    chai.expect(testCustomHtmlElement.message).to.be('This is an attribute property');
  });
});