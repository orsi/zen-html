import { ZenTemplate } from './zen-template';
import { render } from './render';

export abstract class ZenElement extends HTMLElement {
    static get observedAttributes() {
        const attributes = Object.keys(this.properties);
        return attributes;
    }

    static get styles(): string {
        return ``;
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

        // apply class styles to instance
        const ctor = this.constructor as typeof ZenElement;
        const styles = ctor.styles;
        if (typeof styles !== 'string') {
            throw Error('Styles property must return a string.');
        }

        // only insert style element if user set styles
        if (styles !== '') {
            const styleElement = document.createElement('style');
            styleElement.innerHTML = styles;
            this.shadowRoot.insertBefore(styleElement, this.shadowRoot.firstChild);
        }
    }

    disconnectedCallback() {}

    attributeChangedCallback(name, oldValue, newValue) {
        if (this['properties'][name] && oldValue !== newValue) {
            this['properties'][name] = newValue;
        }
    }

    private setup() {
        // reflect class properties on instance
        const ctor = this.constructor as typeof ZenElement;
        if (!this['properties']) {
            this['properties'] = ctor.properties;
        }
        if (!this['state']) {
            this['state'] = ctor.state;
        }
    }

    /**
     * Required implementation by sub-classes. Renders the html for
     * a Zen Element.
     * @param values
     */
    abstract render(values?: any[]): ZenTemplate;

}