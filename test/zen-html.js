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
//# sourceMappingURL=zen-node.js.map

/**
 * Cache previously rendered into containers.
 */
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
//# sourceMappingURL=zen-element.js.map

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

//# sourceMappingURL=zen-html.js.map

export { ZenElement, ZenNode, dynamicMarker, ZenTemplate, zenTemplateCache, zen, containerCache, render };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemVuLWh0bWwuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy96ZW4tdGVtcGxhdGUudHMiLCIuLi9zcmMvemVuLW5vZGUudHMiLCIuLi9zcmMvcmVuZGVyLnRzIiwiLi4vc3JjL3plbi1lbGVtZW50LnRzIiwiLi4vc3JjL3plbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgZHluYW1pY01hcmtlciA9ICfinY0nO1xyXG5leHBvcnQgY2xhc3MgWmVuVGVtcGxhdGUge1xyXG4gICAgaHRtbDogc3RyaW5nID0gJyc7XHJcbiAgICBzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheTtcclxuICAgIHZhbHVlczogYW55W107XHJcbiAgICBjb25zdHJ1Y3RvcihzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSwgdmFsdWVzOiBhbnlbXSkge1xyXG4gICAgICAgIHRoaXMuc3RyaW5ncyA9IHN0cmluZ3M7XHJcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB2YWx1ZXM7XHJcbiAgICAgICAgdGhpcy5wYXJzZSh0aGlzLnN0cmluZ3MpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUGFyc2VzIHRoZSB0ZW1wbGF0ZSBzdHJpbmdzIGFuZCByZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uXHJcbiAgICAgKiBvZiBhbiBlbGVtZW50IHdpdGggdmFsdWUgcG9zaXRpb25zIHJlcGxhY2VkIGJ5IG1hcmtlcnMuXHJcbiAgICAgKiBAcGFyYW0gc3RyaW5nc1xyXG4gICAgICovXHJcbiAgICBwYXJzZSAoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXkpIHtcclxuICAgICAgICBzdHJpbmdzLmZvckVhY2goKGVsZW1lbnQsIGkpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5odG1sICs9IGVsZW1lbnQgKyAoaSA8IHN0cmluZ3MubGVuZ3RoIC0gMSA/IGR5bmFtaWNNYXJrZXIgOiAnJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGFuZCByZXR1cm5zIGFuIEhUTUwgVGVtcGxhdGUgZWxlbWVudCBmcm9tIHRoZVxyXG4gICAgICogcmF3IHN0cmluZy5cclxuICAgICAqL1xyXG4gICAgZ2V0VGVtcGxhdGUgKCk6IEhUTUxUZW1wbGF0ZUVsZW1lbnQge1xyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcclxuICAgICAgICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSB0aGlzLmh0bWw7XHJcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2xvbmVzIGFuIGVsZW1lbnQgdXNpbmcgdGhpcyB0ZW1wbGF0ZS5cclxuICAgICAqL1xyXG4gICAgY2xvbmUoKTogTm9kZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VGVtcGxhdGUoKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IGR5bmFtaWNNYXJrZXIgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcblxyXG5leHBvcnQgY2xhc3MgWmVuTm9kZSB7XHJcbiAgICBjaGlsZHJlbjogYW55W10gPSBbXTtcclxuICAgIGNvbnN0cnVjdG9yIChub2RlOiBOb2RlKSB7XHJcbiAgICAgICAgdGhpcy5wYXJzZShub2RlKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIgKHZhbHVlczogYW55W10pIHtcclxuICAgICAgICAvLyB2YWx1ZXMgc2hvdWxkIGFsd2F5cyBlcXVhbCBhbmQgYmUgaW4gdGhlIHNhbWVcclxuICAgICAgICAvLyBvcmRlciBhcyB0aGlzIG5vZGUncyBjaGlsZHJlblxyXG4gICAgICAgIGxldCBkeW5hbWljVmFsdWU7XHJcbiAgICAgICAgbGV0IHZhbHVlO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBkeW5hbWljIHZhbHVlIGFuZCByZW5kZXJcclxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZXNbaV07XHJcbiAgICAgICAgICAgIGR5bmFtaWNWYWx1ZSA9IHRoaXMuY2hpbGRyZW5baV07XHJcbiAgICAgICAgICAgIGR5bmFtaWNWYWx1ZS5vbGRWYWx1ZSA9IGR5bmFtaWNWYWx1ZS5jdXJyZW50VmFsdWU7XHJcbiAgICAgICAgICAgIGR5bmFtaWNWYWx1ZS5jdXJyZW50VmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgc3dpdGNoIChkeW5hbWljVmFsdWUudHlwZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYXR0cmlidXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAvKiogVE9ET1xyXG4gICAgICAgICAgICAgICAgICAgICAqICBBdHRyaWJ1dGVzIHNob3VsZCBvbmx5IHJlbmRlciBvbmNlLCBldmVuIGlmIGl0XHJcbiAgICAgICAgICAgICAgICAgICAgICogIGNvbnRhaW5zIG11bHRpcGxlIGR5bmFtaWMgdmFsdWVzLiBDdXJyZW50bHkgdGhpc1xyXG4gICAgICAgICAgICAgICAgICAgICAqICB3aWxsIHJlbmRlciBmb3IgZWFjaCBkeW5hbWljIHZhbHVlLlxyXG4gICAgICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyQXR0cmlidXRlKGR5bmFtaWNWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd0ZXh0JzpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlclRleHQoZHluYW1pY1ZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwYXJzZSAobm9kZTogTm9kZSkge1xyXG4gICAgICAgIC8vIHdhbGsgb3ZlciB0aGUgZWxlbWVudCBhbmQgc2F2ZSBhbGwgZHluYW1pYyBtYXJrZXIgbm9kZXNcclxuICAgICAgICBjb25zdCB0cmVlV2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihub2RlLCA1IC8qKiBvbmx5IGVsZW1lbnRzIGFuZCB0ZXh0ICovKTtcclxuICAgICAgICB3aGlsZSh0cmVlV2Fsa2VyLm5leHROb2RlKCkpIHtcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudE5vZGUgPSB0cmVlV2Fsa2VyLmN1cnJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAoY3VycmVudE5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiBlbGVtZW50LCB0cmF2ZXJzZSBhdHRyaWJ1dGVzXHJcbiAgICAgICAgICAgICAgICBsZXQgY3VycmVudEF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY3VycmVudE5vZGUuYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRBdHRyaWJ1dGUgPSBjdXJyZW50Tm9kZS5hdHRyaWJ1dGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50QXR0cmlidXRlLnRleHRDb250ZW50LmluZGV4T2YoZHluYW1pY01hcmtlcikgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcnNlQXR0cmlidXRlKGN1cnJlbnRBdHRyaWJ1dGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50Tm9kZS50ZXh0Q29udGVudC5pbmRleE9mKGR5bmFtaWNNYXJrZXIpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIGl0J3Mgbm90IGFuIGVsZW1lbnQsIG11c3QgYmUgaW4gYSB0ZXh0IHBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhcnNlVGV4dChjdXJyZW50Tm9kZSBhcyBUZXh0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHBhcnNlQXR0cmlidXRlKGN1cnJlbnRBdHRyaWJ1dGU6IEF0dHIpIHtcclxuICAgICAgICAvKiogQXR0cmlidXRlcyBjYW4gY29udGFpbiBtb3JlIHRoYW4gb25lIGR5bmFtaWMgdmFsdWVcclxuICAgICAgICAgKiAgYW5kIGNhbm5vdCBiZSB1cGRhdGVkIGluZGl2aWR1YWxseSwgc28gd2VcclxuICAgICAgICAgKiAgaGF2ZSB0byBzYXZlIHRoZSBvcmlnaW5hbCBhdHRyaWJ1dGUgc3RyaW5nXHJcbiAgICAgICAgICogIGFuZCBidWlsZCB0aGUgZW50aXJlIHN0cmluZyBmcm9tIGFsbCBkeW5hbWljXHJcbiAgICAgICAgICogIHZhbHVlcyBjb250YWluZWQgd2l0aGluIGl0IHdoZW4gYSBzaW5nbGVcclxuICAgICAgICAgKiAgdmFsdWUgY2hhbmdlcy5cclxuICAgICAgICAgKi9cclxuICAgICAgICBjb25zdCB0ZXh0Q29udGVudCA9IGN1cnJlbnRBdHRyaWJ1dGUudGV4dENvbnRlbnQ7XHJcbiAgICAgICAgY29uc3QgbWF0Y2hlcyA9IHRleHRDb250ZW50Lm1hdGNoKG5ldyBSZWdFeHAoZHluYW1pY01hcmtlciwgJ2cnKSk7XHJcbiAgICAgICAgY29uc3QgZHluYW1pY1ZhbHVlc0NvdW50ID0gbWF0Y2hlcyA/IG1hdGNoZXMubGVuZ3RoIDogMDtcclxuICAgICAgICBjb25zdCBkeW5hbWljQXR0cmlidXRlVmFsdWVzID0gW107XHJcbiAgICAgICAgY29uc3QgYXR0cmlidXRlVGVtcGxhdGUgPSB7XHJcbiAgICAgICAgICAgIHJhdzogY3VycmVudEF0dHJpYnV0ZS50ZXh0Q29udGVudCxcclxuICAgICAgICAgICAgdmFsdWVzOiBkeW5hbWljQXR0cmlidXRlVmFsdWVzXHJcbiAgICAgICAgfTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGR5bmFtaWNWYWx1ZXNDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGR5bmFtaWNWYWx1ZSA9IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IGksXHJcbiAgICAgICAgICAgICAgICBjb250YWluZXI6IGN1cnJlbnRBdHRyaWJ1dGUsXHJcbiAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IGR5bmFtaWNNYXJrZXIsXHJcbiAgICAgICAgICAgICAgICBvbGRWYWx1ZTogbnVsbCxcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBhdHRyaWJ1dGVUZW1wbGF0ZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBkeW5hbWljQXR0cmlidXRlVmFsdWVzLnB1c2goZHluYW1pY1ZhbHVlKTsgLy8gcHVzaCBpbnRvIGF0dHJpYnV0ZSB0ZW1wbGF0ZVxyXG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goZHluYW1pY1ZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwYXJzZVRleHQodGV4dDogVGV4dCkge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFdlIGNhbiBicmVhayB0aGUgdGV4dENvbnRlbnQgc3RyaW5nIGludG8gbXVsdGlwbGVcclxuICAgICAgICAgKiBUZXh0Tm9kZXMsIHNvIHRoYXQgZWFjaCBkeW5hbWljIHBhcnQgaXMgaXNvbGF0ZWQgYW5kXHJcbiAgICAgICAgICogY2FuIHVwZGF0ZSBieSBpdHNlbGYuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgY29uc3QgdmFsdWVNYXJrZXJJbmRpY2VzID0gW107XHJcbiAgICAgICAgY29uc3QgdGV4dFBhcnRzID0gW107XHJcbiAgICAgICAgbGV0IHRleHRDb250ZW50ID0gdGV4dC50ZXh0Q29udGVudDtcclxuICAgICAgICB3aGlsZSAodGV4dENvbnRlbnQgIT09ICcnKSB7XHJcbiAgICAgICAgICAgIGxldCBwYXJ0O1xyXG4gICAgICAgICAgICBjb25zdCB2YWx1ZUluZGV4ID0gdGV4dENvbnRlbnQuaW5kZXhPZihkeW5hbWljTWFya2VyKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlSW5kZXggIT09IDApIHtcclxuICAgICAgICAgICAgICAgIC8vIHRleHQgY29udGVudCBiZWZvcmUgdmFsdWUgbWFya2VyXHJcbiAgICAgICAgICAgICAgICBwYXJ0ID0gdGV4dENvbnRlbnQuc3Vic3RyaW5nKDAsIHZhbHVlSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgdGV4dENvbnRlbnQgPSB0ZXh0Q29udGVudC5zdWJzdHJpbmcodmFsdWVJbmRleCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyB2YWx1ZSBtYXJrZXJcclxuICAgICAgICAgICAgICAgIHZhbHVlTWFya2VySW5kaWNlcy5wdXNoKHRleHRQYXJ0cy5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgcGFydCA9IHRleHRDb250ZW50LnN1YnN0cmluZygwLCBkeW5hbWljTWFya2VyLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0Q29udGVudCA9IHRleHRDb250ZW50LnN1YnN0cmluZyhkeW5hbWljTWFya2VyLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGV4dFBhcnRzLnB1c2goZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUocGFydCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gc2F2ZSB0aGUgZHluYW1pYyB0ZXh0IHBhcnRzXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZU1hcmtlckluZGljZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogdGV4dFBhcnRzW3ZhbHVlTWFya2VySW5kaWNlc1tpXV0sXHJcbiAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IGR5bmFtaWNNYXJrZXIsXHJcbiAgICAgICAgICAgICAgICBvbGRWYWx1ZTogbnVsbFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGVtcHR5IGN1cnJlbnQgbm9kZSBhbmQgcmVwbGFjZSB3aXRoIHRleHQgbm9kZXNcclxuICAgICAgICAvLyAqKiB3YXJuaW5nOiBjYW4ndCBhcHBlbmRDaGlsZCgpIG9yIGVsc2Ugd2Fsa2VyXHJcbiAgICAgICAgLy8gKiogd2lsbCBrZWVwIGFkZGluZyBhbmQgd2Fsa2luZyBvdmVyIG5vZGVzICoqXHJcbiAgICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IHRleHQucGFyZW50RWxlbWVudDtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRQYXJ0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBwYXJlbnROb2RlLmluc2VydEJlZm9yZSh0ZXh0UGFydHNbaV0sIHRleHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gcmVtb3ZlIGN1cnJlbnQgdGV4dCBub2RlIGZyb20gcGFyZW50XHJcbiAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbmRlcnMgYSBuZXcgYXR0cmlidXRlIHZhbHVlIGJ5XHJcbiAgICAgKiByZWJ1aWxkaW5nIHRoZSByYXcgc3RyaW5nIGFuZCByZXBsYWNpbmdcclxuICAgICAqIGVhY2ggZHluYW1pYyBwYXJ0IHdpdGggdGhlaXIgY3VycmVudCB2YWx1ZXNcclxuICAgICAqIEBwYXJhbSBkeW5hbWljVmFsdWUgYSBkeW5hbWljIGF0dHJpYnV0ZSB2YWx1ZVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHJlbmRlckF0dHJpYnV0ZShkeW5hbWljVmFsdWUpIHtcclxuICAgICAgICBsZXQgbmV3QXR0cmlidXRlVmFsdWUgPSBkeW5hbWljVmFsdWUudGVtcGxhdGUucmF3O1xyXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZHluYW1pY1ZhbHVlLnRlbXBsYXRlLnZhbHVlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBuZXdBdHRyaWJ1dGVWYWx1ZSA9IG5ld0F0dHJpYnV0ZVZhbHVlLnJlcGxhY2UoZHluYW1pY01hcmtlciwgZHluYW1pY1ZhbHVlLnRlbXBsYXRlLnZhbHVlc1tqXS5jdXJyZW50VmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkeW5hbWljVmFsdWUuY29udGFpbmVyLnRleHRDb250ZW50ID0gbmV3QXR0cmlidXRlVmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW5kZXJzIGEgbmV3IHRleHQgdmFsdWUuXHJcbiAgICAgKiBAcGFyYW0gZHluYW1pY1ZhbHVlIGEgZHluYW1pYyB0ZXh0IG5vZGVcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSByZW5kZXJUZXh0KGR5bmFtaWNWYWx1ZSkge1xyXG4gICAgICAgIGR5bmFtaWNWYWx1ZS5jb250YWluZXIudGV4dENvbnRlbnQgPSBkeW5hbWljVmFsdWUuY3VycmVudFZhbHVlO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgWmVuTm9kZSB9IGZyb20gJy4vemVuLW5vZGUnO1xyXG5pbXBvcnQgeyBaZW5UZW1wbGF0ZSB9IGZyb20gJy4vemVuLXRlbXBsYXRlJztcclxuXHJcbi8qKlxyXG4gKiBDYWNoZSBwcmV2aW91c2x5IHJlbmRlcmVkIGludG8gY29udGFpbmVycy5cclxuICovXHJcbmV4cG9ydCBjb25zdCBjb250YWluZXJDYWNoZSA9IG5ldyBXZWFrTWFwPE5vZGUsIFplbk5vZGU+KCk7XHJcblxyXG4vKipcclxuICogUmVuZGVycyBhIHplbiB0ZW1wbGF0ZSBpbnRvIGEgY29udGFpbmVyIERPTSBlbGVtZW50LlxyXG4gKiBAcGFyYW0gemVuVGVtcGxhdGUgQSB6ZW4gdGVtcGxhdGUgdG8gcmVuZGVyIGludG8gdGhlIERPTVxyXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBET00gZWxlbWVudCB0byByZW5kZXIgaW50b1xyXG4gKi9cclxuZXhwb3J0IGNvbnN0IHJlbmRlciA9IGZ1bmN0aW9uICh6ZW5UZW1wbGF0ZTogWmVuVGVtcGxhdGUsIGNvbnRhaW5lcjogTm9kZSkge1xyXG4gICAgLy8gY2hlY2sgaWYgemVuIHRlbXBsYXRlIGhhcyBiZWVuIHJlbmRlcmVkIGFuZCBjYWNoZWRcclxuICAgIGxldCB6ZW5SZW5kZXIgPSBjb250YWluZXJDYWNoZS5nZXQoY29udGFpbmVyKTtcclxuICAgIGlmICghemVuUmVuZGVyKSB7XHJcbiAgICAgICAgLy8gY3JlYXRlIHplbiByZW5kZXIsIGNhY2hlLCBhbmQgaW5zZXJ0XHJcbiAgICAgICAgY29uc3QgZHluYW1pY05vZGUgPSB6ZW5UZW1wbGF0ZS5jbG9uZSgpO1xyXG4gICAgICAgIHplblJlbmRlciA9IG5ldyBaZW5Ob2RlKGR5bmFtaWNOb2RlKTtcclxuICAgICAgICBjb250YWluZXJDYWNoZS5zZXQoY29udGFpbmVyLCB6ZW5SZW5kZXIpO1xyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChkeW5hbWljTm9kZSk7XHJcbiAgICB9XHJcbiAgICB6ZW5SZW5kZXIucmVuZGVyKHplblRlbXBsYXRlLnZhbHVlcyk7XHJcbn0iLCJpbXBvcnQgeyBaZW5UZW1wbGF0ZSB9IGZyb20gJy4vemVuLXRlbXBsYXRlJztcclxuaW1wb3J0IHsgcmVuZGVyIH0gZnJvbSAnLi9yZW5kZXInO1xyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFplbkVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbm5lY3RlZENhbGxiYWNrICgpIHtcclxuICAgICAgICByZW5kZXIodGhpcy5yZW5kZXIoKSwgdGhpcy5zaGFkb3dSb290KTtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCByZW5kZXIodmFsdWVzPzogYW55W10pOiBaZW5UZW1wbGF0ZTtcclxufSIsImltcG9ydCB7IFplblRlbXBsYXRlIH0gZnJvbSAnLi96ZW4tdGVtcGxhdGUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IHplblRlbXBsYXRlQ2FjaGUgPSBuZXcgV2Vha01hcDxUZW1wbGF0ZVN0cmluZ3NBcnJheSwgWmVuVGVtcGxhdGU+KCk7XHJcbmV4cG9ydCBjb25zdCB6ZW4gPSBmdW5jdGlvbiAoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIC4uLnZhbHVlczogYW55W10pIHtcclxuICAgIC8vIGNoZWNrIGlmIHRoaXMgdGVtcGxhdGUgc3RyaW5nIGFycmF5IGhhcyBiZWVuIGNhY2hlZFxyXG4gICAgbGV0IHplblRlbXBsYXRlID0gemVuVGVtcGxhdGVDYWNoZS5nZXQoc3RyaW5ncyk7XHJcbiAgICBpZiAoIXplblRlbXBsYXRlKSB7XHJcbiAgICAgICAgLy8gY3JlYXRlIGFuZCBjYWNoZSB0ZW1wbGF0ZVxyXG4gICAgICAgIHplblRlbXBsYXRlID0gbmV3IFplblRlbXBsYXRlKHN0cmluZ3MsIHZhbHVlcyk7XHJcbiAgICAgICAgemVuVGVtcGxhdGVDYWNoZS5zZXQoc3RyaW5ncywgemVuVGVtcGxhdGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHplblRlbXBsYXRlO1xyXG59XHJcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiTUFBYSxhQUFhLEdBQUcsR0FBRyxDQUFDO0FBQ2pDLE1BQWEsV0FBVztJQUlwQixZQUFZLE9BQTZCLEVBQUUsTUFBYTtRQUh4RCxTQUFJLEdBQVcsRUFBRSxDQUFDO1FBSWQsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENB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
