import { ZenTemplate } from './zen-template';
import { render } from './render';

export abstract class ZenElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback () {
        render(this.render(), this.shadowRoot);
    }

    abstract render(values?: any[]): ZenTemplate;
}