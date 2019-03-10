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

class ZenNode {
    constructor(node) {
        this.children = [];
        this.parse(node);
    }
    render(values) {
        // values should always equal and be in the same
        // order as this node's children
        let dynamicValue;
        let value;
        for (let i = 0; i < values.length; i++) {
            // update dynamic value and render
            value = values[i];
            dynamicValue = this.children[i];
            dynamicValue.oldValue = dynamicValue.currentValue;
            dynamicValue.currentValue = value;
            switch (dynamicValue.type) {
                case 'attribute':
                    /** TODO
                     *  Attributes should only render once, even if it
                     *  contains multiple dynamic values. Currently this
                     *  will render for each dynamic value.
                     */
                    this.renderAttribute(dynamicValue);
                    break;
                case 'text':
                    this.renderText(dynamicValue);
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
                let currentAttribute;
                for (let i = 0; i < currentNode.attributes.length; i++) {
                    currentAttribute = currentNode.attributes[i];
                    if (currentAttribute.textContent.indexOf(dynamicMarker) > -1) {
                        this.parseAttribute(currentAttribute);
                    }
                }
            }
            else if (currentNode.textContent.indexOf(dynamicMarker) > -1) {
                // if it's not an element, must be in a text position
                this.parseText(currentNode);
            }
        }
    }
    parseAttribute(currentAttribute) {
        /** Attributes can contain more than one dynamic value
         *  and cannot be updated individually, so we
         *  have to save the original attribute string
         *  and build the entire string from all dynamic
         *  values contained within it when a single
         *  value changes.
         */
        const textContent = currentAttribute.textContent;
        const matches = textContent.match(new RegExp(dynamicMarker, 'g'));
        const dynamicValuesCount = matches ? matches.length : 0;
        const dynamicAttributeValues = [];
        const attributeTemplate = {
            raw: currentAttribute.textContent,
            values: dynamicAttributeValues
        };
        for (let i = 0; i < dynamicValuesCount; i++) {
            const dynamicValue = {
                type: 'attribute',
                position: i,
                container: currentAttribute,
                currentValue: dynamicMarker,
                oldValue: null,
                template: attributeTemplate
            };
            dynamicAttributeValues.push(dynamicValue); // push into attribute template
            this.children.push(dynamicValue);
        }
    }
    parseText(text) {
        /**
         * We can break the textContent string into multiple
         * TextNodes, so that each dynamic part is isolated and
         * can update by itself.
         */
        const valueMarkerIndices = [];
        const textParts = [];
        let textContent = text.textContent;
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
        // save the dynamic text parts
        for (let i = 0; i < valueMarkerIndices.length; i++) {
            this.children.push({
                type: 'text',
                container: textParts[valueMarkerIndices[i]],
                currentValue: dynamicMarker,
                oldValue: null
            });
        }
        // empty current node and replace with text nodes
        // ** warning: can't appendChild() or else walker
        // ** will keep adding and walking over nodes **
        const parentNode = text.parentElement;
        for (let i = 0; i < textParts.length; i++) {
            parentNode.insertBefore(textParts[i], text);
        }
        // remove current text node from parent
        parentNode.removeChild(text);
    }
    /**
     * Renders a new attribute value by
     * rebuilding the raw string and replacing
     * each dynamic part with their current values
     * @param dynamicValue a dynamic attribute value
     */
    renderAttribute(dynamicValue) {
        let newAttributeValue = dynamicValue.template.raw;
        for (let j = 0; j < dynamicValue.template.values.length; j++) {
            newAttributeValue = newAttributeValue.replace(dynamicMarker, dynamicValue.template.values[j].currentValue);
        }
        dynamicValue.container.textContent = newAttributeValue;
    }
    /**
     * Renders a new text value.
     * @param dynamicValue a dynamic text node
     */
    renderText(dynamicValue) {
        dynamicValue.container.textContent = dynamicValue.currentValue;
    }
}

const containerCache = new WeakMap();
/**
 * Renders a zen template into a container DOM element.
 * @param zenTemplate A zen template to render into the DOM
 * @param container The DOM element to render into
 */
