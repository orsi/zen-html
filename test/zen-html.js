const dynamicMarker = '❍';
class ZenTemplate {
    constructor(strings, values) {
        this.strings = strings;
        this.values = values;
        this.html = this.parse(this.strings);
    }
    /** Parses the template strings and returns a string representation
     * of an element with values replaced by markers.
     */
    parse(strings) {
        let html = '';
        strings.forEach((element, index) => {
            html += element + (index < strings.length - 1 ? dynamicMarker : '');
        });
        return html;
    }
    getTemplate() {
        const template = document.createElement('template');
        template.innerHTML = this.html;
        return template;
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
//# sourceMappingURL=zen-node.js.map

const containerCache = new WeakMap();
const render = function (zenTemplate, container) {
    // check if zen template has been rendered and cached
    let zenRender = containerCache.get(container);
    if (!zenRender) {
        // create zen render, cache, and insert
        const dynamicNode = zenTemplate.getTemplate().content.cloneNode(true);
        zenRender = new ZenNode(dynamicNode);
        containerCache.set(container, zenRender);
        container.appendChild(dynamicNode);
    }
    zenRender.render(zenTemplate.values);
};
//# sourceMappingURL=render.js.map

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemVuLWh0bWwuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy96ZW4tdGVtcGxhdGUudHMiLCIuLi9zcmMvemVuLW5vZGUudHMiLCIuLi9zcmMvcmVuZGVyLnRzIiwiLi4vc3JjL3plbi1lbGVtZW50LnRzIiwiLi4vc3JjL3plbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgZHluYW1pY01hcmtlciA9ICfinY0nO1xyXG5leHBvcnQgY2xhc3MgWmVuVGVtcGxhdGUge1xyXG4gICAgcHJpdmF0ZSBzdHJpbmdzO1xyXG4gICAgcHJpdmF0ZSBodG1sO1xyXG4gICAgdmFsdWVzOiBhbnlbXTtcclxuICAgIGNvbnN0cnVjdG9yKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5LCB2YWx1ZXM6IGFueVtdKSB7XHJcbiAgICAgICAgdGhpcy5zdHJpbmdzID0gc3RyaW5ncztcclxuICAgICAgICB0aGlzLnZhbHVlcyA9IHZhbHVlcztcclxuICAgICAgICB0aGlzLmh0bWwgPSB0aGlzLnBhcnNlKHRoaXMuc3RyaW5ncyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFBhcnNlcyB0aGUgdGVtcGxhdGUgc3RyaW5ncyBhbmQgcmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvblxyXG4gICAgICogb2YgYW4gZWxlbWVudCB3aXRoIHZhbHVlcyByZXBsYWNlZCBieSBtYXJrZXJzLlxyXG4gICAgICovXHJcbiAgICBwYXJzZSAoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXkpOiBzdHJpbmcge1xyXG4gICAgICAgIGxldCBodG1sID0gJyc7XHJcbiAgICAgICAgc3RyaW5ncy5mb3JFYWNoKChlbGVtZW50LCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICBodG1sICs9IGVsZW1lbnQgKyAoaW5kZXggPCBzdHJpbmdzLmxlbmd0aCAtIDEgPyBkeW5hbWljTWFya2VyIDogJycpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBodG1sO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFRlbXBsYXRlICgpOiBIVE1MVGVtcGxhdGVFbGVtZW50IHtcclxuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XHJcbiAgICAgICAgdGVtcGxhdGUuaW5uZXJIVE1MID0gdGhpcy5odG1sO1xyXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IGR5bmFtaWNNYXJrZXIgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcblxyXG5leHBvcnQgY2xhc3MgWmVuTm9kZSB7XHJcbiAgICBjaGlsZHJlbjogYW55W10gPSBbXTtcclxuICAgIGNvbnN0cnVjdG9yIChub2RlOiBOb2RlKSB7XHJcbiAgICAgICAgdGhpcy5wYXJzZShub2RlKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIgKHZhbHVlczogYW55W10pIHtcclxuICAgICAgICAvLyB2YWx1ZXMgc2hvdWxkIGFsd2F5cyBlcXVhbCBhbmQgYmUgaW4gdGhlIHNhbWVcclxuICAgICAgICAvLyBvcmRlciBhcyB0aGlzIG5vZGUncyBjaGlsZHJlblxyXG4gICAgICAgIGxldCBkeW5hbWljVmFsdWU7XHJcbiAgICAgICAgbGV0IHZhbHVlO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBkeW5hbWljIHZhbHVlIGFuZCByZW5kZXJcclxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZXNbaV07XHJcbiAgICAgICAgICAgIGR5bmFtaWNWYWx1ZSA9IHRoaXMuY2hpbGRyZW5baV07XHJcbiAgICAgICAgICAgIGR5bmFtaWNWYWx1ZS5vbGRWYWx1ZSA9IGR5bmFtaWNWYWx1ZS5jdXJyZW50VmFsdWU7XHJcbiAgICAgICAgICAgIGR5bmFtaWNWYWx1ZS5jdXJyZW50VmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgc3dpdGNoIChkeW5hbWljVmFsdWUudHlwZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYXR0cmlidXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAvKiogVE9ET1xyXG4gICAgICAgICAgICAgICAgICAgICAqICBBdHRyaWJ1dGVzIHNob3VsZCBvbmx5IHJlbmRlciBvbmNlLCBldmVuIGlmIGl0XHJcbiAgICAgICAgICAgICAgICAgICAgICogIGNvbnRhaW5zIG11bHRpcGxlIGR5bmFtaWMgdmFsdWVzLiBDdXJyZW50bHkgdGhpc1xyXG4gICAgICAgICAgICAgICAgICAgICAqICB3aWxsIHJlbmRlciBmb3IgZWFjaCBkeW5hbWljIHZhbHVlLlxyXG4gICAgICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyQXR0cmlidXRlKGR5bmFtaWNWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd0ZXh0JzpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlclRleHQoZHluYW1pY1ZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwYXJzZSAobm9kZTogTm9kZSkge1xyXG4gICAgICAgIC8vIHdhbGsgb3ZlciB0aGUgZWxlbWVudCBhbmQgc2F2ZSBhbGwgZHluYW1pYyBtYXJrZXIgbm9kZXNcclxuICAgICAgICBjb25zdCB0cmVlV2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihub2RlLCA1IC8qKiBvbmx5IGVsZW1lbnRzIGFuZCB0ZXh0ICovKTtcclxuICAgICAgICB3aGlsZSh0cmVlV2Fsa2VyLm5leHROb2RlKCkpIHtcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudE5vZGUgPSB0cmVlV2Fsa2VyLmN1cnJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAoY3VycmVudE5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiBlbGVtZW50LCB0cmF2ZXJzZSBhdHRyaWJ1dGVzXHJcbiAgICAgICAgICAgICAgICBsZXQgY3VycmVudEF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY3VycmVudE5vZGUuYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRBdHRyaWJ1dGUgPSBjdXJyZW50Tm9kZS5hdHRyaWJ1dGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50QXR0cmlidXRlLnRleHRDb250ZW50LmluZGV4T2YoZHluYW1pY01hcmtlcikgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcnNlQXR0cmlidXRlKGN1cnJlbnRBdHRyaWJ1dGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyZW50Tm9kZS50ZXh0Q29udGVudC5pbmRleE9mKGR5bmFtaWNNYXJrZXIpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIGl0J3Mgbm90IGFuIGVsZW1lbnQsIG11c3QgYmUgaW4gYSB0ZXh0IHBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhcnNlVGV4dChjdXJyZW50Tm9kZSBhcyBUZXh0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHBhcnNlQXR0cmlidXRlKGN1cnJlbnRBdHRyaWJ1dGU6IEF0dHIpIHtcclxuICAgICAgICAvKiogQXR0cmlidXRlcyBjYW4gY29udGFpbiBtb3JlIHRoYW4gb25lIGR5bmFtaWMgdmFsdWVcclxuICAgICAgICAgKiAgYW5kIGNhbm5vdCBiZSB1cGRhdGVkIGluZGl2aWR1YWxseSwgc28gd2VcclxuICAgICAgICAgKiAgaGF2ZSB0byBzYXZlIHRoZSBvcmlnaW5hbCBhdHRyaWJ1dGUgc3RyaW5nXHJcbiAgICAgICAgICogIGFuZCBidWlsZCB0aGUgZW50aXJlIHN0cmluZyBmcm9tIGFsbCBkeW5hbWljXHJcbiAgICAgICAgICogIHZhbHVlcyBjb250YWluZWQgd2l0aGluIGl0IHdoZW4gYSBzaW5nbGVcclxuICAgICAgICAgKiAgdmFsdWUgY2hhbmdlcy5cclxuICAgICAgICAgKi9cclxuICAgICAgICBjb25zdCB0ZXh0Q29udGVudCA9IGN1cnJlbnRBdHRyaWJ1dGUudGV4dENvbnRlbnQ7XHJcbiAgICAgICAgY29uc3QgbWF0Y2hlcyA9IHRleHRDb250ZW50Lm1hdGNoKG5ldyBSZWdFeHAoZHluYW1pY01hcmtlciwgJ2cnKSk7XHJcbiAgICAgICAgY29uc3QgZHluYW1pY1ZhbHVlc0NvdW50ID0gbWF0Y2hlcyA/IG1hdGNoZXMubGVuZ3RoIDogMDtcclxuICAgICAgICBjb25zdCBkeW5hbWljQXR0cmlidXRlVmFsdWVzID0gW107XHJcbiAgICAgICAgY29uc3QgYXR0cmlidXRlVGVtcGxhdGUgPSB7XHJcbiAgICAgICAgICAgIHJhdzogY3VycmVudEF0dHJpYnV0ZS50ZXh0Q29udGVudCxcclxuICAgICAgICAgICAgdmFsdWVzOiBkeW5hbWljQXR0cmlidXRlVmFsdWVzXHJcbiAgICAgICAgfTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGR5bmFtaWNWYWx1ZXNDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGR5bmFtaWNWYWx1ZSA9IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IGksXHJcbiAgICAgICAgICAgICAgICBjb250YWluZXI6IGN1cnJlbnRBdHRyaWJ1dGUsXHJcbiAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IGR5bmFtaWNNYXJrZXIsXHJcbiAgICAgICAgICAgICAgICBvbGRWYWx1ZTogbnVsbCxcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBhdHRyaWJ1dGVUZW1wbGF0ZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBkeW5hbWljQXR0cmlidXRlVmFsdWVzLnB1c2goZHluYW1pY1ZhbHVlKTsgLy8gcHVzaCBpbnRvIGF0dHJpYnV0ZSB0ZW1wbGF0ZVxyXG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goZHluYW1pY1ZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwYXJzZVRleHQodGV4dDogVGV4dCkge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFdlIGNhbiBicmVhayB0aGUgdGV4dENvbnRlbnQgc3RyaW5nIGludG8gbXVsdGlwbGVcclxuICAgICAgICAgKiBUZXh0Tm9kZXMsIHNvIHRoYXQgZWFjaCBkeW5hbWljIHBhcnQgaXMgaXNvbGF0ZWQgYW5kXHJcbiAgICAgICAgICogY2FuIHVwZGF0ZSBieSBpdHNlbGYuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgY29uc3QgdmFsdWVNYXJrZXJJbmRpY2VzID0gW107XHJcbiAgICAgICAgY29uc3QgdGV4dFBhcnRzID0gW107XHJcbiAgICAgICAgbGV0IHRleHRDb250ZW50ID0gdGV4dC50ZXh0Q29udGVudDtcclxuICAgICAgICB3aGlsZSAodGV4dENvbnRlbnQgIT09ICcnKSB7XHJcbiAgICAgICAgICAgIGxldCBwYXJ0O1xyXG4gICAgICAgICAgICBjb25zdCB2YWx1ZUluZGV4ID0gdGV4dENvbnRlbnQuaW5kZXhPZihkeW5hbWljTWFya2VyKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlSW5kZXggIT09IDApIHtcclxuICAgICAgICAgICAgICAgIC8vIHRleHQgY29udGVudCBiZWZvcmUgdmFsdWUgbWFya2VyXHJcbiAgICAgICAgICAgICAgICBwYXJ0ID0gdGV4dENvbnRlbnQuc3Vic3RyaW5nKDAsIHZhbHVlSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgdGV4dENvbnRlbnQgPSB0ZXh0Q29udGVudC5zdWJzdHJpbmcodmFsdWVJbmRleCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyB2YWx1ZSBtYXJrZXJcclxuICAgICAgICAgICAgICAgIHZhbHVlTWFya2VySW5kaWNlcy5wdXNoKHRleHRQYXJ0cy5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgcGFydCA9IHRleHRDb250ZW50LnN1YnN0cmluZygwLCBkeW5hbWljTWFya2VyLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0Q29udGVudCA9IHRleHRDb250ZW50LnN1YnN0cmluZyhkeW5hbWljTWFya2VyLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGV4dFBhcnRzLnB1c2goZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUocGFydCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gc2F2ZSB0aGUgZHluYW1pYyB0ZXh0IHBhcnRzXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZU1hcmtlckluZGljZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogdGV4dFBhcnRzW3ZhbHVlTWFya2VySW5kaWNlc1tpXV0sXHJcbiAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IGR5bmFtaWNNYXJrZXIsXHJcbiAgICAgICAgICAgICAgICBvbGRWYWx1ZTogbnVsbFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGVtcHR5IGN1cnJlbnQgbm9kZSBhbmQgcmVwbGFjZSB3aXRoIHRleHQgbm9kZXNcclxuICAgICAgICAvLyAqKiB3YXJuaW5nOiBjYW4ndCBhcHBlbmRDaGlsZCgpIG9yIGVsc2Ugd2Fsa2VyXHJcbiAgICAgICAgLy8gKiogd2lsbCBrZWVwIGFkZGluZyBhbmQgd2Fsa2luZyBvdmVyIG5vZGVzICoqXHJcbiAgICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IHRleHQucGFyZW50RWxlbWVudDtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRQYXJ0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBwYXJlbnROb2RlLmluc2VydEJlZm9yZSh0ZXh0UGFydHNbaV0sIHRleHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gcmVtb3ZlIGN1cnJlbnQgdGV4dCBub2RlIGZyb20gcGFyZW50XHJcbiAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbmRlcnMgYSBuZXcgYXR0cmlidXRlIHZhbHVlIGJ5XHJcbiAgICAgKiByZWJ1aWxkaW5nIHRoZSByYXcgc3RyaW5nIGFuZCByZXBsYWNpbmdcclxuICAgICAqIGVhY2ggZHluYW1pYyBwYXJ0IHdpdGggdGhlaXIgY3VycmVudCB2YWx1ZXNcclxuICAgICAqIEBwYXJhbSBkeW5hbWljVmFsdWUgYSBkeW5hbWljIGF0dHJpYnV0ZSB2YWx1ZVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHJlbmRlckF0dHJpYnV0ZShkeW5hbWljVmFsdWUpIHtcclxuICAgICAgICBsZXQgbmV3QXR0cmlidXRlVmFsdWUgPSBkeW5hbWljVmFsdWUudGVtcGxhdGUucmF3O1xyXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZHluYW1pY1ZhbHVlLnRlbXBsYXRlLnZhbHVlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBuZXdBdHRyaWJ1dGVWYWx1ZSA9IG5ld0F0dHJpYnV0ZVZhbHVlLnJlcGxhY2UoZHluYW1pY01hcmtlciwgZHluYW1pY1ZhbHVlLnRlbXBsYXRlLnZhbHVlc1tqXS5jdXJyZW50VmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkeW5hbWljVmFsdWUuY29udGFpbmVyLnRleHRDb250ZW50ID0gbmV3QXR0cmlidXRlVmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW5kZXJzIGEgbmV3IHRleHQgdmFsdWUuXHJcbiAgICAgKiBAcGFyYW0gZHluYW1pY1ZhbHVlIGEgZHluYW1pYyB0ZXh0IG5vZGVcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSByZW5kZXJUZXh0KGR5bmFtaWNWYWx1ZSkge1xyXG4gICAgICAgIGR5bmFtaWNWYWx1ZS5jb250YWluZXIudGV4dENvbnRlbnQgPSBkeW5hbWljVmFsdWUuY3VycmVudFZhbHVlO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgWmVuTm9kZSB9IGZyb20gJy4vemVuLW5vZGUnO1xyXG5pbXBvcnQgeyBaZW5UZW1wbGF0ZSB9IGZyb20gJy4vemVuLXRlbXBsYXRlJztcclxuXHJcbmV4cG9ydCBjb25zdCBjb250YWluZXJDYWNoZSA9IG5ldyBXZWFrTWFwPE5vZGUsIFplbk5vZGU+KCk7XHJcbmV4cG9ydCBjb25zdCByZW5kZXIgPSBmdW5jdGlvbiAoemVuVGVtcGxhdGU6IFplblRlbXBsYXRlLCBjb250YWluZXI6IE5vZGUpIHtcclxuICAgIC8vIGNoZWNrIGlmIHplbiB0ZW1wbGF0ZSBoYXMgYmVlbiByZW5kZXJlZCBhbmQgY2FjaGVkXHJcbiAgICBsZXQgemVuUmVuZGVyID0gY29udGFpbmVyQ2FjaGUuZ2V0KGNvbnRhaW5lcik7XHJcbiAgICBpZiAoIXplblJlbmRlcikge1xyXG4gICAgICAgIC8vIGNyZWF0ZSB6ZW4gcmVuZGVyLCBjYWNoZSwgYW5kIGluc2VydFxyXG4gICAgICAgIGNvbnN0IGR5bmFtaWNOb2RlID0gemVuVGVtcGxhdGUuZ2V0VGVtcGxhdGUoKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcclxuICAgICAgICB6ZW5SZW5kZXIgPSBuZXcgWmVuTm9kZShkeW5hbWljTm9kZSk7XHJcbiAgICAgICAgY29udGFpbmVyQ2FjaGUuc2V0KGNvbnRhaW5lciwgemVuUmVuZGVyKTtcclxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZHluYW1pY05vZGUpO1xyXG4gICAgfVxyXG4gICAgemVuUmVuZGVyLnJlbmRlcih6ZW5UZW1wbGF0ZS52YWx1ZXMpO1xyXG59IiwiaW1wb3J0IHsgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcbmltcG9ydCB7IHJlbmRlciB9IGZyb20gJy4vcmVuZGVyJztcclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBaZW5FbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6ICdvcGVuJyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25uZWN0ZWRDYWxsYmFjayAoKSB7XHJcbiAgICAgICAgcmVuZGVyKHRoaXMucmVuZGVyKCksIHRoaXMuc2hhZG93Um9vdCk7XHJcbiAgICB9XHJcblxyXG4gICAgYWJzdHJhY3QgcmVuZGVyKHZhbHVlcz86IGFueVtdKTogWmVuVGVtcGxhdGU7XHJcbn0iLCJpbXBvcnQgeyBaZW5UZW1wbGF0ZSB9IGZyb20gJy4vemVuLXRlbXBsYXRlJztcclxuXHJcbmV4cG9ydCBjb25zdCB6ZW5UZW1wbGF0ZUNhY2hlID0gbmV3IFdlYWtNYXA8VGVtcGxhdGVTdHJpbmdzQXJyYXksIFplblRlbXBsYXRlPigpO1xyXG5leHBvcnQgY29uc3QgemVuID0gZnVuY3Rpb24gKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5LCAuLi52YWx1ZXM6IGFueVtdKSB7XHJcbiAgICAvLyBjaGVjayBpZiB0aGlzIHRlbXBsYXRlIHN0cmluZyBhcnJheSBoYXMgYmVlbiBjYWNoZWRcclxuICAgIGxldCB6ZW5UZW1wbGF0ZSA9IHplblRlbXBsYXRlQ2FjaGUuZ2V0KHN0cmluZ3MpO1xyXG4gICAgaWYgKCF6ZW5UZW1wbGF0ZSkge1xyXG4gICAgICAgIC8vIGNyZWF0ZSBhbmQgY2FjaGUgdGVtcGxhdGVcclxuICAgICAgICB6ZW5UZW1wbGF0ZSA9IG5ldyBaZW5UZW1wbGF0ZShzdHJpbmdzLCB2YWx1ZXMpO1xyXG4gICAgICAgIHplblRlbXBsYXRlQ2FjaGUuc2V0KHN0cmluZ3MsIHplblRlbXBsYXRlKTtcclxuICAgIH1cclxuICAgIHJldHVybiB6ZW5UZW1wbGF0ZTtcclxufVxyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ik1BQWEsYUFBYSxHQUFHLEdBQUcsQ0FBQztBQUNqQyxNQUFhLFdBQVc7SUFJcEIsWUFBWSxPQUE2QixFQUFFLE1BQWE7UUFDcEQsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUN4Qzs7OztJQUtELEtBQUssQ0FBRSxPQUE2QjtRQUNoQyxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZCxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEtBQUs7WUFDM0IsSUFBSSxJQUFJLE9BQU8sSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsYUFBYSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1NBQ3ZFLENBQUMsQ0FBQztRQUNILE9BQU8sSUFBSSxDQUFDO0tBQ2Y7SUFFRCxXQUFXO1FBQ1AsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNwRCxRQUFRLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDL0IsT0FBTyxRQUFRLENBQUM7S0FDbkI7Q0FDSjs7TUN6QlksT0FBTztJQUVoQixZQUFhLElBQVU7UUFEdkIsYUFBUSxHQUFVLEVBQUUsQ0FBQztRQUVqQixJQUFJ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
