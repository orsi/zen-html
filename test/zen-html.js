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
                // empty current node and replace with text nodes
                // ** warning: can't appendChild() or else walker
                // ** will keep adding and walking over nodes **
                const parentNode = currentNode.parentElement;
                for (let i = 0; i < textParts.length; i++) {
                    parentNode.insertBefore(textParts[i], currentNode);
                }
                // remove current node from parent now that we've
                // replaced all text parts within it
                parentNode.removeChild(currentNode);
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
//# sourceMappingURL=dynamic-node.js.map

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
        console.dir(this);
        return attributes;
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
    }
    disconnectedCallback() { }
    attributeChangedCallback(name, oldValue, newValue) {
        if (this['properties'][name] && oldValue !== newValue) {
            this['properties'][name] = newValue;
        }
    }
    setup() {
        // reflect constructor class properties on instance
        const ctor = this.constructor;
        if (!this['properties']) {
            this['properties'] = ctor['properties'];
        }
        if (!this['state']) {
            this['state'] = ctor['state'];
        }
    }
}

//# sourceMappingURL=zen-html.js.map

export { zenTemplateCache, zen, dynamicMarker, ZenTemplate, containerCache, render, templateCache, DynamicNode, ZenElement };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemVuLWh0bWwuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy96ZW4tdGVtcGxhdGUudHMiLCIuLi9zcmMvemVuLnRzIiwiLi4vc3JjL2R5bmFtaWMtbm9kZS50cyIsIi4uL3NyYy9yZW5kZXIudHMiLCIuLi9zcmMvemVuLWVsZW1lbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IGR5bmFtaWNNYXJrZXIgPSAn4p2NJztcclxuZXhwb3J0IGNsYXNzIFplblRlbXBsYXRlIHtcclxuICAgIGh0bWw6IHN0cmluZyA9ICcnO1xyXG4gICAgc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXk7XHJcbiAgICB2YWx1ZXM6IGFueVtdO1xyXG4gICAgY29uc3RydWN0b3Ioc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIHZhbHVlczogYW55W10pIHtcclxuICAgICAgICB0aGlzLnN0cmluZ3MgPSBzdHJpbmdzO1xyXG4gICAgICAgIHRoaXMudmFsdWVzID0gdmFsdWVzO1xyXG4gICAgICAgIHRoaXMucGFyc2UodGhpcy5zdHJpbmdzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFBhcnNlcyB0aGUgdGVtcGxhdGUgc3RyaW5ncyBhbmQgcmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvblxyXG4gICAgICogb2YgYW4gZWxlbWVudCB3aXRoIHZhbHVlIHBvc2l0aW9ucyByZXBsYWNlZCBieSBtYXJrZXJzLlxyXG4gICAgICogQHBhcmFtIHN0cmluZ3NcclxuICAgICAqL1xyXG4gICAgcGFyc2UgKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5KSB7XHJcbiAgICAgICAgc3RyaW5ncy5mb3JFYWNoKChlbGVtZW50LCBpKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuaHRtbCArPSBlbGVtZW50ICsgKGkgPCBzdHJpbmdzLmxlbmd0aCAtIDEgPyBkeW5hbWljTWFya2VyIDogJycpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhbmQgcmV0dXJucyBhbiBIVE1MIFRlbXBsYXRlIGVsZW1lbnQgZnJvbSB0aGVcclxuICAgICAqIHJhdyBzdHJpbmcuXHJcbiAgICAgKi9cclxuICAgIGdldFRlbXBsYXRlICgpOiBIVE1MVGVtcGxhdGVFbGVtZW50IHtcclxuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XHJcbiAgICAgICAgdGVtcGxhdGUuaW5uZXJIVE1MID0gdGhpcy5odG1sO1xyXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENsb25lcyBhbiBlbGVtZW50IHVzaW5nIHRoaXMgdGVtcGxhdGUuXHJcbiAgICAgKi9cclxuICAgIGNsb25lKCk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRUZW1wbGF0ZSgpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpIGFzIEhUTUxFbGVtZW50O1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcblxyXG5leHBvcnQgY29uc3QgemVuVGVtcGxhdGVDYWNoZSA9IG5ldyBXZWFrTWFwPFRlbXBsYXRlU3RyaW5nc0FycmF5LCBaZW5UZW1wbGF0ZT4oKTtcclxuZXhwb3J0IGNvbnN0IHplbiA9IGZ1bmN0aW9uIChzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSwgLi4udmFsdWVzOiBhbnlbXSkge1xyXG4gICAgLy8gY2hlY2sgaWYgdGhpcyB0ZW1wbGF0ZSBzdHJpbmcgYXJyYXkgaGFzIGJlZW4gY2FjaGVkXHJcbiAgICBsZXQgemVuVGVtcGxhdGUgPSB6ZW5UZW1wbGF0ZUNhY2hlLmdldChzdHJpbmdzKTtcclxuICAgIGlmICghemVuVGVtcGxhdGUpIHtcclxuICAgICAgICAvLyBjcmVhdGUgYW5kIGNhY2hlIHRlbXBsYXRlXHJcbiAgICAgICAgemVuVGVtcGxhdGUgPSBuZXcgWmVuVGVtcGxhdGUoc3RyaW5ncywgdmFsdWVzKTtcclxuICAgICAgICB6ZW5UZW1wbGF0ZUNhY2hlLnNldChzdHJpbmdzLCB6ZW5UZW1wbGF0ZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gemVuVGVtcGxhdGU7XHJcbn1cclxuIiwiaW1wb3J0IHsgZHluYW1pY01hcmtlciwgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcbmltcG9ydCB7IHJlbmRlciB9IGZyb20gJy4vcmVuZGVyJztcclxuXHJcbi8qKlxyXG4gKiBBIGNhY2hlIG9mIG5lc3RlZCB0ZW1wbGF0ZXMuXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgdGVtcGxhdGVDYWNoZSA9IG5ldyBXZWFrTWFwPE5vZGUsIER5bmFtaWNOb2RlPigpO1xyXG5cclxuZXhwb3J0IGNsYXNzIER5bmFtaWNOb2RlIHtcclxuICAgIHZhbHVlczogRHluYW1pY1ZhbHVlW10gPSBbXTtcclxuICAgIHJlbmRlcmFibGVzOiBSZW5kZXJhYmxlQXJlYVtdID0gW107XHJcbiAgICBjb25zdHJ1Y3RvciAobm9kZTogTm9kZSkge1xyXG4gICAgICAgIHRoaXMucGFyc2Uobm9kZSk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIFVwZGF0ZXMgYWxsIHZhbHVlcyBjb250YWluZWQgaW4gdGhlIGR5bmFtaWMgbm9kZS5cclxuICAgICAqIEBwYXJhbSB2YWx1ZXMgYXJyYXkgb2YgdmFsdWVzIGZyb20gYSB6ZW4gdGVtcGxhdGVcclxuICAgICAqL1xyXG4gICAgdXBkYXRlICh2YWx1ZXM6IGFueVtdKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW2ldO1xyXG4gICAgICAgICAgICBsZXQgZHluYW1pY1ZhbHVlID0gdGhpcy52YWx1ZXNbaV07XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gZHluYW1pY1ZhbHVlLmN1cnJlbnRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gYXZvaWQgdW5uZWNjZXNzYXJ5IHVwZGF0ZXNcclxuICAgICAgICAgICAgICAgIGR5bmFtaWNWYWx1ZS5vbGRWYWx1ZSA9IGR5bmFtaWNWYWx1ZS5jdXJyZW50VmFsdWU7XHJcbiAgICAgICAgICAgICAgICBkeW5hbWljVmFsdWUuY3VycmVudFZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlciAoKSB7XHJcbiAgICAgICAgZm9yIChsZXQgcmVuZGVyYWJsZSBvZiB0aGlzLnJlbmRlcmFibGVzKSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAocmVuZGVyYWJsZS5hcmVhKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhdHRyaWJ1dGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyQXR0cmlidXRlKHJlbmRlcmFibGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndGV4dENvbnRlbnQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyVGV4dENvbnRlbnQocmVuZGVyYWJsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwYXJzZSAobm9kZTogTm9kZSkge1xyXG4gICAgICAgIC8vIHdhbGsgb3ZlciB0aGUgZWxlbWVudCBhbmQgc2F2ZSBhbGwgZHluYW1pYyBtYXJrZXIgbm9kZXNcclxuICAgICAgICBjb25zdCB0cmVlV2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihub2RlLCA1IC8qKiBvbmx5IGVsZW1lbnRzIGFuZCB0ZXh0ICovKTtcclxuICAgICAgICB3aGlsZSh0cmVlV2Fsa2VyLm5leHROb2RlKCkpIHtcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudE5vZGUgPSB0cmVlV2Fsa2VyLmN1cnJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAoY3VycmVudE5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiBlbGVtZW50LCB0cmF2ZXJzZSBhdHRyaWJ1dGVzXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGN1cnJlbnROb2RlLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY3VycmVudEF0dHJpYnV0ZSA9IGN1cnJlbnROb2RlLmF0dHJpYnV0ZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRBdHRyaWJ1dGUudGV4dENvbnRlbnQuaW5kZXhPZihkeW5hbWljTWFya2VyKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhcnNlIGR5bmFtaWMgdmFsdWVzIGluIGF0dHJpYnV0ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0Q29udGVudCA9IGN1cnJlbnRBdHRyaWJ1dGUudGV4dENvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoZXMgPSB0ZXh0Q29udGVudC5tYXRjaChuZXcgUmVnRXhwKGR5bmFtaWNNYXJrZXIsICdnJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkeW5hbWljVmFsdWVzQ291bnQgPSBtYXRjaGVzID8gbWF0Y2hlcy5sZW5ndGggOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkeW5hbWljVmFsdWVzOiBEeW5hbWljVmFsdWVbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGR5bmFtaWNWYWx1ZXNDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkeW5hbWljVmFsdWVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZTogZHluYW1pY01hcmtlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRWYWx1ZTogbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZXMgPSB0aGlzLnZhbHVlcy5jb25jYXQoZHluYW1pY1ZhbHVlcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgcmVuZGVyYWJsZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmFibGVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJlYTogJ2F0dHJpYnV0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXI6IGN1cnJlbnRBdHRyaWJ1dGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogY3VycmVudEF0dHJpYnV0ZS50ZXh0Q29udGVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlczogZHluYW1pY1ZhbHVlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudE5vZGUudGV4dENvbnRlbnQuaW5kZXhPZihkeW5hbWljTWFya2VyKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiBpdCdzIG5vdCBhbiBlbGVtZW50LCBtdXN0IGJlIGluIGEgdGV4dCBwb3NpdGlvblxyXG5cclxuICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICogV2UgY2FuIGJyZWFrIHRoZSB0ZXh0Q29udGVudCBzdHJpbmcgaW50byBtdWx0aXBsZVxyXG4gICAgICAgICAgICAgICAgICogVGV4dE5vZGVzLCBzbyB0aGF0IGVhY2ggZHluYW1pYyBwYXJ0IGlzIGlzb2xhdGVkIGFuZFxyXG4gICAgICAgICAgICAgICAgICogY2FuIHVwZGF0ZSBieSBpdHNlbGYuXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIGNvbnN0IGR5bmFtaWNNYXJrZXJJbmRpY2VzID0gW107XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0UGFydHMgPSBbXTtcclxuICAgICAgICAgICAgICAgIGxldCB0ZXh0Q29udGVudCA9IGN1cnJlbnROb2RlLnRleHRDb250ZW50O1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRleHRDb250ZW50ICE9PSAnJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwYXJ0O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlSW5kZXggPSB0ZXh0Q29udGVudC5pbmRleE9mKGR5bmFtaWNNYXJrZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZUluZGV4ID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0ZXh0IGNvbnRlbnQgYmVmb3JlIHZhbHVlIG1hcmtlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJ0ID0gdGV4dENvbnRlbnQuc3Vic3RyaW5nKDAsIHZhbHVlSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0Q29udGVudCA9IHRleHRDb250ZW50LnN1YnN0cmluZyh2YWx1ZUluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlSW5kZXggPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdmFsdWUgbWFya2VyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR5bmFtaWNNYXJrZXJJbmRpY2VzLnB1c2godGV4dFBhcnRzLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnQgPSB0ZXh0Q29udGVudC5zdWJzdHJpbmcoMCwgZHluYW1pY01hcmtlci5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0Q29udGVudCA9IHRleHRDb250ZW50LnN1YnN0cmluZyhkeW5hbWljTWFya2VyLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbGFzdCB0ZXh0IGNvbnRlbnQgYWZ0ZXIgdmFsdWUgbWFya2VyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnQgPSB0ZXh0Q29udGVudC5zdWJzdHJpbmcoMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHRDb250ZW50ID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRleHRQYXJ0cy5wdXNoKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHBhcnQpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBlbXB0eSBjdXJyZW50IG5vZGUgYW5kIHJlcGxhY2Ugd2l0aCB0ZXh0IG5vZGVzXHJcbiAgICAgICAgICAgICAgICAvLyAqKiB3YXJuaW5nOiBjYW4ndCBhcHBlbmRDaGlsZCgpIG9yIGVsc2Ugd2Fsa2VyXHJcbiAgICAgICAgICAgICAgICAvLyAqKiB3aWxsIGtlZXAgYWRkaW5nIGFuZCB3YWxraW5nIG92ZXIgbm9kZXMgKipcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSBjdXJyZW50Tm9kZS5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0UGFydHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnROb2RlLmluc2VydEJlZm9yZSh0ZXh0UGFydHNbaV0sIGN1cnJlbnROb2RlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyByZW1vdmUgY3VycmVudCBub2RlIGZyb20gcGFyZW50IG5vdyB0aGF0IHdlJ3ZlXHJcbiAgICAgICAgICAgICAgICAvLyByZXBsYWNlZCBhbGwgdGV4dCBwYXJ0cyB3aXRoaW4gaXRcclxuICAgICAgICAgICAgICAgIHBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY3VycmVudE5vZGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSB2YWx1ZXMgYW5kIHJlbmRlcmFibGVzIGZvciBlYWNoXHJcbiAgICAgICAgICAgICAgICAvLyBkeW5hbWljIHZhbHVlXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGR5bmFtaWNNYXJrZXJJbmRpY2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHluYW1pY1ZhbHVlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IGR5bmFtaWNNYXJrZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sZFZhbHVlOiBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlcy5wdXNoKGR5bmFtaWNWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJhYmxlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJlYTogJ3RleHRDb250ZW50JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyOiB0ZXh0UGFydHNbZHluYW1pY01hcmtlckluZGljZXNbaV1dLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogZHluYW1pY01hcmtlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzOiBbZHluYW1pY1ZhbHVlXVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVuZGVycyBhIG5ldyBhdHRyaWJ1dGUgdmFsdWUgYnlcclxuICAgICAqIHJlYnVpbGRpbmcgdGhlIHJhdyBzdHJpbmcgYW5kIHJlcGxhY2luZ1xyXG4gICAgICogZWFjaCBkeW5hbWljIHBhcnQgd2l0aCB0aGVpciBjdXJyZW50IHZhbHVlc1xyXG4gICAgICogQHBhcmFtIHJlbmRlcmFibGUgYSBkeW5hbWljIGF0dHJpYnV0ZSB2YWx1ZVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHJlbmRlckF0dHJpYnV0ZShyZW5kZXJhYmxlOiBSZW5kZXJhYmxlQXJlYSkge1xyXG4gICAgICAgIGxldCBhdHRyaWJ1dGVWYWx1ZSA9IHJlbmRlcmFibGUudGVtcGxhdGU7XHJcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCByZW5kZXJhYmxlLnZhbHVlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBhdHRyaWJ1dGVWYWx1ZSA9IGF0dHJpYnV0ZVZhbHVlLnJlcGxhY2UoZHluYW1pY01hcmtlciwgcmVuZGVyYWJsZS52YWx1ZXNbal0uY3VycmVudFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVuZGVyYWJsZS5jb250YWluZXIudGV4dENvbnRlbnQgPSBhdHRyaWJ1dGVWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbmRlcnMgdmFsdWUgaW50byBhIHRleHRDb250ZW50IGFyZWEuIFByaW1pdGl2ZSB2YWx1ZXNcclxuICAgICAqIGNhbiBiZSBkaXJlY3RseSByZW5kZXJlZCBpbnRvIHRleHRDb250ZW50LCBob3dldmVyLCBaZW5UZW1wbGF0ZVxyXG4gICAgICogdmFsdWVzIG11c3QgYmUgcGFyc2VkIGNvcnJlY3RseS5cclxuICAgICAqIEBwYXJhbSByZW5kZXJhYmxlIGEgZHluYW1pYyB0ZXh0IG5vZGVcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSByZW5kZXJUZXh0Q29udGVudChyZW5kZXJhYmxlOiBSZW5kZXJhYmxlQXJlYSkge1xyXG4gICAgICAgIC8vIGRldGVybWluZSB2YWx1ZVxyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gcmVuZGVyYWJsZS52YWx1ZXNbMF07XHJcbiAgICAgICAgaWYgKHZhbHVlLmN1cnJlbnRWYWx1ZSBpbnN0YW5jZW9mIFplblRlbXBsYXRlKSB7XHJcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoaXMgdGVtcGxhdGUgd2FzIHJlbmRlcmVkIGJlZm9yZVxyXG4gICAgICAgICAgICBpZiAodmFsdWUuY3VycmVudFZhbHVlICE9PSB2YWx1ZS5vbGRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gdGhpcyB0ZW1wbGF0ZSBoYXNuJ3QgYmVlbiByZW5kZXJlZCBiZWZvcmVcclxuICAgICAgICAgICAgICAgIGxldCBkeW5hbWljTm9kZSA9IHRlbXBsYXRlQ2FjaGUuZ2V0KHJlbmRlcmFibGUuY29udGFpbmVyKTtcclxuICAgICAgICAgICAgICAgIGlmICghZHluYW1pY05vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb250YWluZXIgaGFzIG5vdCBiZWVuIHJlbmRlcmVkIGludG8gYmVmb3JlLlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNsb25lLCBwYXJzZSwgYW5kIGluc2VydCB0ZW1wbGF0ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gdmFsdWUuY3VycmVudFZhbHVlLmNsb25lKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZHluYW1pY05vZGUgPSBuZXcgRHluYW1pY05vZGUodGVtcGxhdGUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgY29tbWVudCBtYXJrZXIgYW5kIHJlcGxhY2UgdGV4dCBjb250ZW50XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tbWVudE1hcmtlciA9IGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQoJycpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmFibGUuY29udGFpbmVyLnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNvbW1lbnRNYXJrZXIsIHJlbmRlcmFibGUuY29udGFpbmVyKTtcclxuICAgICAgICAgICAgICAgICAgICByZW5kZXJhYmxlLmNvbnRhaW5lci5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZSh0ZW1wbGF0ZSwgcmVuZGVyYWJsZS5jb250YWluZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmFibGUuY29udGFpbmVyLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQocmVuZGVyYWJsZS5jb250YWluZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmFibGUuY29udGFpbmVyID0gY29tbWVudE1hcmtlcjtcclxuICAgICAgICAgICAgICAgICAgICAvLyBzZXQgY29udGFpbmVyXHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVDYWNoZS5zZXQocmVuZGVyYWJsZS5jb250YWluZXIsIGR5bmFtaWNOb2RlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGR5bmFtaWNOb2RlLnVwZGF0ZSh2YWx1ZS5jdXJyZW50VmFsdWUudmFsdWVzKTtcclxuICAgICAgICAgICAgICAgIGR5bmFtaWNOb2RlLnJlbmRlcigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVuZGVyYWJsZS5jb250YWluZXIudGV4dENvbnRlbnQgPSByZW5kZXJhYmxlLnZhbHVlc1swXS5jdXJyZW50VmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgRHluYW1pY1ZhbHVlIHtcclxuICAgIGN1cnJlbnRWYWx1ZTogYW55O1xyXG4gICAgb2xkVmFsdWU6IGFueTtcclxufVxyXG5pbnRlcmZhY2UgUmVuZGVyYWJsZUFyZWEge1xyXG4gICAgYXJlYTogJ3RleHRDb250ZW50JyB8ICdhdHRyaWJ1dGUnO1xyXG4gICAgY29udGFpbmVyOiBOb2RlO1xyXG4gICAgdGVtcGxhdGU6IHN0cmluZztcclxuICAgIHZhbHVlczogRHluYW1pY1ZhbHVlW107XHJcbn0iLCJpbXBvcnQgeyBEeW5hbWljTm9kZSB9IGZyb20gJy4vZHluYW1pYy1ub2RlJztcclxuaW1wb3J0IHsgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcblxyXG4vKipcclxuICogQSBjYWNoZSBvZiBkeWFubWljIG5vZGVzIHJlbmRlcmVkIGludG8gY29udGFpbmVycy5cclxuICovXHJcbmV4cG9ydCBjb25zdCBjb250YWluZXJDYWNoZSA9IG5ldyBXZWFrTWFwPE5vZGUsIER5bmFtaWNOb2RlPigpO1xyXG5cclxuLyoqXHJcbiAqIFJlbmRlcnMgYSB6ZW4gdGVtcGxhdGUgaW50byBhIGNvbnRhaW5lciBET00gZWxlbWVudC5cclxuICogQHBhcmFtIHplblRlbXBsYXRlIEEgemVuIHRlbXBsYXRlIHRvIHJlbmRlciBpbnRvIHRoZSBET01cclxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgRE9NIGVsZW1lbnQgdG8gcmVuZGVyIGludG9cclxuICovXHJcbmV4cG9ydCBjb25zdCByZW5kZXIgPSBmdW5jdGlvbiAoemVuVGVtcGxhdGU6IFplblRlbXBsYXRlLCBjb250YWluZXI6IE5vZGUpIHtcclxuICAgIC8vIGNoZWNrIGlmIHplbiB0ZW1wbGF0ZSBoYXMgYmVlbiByZW5kZXJlZCBhbmQgY2FjaGVkXHJcbiAgICBsZXQgZHluYW1pY05vZGUgPSBjb250YWluZXJDYWNoZS5nZXQoY29udGFpbmVyKTtcclxuICAgIGlmICghZHluYW1pY05vZGUpIHtcclxuICAgICAgICAvLyBjb250YWluZXIgaGFzIG5vdCBiZWVuIHJlbmRlcmVkIGludG8gYmVmb3JlLlxyXG4gICAgICAgIC8vIGNsb25lLCBwYXJzZSwgYW5kIGluc2VydCB0ZW1wbGF0ZVxyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gemVuVGVtcGxhdGUuY2xvbmUoKTtcclxuICAgICAgICBkeW5hbWljTm9kZSA9IG5ldyBEeW5hbWljTm9kZSh0ZW1wbGF0ZSk7XHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcclxuICAgICAgICBjb250YWluZXJDYWNoZS5zZXQoY29udGFpbmVyLCBkeW5hbWljTm9kZSk7XHJcbiAgICB9XHJcbiAgICBkeW5hbWljTm9kZS51cGRhdGUoemVuVGVtcGxhdGUudmFsdWVzKTtcclxuICAgIGR5bmFtaWNOb2RlLnJlbmRlcigpO1xyXG59IiwiaW1wb3J0IHsgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcbmltcG9ydCB7IHJlbmRlciB9IGZyb20gJy4vcmVuZGVyJztcclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBaZW5FbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xyXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XHJcbiAgICAgICAgY29uc3QgYXR0cmlidXRlcyA9IE9iamVjdC5rZXlzKHRoaXMucHJvcGVydGllcyk7XHJcbiAgICAgICAgY29uc29sZS5kaXIodGhpcyk7XHJcbiAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldCBwcm9wZXJ0aWVzKCkge1xyXG4gICAgICAgIHJldHVybiB7fTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZ2V0IHN0YXRlKCkge1xyXG4gICAgICAgIHJldHVybiB7fTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xyXG4gICAgICAgIHRoaXMuc2V0dXAoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEN1c3RvbSBXZWIgRWxlbWVudHMgbGlmZWN5Y2xlIGhvb2tzXHJcbiAgICAgKi9cclxuXHJcbiAgICBjb25uZWN0ZWRDYWxsYmFjayAoKSB7XHJcbiAgICAgICAgcmVuZGVyKHRoaXMucmVuZGVyKCksIHRoaXMuc2hhZG93Um9vdCk7XHJcbiAgICB9XHJcblxyXG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7fVxyXG5cclxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcclxuICAgICAgICBpZiAodGhpc1sncHJvcGVydGllcyddW25hbWVdICYmIG9sZFZhbHVlICE9PSBuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzWydwcm9wZXJ0aWVzJ11bbmFtZV0gPSBuZXdWYWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cCgpIHtcclxuICAgICAgICAvLyByZWZsZWN0IGNvbnN0cnVjdG9yIGNsYXNzIHByb3BlcnRpZXMgb24gaW5zdGFuY2VcclxuICAgICAgICBjb25zdCBjdG9yID0gdGhpcy5jb25zdHJ1Y3RvciBhcyB0eXBlb2YgWmVuRWxlbWVudDtcclxuICAgICAgICBpZiAoIXRoaXNbJ3Byb3BlcnRpZXMnXSkge1xyXG4gICAgICAgICAgICB0aGlzWydwcm9wZXJ0aWVzJ10gPSBjdG9yWydwcm9wZXJ0aWVzJ107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpc1snc3RhdGUnXSkge1xyXG4gICAgICAgICAgICB0aGlzWydzdGF0ZSddID0gY3Rvclsnc3RhdGUnXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXF1aXJlZCBpbXBsZW1lbnRhdGlvbiBieSBzdWItY2xhc3Nlcy4gUmVuZGVycyB0aGUgaHRtbCBmb3JcclxuICAgICAqIGEgWmVuIEVsZW1lbnQuXHJcbiAgICAgKiBAcGFyYW0gdmFsdWVzXHJcbiAgICAgKi9cclxuICAgIGFic3RyYWN0IHJlbmRlcih2YWx1ZXM/OiBhbnlbXSk6IFplblRlbXBsYXRlO1xyXG5cclxufSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiTUFBYSxhQUFhLEdBQUcsR0FBRyxDQUFDO0FBQ2pDLE1BQWEsV0FBVztJQUlwQixZQUFZLE9BQTZCLEVBQUUsTUFBYTtRQUh4RCxTQUFJLEdBQVcsRUFBRSxDQUFDO1FBSWQsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDNUI7Ozs7OztJQU9ELEtBQUssQ0FBRSxPQUE2QjtRQUNoQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLElBQUksSUFBSSxPQUFPLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLGFBQWEsR0FBRyxFQUFFLENBQUMsQ0FBQztTQUN4RSxDQUFDLENBQUM7S0FDTjs7Ozs7SUFNRCxXQUFXO1FBQ1AsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNwRCxRQUFRLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDL0IsT0FBTyxRQUFRLENBQUM7S0FDbkI7Ozs7SUFLRCxLQUFLO1FBQ0QsT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQWdCLENBQUM7S0FDcEU7Q0FDSjs7O01DcENZLGdCQUFnQixHQUFHLElBQUksT0FBTyxFQUFxQyxDQUFDO0FBQ2pGLE1BQWEsR0FBRyxHQUFHLFVBQVUsT0FBNkIsRUFBRSxHQUFHLE1BQWE7O0lBRXhFLElBQUksV0FBVyxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FB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
