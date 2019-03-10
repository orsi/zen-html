import { zen, render } from './zen-html.js';

function createContainer() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
}

describe('render.ts', function () {
  it('should render zen template into dom', function () {
    const container = createContainer();
    const zenTemplate = zen`<div id="zen-template">Hi!</div>`;
    render(zenTemplate, container);

    chai.expect(container.querySelector('#zen-template')).to.exist;
    container.remove();
  });

  it('should render zen template with given values', function () {
    const container = createContainer();
    const className1 = 'test-1';
    const className2 = 'test-2';
    const message = 'Test 1';
    const number = 123;
    const zenTemplate = zen`<div id="rendered-element-2" class="${className1} break ${className2}">${message} - ${number}</div>`;

    render(zenTemplate, container);

    const renderedElement = document.querySelector('#rendered-element-2');
    chai.expect(renderedElement.className).to.contain(`${className1} break ${className2}`);
    chai.expect(renderedElement.textContent).to.contain(`${message} - ${number}`);
    container.remove();
  });

  it('should render zen template with updated values', function () {
    const container = createContainer();
    const className = 'test';
    const message = 'Test 2';
    const zenTemplate = zen`<div id="rendered-element-3" class="${className}">${message}</div>`;
    render(zenTemplate, container);

    const newClassName = 'new-test';
    const newMessage = 'Hello world!';
    const newZenTemplateValues = zen`<div id="rendered-element-3" class="${newClassName}">${newMessage}</div>`;
    // rendering into the same container should update previous element
    // since both templates share the same template string
    render(newZenTemplateValues, container);

    // get element out of dom and check
    const renderedElement = document.querySelector('#rendered-element-3');
    chai.expect(renderedElement.className).to.contain(newClassName);
    chai.expect(renderedElement.textContent).to.contain(newMessage);
    container.remove();
  });
});