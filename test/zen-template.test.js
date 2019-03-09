import { zen, ZenTemplate, dynamicMarker } from './zen-html.js';

describe('zen-template', function () {
    it('should return a template class', function () {
      const zenTemplate = zen`<h1>Hi!</h1>`;
      chai.expect(zenTemplate).to.be.instanceOf(ZenTemplate);
    });

    it('should replace attribute values with markers', function () {
      const className1 = 'testing';
      const className2 = 'testing-2';
      const zenTemplate = zen`<h1 class="${ className1 } ${ className2 }">Hi!</h1>`;
      const html = zenTemplate.html;
      chai.expect((html.match(new RegExp(dynamicMarker, 'g')) || []).length, 'should contain 2 markers').to.equal(2);
    });

    it('should replace content values with markers', function () {
      const message = 'Hi!';
      const zenTemplate = zen`<h1>${ message }</h1>`;
      const html = zenTemplate.html;
      chai.expect(html, 'html should have marker').to.contain(dynamicMarker);
    });
  });