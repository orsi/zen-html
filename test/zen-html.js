const dynamicMarker = '❍';
class ZenTemplate {
    constructor(strings, values) {
        this.html = '';
        this.strings = strings;
        this.values = values;
        this.parse(this.strings);
    }
    /**
     * Parses the template strings and returns a string representation
     * of an element with value positions replaced by markers.
     * @param strings
     */
    parse(strings) {
        strings.forEach((element, i) => {
            this.html += element + (i < strings.length - 1 ? dynamicMarker : '');
        });
    }
    /**
     * Creates and returns an HTML Template element from the
     * raw string.
     */
    getTemplate() {
        const template = document.createElement('template');
        template.innerHTML = this.html;
        return template;
    }
    /**
     * Clones an element using this template.
     */
    clone() {
        return this.getTemplate().content.cloneNode(true);
    }
}
//# sourceMappingURL=zen-template.js.map

const zenTemplateCache = new WeakMap();
const zen = function (strings, ...values) {
    // check if this template string array has been cached
    let zenTemplate = zenTemplateCache.get(strings);
    if (!zenTemplate) {
        // create and cache template
        zenTemplate = new ZenTemplate(strings, values);
        zenTemplateCache.set(strings, zenTemplate);
    }
    return zenTemplate;
};
//# sourceMappingURL=zen.js.map

/**
 * A cache of nested templates.
 */
const templateCache = new WeakMap();
class DynamicNode {
    constructor(node) {
        this.values = [];
        this.renderables = [];
        this.parse(node);
    }
    /**
     * Updates all values contained in the dynamic node.
     * @param values array of values from a zen template
     */
    update(values) {
        for (let i = 0; i < values.length; i++) {
            let value = values[i];
            let dynamicValue = this.values[i];
            if (value !== dynamicValue.currentValue) {
                // avoid unneccessary updates
                dynamicValue.oldValue = dynamicValue.currentValue;
                dynamicValue.currentValue = value;
            }
        }
    }
    render() {
        for (let renderable of this.renderables) {
            switch (renderable.area) {
                case 'attribute':
                    this.renderAttribute(renderable);
                    break;
                case 'textContent':
                    this.renderTextContent(renderable);
                    break;
            }
        }
    }
    parse(node) {
        // walk over the element and save all dynamic marker nodes
        const treeWalker = document.createTreeWalker(node, 5 /** only elements and text */);
        const nodesToRemove = [];
        while (treeWalker.nextNode()) {
            const currentNode = treeWalker.currentNode;
            if (currentNode instanceof Element) {
                // if element, traverse attributes
                for (let i = 0; i < currentNode.attributes.length; i++) {
                    let currentAttribute = currentNode.attributes[i];
                    if (currentAttribute.textContent.indexOf(dynamicMarker) > -1) {
                        // parse dynamic values in attribute
                        const textContent = currentAttribute.textContent;
                        const matches = textContent.match(new RegExp(dynamicMarker, 'g'));
                        const dynamicValuesCount = matches ? matches.length : 0;
                        const dynamicValues = [];
                        for (let i = 0; i < dynamicValuesCount; i++) {
                            dynamicValues.push({
                                currentValue: dynamicMarker,
                                oldValue: null
                            });
                        }
                        this.values = this.values.concat(dynamicValues);
                        // create renderable
                        this.renderables.push({
                            area: 'attribute',
                            container: currentAttribute,
                            template: currentAttribute.textContent,
                            values: dynamicValues
                        });
                    }
                }
            }
            else if (currentNode.textContent.indexOf(dynamicMarker) > -1) {
                // if it's not an element, must be in a text position
                /**
                 * We can break the textContent string into multiple
                 * TextNodes, so that each dynamic part is isolated and
                 * can update by itself.
                 */
                const dynamicMarkerIndices = [];
                const textParts = [];
                let textContent = currentNode.textContent;
                while (textContent !== '') {
                    let part;
                    const valueIndex = textContent.indexOf(dynamicMarker);
                    if (valueIndex > 0) {
                        // text content before value marker
                        part = textContent.substring(0, valueIndex);
                        textContent = textContent.substring(valueIndex);
                    }
                    else if (valueIndex === 0) {
                        // value marker
                        dynamicMarkerIndices.push(textParts.length);
                        part = textContent.substring(0, dynamicMarker.length);
                        textContent = textContent.substring(dynamicMarker.length);
                    }
                    else {
                        // last text content after value marker
                        part = textContent.substring(0);
                        textContent = '';
                    }
                    textParts.push(document.createTextNode(part));
                }
                // insert new text nodes before current node
                // ** warning: can't appendChild() or else walker
                // ** will keep adding and walking over nodes **
                const parentNode = currentNode.parentElement;
                for (let i = 0; i < textParts.length; i++) {
                    parentNode.insertBefore(textParts[i], currentNode);
                }
                // must clean up afterward to prevent walker from breaking
                nodesToRemove.push(currentNode);
                // create values and renderables for each
                // dynamic value
                for (let i = 0; i < dynamicMarkerIndices.length; i++) {
                    const dynamicValue = {
                        currentValue: dynamicMarker,
                        oldValue: null
                    };
                    this.values.push(dynamicValue);
                    this.renderables.push({
                        area: 'textContent',
                        container: textParts[dynamicMarkerIndices[i]],
                        template: dynamicMarker,
                        values: [dynamicValue]
                    });
                }
            }
        }
        // clean up old nodes
        for (let nodeToRemove of nodesToRemove) {
            nodeToRemove.parentElement.removeChild(nodeToRemove);
        }
    }
    /**
     * Renders a new attribute value by
     * rebuilding the raw string and replacing
     * each dynamic part with their current values
     * @param renderable a dynamic attribute value
     */
    renderAttribute(renderable) {
        let attributeValue = renderable.template;
        for (let j = 0; j < renderable.values.length; j++) {
            attributeValue = attributeValue.replace(dynamicMarker, renderable.values[j].currentValue);
        }
        renderable.container.textContent = attributeValue;
    }
    /**
     * Renders value into a textContent area. Primitive values
     * can be directly rendered into textContent, however, ZenTemplate
     * values must be parsed correctly.
     * @param renderable a dynamic text node
     */
    renderTextContent(renderable) {
        // determine value
        const value = renderable.values[0];
        if (value.currentValue instanceof ZenTemplate) {
            // check if this template was rendered before
            if (value.currentValue !== value.oldValue) {
                // this template hasn't been rendered before
                let dynamicNode = templateCache.get(renderable.container);
                if (!dynamicNode) {
                    // container has not been rendered into before.
                    // clone, parse, and insert template
                    const template = value.currentValue.clone();
                    dynamicNode = new DynamicNode(template);
                    // create comment marker and replace text content
                    const commentMarker = document.createComment('');
                    renderable.container.parentElement.insertBefore(commentMarker, renderable.container);
                    renderable.container.parentElement.insertBefore(template, renderable.container);
                    renderable.container.parentElement.removeChild(renderable.container);
                    renderable.container = commentMarker;
                    // set container
                    templateCache.set(renderable.container, dynamicNode);
                }
                dynamicNode.update(value.currentValue.values);
                dynamicNode.render();
            }
        }
        else {
            renderable.container.textContent = renderable.values[0].currentValue;
        }
    }
}

