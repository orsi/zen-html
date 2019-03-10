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
            switch (renderable.type) {
                case 'attribute':
                    this.renderAttribute(renderable);
                    break;
                case 'text':
                    this.renderText(renderable);
                    break;
                case 'template':
                    this.renderTemplate(renderable);
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
                        const attributeRenderable = {
                            type: 'attribute',
                            container: currentAttribute,
                            template: currentAttribute.textContent,
                            values: dynamicValues
                        };
                        this.renderables.push(attributeRenderable);
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
                const valueMarkerIndices = [];
                const textParts = [];
                let textContent = currentNode.textContent;
                while (textContent !== '') {
                    let part;
                    const valueIndex = textContent.indexOf(dynamicMarker);
                    if (valueIndex !== 0) {
                        // text content before value marker
                        part = textContent.substring(0, valueIndex);
                        textContent = textContent.substring(valueIndex);
                    }
                    else {
                        // value marker
                        valueMarkerIndices.push(textParts.length);
                        part = textContent.substring(0, dynamicMarker.length);
                        textContent = textContent.substring(dynamicMarker.length);
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
                // remove current text node from parent
                parentNode.removeChild(currentNode);
                // parse each new text node
                for (let i = 0; i < valueMarkerIndices.length; i++) {
                    const dynamicValue = {
                        currentValue: dynamicMarker,
                        oldValue: null
                    };
                    this.values.push(dynamicValue);
                    this.renderables.push({
                        type: 'text',
                        container: textParts[valueMarkerIndices[i]],
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
     * Renders a new text value.
     * @param renderable a dynamic text node
     */
    renderText(renderable) {
        renderable.container.textContent = renderable.values[0].currentValue;
    }
    /**
     * Renders a nested zen template.
     * @param renderable a dynamic text node
     */
    renderTemplate(renderable) {
        throw new Error('Not Implemented');
        // renderable.container.textContent = renderable.values[0].currentValue;
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

class ZenElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        render(this.render(), this.shadowRoot);
    }
}

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

export { ZenElement, DynamicNode, dynamicMarker, ZenTemplate, zenTemplateCache, zen, containerCache, render };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemVuLWh0bWwuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy96ZW4tdGVtcGxhdGUudHMiLCIuLi9zcmMvZHluYW1pYy1ub2RlLnRzIiwiLi4vc3JjL3JlbmRlci50cyIsIi4uL3NyYy96ZW4tZWxlbWVudC50cyIsIi4uL3NyYy96ZW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IGR5bmFtaWNNYXJrZXIgPSAn4p2NJztcclxuZXhwb3J0IGNsYXNzIFplblRlbXBsYXRlIHtcclxuICAgIGh0bWw6IHN0cmluZyA9ICcnO1xyXG4gICAgc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXk7XHJcbiAgICB2YWx1ZXM6IGFueVtdO1xyXG4gICAgY29uc3RydWN0b3Ioc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIHZhbHVlczogYW55W10pIHtcclxuICAgICAgICB0aGlzLnN0cmluZ3MgPSBzdHJpbmdzO1xyXG4gICAgICAgIHRoaXMudmFsdWVzID0gdmFsdWVzO1xyXG4gICAgICAgIHRoaXMucGFyc2UodGhpcy5zdHJpbmdzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFBhcnNlcyB0aGUgdGVtcGxhdGUgc3RyaW5ncyBhbmQgcmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvblxyXG4gICAgICogb2YgYW4gZWxlbWVudCB3aXRoIHZhbHVlIHBvc2l0aW9ucyByZXBsYWNlZCBieSBtYXJrZXJzLlxyXG4gICAgICogQHBhcmFtIHN0cmluZ3NcclxuICAgICAqL1xyXG4gICAgcGFyc2UgKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5KSB7XHJcbiAgICAgICAgc3RyaW5ncy5mb3JFYWNoKChlbGVtZW50LCBpKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuaHRtbCArPSBlbGVtZW50ICsgKGkgPCBzdHJpbmdzLmxlbmd0aCAtIDEgPyBkeW5hbWljTWFya2VyIDogJycpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhbmQgcmV0dXJucyBhbiBIVE1MIFRlbXBsYXRlIGVsZW1lbnQgZnJvbSB0aGVcclxuICAgICAqIHJhdyBzdHJpbmcuXHJcbiAgICAgKi9cclxuICAgIGdldFRlbXBsYXRlICgpOiBIVE1MVGVtcGxhdGVFbGVtZW50IHtcclxuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XHJcbiAgICAgICAgdGVtcGxhdGUuaW5uZXJIVE1MID0gdGhpcy5odG1sO1xyXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENsb25lcyBhbiBlbGVtZW50IHVzaW5nIHRoaXMgdGVtcGxhdGUuXHJcbiAgICAgKi9cclxuICAgIGNsb25lKCk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRUZW1wbGF0ZSgpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpIGFzIEhUTUxFbGVtZW50O1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgZHluYW1pY01hcmtlciB9IGZyb20gJy4vemVuLXRlbXBsYXRlJztcclxuXHJcbmV4cG9ydCBjbGFzcyBEeW5hbWljTm9kZSB7XHJcbiAgICB2YWx1ZXM6IER5bmFtaWNWYWx1ZVtdID0gW107XHJcbiAgICByZW5kZXJhYmxlczogRHluYW1pY1JlbmRlcmFibGVbXSA9IFtdO1xyXG4gICAgY29uc3RydWN0b3IgKG5vZGU6IE5vZGUpIHtcclxuICAgICAgICB0aGlzLnBhcnNlKG5vZGUpO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBVcGRhdGVzIGFsbCB2YWx1ZXMgY29udGFpbmVkIGluIHRoZSBkeW5hbWljIG5vZGUuXHJcbiAgICAgKiBAcGFyYW0gdmFsdWVzIGFycmF5IG9mIHZhbHVlcyBmcm9tIGEgemVuIHRlbXBsYXRlXHJcbiAgICAgKi9cclxuICAgIHVwZGF0ZSAodmFsdWVzOiBhbnlbXSkge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tpXTtcclxuICAgICAgICAgICAgbGV0IGR5bmFtaWNWYWx1ZSA9IHRoaXMudmFsdWVzW2ldO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IGR5bmFtaWNWYWx1ZS5jdXJyZW50VmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIGF2b2lkIHVubmVjY2Vzc2FyeSB1cGRhdGVzXHJcbiAgICAgICAgICAgICAgICBkeW5hbWljVmFsdWUub2xkVmFsdWUgPSBkeW5hbWljVmFsdWUuY3VycmVudFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgZHluYW1pY1ZhbHVlLmN1cnJlbnRWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIgKCkge1xyXG4gICAgICAgIGZvciAobGV0IHJlbmRlcmFibGUgb2YgdGhpcy5yZW5kZXJhYmxlcykge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHJlbmRlcmFibGUudHlwZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYXR0cmlidXRlJzpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckF0dHJpYnV0ZShyZW5kZXJhYmxlKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyVGV4dChyZW5kZXJhYmxlKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3RlbXBsYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlclRlbXBsYXRlKHJlbmRlcmFibGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcGFyc2UgKG5vZGU6IE5vZGUpIHtcclxuICAgICAgICAvLyB3YWxrIG92ZXIgdGhlIGVsZW1lbnQgYW5kIHNhdmUgYWxsIGR5bmFtaWMgbWFya2VyIG5vZGVzXHJcbiAgICAgICAgY29uc3QgdHJlZVdhbGtlciA9IGRvY3VtZW50LmNyZWF0ZVRyZWVXYWxrZXIobm9kZSwgNSAvKiogb25seSBlbGVtZW50cyBhbmQgdGV4dCAqLyk7XHJcbiAgICAgICAgd2hpbGUodHJlZVdhbGtlci5uZXh0Tm9kZSgpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnROb2RlID0gdHJlZVdhbGtlci5jdXJyZW50Tm9kZTtcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnROb2RlIGluc3RhbmNlb2YgRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgZWxlbWVudCwgdHJhdmVyc2UgYXR0cmlidXRlc1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjdXJyZW50Tm9kZS5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGN1cnJlbnRBdHRyaWJ1dGUgPSBjdXJyZW50Tm9kZS5hdHRyaWJ1dGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50QXR0cmlidXRlLnRleHRDb250ZW50LmluZGV4T2YoZHluYW1pY01hcmtlcikgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJzZSBkeW5hbWljIHZhbHVlcyBpbiBhdHRyaWJ1dGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGV4dENvbnRlbnQgPSBjdXJyZW50QXR0cmlidXRlLnRleHRDb250ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gdGV4dENvbnRlbnQubWF0Y2gobmV3IFJlZ0V4cChkeW5hbWljTWFya2VyLCAnZycpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZHluYW1pY1ZhbHVlc0NvdW50ID0gbWF0Y2hlcyA/IG1hdGNoZXMubGVuZ3RoIDogMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZHluYW1pY1ZhbHVlczogRHluYW1pY1ZhbHVlW10gPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkeW5hbWljVmFsdWVzQ291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHluYW1pY1ZhbHVlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IGR5bmFtaWNNYXJrZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWU6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzID0gdGhpcy52YWx1ZXMuY29uY2F0KGR5bmFtaWNWYWx1ZXMpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRlIHJlbmRlcmFibGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlUmVuZGVyYWJsZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyOiBjdXJyZW50QXR0cmlidXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IGN1cnJlbnRBdHRyaWJ1dGUudGV4dENvbnRlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXM6IGR5bmFtaWNWYWx1ZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJhYmxlcy5wdXNoKGF0dHJpYnV0ZVJlbmRlcmFibGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50Tm9kZS50ZXh0Q29udGVudC5pbmRleE9mKGR5bmFtaWNNYXJrZXIpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIGl0J3Mgbm90IGFuIGVsZW1lbnQsIG11c3QgYmUgaW4gYSB0ZXh0IHBvc2l0aW9uXHJcblxyXG4gICAgICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAgICAgKiBXZSBjYW4gYnJlYWsgdGhlIHRleHRDb250ZW50IHN0cmluZyBpbnRvIG11bHRpcGxlXHJcbiAgICAgICAgICAgICAgICAgKiBUZXh0Tm9kZXMsIHNvIHRoYXQgZWFjaCBkeW5hbWljIHBhcnQgaXMgaXNvbGF0ZWQgYW5kXHJcbiAgICAgICAgICAgICAgICAgKiBjYW4gdXBkYXRlIGJ5IGl0c2VsZi5cclxuICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWVNYXJrZXJJbmRpY2VzID0gW107XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0UGFydHMgPSBbXTtcclxuICAgICAgICAgICAgICAgIGxldCB0ZXh0Q29udGVudCA9IGN1cnJlbnROb2RlLnRleHRDb250ZW50O1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRleHRDb250ZW50ICE9PSAnJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwYXJ0O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlSW5kZXggPSB0ZXh0Q29udGVudC5pbmRleE9mKGR5bmFtaWNNYXJrZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZUluZGV4ICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRleHQgY29udGVudCBiZWZvcmUgdmFsdWUgbWFya2VyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnQgPSB0ZXh0Q29udGVudC5zdWJzdHJpbmcoMCwgdmFsdWVJbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHRDb250ZW50ID0gdGV4dENvbnRlbnQuc3Vic3RyaW5nKHZhbHVlSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZhbHVlIG1hcmtlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZU1hcmtlckluZGljZXMucHVzaCh0ZXh0UGFydHMubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFydCA9IHRleHRDb250ZW50LnN1YnN0cmluZygwLCBkeW5hbWljTWFya2VyLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHRDb250ZW50ID0gdGV4dENvbnRlbnQuc3Vic3RyaW5nKGR5bmFtaWNNYXJrZXIubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dFBhcnRzLnB1c2goZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUocGFydCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIGVtcHR5IGN1cnJlbnQgbm9kZSBhbmQgcmVwbGFjZSB3aXRoIHRleHQgbm9kZXNcclxuICAgICAgICAgICAgICAgIC8vICoqIHdhcm5pbmc6IGNhbid0IGFwcGVuZENoaWxkKCkgb3IgZWxzZSB3YWxrZXJcclxuICAgICAgICAgICAgICAgIC8vICoqIHdpbGwga2VlcCBhZGRpbmcgYW5kIHdhbGtpbmcgb3ZlciBub2RlcyAqKlxyXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IGN1cnJlbnROb2RlLnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRQYXJ0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRleHRQYXJ0c1tpXSwgY3VycmVudE5vZGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBjdXJyZW50IHRleHQgbm9kZSBmcm9tIHBhcmVudFxyXG4gICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjdXJyZW50Tm9kZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcGFyc2UgZWFjaCBuZXcgdGV4dCBub2RlXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlTWFya2VySW5kaWNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGR5bmFtaWNWYWx1ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZhbHVlOiBkeW5hbWljTWFya2VyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRWYWx1ZTogbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZXMucHVzaChkeW5hbWljVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyYWJsZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyOiB0ZXh0UGFydHNbdmFsdWVNYXJrZXJJbmRpY2VzW2ldXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IGR5bmFtaWNNYXJrZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlczogW2R5bmFtaWNWYWx1ZV1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbmRlcnMgYSBuZXcgYXR0cmlidXRlIHZhbHVlIGJ5XHJcbiAgICAgKiByZWJ1aWxkaW5nIHRoZSByYXcgc3RyaW5nIGFuZCByZXBsYWNpbmdcclxuICAgICAqIGVhY2ggZHluYW1pYyBwYXJ0IHdpdGggdGhlaXIgY3VycmVudCB2YWx1ZXNcclxuICAgICAqIEBwYXJhbSByZW5kZXJhYmxlIGEgZHluYW1pYyBhdHRyaWJ1dGUgdmFsdWVcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSByZW5kZXJBdHRyaWJ1dGUocmVuZGVyYWJsZTogRHluYW1pY1JlbmRlcmFibGUpIHtcclxuICAgICAgICBsZXQgYXR0cmlidXRlVmFsdWUgPSByZW5kZXJhYmxlLnRlbXBsYXRlO1xyXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcmVuZGVyYWJsZS52YWx1ZXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgYXR0cmlidXRlVmFsdWUgPSBhdHRyaWJ1dGVWYWx1ZS5yZXBsYWNlKGR5bmFtaWNNYXJrZXIsIHJlbmRlcmFibGUudmFsdWVzW2pdLmN1cnJlbnRWYWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlbmRlcmFibGUuY29udGFpbmVyLnRleHRDb250ZW50ID0gYXR0cmlidXRlVmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW5kZXJzIGEgbmV3IHRleHQgdmFsdWUuXHJcbiAgICAgKiBAcGFyYW0gcmVuZGVyYWJsZSBhIGR5bmFtaWMgdGV4dCBub2RlXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgcmVuZGVyVGV4dChyZW5kZXJhYmxlOiBEeW5hbWljUmVuZGVyYWJsZSkge1xyXG4gICAgICAgIHJlbmRlcmFibGUuY29udGFpbmVyLnRleHRDb250ZW50ID0gcmVuZGVyYWJsZS52YWx1ZXNbMF0uY3VycmVudFZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVuZGVycyBhIG5lc3RlZCB6ZW4gdGVtcGxhdGUuXHJcbiAgICAgKiBAcGFyYW0gcmVuZGVyYWJsZSBhIGR5bmFtaWMgdGV4dCBub2RlXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgcmVuZGVyVGVtcGxhdGUocmVuZGVyYWJsZTogRHluYW1pY1JlbmRlcmFibGUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBJbXBsZW1lbnRlZCcpO1xyXG4gICAgICAgIC8vIHJlbmRlcmFibGUuY29udGFpbmVyLnRleHRDb250ZW50ID0gcmVuZGVyYWJsZS52YWx1ZXNbMF0uY3VycmVudFZhbHVlO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgRHluYW1pY1ZhbHVlIHtcclxuICAgIGN1cnJlbnRWYWx1ZTogYW55O1xyXG4gICAgb2xkVmFsdWU6IGFueTtcclxufVxyXG5pbnRlcmZhY2UgRHluYW1pY1JlbmRlcmFibGUge1xyXG4gICAgdHlwZTogc3RyaW5nO1xyXG4gICAgY29udGFpbmVyOiBOb2RlO1xyXG4gICAgdGVtcGxhdGU6IHN0cmluZztcclxuICAgIHZhbHVlczogRHluYW1pY1ZhbHVlW107XHJcbn0iLCJpbXBvcnQgeyBEeW5hbWljTm9kZSB9IGZyb20gJy4vZHluYW1pYy1ub2RlJztcclxuaW1wb3J0IHsgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcblxyXG4vKipcclxuICogQSBjYWNoZSBvZiBkeWFubWljIG5vZGVzIHJlbmRlcmVkIGludG8gY29udGFpbmVycy5cclxuICovXHJcbmV4cG9ydCBjb25zdCBjb250YWluZXJDYWNoZSA9IG5ldyBXZWFrTWFwPE5vZGUsIER5bmFtaWNOb2RlPigpO1xyXG5cclxuLyoqXHJcbiAqIFJlbmRlcnMgYSB6ZW4gdGVtcGxhdGUgaW50byBhIGNvbnRhaW5lciBET00gZWxlbWVudC5cclxuICogQHBhcmFtIHplblRlbXBsYXRlIEEgemVuIHRlbXBsYXRlIHRvIHJlbmRlciBpbnRvIHRoZSBET01cclxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgRE9NIGVsZW1lbnQgdG8gcmVuZGVyIGludG9cclxuICovXHJcbmV4cG9ydCBjb25zdCByZW5kZXIgPSBmdW5jdGlvbiAoemVuVGVtcGxhdGU6IFplblRlbXBsYXRlLCBjb250YWluZXI6IE5vZGUpIHtcclxuICAgIC8vIGNoZWNrIGlmIHplbiB0ZW1wbGF0ZSBoYXMgYmVlbiByZW5kZXJlZCBhbmQgY2FjaGVkXHJcbiAgICBsZXQgZHluYW1pY05vZGUgPSBjb250YWluZXJDYWNoZS5nZXQoY29udGFpbmVyKTtcclxuICAgIGlmICghZHluYW1pY05vZGUpIHtcclxuICAgICAgICAvLyBjb250YWluZXIgaGFzIG5vdCBiZWVuIHJlbmRlcmVkIGludG8gYmVmb3JlLlxyXG4gICAgICAgIC8vIGNsb25lLCBwYXJzZSwgYW5kIGluc2VydCB0ZW1wbGF0ZVxyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gemVuVGVtcGxhdGUuY2xvbmUoKTtcclxuICAgICAgICBkeW5hbWljTm9kZSA9IG5ldyBEeW5hbWljTm9kZSh0ZW1wbGF0ZSk7XHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcclxuICAgICAgICBjb250YWluZXJDYWNoZS5zZXQoY29udGFpbmVyLCBkeW5hbWljTm9kZSk7XHJcbiAgICB9XHJcbiAgICBkeW5hbWljTm9kZS51cGRhdGUoemVuVGVtcGxhdGUudmFsdWVzKTtcclxuICAgIGR5bmFtaWNOb2RlLnJlbmRlcigpO1xyXG59IiwiaW1wb3J0IHsgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcbmltcG9ydCB7IHJlbmRlciB9IGZyb20gJy4vcmVuZGVyJztcclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBaZW5FbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6ICdvcGVuJyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25uZWN0ZWRDYWxsYmFjayAoKSB7XHJcbiAgICAgICAgcmVuZGVyKHRoaXMucmVuZGVyKCksIHRoaXMuc2hhZG93Um9vdCk7XHJcbiAgICB9XHJcblxyXG4gICAgYWJzdHJhY3QgcmVuZGVyKHZhbHVlcz86IGFueVtdKTogWmVuVGVtcGxhdGU7XHJcbn0iLCJpbXBvcnQgeyBaZW5UZW1wbGF0ZSB9IGZyb20gJy4vemVuLXRlbXBsYXRlJztcclxuXHJcbmV4cG9ydCBjb25zdCB6ZW5UZW1wbGF0ZUNhY2hlID0gbmV3IFdlYWtNYXA8VGVtcGxhdGVTdHJpbmdzQXJyYXksIFplblRlbXBsYXRlPigpO1xyXG5leHBvcnQgY29uc3QgemVuID0gZnVuY3Rpb24gKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5LCAuLi52YWx1ZXM6IGFueVtdKSB7XHJcbiAgICAvLyBjaGVjayBpZiB0aGlzIHRlbXBsYXRlIHN0cmluZyBhcnJheSBoYXMgYmVlbiBjYWNoZWRcclxuICAgIGxldCB6ZW5UZW1wbGF0ZSA9IHplblRlbXBsYXRlQ2FjaGUuZ2V0KHN0cmluZ3MpO1xyXG4gICAgaWYgKCF6ZW5UZW1wbGF0ZSkge1xyXG4gICAgICAgIC8vIGNyZWF0ZSBhbmQgY2FjaGUgdGVtcGxhdGVcclxuICAgICAgICB6ZW5UZW1wbGF0ZSA9IG5ldyBaZW5UZW1wbGF0ZShzdHJpbmdzLCB2YWx1ZXMpO1xyXG4gICAgICAgIHplblRlbXBsYXRlQ2FjaGUuc2V0KHN0cmluZ3MsIHplblRlbXBsYXRlKTtcclxuICAgIH1cclxuICAgIHJldHVybiB6ZW5UZW1wbGF0ZTtcclxufVxyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ik1BQWEsYUFBYSxHQUFHLEdBQUcsQ0FBQztBQUNqQyxNQUFhLFdBQVc7SUFJcEIsWUFBWSxPQUE2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
