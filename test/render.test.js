import { zen, render } from './zen-html.js';

function createContainer() {
  const container = document.createElement('div');
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
    const zenTemplate = zen`<div id="zen-template">Hi!</div>`;
    render(zenTemplate, container);

    chai.expect(container.querySelector('#zen-template')).to.exist;
  });

  it('should render primitives in attribute area', function () {
    const className1 = 'test-1';
    const className2 = 'test-2';
    const zenTemplate = zen`<div id="rendered-element" class="${className1} break ${className2}"></div>`;

    render(zenTemplate, container);

    const renderedElement = document.querySelector('#rendered-element');
    chai.expect(renderedElement.className).to.contain(`${className1} break ${className2}`);
  });

  it('should render primitives in text content area', function () {
    const hi = 'Hi';
    const testing = 'Testing';
    const zenTemplate = zen`<div id="rendered-element">${hi}, ${testing}</div>`;

    render(zenTemplate, container);

    const renderedElement = document.querySelector('#rendered-element');
    chai.expect(renderedElement.textContent).to.contain(`${hi}, ${testing}`);
  });

  it('should render zen template in text content area', function () {
    const zenTemplate = zen`
      <div id="rendered-element">
        ${ zen`<div id="nested-element'></div>` }
      </div>`;

    render(zenTemplate, container);

    const renderedElement = document.querySelector('#nested-element');
    chai.expect(renderedElement).to.exist;
  });

  it('should render updated values', function () {
    let attributeValue = 'test-class';
    let textContent = 'Test Message';
    const zenTemplate = zen`<div id="rendered-element" class="${attributeValue}">${textContent}</div>`;

    render(zenTemplate, container);

    attributeValue = 'new-test-class';
    textContent = 'New Test Message';
    const newZenTemplateValues = zen`<div id="rendered-element" class="${attributeValue}">${textContent}</div>`;
    // rendering into the same container should update previous element
    // since both templates share the same template string
    render(newZenTemplateValues, container);

    // get element out of dom and check
    const renderedElement = document.querySelector('#rendered-element');
    chai.expect(renderedElement.className).to.contain(attributeValue);
    chai.expect(renderedElement.textContent).to.contain(textContent);
  });
});