/**
 * A cache of dyanmic nodes rendered into containers.
 */
const containerCache = new WeakMap();
/**
 * Renders a zen template into a container DOM element.
 * @param zenTemplate A zen template to render into the DOM
 * @param container The DOM element to render into
 */
const render = function (zenTemplate, container) {
    // check if zen template has been rendered and cached
    let dynamicNode = containerCache.get(container);
    if (!dynamicNode) {
        // container has not been rendered into before.
        // clone, parse, and insert template
        const template = zenTemplate.clone();
        dynamicNode = new DynamicNode(template);
        container.appendChild(template);
        containerCache.set(container, dynamicNode);
    }
    dynamicNode.update(zenTemplate.values);
    dynamicNode.render();
};
//# sourceMappingURL=render.js.map

class ZenElement extends HTMLElement {
    static get observedAttributes() {
        const attributes = Object.keys(this.properties);
        return attributes;
    }
    static get styles() {
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
    connectedCallback() {
        render(this.render(), this.shadowRoot);
        // apply class styles to instance
        const ctor = this.constructor;
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
    disconnectedCallback() { }
    attributeChangedCallback(name, oldValue, newValue) {
        if (this['properties'][name] && oldValue !== newValue) {
            this['properties'][name] = newValue;
        }
    }
    setup() {
        // reflect class properties on instance
        const ctor = this.constructor;
        if (!this['properties']) {
            this['properties'] = ctor.properties;
        }
        if (!this['state']) {
            this['state'] = ctor.state;
        }
    }
}
//# sourceMappingURL=zen-element.js.map

//# sourceMappingURL=zen-html.js.map

export { zenTemplateCache, zen, dynamicMarker, ZenTemplate, containerCache, render, templateCache, DynamicNode, ZenElement };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemVuLWh0bWwuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy96ZW4tdGVtcGxhdGUudHMiLCIuLi9zcmMvemVuLnRzIiwiLi4vc3JjL2R5bmFtaWMtbm9kZS50cyIsIi4uL3NyYy9yZW5kZXIudHMiLCIuLi9zcmMvemVuLWVsZW1lbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IGR5bmFtaWNNYXJrZXIgPSAn4p2NJztcclxuZXhwb3J0IGNsYXNzIFplblRlbXBsYXRlIHtcclxuICAgIGh0bWw6IHN0cmluZyA9ICcnO1xyXG4gICAgc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXk7XHJcbiAgICB2YWx1ZXM6IGFueVtdO1xyXG4gICAgY29uc3RydWN0b3Ioc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIHZhbHVlczogYW55W10pIHtcclxuICAgICAgICB0aGlzLnN0cmluZ3MgPSBzdHJpbmdzO1xyXG4gICAgICAgIHRoaXMudmFsdWVzID0gdmFsdWVzO1xyXG4gICAgICAgIHRoaXMucGFyc2UodGhpcy5zdHJpbmdzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFBhcnNlcyB0aGUgdGVtcGxhdGUgc3RyaW5ncyBhbmQgcmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvblxyXG4gICAgICogb2YgYW4gZWxlbWVudCB3aXRoIHZhbHVlIHBvc2l0aW9ucyByZXBsYWNlZCBieSBtYXJrZXJzLlxyXG4gICAgICogQHBhcmFtIHN0cmluZ3NcclxuICAgICAqL1xyXG4gICAgcGFyc2UgKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5KSB7XHJcbiAgICAgICAgc3RyaW5ncy5mb3JFYWNoKChlbGVtZW50LCBpKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuaHRtbCArPSBlbGVtZW50ICsgKGkgPCBzdHJpbmdzLmxlbmd0aCAtIDEgPyBkeW5hbWljTWFya2VyIDogJycpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhbmQgcmV0dXJucyBhbiBIVE1MIFRlbXBsYXRlIGVsZW1lbnQgZnJvbSB0aGVcclxuICAgICAqIHJhdyBzdHJpbmcuXHJcbiAgICAgKi9cclxuICAgIGdldFRlbXBsYXRlICgpOiBIVE1MVGVtcGxhdGVFbGVtZW50IHtcclxuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XHJcbiAgICAgICAgdGVtcGxhdGUuaW5uZXJIVE1MID0gdGhpcy5odG1sO1xyXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENsb25lcyBhbiBlbGVtZW50IHVzaW5nIHRoaXMgdGVtcGxhdGUuXHJcbiAgICAgKi9cclxuICAgIGNsb25lKCk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRUZW1wbGF0ZSgpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpIGFzIEhUTUxFbGVtZW50O1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcblxyXG5leHBvcnQgY29uc3QgemVuVGVtcGxhdGVDYWNoZSA9IG5ldyBXZWFrTWFwPFRlbXBsYXRlU3RyaW5nc0FycmF5LCBaZW5UZW1wbGF0ZT4oKTtcclxuZXhwb3J0IGNvbnN0IHplbiA9IGZ1bmN0aW9uIChzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSwgLi4udmFsdWVzOiBhbnlbXSkge1xyXG4gICAgLy8gY2hlY2sgaWYgdGhpcyB0ZW1wbGF0ZSBzdHJpbmcgYXJyYXkgaGFzIGJlZW4gY2FjaGVkXHJcbiAgICBsZXQgemVuVGVtcGxhdGUgPSB6ZW5UZW1wbGF0ZUNhY2hlLmdldChzdHJpbmdzKTtcclxuICAgIGlmICghemVuVGVtcGxhdGUpIHtcclxuICAgICAgICAvLyBjcmVhdGUgYW5kIGNhY2hlIHRlbXBsYXRlXHJcbiAgICAgICAgemVuVGVtcGxhdGUgPSBuZXcgWmVuVGVtcGxhdGUoc3RyaW5ncywgdmFsdWVzKTtcclxuICAgICAgICB6ZW5UZW1wbGF0ZUNhY2hlLnNldChzdHJpbmdzLCB6ZW5UZW1wbGF0ZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gemVuVGVtcGxhdGU7XHJcbn1cclxuIiwiaW1wb3J0IHsgZHluYW1pY01hcmtlciwgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcbmltcG9ydCB7IHJlbmRlciB9IGZyb20gJy4vcmVuZGVyJztcclxuXHJcbi8qKlxyXG4gKiBBIGNhY2hlIG9mIG5lc3RlZCB0ZW1wbGF0ZXMuXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgdGVtcGxhdGVDYWNoZSA9IG5ldyBXZWFrTWFwPE5vZGUsIER5bmFtaWNOb2RlPigpO1xyXG5cclxuZXhwb3J0IGNsYXNzIER5bmFtaWNOb2RlIHtcclxuICAgIHZhbHVlczogRHluYW1pY1ZhbHVlW10gPSBbXTtcclxuICAgIHJlbmRlcmFibGVzOiBSZW5kZXJhYmxlQXJlYVtdID0gW107XHJcbiAgICBjb25zdHJ1Y3RvciAobm9kZTogTm9kZSkge1xyXG4gICAgICAgIHRoaXMucGFyc2Uobm9kZSk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIFVwZGF0ZXMgYWxsIHZhbHVlcyBjb250YWluZWQgaW4gdGhlIGR5bmFtaWMgbm9kZS5cclxuICAgICAqIEBwYXJhbSB2YWx1ZXMgYXJyYXkgb2YgdmFsdWVzIGZyb20gYSB6ZW4gdGVtcGxhdGVcclxuICAgICAqL1xyXG4gICAgdXBkYXRlICh2YWx1ZXM6IGFueVtdKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW2ldO1xyXG4gICAgICAgICAgICBsZXQgZHluYW1pY1ZhbHVlID0gdGhpcy52YWx1ZXNbaV07XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gZHluYW1pY1ZhbHVlLmN1cnJlbnRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gYXZvaWQgdW5uZWNjZXNzYXJ5IHVwZGF0ZXNcclxuICAgICAgICAgICAgICAgIGR5bmFtaWNWYWx1ZS5vbGRWYWx1ZSA9IGR5bmFtaWNWYWx1ZS5jdXJyZW50VmFsdWU7XHJcbiAgICAgICAgICAgICAgICBkeW5hbWljVmFsdWUuY3VycmVudFZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlciAoKSB7XHJcbiAgICAgICAgZm9yIChsZXQgcmVuZGVyYWJsZSBvZiB0aGlzLnJlbmRlcmFibGVzKSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAocmVuZGVyYWJsZS5hcmVhKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhdHRyaWJ1dGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyQXR0cmlidXRlKHJlbmRlcmFibGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndGV4dENvbnRlbnQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyVGV4dENvbnRlbnQocmVuZGVyYWJsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwYXJzZSAobm9kZTogTm9kZSkge1xyXG4gICAgICAgIC8vIHdhbGsgb3ZlciB0aGUgZWxlbWVudCBhbmQgc2F2ZSBhbGwgZHluYW1pYyBtYXJrZXIgbm9kZXNcclxuICAgICAgICBjb25zdCB0cmVlV2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihub2RlLCA1IC8qKiBvbmx5IGVsZW1lbnRzIGFuZCB0ZXh0ICovKTtcclxuICAgICAgICBjb25zdCBub2Rlc1RvUmVtb3ZlID0gW107XHJcbiAgICAgICAgd2hpbGUodHJlZVdhbGtlci5uZXh0Tm9kZSgpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnROb2RlID0gdHJlZVdhbGtlci5jdXJyZW50Tm9kZTtcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnROb2RlIGluc3RhbmNlb2YgRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgZWxlbWVudCwgdHJhdmVyc2UgYXR0cmlidXRlc1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjdXJyZW50Tm9kZS5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGN1cnJlbnRBdHRyaWJ1dGUgPSBjdXJyZW50Tm9kZS5hdHRyaWJ1dGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50QXR0cmlidXRlLnRleHRDb250ZW50LmluZGV4T2YoZHluYW1pY01hcmtlcikgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJzZSBkeW5hbWljIHZhbHVlcyBpbiBhdHRyaWJ1dGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGV4dENvbnRlbnQgPSBjdXJyZW50QXR0cmlidXRlLnRleHRDb250ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gdGV4dENvbnRlbnQubWF0Y2gobmV3IFJlZ0V4cChkeW5hbWljTWFya2VyLCAnZycpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZHluYW1pY1ZhbHVlc0NvdW50ID0gbWF0Y2hlcyA/IG1hdGNoZXMubGVuZ3RoIDogMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZHluYW1pY1ZhbHVlczogRHluYW1pY1ZhbHVlW10gPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkeW5hbWljVmFsdWVzQ291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHluYW1pY1ZhbHVlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IGR5bmFtaWNNYXJrZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWU6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzID0gdGhpcy52YWx1ZXMuY29uY2F0KGR5bmFtaWNWYWx1ZXMpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRlIHJlbmRlcmFibGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJhYmxlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZWE6ICdhdHRyaWJ1dGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyOiBjdXJyZW50QXR0cmlidXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IGN1cnJlbnRBdHRyaWJ1dGUudGV4dENvbnRlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXM6IGR5bmFtaWNWYWx1ZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnROb2RlLnRleHRDb250ZW50LmluZGV4T2YoZHluYW1pY01hcmtlcikgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgaXQncyBub3QgYW4gZWxlbWVudCwgbXVzdCBiZSBpbiBhIHRleHQgcG9zaXRpb25cclxuXHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIFdlIGNhbiBicmVhayB0aGUgdGV4dENvbnRlbnQgc3RyaW5nIGludG8gbXVsdGlwbGVcclxuICAgICAgICAgICAgICAgICAqIFRleHROb2Rlcywgc28gdGhhdCBlYWNoIGR5bmFtaWMgcGFydCBpcyBpc29sYXRlZCBhbmRcclxuICAgICAgICAgICAgICAgICAqIGNhbiB1cGRhdGUgYnkgaXRzZWxmLlxyXG4gICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICBjb25zdCBkeW5hbWljTWFya2VySW5kaWNlcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGV4dFBhcnRzID0gW107XHJcbiAgICAgICAgICAgICAgICBsZXQgdGV4dENvbnRlbnQgPSBjdXJyZW50Tm9kZS50ZXh0Q29udGVudDtcclxuICAgICAgICAgICAgICAgIHdoaWxlICh0ZXh0Q29udGVudCAhPT0gJycpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcGFydDtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZUluZGV4ID0gdGV4dENvbnRlbnQuaW5kZXhPZihkeW5hbWljTWFya2VyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWVJbmRleCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGV4dCBjb250ZW50IGJlZm9yZSB2YWx1ZSBtYXJrZXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFydCA9IHRleHRDb250ZW50LnN1YnN0cmluZygwLCB2YWx1ZUluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dENvbnRlbnQgPSB0ZXh0Q29udGVudC5zdWJzdHJpbmcodmFsdWVJbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZUluZGV4ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZhbHVlIG1hcmtlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkeW5hbWljTWFya2VySW5kaWNlcy5wdXNoKHRleHRQYXJ0cy5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJ0ID0gdGV4dENvbnRlbnQuc3Vic3RyaW5nKDAsIGR5bmFtaWNNYXJrZXIubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dENvbnRlbnQgPSB0ZXh0Q29udGVudC5zdWJzdHJpbmcoZHluYW1pY01hcmtlci5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxhc3QgdGV4dCBjb250ZW50IGFmdGVyIHZhbHVlIG1hcmtlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJ0ID0gdGV4dENvbnRlbnQuc3Vic3RyaW5nKDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0Q29udGVudCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0ZXh0UGFydHMucHVzaChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShwYXJ0KSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaW5zZXJ0IG5ldyB0ZXh0IG5vZGVzIGJlZm9yZSBjdXJyZW50IG5vZGVcclxuICAgICAgICAgICAgICAgIC8vICoqIHdhcm5pbmc6IGNhbid0IGFwcGVuZENoaWxkKCkgb3IgZWxzZSB3YWxrZXJcclxuICAgICAgICAgICAgICAgIC8vICoqIHdpbGwga2VlcCBhZGRpbmcgYW5kIHdhbGtpbmcgb3ZlciBub2RlcyAqKlxyXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IGN1cnJlbnROb2RlLnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRQYXJ0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRleHRQYXJ0c1tpXSwgY3VycmVudE5vZGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIG11c3QgY2xlYW4gdXAgYWZ0ZXJ3YXJkIHRvIHByZXZlbnQgd2Fsa2VyIGZyb20gYnJlYWtpbmdcclxuICAgICAgICAgICAgICAgIG5vZGVzVG9SZW1vdmUucHVzaChjdXJyZW50Tm9kZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIHZhbHVlcyBhbmQgcmVuZGVyYWJsZXMgZm9yIGVhY2hcclxuICAgICAgICAgICAgICAgIC8vIGR5bmFtaWMgdmFsdWVcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZHluYW1pY01hcmtlckluZGljZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkeW5hbWljVmFsdWUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZTogZHluYW1pY01hcmtlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWU6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzLnB1c2goZHluYW1pY1ZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmFibGVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmVhOiAndGV4dENvbnRlbnQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXI6IHRleHRQYXJ0c1tkeW5hbWljTWFya2VySW5kaWNlc1tpXV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBkeW5hbWljTWFya2VyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXM6IFtkeW5hbWljVmFsdWVdXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGNsZWFuIHVwIG9sZCBub2Rlc1xyXG4gICAgICAgIGZvciAobGV0IG5vZGVUb1JlbW92ZSBvZiBub2Rlc1RvUmVtb3ZlKSB7XHJcbiAgICAgICAgICAgIG5vZGVUb1JlbW92ZS5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKG5vZGVUb1JlbW92ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVuZGVycyBhIG5ldyBhdHRyaWJ1dGUgdmFsdWUgYnlcclxuICAgICAqIHJlYnVpbGRpbmcgdGhlIHJhdyBzdHJpbmcgYW5kIHJlcGxhY2luZ1xyXG4gICAgICogZWFjaCBkeW5hbWljIHBhcnQgd2l0aCB0aGVpciBjdXJyZW50IHZhbHVlc1xyXG4gICAgICogQHBhcmFtIHJlbmRlcmFibGUgYSBkeW5hbWljIGF0dHJpYnV0ZSB2YWx1ZVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHJlbmRlckF0dHJpYnV0ZShyZW5kZXJhYmxlOiBSZW5kZXJhYmxlQXJlYSkge1xyXG4gICAgICAgIGxldCBhdHRyaWJ1dGVWYWx1ZSA9IHJlbmRlcmFibGUudGVtcGxhdGU7XHJcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCByZW5kZXJhYmxlLnZhbHVlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBhdHRyaWJ1dGVWYWx1ZSA9IGF0dHJpYnV0ZVZhbHVlLnJlcGxhY2UoZHluYW1pY01hcmtlciwgcmVuZGVyYWJsZS52YWx1ZXNbal0uY3VycmVudFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVuZGVyYWJsZS5jb250YWluZXIudGV4dENvbnRlbnQgPSBhdHRyaWJ1dGVWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbmRlcnMgdmFsdWUgaW50byBhIHRleHRDb250ZW50IGFyZWEuIFByaW1pdGl2ZSB2YWx1ZXNcclxuICAgICAqIGNhbiBiZSBkaXJlY3RseSByZW5kZXJlZCBpbnRvIHRleHRDb250ZW50LCBob3dldmVyLCBaZW5UZW1wbGF0ZVxyXG4gICAgICogdmFsdWVzIG11c3QgYmUgcGFyc2VkIGNvcnJlY3RseS5cclxuICAgICAqIEBwYXJhbSByZW5kZXJhYmxlIGEgZHluYW1pYyB0ZXh0IG5vZGVcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSByZW5kZXJUZXh0Q29udGVudChyZW5kZXJhYmxlOiBSZW5kZXJhYmxlQXJlYSkge1xyXG4gICAgICAgIC8vIGRldGVybWluZSB2YWx1ZVxyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gcmVuZGVyYWJsZS52YWx1ZXNbMF07XHJcbiAgICAgICAgaWYgKHZhbHVlLmN1cnJlbnRWYWx1ZSBpbnN0YW5jZW9mIFplblRlbXBsYXRlKSB7XHJcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoaXMgdGVtcGxhdGUgd2FzIHJlbmRlcmVkIGJlZm9yZVxyXG4gICAgICAgICAgICBpZiAodmFsdWUuY3VycmVudFZhbHVlICE9PSB2YWx1ZS5vbGRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gdGhpcyB0ZW1wbGF0ZSBoYXNuJ3QgYmVlbiByZW5kZXJlZCBiZWZvcmVcclxuICAgICAgICAgICAgICAgIGxldCBkeW5hbWljTm9kZSA9IHRlbXBsYXRlQ2FjaGUuZ2V0KHJlbmRlcmFibGUuY29udGFpbmVyKTtcclxuICAgICAgICAgICAgICAgIGlmICghZHluYW1pY05vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb250YWluZXIgaGFzIG5vdCBiZWVuIHJlbmRlcmVkIGludG8gYmVmb3JlLlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNsb25lLCBwYXJzZSwgYW5kIGluc2VydCB0ZW1wbGF0ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gdmFsdWUuY3VycmVudFZhbHVlLmNsb25lKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZHluYW1pY05vZGUgPSBuZXcgRHluYW1pY05vZGUodGVtcGxhdGUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgY29tbWVudCBtYXJrZXIgYW5kIHJlcGxhY2UgdGV4dCBjb250ZW50XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tbWVudE1hcmtlciA9IGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQoJycpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmFibGUuY29udGFpbmVyLnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNvbW1lbnRNYXJrZXIsIHJlbmRlcmFibGUuY29udGFpbmVyKTtcclxuICAgICAgICAgICAgICAgICAgICByZW5kZXJhYmxlLmNvbnRhaW5lci5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZSh0ZW1wbGF0ZSwgcmVuZGVyYWJsZS5jb250YWluZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmFibGUuY29udGFpbmVyLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQocmVuZGVyYWJsZS5jb250YWluZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmFibGUuY29udGFpbmVyID0gY29tbWVudE1hcmtlcjtcclxuICAgICAgICAgICAgICAgICAgICAvLyBzZXQgY29udGFpbmVyXHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVDYWNoZS5zZXQocmVuZGVyYWJsZS5jb250YWluZXIsIGR5bmFtaWNOb2RlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGR5bmFtaWNOb2RlLnVwZGF0ZSh2YWx1ZS5jdXJyZW50VmFsdWUudmFsdWVzKTtcclxuICAgICAgICAgICAgICAgIGR5bmFtaWNOb2RlLnJlbmRlcigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVuZGVyYWJsZS5jb250YWluZXIudGV4dENvbnRlbnQgPSByZW5kZXJhYmxlLnZhbHVlc1swXS5jdXJyZW50VmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgRHluYW1pY1ZhbHVlIHtcclxuICAgIGN1cnJlbnRWYWx1ZTogYW55O1xyXG4gICAgb2xkVmFsdWU6IGFueTtcclxufVxyXG5pbnRlcmZhY2UgUmVuZGVyYWJsZUFyZWEge1xyXG4gICAgYXJlYTogJ3RleHRDb250ZW50JyB8ICdhdHRyaWJ1dGUnO1xyXG4gICAgY29udGFpbmVyOiBOb2RlO1xyXG4gICAgdGVtcGxhdGU6IHN0cmluZztcclxuICAgIHZhbHVlczogRHluYW1pY1ZhbHVlW107XHJcbn0iLCJpbXBvcnQgeyBEeW5hbWljTm9kZSB9IGZyb20gJy4vZHluYW1pYy1ub2RlJztcclxuaW1wb3J0IHsgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcblxyXG4vKipcclxuICogQSBjYWNoZSBvZiBkeWFubWljIG5vZGVzIHJlbmRlcmVkIGludG8gY29udGFpbmVycy5cclxuICovXHJcbmV4cG9ydCBjb25zdCBjb250YWluZXJDYWNoZSA9IG5ldyBXZWFrTWFwPE5vZGUsIER5bmFtaWNOb2RlPigpO1xyXG5cclxuLyoqXHJcbiAqIFJlbmRlcnMgYSB6ZW4gdGVtcGxhdGUgaW50byBhIGNvbnRhaW5lciBET00gZWxlbWVudC5cclxuICogQHBhcmFtIHplblRlbXBsYXRlIEEgemVuIHRlbXBsYXRlIHRvIHJlbmRlciBpbnRvIHRoZSBET01cclxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgRE9NIGVsZW1lbnQgdG8gcmVuZGVyIGludG9cclxuICovXHJcbmV4cG9ydCBjb25zdCByZW5kZXIgPSBmdW5jdGlvbiAoemVuVGVtcGxhdGU6IFplblRlbXBsYXRlLCBjb250YWluZXI6IE5vZGUpIHtcclxuICAgIC8vIGNoZWNrIGlmIHplbiB0ZW1wbGF0ZSBoYXMgYmVlbiByZW5kZXJlZCBhbmQgY2FjaGVkXHJcbiAgICBsZXQgZHluYW1pY05vZGUgPSBjb250YWluZXJDYWNoZS5nZXQoY29udGFpbmVyKTtcclxuICAgIGlmICghZHluYW1pY05vZGUpIHtcclxuICAgICAgICAvLyBjb250YWluZXIgaGFzIG5vdCBiZWVuIHJlbmRlcmVkIGludG8gYmVmb3JlLlxyXG4gICAgICAgIC8vIGNsb25lLCBwYXJzZSwgYW5kIGluc2VydCB0ZW1wbGF0ZVxyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gemVuVGVtcGxhdGUuY2xvbmUoKTtcclxuICAgICAgICBkeW5hbWljTm9kZSA9IG5ldyBEeW5hbWljTm9kZSh0ZW1wbGF0ZSk7XHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcclxuICAgICAgICBjb250YWluZXJDYWNoZS5zZXQoY29udGFpbmVyLCBkeW5hbWljTm9kZSk7XHJcbiAgICB9XHJcbiAgICBkeW5hbWljTm9kZS51cGRhdGUoemVuVGVtcGxhdGUudmFsdWVzKTtcclxuICAgIGR5bmFtaWNOb2RlLnJlbmRlcigpO1xyXG59IiwiaW1wb3J0IHsgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcbmltcG9ydCB7IHJlbmRlciB9IGZyb20gJy4vcmVuZGVyJztcclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBaZW5FbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xyXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XHJcbiAgICAgICAgY29uc3QgYXR0cmlidXRlcyA9IE9iamVjdC5rZXlzKHRoaXMucHJvcGVydGllcyk7XHJcbiAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldCBzdHlsZXMoKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gYGA7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldCBwcm9wZXJ0aWVzKCkge1xyXG4gICAgICAgIHJldHVybiB7fTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZ2V0IHN0YXRlKCkge1xyXG4gICAgICAgIHJldHVybiB7fTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xyXG4gICAgICAgIHRoaXMuc2V0dXAoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEN1c3RvbSBXZWIgRWxlbWVudHMgbGlmZWN5Y2xlIGhvb2tzXHJcbiAgICAgKi9cclxuXHJcbiAgICBjb25uZWN0ZWRDYWxsYmFjayAoKSB7XHJcbiAgICAgICAgcmVuZGVyKHRoaXMucmVuZGVyKCksIHRoaXMuc2hhZG93Um9vdCk7XHJcblxyXG4gICAgICAgIC8vIGFwcGx5IGNsYXNzIHN0eWxlcyB0byBpbnN0YW5jZVxyXG4gICAgICAgIGNvbnN0IGN0b3IgPSB0aGlzLmNvbnN0cnVjdG9yIGFzIHR5cGVvZiBaZW5FbGVtZW50O1xyXG4gICAgICAgIGNvbnN0IHN0eWxlcyA9IGN0b3Iuc3R5bGVzO1xyXG4gICAgICAgIGlmICh0eXBlb2Ygc3R5bGVzICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcignU3R5bGVzIHByb3BlcnR5IG11c3QgcmV0dXJuIGEgc3RyaW5nLicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gb25seSBpbnNlcnQgc3R5bGUgZWxlbWVudCBpZiB1c2VyIHNldCBzdHlsZXNcclxuICAgICAgICBpZiAoc3R5bGVzICE9PSAnJykge1xyXG4gICAgICAgICAgICBjb25zdCBzdHlsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG4gICAgICAgICAgICBzdHlsZUVsZW1lbnQuaW5uZXJIVE1MID0gc3R5bGVzO1xyXG4gICAgICAgICAgICB0aGlzLnNoYWRvd1Jvb3QuaW5zZXJ0QmVmb3JlKHN0eWxlRWxlbWVudCwgdGhpcy5zaGFkb3dSb290LmZpcnN0Q2hpbGQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHt9XHJcblxyXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xyXG4gICAgICAgIGlmICh0aGlzWydwcm9wZXJ0aWVzJ11bbmFtZV0gJiYgb2xkVmFsdWUgIT09IG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgICAgIHRoaXNbJ3Byb3BlcnRpZXMnXVtuYW1lXSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldHVwKCkge1xyXG4gICAgICAgIC8vIHJlZmxlY3QgY2xhc3MgcHJvcGVydGllcyBvbiBpbnN0YW5jZVxyXG4gICAgICAgIGNvbnN0IGN0b3IgPSB0aGlzLmNvbnN0cnVjdG9yIGFzIHR5cGVvZiBaZW5FbGVtZW50O1xyXG4gICAgICAgIGlmICghdGhpc1sncHJvcGVydGllcyddKSB7XHJcbiAgICAgICAgICAgIHRoaXNbJ3Byb3BlcnRpZXMnXSA9IGN0b3IucHJvcGVydGllcztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0aGlzWydzdGF0ZSddKSB7XHJcbiAgICAgICAgICAgIHRoaXNbJ3N0YXRlJ10gPSBjdG9yLnN0YXRlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlcXVpcmVkIGltcGxlbWVudGF0aW9uIGJ5IHN1Yi1jbGFzc2VzLiBSZW5kZXJzIHRoZSBodG1sIGZvclxyXG4gICAgICogYSBaZW4gRWxlbWVudC5cclxuICAgICAqIEBwYXJhbSB2YWx1ZXNcclxuICAgICAqL1xyXG4gICAgYWJzdHJhY3QgcmVuZGVyKHZhbHVlcz86IGFueVtdKTogWmVuVGVtcGxhdGU7XHJcblxyXG59Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJNQUFhLGFBQWEsR0FBRyxHQUFHLENBQUM7QUFDakMs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