const render = function (zenTemplate, container) {
    // check if zen template has been rendered and cached
    let zenRender = containerCache.get(container);
    if (!zenRender) {
        // create zen render, cache, and insert
        const dynamicNode = zenTemplate.clone();
        zenRender = new ZenNode(dynamicNode);
        containerCache.set(container, zenRender);
        container.appendChild(dynamicNode);
    }
    zenRender.render(zenTemplate.values);
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

export { ZenElement, ZenNode, dynamicMarker, ZenTemplate, zenTemplateCache, zen, containerCache, render };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemVuLWh0bWwuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy96ZW4tdGVtcGxhdGUudHMiLCIuLi9zcmMvemVuLW5vZGUudHMiLCIuLi9zcmMvcmVuZGVyLnRzIiwiLi4vc3JjL3plbi1lbGVtZW50LnRzIiwiLi4vc3JjL3plbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgZHluYW1pY01hcmtlciA9ICfinY0nO1xyXG5leHBvcnQgY2xhc3MgWmVuVGVtcGxhdGUge1xyXG4gICAgaHRtbDogc3RyaW5nID0gJyc7XHJcbiAgICBzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheTtcclxuICAgIHZhbHVlczogYW55W107XHJcbiAgICBjb25zdHJ1Y3RvcihzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSwgdmFsdWVzOiBhbnlbXSkge1xyXG4gICAgICAgIHRoaXMuc3RyaW5ncyA9IHN0cmluZ3M7XHJcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB2YWx1ZXM7XHJcbiAgICAgICAgdGhpcy5wYXJzZSh0aGlzLnN0cmluZ3MpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUGFyc2VzIHRoZSB0ZW1wbGF0ZSBzdHJpbmdzIGFuZCByZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uXHJcbiAgICAgKiBvZiBhbiBlbGVtZW50IHdpdGggdmFsdWUgcG9zaXRpb25zIHJlcGxhY2VkIGJ5IG1hcmtlcnMuXHJcbiAgICAgKiBAcGFyYW0gc3RyaW5nc1xyXG4gICAgICovXHJcbiAgICBwYXJzZSAoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXkpIHtcclxuICAgICAgICBzdHJpbmdzLmZvckVhY2goKGVsZW1lbnQsIGkpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5odG1sICs9IGVsZW1lbnQgKyAoaSA8IHN0cmluZ3MubGVuZ3RoIC0gMSA/IGR5bmFtaWNNYXJrZXIgOiAnJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGFuZCByZXR1cm5zIGFuIEhUTUwgVGVtcGxhdGUgZWxlbWVudCBmcm9tIHRoZVxyXG4gICAgICogcmF3IHN0cmluZy5cclxuICAgICAqL1xyXG4gICAgZ2V0VGVtcGxhdGUgKCk6IEhUTUxUZW1wbGF0ZUVsZW1lbnQge1xyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcclxuICAgICAgICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSB0aGlzLmh0bWw7XHJcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2xvbmVzIGFuIGVsZW1lbnQgdXNpbmcgdGhpcyB0ZW1wbGF0ZS5cclxuICAgICAqL1xyXG4gICAgY2xvbmUoKTogSFRNTEVsZW1lbnQge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldFRlbXBsYXRlKCkuY29udGVudC5jbG9uZU5vZGUodHJ1ZSkgYXMgSFRNTEVsZW1lbnQ7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBkeW5hbWljTWFya2VyIH0gZnJvbSAnLi96ZW4tdGVtcGxhdGUnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFplbk5vZGUge1xyXG4gICAgY2hpbGRyZW46IGFueVtdID0gW107XHJcbiAgICBjb25zdHJ1Y3RvciAobm9kZTogTm9kZSkge1xyXG4gICAgICAgIHRoaXMucGFyc2Uobm9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyICh2YWx1ZXM6IGFueVtdKSB7XHJcbiAgICAgICAgLy8gdmFsdWVzIHNob3VsZCBhbHdheXMgZXF1YWwgYW5kIGJlIGluIHRoZSBzYW1lXHJcbiAgICAgICAgLy8gb3JkZXIgYXMgdGhpcyBub2RlJ3MgY2hpbGRyZW5cclxuICAgICAgICBsZXQgZHluYW1pY1ZhbHVlO1xyXG4gICAgICAgIGxldCB2YWx1ZTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAvLyB1cGRhdGUgZHluYW1pYyB2YWx1ZSBhbmQgcmVuZGVyXHJcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWVzW2ldO1xyXG4gICAgICAgICAgICBkeW5hbWljVmFsdWUgPSB0aGlzLmNoaWxkcmVuW2ldO1xyXG4gICAgICAgICAgICBkeW5hbWljVmFsdWUub2xkVmFsdWUgPSBkeW5hbWljVmFsdWUuY3VycmVudFZhbHVlO1xyXG4gICAgICAgICAgICBkeW5hbWljVmFsdWUuY3VycmVudFZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoZHluYW1pY1ZhbHVlLnR5cGUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2F0dHJpYnV0ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgLyoqIFRPRE9cclxuICAgICAgICAgICAgICAgICAgICAgKiAgQXR0cmlidXRlcyBzaG91bGQgb25seSByZW5kZXIgb25jZSwgZXZlbiBpZiBpdFxyXG4gICAgICAgICAgICAgICAgICAgICAqICBjb250YWlucyBtdWx0aXBsZSBkeW5hbWljIHZhbHVlcy4gQ3VycmVudGx5IHRoaXNcclxuICAgICAgICAgICAgICAgICAgICAgKiAgd2lsbCByZW5kZXIgZm9yIGVhY2ggZHluYW1pYyB2YWx1ZS5cclxuICAgICAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckF0dHJpYnV0ZShkeW5hbWljVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndGV4dCc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJUZXh0KGR5bmFtaWNWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcGFyc2UgKG5vZGU6IE5vZGUpIHtcclxuICAgICAgICAvLyB3YWxrIG92ZXIgdGhlIGVsZW1lbnQgYW5kIHNhdmUgYWxsIGR5bmFtaWMgbWFya2VyIG5vZGVzXHJcbiAgICAgICAgY29uc3QgdHJlZVdhbGtlciA9IGRvY3VtZW50LmNyZWF0ZVRyZWVXYWxrZXIobm9kZSwgNSAvKiogb25seSBlbGVtZW50cyBhbmQgdGV4dCAqLyk7XHJcbiAgICAgICAgd2hpbGUodHJlZVdhbGtlci5uZXh0Tm9kZSgpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnROb2RlID0gdHJlZVdhbGtlci5jdXJyZW50Tm9kZTtcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnROb2RlIGluc3RhbmNlb2YgRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgZWxlbWVudCwgdHJhdmVyc2UgYXR0cmlidXRlc1xyXG4gICAgICAgICAgICAgICAgbGV0IGN1cnJlbnRBdHRyaWJ1dGU7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGN1cnJlbnROb2RlLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50QXR0cmlidXRlID0gY3VycmVudE5vZGUuYXR0cmlidXRlc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudEF0dHJpYnV0ZS50ZXh0Q29udGVudC5pbmRleE9mKGR5bmFtaWNNYXJrZXIpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJzZUF0dHJpYnV0ZShjdXJyZW50QXR0cmlidXRlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudE5vZGUudGV4dENvbnRlbnQuaW5kZXhPZihkeW5hbWljTWFya2VyKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiBpdCdzIG5vdCBhbiBlbGVtZW50LCBtdXN0IGJlIGluIGEgdGV4dCBwb3NpdGlvblxyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJzZVRleHQoY3VycmVudE5vZGUgYXMgVGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwYXJzZUF0dHJpYnV0ZShjdXJyZW50QXR0cmlidXRlOiBBdHRyKSB7XHJcbiAgICAgICAgLyoqIEF0dHJpYnV0ZXMgY2FuIGNvbnRhaW4gbW9yZSB0aGFuIG9uZSBkeW5hbWljIHZhbHVlXHJcbiAgICAgICAgICogIGFuZCBjYW5ub3QgYmUgdXBkYXRlZCBpbmRpdmlkdWFsbHksIHNvIHdlXHJcbiAgICAgICAgICogIGhhdmUgdG8gc2F2ZSB0aGUgb3JpZ2luYWwgYXR0cmlidXRlIHN0cmluZ1xyXG4gICAgICAgICAqICBhbmQgYnVpbGQgdGhlIGVudGlyZSBzdHJpbmcgZnJvbSBhbGwgZHluYW1pY1xyXG4gICAgICAgICAqICB2YWx1ZXMgY29udGFpbmVkIHdpdGhpbiBpdCB3aGVuIGEgc2luZ2xlXHJcbiAgICAgICAgICogIHZhbHVlIGNoYW5nZXMuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgY29uc3QgdGV4dENvbnRlbnQgPSBjdXJyZW50QXR0cmlidXRlLnRleHRDb250ZW50O1xyXG4gICAgICAgIGNvbnN0IG1hdGNoZXMgPSB0ZXh0Q29udGVudC5tYXRjaChuZXcgUmVnRXhwKGR5bmFtaWNNYXJrZXIsICdnJykpO1xyXG4gICAgICAgIGNvbnN0IGR5bmFtaWNWYWx1ZXNDb3VudCA9IG1hdGNoZXMgPyBtYXRjaGVzLmxlbmd0aCA6IDA7XHJcbiAgICAgICAgY29uc3QgZHluYW1pY0F0dHJpYnV0ZVZhbHVlcyA9IFtdO1xyXG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZVRlbXBsYXRlID0ge1xyXG4gICAgICAgICAgICByYXc6IGN1cnJlbnRBdHRyaWJ1dGUudGV4dENvbnRlbnQsXHJcbiAgICAgICAgICAgIHZhbHVlczogZHluYW1pY0F0dHJpYnV0ZVZhbHVlc1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkeW5hbWljVmFsdWVzQ291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBkeW5hbWljVmFsdWUgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnYXR0cmlidXRlJyxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBpLFxyXG4gICAgICAgICAgICAgICAgY29udGFpbmVyOiBjdXJyZW50QXR0cmlidXRlLFxyXG4gICAgICAgICAgICAgICAgY3VycmVudFZhbHVlOiBkeW5hbWljTWFya2VyLFxyXG4gICAgICAgICAgICAgICAgb2xkVmFsdWU6IG51bGwsXHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogYXR0cmlidXRlVGVtcGxhdGVcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgZHluYW1pY0F0dHJpYnV0ZVZhbHVlcy5wdXNoKGR5bmFtaWNWYWx1ZSk7IC8vIHB1c2ggaW50byBhdHRyaWJ1dGUgdGVtcGxhdGVcclxuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKGR5bmFtaWNWYWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcGFyc2VUZXh0KHRleHQ6IFRleHQpIHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBXZSBjYW4gYnJlYWsgdGhlIHRleHRDb250ZW50IHN0cmluZyBpbnRvIG11bHRpcGxlXHJcbiAgICAgICAgICogVGV4dE5vZGVzLCBzbyB0aGF0IGVhY2ggZHluYW1pYyBwYXJ0IGlzIGlzb2xhdGVkIGFuZFxyXG4gICAgICAgICAqIGNhbiB1cGRhdGUgYnkgaXRzZWxmLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNvbnN0IHZhbHVlTWFya2VySW5kaWNlcyA9IFtdO1xyXG4gICAgICAgIGNvbnN0IHRleHRQYXJ0cyA9IFtdO1xyXG4gICAgICAgIGxldCB0ZXh0Q29udGVudCA9IHRleHQudGV4dENvbnRlbnQ7XHJcbiAgICAgICAgd2hpbGUgKHRleHRDb250ZW50ICE9PSAnJykge1xyXG4gICAgICAgICAgICBsZXQgcGFydDtcclxuICAgICAgICAgICAgY29uc3QgdmFsdWVJbmRleCA9IHRleHRDb250ZW50LmluZGV4T2YoZHluYW1pY01hcmtlcik7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZUluZGV4ICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAvLyB0ZXh0IGNvbnRlbnQgYmVmb3JlIHZhbHVlIG1hcmtlclxyXG4gICAgICAgICAgICAgICAgcGFydCA9IHRleHRDb250ZW50LnN1YnN0cmluZygwLCB2YWx1ZUluZGV4KTtcclxuICAgICAgICAgICAgICAgIHRleHRDb250ZW50ID0gdGV4dENvbnRlbnQuc3Vic3RyaW5nKHZhbHVlSW5kZXgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gdmFsdWUgbWFya2VyXHJcbiAgICAgICAgICAgICAgICB2YWx1ZU1hcmtlckluZGljZXMucHVzaCh0ZXh0UGFydHMubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIHBhcnQgPSB0ZXh0Q29udGVudC5zdWJzdHJpbmcoMCwgZHluYW1pY01hcmtlci5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgdGV4dENvbnRlbnQgPSB0ZXh0Q29udGVudC5zdWJzdHJpbmcoZHluYW1pY01hcmtlci5sZW5ndGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRleHRQYXJ0cy5wdXNoKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHBhcnQpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHNhdmUgdGhlIGR5bmFtaWMgdGV4dCBwYXJ0c1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVNYXJrZXJJbmRpY2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaCh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgICAgICAgICBjb250YWluZXI6IHRleHRQYXJ0c1t2YWx1ZU1hcmtlckluZGljZXNbaV1dLFxyXG4gICAgICAgICAgICAgICAgY3VycmVudFZhbHVlOiBkeW5hbWljTWFya2VyLFxyXG4gICAgICAgICAgICAgICAgb2xkVmFsdWU6IG51bGxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBlbXB0eSBjdXJyZW50IG5vZGUgYW5kIHJlcGxhY2Ugd2l0aCB0ZXh0IG5vZGVzXHJcbiAgICAgICAgLy8gKiogd2FybmluZzogY2FuJ3QgYXBwZW5kQ2hpbGQoKSBvciBlbHNlIHdhbGtlclxyXG4gICAgICAgIC8vICoqIHdpbGwga2VlcCBhZGRpbmcgYW5kIHdhbGtpbmcgb3ZlciBub2RlcyAqKlxyXG4gICAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSB0ZXh0LnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0UGFydHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgcGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUodGV4dFBhcnRzW2ldLCB0ZXh0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHJlbW92ZSBjdXJyZW50IHRleHQgbm9kZSBmcm9tIHBhcmVudFxyXG4gICAgICAgIHBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGV4dCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW5kZXJzIGEgbmV3IGF0dHJpYnV0ZSB2YWx1ZSBieVxyXG4gICAgICogcmVidWlsZGluZyB0aGUgcmF3IHN0cmluZyBhbmQgcmVwbGFjaW5nXHJcbiAgICAgKiBlYWNoIGR5bmFtaWMgcGFydCB3aXRoIHRoZWlyIGN1cnJlbnQgdmFsdWVzXHJcbiAgICAgKiBAcGFyYW0gZHluYW1pY1ZhbHVlIGEgZHluYW1pYyBhdHRyaWJ1dGUgdmFsdWVcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSByZW5kZXJBdHRyaWJ1dGUoZHluYW1pY1ZhbHVlKSB7XHJcbiAgICAgICAgbGV0IG5ld0F0dHJpYnV0ZVZhbHVlID0gZHluYW1pY1ZhbHVlLnRlbXBsYXRlLnJhdztcclxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGR5bmFtaWNWYWx1ZS50ZW1wbGF0ZS52YWx1ZXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgbmV3QXR0cmlidXRlVmFsdWUgPSBuZXdBdHRyaWJ1dGVWYWx1ZS5yZXBsYWNlKGR5bmFtaWNNYXJrZXIsIGR5bmFtaWNWYWx1ZS50ZW1wbGF0ZS52YWx1ZXNbal0uY3VycmVudFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZHluYW1pY1ZhbHVlLmNvbnRhaW5lci50ZXh0Q29udGVudCA9IG5ld0F0dHJpYnV0ZVZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVuZGVycyBhIG5ldyB0ZXh0IHZhbHVlLlxyXG4gICAgICogQHBhcmFtIGR5bmFtaWNWYWx1ZSBhIGR5bmFtaWMgdGV4dCBub2RlXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgcmVuZGVyVGV4dChkeW5hbWljVmFsdWUpIHtcclxuICAgICAgICBkeW5hbWljVmFsdWUuY29udGFpbmVyLnRleHRDb250ZW50ID0gZHluYW1pY1ZhbHVlLmN1cnJlbnRWYWx1ZTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IFplbk5vZGUgfSBmcm9tICcuL3plbi1ub2RlJztcclxuaW1wb3J0IHsgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcblxyXG5leHBvcnQgY29uc3QgY29udGFpbmVyQ2FjaGUgPSBuZXcgV2Vha01hcDxOb2RlLCBaZW5Ob2RlPigpO1xyXG5cclxuLyoqXHJcbiAqIFJlbmRlcnMgYSB6ZW4gdGVtcGxhdGUgaW50byBhIGNvbnRhaW5lciBET00gZWxlbWVudC5cclxuICogQHBhcmFtIHplblRlbXBsYXRlIEEgemVuIHRlbXBsYXRlIHRvIHJlbmRlciBpbnRvIHRoZSBET01cclxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgRE9NIGVsZW1lbnQgdG8gcmVuZGVyIGludG9cclxuICovXHJcbmV4cG9ydCBjb25zdCByZW5kZXIgPSBmdW5jdGlvbiAoemVuVGVtcGxhdGU6IFplblRlbXBsYXRlLCBjb250YWluZXI6IE5vZGUpIHtcclxuICAgIC8vIGNoZWNrIGlmIHplbiB0ZW1wbGF0ZSBoYXMgYmVlbiByZW5kZXJlZCBhbmQgY2FjaGVkXHJcbiAgICBsZXQgemVuUmVuZGVyID0gY29udGFpbmVyQ2FjaGUuZ2V0KGNvbnRhaW5lcik7XHJcbiAgICBpZiAoIXplblJlbmRlcikge1xyXG4gICAgICAgIC8vIGNyZWF0ZSB6ZW4gcmVuZGVyLCBjYWNoZSwgYW5kIGluc2VydFxyXG4gICAgICAgIGNvbnN0IGR5bmFtaWNOb2RlID0gemVuVGVtcGxhdGUuY2xvbmUoKTtcclxuICAgICAgICB6ZW5SZW5kZXIgPSBuZXcgWmVuTm9kZShkeW5hbWljTm9kZSk7XHJcbiAgICAgICAgY29udGFpbmVyQ2FjaGUuc2V0KGNvbnRhaW5lciwgemVuUmVuZGVyKTtcclxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZHluYW1pY05vZGUpO1xyXG4gICAgfVxyXG4gICAgemVuUmVuZGVyLnJlbmRlcih6ZW5UZW1wbGF0ZS52YWx1ZXMpO1xyXG59IiwiaW1wb3J0IHsgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcbmltcG9ydCB7IHJlbmRlciB9IGZyb20gJy4vcmVuZGVyJztcclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBaZW5FbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6ICdvcGVuJyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25uZWN0ZWRDYWxsYmFjayAoKSB7XHJcbiAgICAgICAgcmVuZGVyKHRoaXMucmVuZGVyKCksIHRoaXMuc2hhZG93Um9vdCk7XHJcbiAgICB9XHJcblxyXG4gICAgYWJzdHJhY3QgcmVuZGVyKHZhbHVlcz86IGFueVtdKTogWmVuVGVtcGxhdGU7XHJcbn0iLCJpbXBvcnQgeyBaZW5UZW1wbGF0ZSB9IGZyb20gJy4vemVuLXRlbXBsYXRlJztcclxuXHJcbmV4cG9ydCBjb25zdCB6ZW5UZW1wbGF0ZUNhY2hlID0gbmV3IFdlYWtNYXA8VGVtcGxhdGVTdHJpbmdzQXJyYXksIFplblRlbXBsYXRlPigpO1xyXG5leHBvcnQgY29uc3QgemVuID0gZnVuY3Rpb24gKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5LCAuLi52YWx1ZXM6IGFueVtdKSB7XHJcbiAgICAvLyBjaGVjayBpZiB0aGlzIHRlbXBsYXRlIHN0cmluZyBhcnJheSBoYXMgYmVlbiBjYWNoZWRcclxuICAgIGxldCB6ZW5UZW1wbGF0ZSA9IHplblRlbXBsYXRlQ2FjaGUuZ2V0KHN0cmluZ3MpO1xyXG4gICAgaWYgKCF6ZW5UZW1wbGF0ZSkge1xyXG4gICAgICAgIC8vIGNyZWF0ZSBhbmQgY2FjaGUgdGVtcGxhdGVcclxuICAgICAgICB6ZW5UZW1wbGF0ZSA9IG5ldyBaZW5UZW1wbGF0ZShzdHJpbmdzLCB2YWx1ZXMpO1xyXG4gICAgICAgIHplblRlbXBsYXRlQ2FjaGUuc2V0KHN0cmluZ3MsIHplblRlbXBsYXRlKTtcclxuICAgIH1cclxuICAgIHJldHVybiB6ZW5UZW1wbGF0ZTtcclxufVxyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ik1BQWEsYUFBYSxHQUFHLEdBQUcsQ0FBQztBQUNqQyxNQUFhLFdBQVc7SUFJcEIsWUFBWSxPQUE2QixFQUFFLE1BQWE7UUFIeEQsU0FBSSxHQUFXLEVBQUUsQ0FBQztRQUlkLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9B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
