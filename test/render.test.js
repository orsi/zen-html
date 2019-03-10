import { zen, render } from './zen-html.js';

let i = 0;
function createContainer() {
  const container = document.createElement('div');
  container.id = 'container-' + i++;
  document.body.appendChild(container);
  return container;
}

describe('render.ts', function () {
  let container;

  beforeEach(function () {
      container = createContainer();
  });

  afterEach(function () {
    container.remove();
  });

  it('should render zen template into dom', function () {
    const zenTemplate = zen`<div class="test-element">Hi!</div>`;
    render(zenTemplate, container);

    chai.expect(container.querySelector('.test-element')).to.exist;
  });

  it('should render primitives in attribute area', function () {
    const className1 = 'test-1';
    const className2 = 'test-2';
    const zenTemplate = zen`<div class="test-element ${className1} break ${className2}"></div>`;

    render(zenTemplate, container);

    const renderedElement = container.querySelector('.test-element');
    chai.expect(renderedElement.className).to.contain(`test-element ${className1} break ${className2}`);
  });

  it('should render primitives in text content area', function () {
    const hi = 'Hi';
    const testing = 'Testing';
    const zenTemplate = zen`<div class="test-element">${hi}, ${testing}</div>`;

    render(zenTemplate, container);

    const renderedElement = container.querySelector('.test-element');
    chai.expect(renderedElement.textContent).to.contain(`${hi}, ${testing}`);
  });

  it('should render zen template in text content area', function () {
    const zenTemplate = zen`
      <div class="test-element">
        ${ zen`<div class="nested-zen-template">Nested Zen Template</div>` }
      </div>`;

    render(zenTemplate, container);

    const renderedElement = document.querySelector('.nested-zen-template');
    chai.expect(renderedElement).to.exist;
  });

  it('should render updated values', function () {
    let attributeValue = 'test-class';
    let textContent = 'Test Message';
    const zenTemplate = zen`<div class="test-element ${attributeValue}">${textContent}</div>`;

    render(zenTemplate, container);

    attributeValue = 'new-test-class';
    textContent = 'New Test Message';
    const newZenTemplateValues = zen`<div class="test-element ${attributeValue}">${textContent}</div>`;
    // rendering into the same container should update previous element
    // since both templates share the same template string
    render(newZenTemplateValues, container);

    // get element out of dom and check
    const renderedElement = container.querySelector('.test-element');
    chai.expect(renderedElement.className).to.contain(`test-element ${attributeValue}`);
    chai.expect(renderedElement.textContent).to.contain(textContent);
  });

  it('should render zen template in text content area with values', function () {
    const textContent = 'Test Value';
    const zenTemplate = zen`
      <div class="test-element">
        ${ zen`<div class="nested-zen-template">${ textContent }</div>` }
      </div>`;

    render(zenTemplate, container);

    const renderedElement = container.querySelector('.nested-zen-template');
    chai.expect(renderedElement.textContent).to.contain(textContent);
  });

  it('should render zen template in text content area with updated values', function () {
    let textContent = 'Test Value';
    let zenTemplate = zen`
      <div class="test-element">
        ${ zen`<div class="nested-zen-template">${ textContent }</div>` }
      </div>`;

    render(zenTemplate, container);

    textContent = 'New Test Value';
    zenTemplate = zen`
      <div class="test-element">
        ${ zen`<div class="nested-zen-template">${ textContent }</div>` }
      </div>`;

    render(zenTemplate, container);

    const renderedElement = container.querySelector('.nested-zen-template');
    chai.expect(renderedElement.textContent).to.contain(textContent);
  });
});