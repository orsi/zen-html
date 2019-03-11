import { ZenTemplate } from './zen-template';
import { render } from './render';

export abstract class ZenElement extends HTMLElement {
    static get observedAttributes() {
        const attributes = Object.keys(this.properties);
        return attributes;
    }

    static get styles() {
        return {};
    }

    static get properties() {
        return {};
    }

    static get state() {
        return {};
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.setup();
    }

    /**
     * Custom Web Elements lifecycle hooks
     */

    connectedCallback () {
        render(this.render(), this.shadowRoot);
    }

    disconnectedCallback() {}

    attributeChangedCallback(name, oldValue, newValue) {
        if (this['properties'][name] && oldValue !== newValue) {
            this['properties'][name] = newValue;
        }
    }

    private setup() {
        // reflect constructor class properties on instance
        const ctor = this.constructor as typeof ZenElement;
        if (!this['properties']) {
            this['properties'] = ctor['properties'];
        }
        if (!this['state']) {
            this['state'] = ctor['state'];
        }
    }

    /**
     * Required implementation by sub-classes. Renders the html for
     * a Zen Element.
     * @param values
     */
    abstract render(values?: any[]): ZenTemplate;

}