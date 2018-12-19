import { zen, render } from './zen-html.js';

describe('zen render', function () {
    it('should render zen template into dom', function () {
      const zenTemplate = zen`<div id="rendered-element-1">Hi!</div>`;

      // render into dom
      render(zenTemplate, document.querySelector('#render-container-1'));

      // get element from dom and check
      const renderedElement = document.querySelector('#rendered-element-1');
      chai.expect(renderedElement).to.exist;
    });

    it('should render zen template into dom with given values', function () {
        const className = 'test-1';
        const message = 'Hi again!';
        const zenTemplate = zen`<div id="rendered-element-2" class="${ className }">${ message }</div>`;

        // render into dom
        render(zenTemplate, document.querySelector('#render-container-2'));

        // get element out of dom and check
        const renderedElement = document.querySelector('#rendered-element-2');
        const classes = renderedElement.className;
        const text = renderedElement.textContent;
        chai.expect(classes).to.contain(className);
        chai.expect(text).to.contain(message);
      });

    it('should render zen template into dom with updated values', function () {
      const className = 'test';
      const message = 'Hi again!';
      const zenTemplate = zen`<div id="rendered-element-3" class="${ className }">${ message }</div>`;
      render(zenTemplate, document.querySelector('#render-container-3'));

      const newClassName = 'new-test';
      const newMessage = 'Hello world!';
      const newZenTemplate = zen`<div id="rendered-element-3" class="${ newClassName }">${ newMessage }</div>`;
      // rendering into the same container should update previous element
      // since both templates share the same template string
      render(newZenTemplate, document.querySelector('#render-container-3'));

      // get element out of dom and check
      const renderedElement = document.querySelector('#rendered-element-3');
      const classes = renderedElement.className;
      const text = renderedElement.textContent;
      chai.expect(classes).to.contain(newClassName);
      chai.expect(text).to.contain(newMessage);
    });
  });