const dynamicMarker = `%zen%`;
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
//# sourceMappingURL=zen-template.js.map

class ZenNode {
    constructor(node) {
        this.children = [];
        this.rootNode = node;
        this.parse(this.rootNode);
    }
    parse(rootNode) {
        // walk over the element and save all the nodes that have value
        // markers contained in them, and set their original values
        let valueIndex = 0;
        const treeWalker = document.createTreeWalker(rootNode, 5 /** Show elements and text */);
        while (treeWalker.nextNode()) {
            let currentNode = treeWalker.currentNode;
            // if element, traverse attributes
            if (currentNode instanceof Element) {
                for (let i = 0; i < currentNode.attributes.length; i++) {
                    const currentAttribute = currentNode.attributes[i];
                    if (currentAttribute.textContent.indexOf(dynamicMarker) > -1) {
                        // text node can contain more than one marker
                        // must save the whole string with markers and
                        // build whole string on each value change
                        const text = currentAttribute.textContent;
                        const valuesCount = (text.match(new RegExp(dynamicMarker, 'gi')) || []).length;
                        const attributeValue = {
                            type: 'attribute',
                            container: currentAttribute,
                            template: currentAttribute.textContent,
                            values: []
                        };
                        // for each value marker, save its index in template string
                        for (let i = 0; i < valuesCount; i++) {
                            attributeValue.values.push({
                                index: valueIndex,
                                currentValue: dynamicMarker,
                                oldValue: null
                            });
                            this.children.push(attributeValue);
                            valueIndex++;
                        }
                    }
                }
            }
            else {
                // if it's not an element, must be in a text position
                if (currentNode.textContent.indexOf(dynamicMarker) > -1) {
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
                    // save the dynamic text parts
                    for (let i = 0; i < valueMarkerIndices.length; i++) {
                        this.children.push({
                            type: 'text',
                            index: valueIndex,
                            container: textParts[valueMarkerIndices[i]],
                            currentValue: dynamicMarker,
                            oldValue: null
                        });
                        valueIndex++;
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
                }
            }
        }
    }
    render(values) {
        values.forEach((value, i) => {
            // grab node saved for value and update with new value
            const dynamicValue = this.children[i];
            switch (dynamicValue.type) {
                case 'attribute':
                    const attribute = dynamicValue.container;
                    // find the attribute part that corresponds with
                    // this value index
                    const attributeValues = dynamicValue.values;
                    const currentValue = attributeValues.find(val => val.index === i);
                    currentValue.oldValue = currentValue.currentValue;
                    currentValue.currentValue = value;
                    // rebuild template from all current values
                    let str = dynamicValue.template;
                    for (let j = 0; j < attributeValues.length; j++) {
                        str = str.replace(dynamicMarker, attributeValues[j].currentValue);
                    }
                    attribute.textContent = str;
                    break;
                case 'text':
                    // find the attribute part that corresponds with
                    // this value index
                    dynamicValue.oldValue = dynamicValue.currentValue;
                    dynamicValue.currentValue = value;
                    dynamicValue.container.textContent = dynamicValue.currentValue;
                    break;
            }
        });
    }
}
//# sourceMappingURL=zen-node.js.map

const containerCache = new WeakMap();
const render = function (zenTemplate, container) {
    // check if zen template has been rendered and cached
    let zenRender = containerCache.get(container);
    if (!zenRender) {
        // create zen render and cache
        zenRender = new ZenNode(zenTemplate.getTemplate().content.cloneNode(true));
        containerCache.set(container, zenRender);
        // insert into container
        container.appendChild(zenRender.rootNode);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemVuLWh0bWwuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy96ZW4tdGVtcGxhdGUudHMiLCIuLi9zcmMvemVuLW5vZGUudHMiLCIuLi9zcmMvcmVuZGVyLnRzIiwiLi4vc3JjL3plbi1lbGVtZW50LnRzIiwiLi4vc3JjL3plbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgZHluYW1pY01hcmtlciA9IGAlemVuJWA7XHJcbmV4cG9ydCBjbGFzcyBaZW5UZW1wbGF0ZSB7XHJcbiAgICBwcml2YXRlIHN0cmluZ3M7XHJcbiAgICBwcml2YXRlIGh0bWw7XHJcbiAgICB2YWx1ZXM6IGFueVtdO1xyXG4gICAgY29uc3RydWN0b3Ioc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIHZhbHVlczogYW55W10pIHtcclxuICAgICAgICB0aGlzLnN0cmluZ3MgPSBzdHJpbmdzO1xyXG4gICAgICAgIHRoaXMudmFsdWVzID0gdmFsdWVzO1xyXG4gICAgICAgIHRoaXMuaHRtbCA9IHRoaXMucGFyc2UodGhpcy5zdHJpbmdzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogUGFyc2VzIHRoZSB0ZW1wbGF0ZSBzdHJpbmdzIGFuZCByZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uXHJcbiAgICAgKiBvZiBhbiBlbGVtZW50IHdpdGggdmFsdWVzIHJlcGxhY2VkIGJ5IG1hcmtlcnMuXHJcbiAgICAgKi9cclxuICAgIHBhcnNlIChzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSk6IHN0cmluZyB7XHJcbiAgICAgICAgbGV0IGh0bWwgPSAnJztcclxuICAgICAgICBzdHJpbmdzLmZvckVhY2goKGVsZW1lbnQsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIGh0bWwgKz0gZWxlbWVudCArIChpbmRleCA8IHN0cmluZ3MubGVuZ3RoIC0gMSA/IGR5bmFtaWNNYXJrZXIgOiAnJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGh0bWw7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VGVtcGxhdGUgKCk6IEhUTUxUZW1wbGF0ZUVsZW1lbnQge1xyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcclxuICAgICAgICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSB0aGlzLmh0bWw7XHJcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgZHluYW1pY01hcmtlciB9IGZyb20gJy4vemVuLXRlbXBsYXRlJztcclxuXHJcbmV4cG9ydCBjbGFzcyBaZW5Ob2RlIHtcclxuICAgIHJvb3ROb2RlOiBOb2RlO1xyXG4gICAgY2hpbGRyZW46IGFueVtdID0gW107XHJcbiAgICBjb25zdHJ1Y3RvciAobm9kZTogTm9kZSkge1xyXG4gICAgICAgIHRoaXMucm9vdE5vZGUgPSBub2RlO1xyXG4gICAgICAgIHRoaXMucGFyc2UodGhpcy5yb290Tm9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2UgKHJvb3ROb2RlOiBOb2RlKSB7XHJcbiAgICAgICAgLy8gd2FsayBvdmVyIHRoZSBlbGVtZW50IGFuZCBzYXZlIGFsbCB0aGUgbm9kZXMgdGhhdCBoYXZlIHZhbHVlXHJcbiAgICAgICAgLy8gbWFya2VycyBjb250YWluZWQgaW4gdGhlbSwgYW5kIHNldCB0aGVpciBvcmlnaW5hbCB2YWx1ZXNcclxuICAgICAgICBsZXQgdmFsdWVJbmRleCA9IDA7XHJcbiAgICAgICAgY29uc3QgdHJlZVdhbGtlciA9IGRvY3VtZW50LmNyZWF0ZVRyZWVXYWxrZXIocm9vdE5vZGUsIDUgLyoqIFNob3cgZWxlbWVudHMgYW5kIHRleHQgKi8pO1xyXG4gICAgICAgIHdoaWxlKHRyZWVXYWxrZXIubmV4dE5vZGUoKSkge1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudE5vZGUgPSB0cmVlV2Fsa2VyLmN1cnJlbnROb2RlO1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgZWxlbWVudCwgdHJhdmVyc2UgYXR0cmlidXRlc1xyXG4gICAgICAgICAgICBpZiAoY3VycmVudE5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGN1cnJlbnROb2RlLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50QXR0cmlidXRlID0gY3VycmVudE5vZGUuYXR0cmlidXRlc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudEF0dHJpYnV0ZS50ZXh0Q29udGVudC5pbmRleE9mKGR5bmFtaWNNYXJrZXIpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGV4dCBub2RlIGNhbiBjb250YWluIG1vcmUgdGhhbiBvbmUgbWFya2VyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG11c3Qgc2F2ZSB0aGUgd2hvbGUgc3RyaW5nIHdpdGggbWFya2VycyBhbmRcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYnVpbGQgd2hvbGUgc3RyaW5nIG9uIGVhY2ggdmFsdWUgY2hhbmdlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBjdXJyZW50QXR0cmlidXRlLnRleHRDb250ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZXNDb3VudCA9ICh0ZXh0Lm1hdGNoKG5ldyBSZWdFeHAoZHluYW1pY01hcmtlciwgJ2dpJykpIHx8IFtdKS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVWYWx1ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyOiBjdXJyZW50QXR0cmlidXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IGN1cnJlbnRBdHRyaWJ1dGUudGV4dENvbnRlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXM6IFtdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmb3IgZWFjaCB2YWx1ZSBtYXJrZXIsIHNhdmUgaXRzIGluZGV4IGluIHRlbXBsYXRlIHN0cmluZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlc0NvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVZhbHVlLnZhbHVlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogdmFsdWVJbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IGR5bmFtaWNNYXJrZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWU6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKGF0dHJpYnV0ZVZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlSW5kZXgrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIGl0J3Mgbm90IGFuIGVsZW1lbnQsIG11c3QgYmUgaW4gYSB0ZXh0IHBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudE5vZGUudGV4dENvbnRlbnQuaW5kZXhPZihkeW5hbWljTWFya2VyKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAgICAgICAgICogV2UgY2FuIGJyZWFrIHRoZSB0ZXh0Q29udGVudCBzdHJpbmcgaW50byBtdWx0aXBsZVxyXG4gICAgICAgICAgICAgICAgICAgICAqIFRleHROb2Rlcywgc28gdGhhdCBlYWNoIGR5bmFtaWMgcGFydCBpcyBpc29sYXRlZCBhbmRcclxuICAgICAgICAgICAgICAgICAgICAgKiBjYW4gdXBkYXRlIGJ5IGl0c2VsZi5cclxuICAgICAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZU1hcmtlckluZGljZXMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0UGFydHMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdGV4dENvbnRlbnQgPSBjdXJyZW50Tm9kZS50ZXh0Q29udGVudDtcclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAodGV4dENvbnRlbnQgIT09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwYXJ0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZUluZGV4ID0gdGV4dENvbnRlbnQuaW5kZXhPZihkeW5hbWljTWFya2VyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlSW5kZXggIT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRleHQgY29udGVudCBiZWZvcmUgdmFsdWUgbWFya2VyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJ0ID0gdGV4dENvbnRlbnQuc3Vic3RyaW5nKDAsIHZhbHVlSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dENvbnRlbnQgPSB0ZXh0Q29udGVudC5zdWJzdHJpbmcodmFsdWVJbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2YWx1ZSBtYXJrZXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlTWFya2VySW5kaWNlcy5wdXNoKHRleHRQYXJ0cy5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFydCA9IHRleHRDb250ZW50LnN1YnN0cmluZygwLCBkeW5hbWljTWFya2VyLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0Q29udGVudCA9IHRleHRDb250ZW50LnN1YnN0cmluZyhkeW5hbWljTWFya2VyLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dFBhcnRzLnB1c2goZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUocGFydCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gc2F2ZSB0aGUgZHluYW1pYyB0ZXh0IHBhcnRzXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZU1hcmtlckluZGljZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiB2YWx1ZUluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyOiB0ZXh0UGFydHNbdmFsdWVNYXJrZXJJbmRpY2VzW2ldXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZTogZHluYW1pY01hcmtlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFZhbHVlOiBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZUluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBlbXB0eSBjdXJyZW50IG5vZGUgYW5kIHJlcGxhY2Ugd2l0aCB0ZXh0IG5vZGVzXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gKiogd2FybmluZzogY2FuJ3QgYXBwZW5kQ2hpbGQoKSBvciBlbHNlIHdhbGtlclxyXG4gICAgICAgICAgICAgICAgICAgIC8vICoqIHdpbGwga2VlcCBhZGRpbmcgYW5kIHdhbGtpbmcgb3ZlciBub2RlcyAqKlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSBjdXJyZW50Tm9kZS5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dFBhcnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRleHRQYXJ0c1tpXSwgY3VycmVudE5vZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIGN1cnJlbnQgdGV4dCBub2RlIGZyb20gcGFyZW50XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjdXJyZW50Tm9kZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyICh2YWx1ZXM6IGFueVtdKSB7XHJcbiAgICAgICAgdmFsdWVzLmZvckVhY2goKHZhbHVlLCBpKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIGdyYWIgbm9kZSBzYXZlZCBmb3IgdmFsdWUgYW5kIHVwZGF0ZSB3aXRoIG5ldyB2YWx1ZVxyXG4gICAgICAgICAgICBjb25zdCBkeW5hbWljVmFsdWUgPSB0aGlzLmNoaWxkcmVuW2ldO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGR5bmFtaWNWYWx1ZS50eXBlKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhdHRyaWJ1dGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IDxBdHRyPmR5bmFtaWNWYWx1ZS5jb250YWluZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZmluZCB0aGUgYXR0cmlidXRlIHBhcnQgdGhhdCBjb3JyZXNwb25kcyB3aXRoXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyB2YWx1ZSBpbmRleFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZVZhbHVlcyA9IGR5bmFtaWNWYWx1ZS52YWx1ZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VycmVudFZhbHVlID0gYXR0cmlidXRlVmFsdWVzLmZpbmQodmFsID0+IHZhbC5pbmRleCA9PT0gaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFZhbHVlLm9sZFZhbHVlID0gY3VycmVudFZhbHVlLmN1cnJlbnRWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWUuY3VycmVudFZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVidWlsZCB0ZW1wbGF0ZSBmcm9tIGFsbCBjdXJyZW50IHZhbHVlc1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBzdHIgPSBkeW5hbWljVmFsdWUudGVtcGxhdGU7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGVWYWx1ZXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UoZHluYW1pY01hcmtlciwgYXR0cmlidXRlVmFsdWVzW2pdLmN1cnJlbnRWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZS50ZXh0Q29udGVudCA9IHN0cjtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGZpbmQgdGhlIGF0dHJpYnV0ZSBwYXJ0IHRoYXQgY29ycmVzcG9uZHMgd2l0aFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgdmFsdWUgaW5kZXhcclxuICAgICAgICAgICAgICAgICAgICBkeW5hbWljVmFsdWUub2xkVmFsdWUgPSBkeW5hbWljVmFsdWUuY3VycmVudFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGR5bmFtaWNWYWx1ZS5jdXJyZW50VmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBkeW5hbWljVmFsdWUuY29udGFpbmVyLnRleHRDb250ZW50ID0gZHluYW1pY1ZhbHVlLmN1cnJlbnRWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgWmVuTm9kZSB9IGZyb20gJy4vemVuLW5vZGUnO1xyXG5pbXBvcnQgeyBaZW5UZW1wbGF0ZSB9IGZyb20gJy4vemVuLXRlbXBsYXRlJztcclxuXHJcbmV4cG9ydCBjb25zdCBjb250YWluZXJDYWNoZSA9IG5ldyBXZWFrTWFwPE5vZGUsIFplbk5vZGU+KCk7XHJcbmV4cG9ydCBjb25zdCByZW5kZXIgPSBmdW5jdGlvbiAoemVuVGVtcGxhdGU6IFplblRlbXBsYXRlLCBjb250YWluZXI6IE5vZGUpIHtcclxuICAgIC8vIGNoZWNrIGlmIHplbiB0ZW1wbGF0ZSBoYXMgYmVlbiByZW5kZXJlZCBhbmQgY2FjaGVkXHJcbiAgICBsZXQgemVuUmVuZGVyID0gY29udGFpbmVyQ2FjaGUuZ2V0KGNvbnRhaW5lcik7XHJcbiAgICBpZiAoIXplblJlbmRlcikge1xyXG4gICAgICAgIC8vIGNyZWF0ZSB6ZW4gcmVuZGVyIGFuZCBjYWNoZVxyXG4gICAgICAgIHplblJlbmRlciA9IG5ldyBaZW5Ob2RlKHplblRlbXBsYXRlLmdldFRlbXBsYXRlKCkuY29udGVudC5jbG9uZU5vZGUodHJ1ZSkpO1xyXG4gICAgICAgIGNvbnRhaW5lckNhY2hlLnNldChjb250YWluZXIsIHplblJlbmRlcik7XHJcbiAgICAgICAgLy8gaW5zZXJ0IGludG8gY29udGFpbmVyXHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHplblJlbmRlci5yb290Tm9kZSk7XHJcbiAgICB9XHJcbiAgICB6ZW5SZW5kZXIucmVuZGVyKHplblRlbXBsYXRlLnZhbHVlcyk7XHJcbn0iLCJpbXBvcnQgeyBaZW5UZW1wbGF0ZSB9IGZyb20gJy4vemVuLXRlbXBsYXRlJztcclxuaW1wb3J0IHsgcmVuZGVyIH0gZnJvbSAnLi9yZW5kZXInO1xyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFplbkVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbm5lY3RlZENhbGxiYWNrICgpIHtcclxuICAgICAgICByZW5kZXIodGhpcy5yZW5kZXIoKSwgdGhpcy5zaGFkb3dSb290KTtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCByZW5kZXIodmFsdWVzPzogYW55W10pOiBaZW5UZW1wbGF0ZTtcclxufSIsImltcG9ydCB7IFplblRlbXBsYXRlIH0gZnJvbSAnLi96ZW4tdGVtcGxhdGUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IHplblRlbXBsYXRlQ2FjaGUgPSBuZXcgV2Vha01hcDxUZW1wbGF0ZVN0cmluZ3NBcnJheSwgWmVuVGVtcGxhdGU+KCk7XHJcbmV4cG9ydCBjb25zdCB6ZW4gPSBmdW5jdGlvbiAoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIC4uLnZhbHVlczogYW55W10pIHtcclxuICAgIC8vIGNoZWNrIGlmIHRoaXMgdGVtcGxhdGUgc3RyaW5nIGFycmF5IGhhcyBiZWVuIGNhY2hlZFxyXG4gICAgbGV0IHplblRlbXBsYXRlID0gemVuVGVtcGxhdGVDYWNoZS5nZXQoc3RyaW5ncyk7XHJcbiAgICBpZiAoIXplblRlbXBsYXRlKSB7XHJcbiAgICAgICAgLy8gY3JlYXRlIGFuZCBjYWNoZSB0ZW1wbGF0ZVxyXG4gICAgICAgIHplblRlbXBsYXRlID0gbmV3IFplblRlbXBsYXRlKHN0cmluZ3MsIHZhbHVlcyk7XHJcbiAgICAgICAgemVuVGVtcGxhdGVDYWNoZS5zZXQoc3RyaW5ncywgemVuVGVtcGxhdGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHplblRlbXBsYXRlO1xyXG59XHJcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiTUFBYSxhQUFhLEdBQUcsT0FBTyxDQUFDO0FBQ3JDLE1BQWEsV0FBVztJQUlwQixZQUFZLE9BQTZCLEVBQUUsTUFBYTtRQUNwRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3hDOzs7O0lBS0QsS0FBSyxDQUFFLE9BQTZCO1FBQ2hDLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNkLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsS0FBSztZQUMzQixJQUFJLElBQUksT0FBTyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxhQUFhLEdBQUcsRUFBRSxDQUFDLENBQUM7U0FDdkUsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxJQUFJLENBQUM7S0FDZjtJQUVELFdBQVc7UUFDUCxNQUFNLFFB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
