const valueMarker = `%zen%`;
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
            html += element + (index < strings.length - 1 ? valueMarker : '');
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
                    if (currentAttribute.textContent.indexOf(valueMarker) > -1) {
                        // text node can contain more than one marker
                        // must save the whole string with markers and
                        // build whole string on each value change
                        const text = currentAttribute.textContent;
                        const valuesCount = (text.match(new RegExp(valueMarker, 'gi')) || []).length;
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
                                currentValue: valueMarker,
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
                if (currentNode.textContent.indexOf(valueMarker) > -1) {
                    // text node can contain more than one marker
                    // see how many value markers are within text node
                    const text = currentNode.textContent;
                    const valuesCount = (text.match(new RegExp(valueMarker, 'gi')) || []).length;
                    const textValue = {
                        type: 'text',
                        container: currentNode,
                        template: currentNode.textContent,
                        values: []
                    };
                    // for each value marker, save its index in template string
                    for (let i = 0; i < valuesCount; i++) {
                        textValue.values.push({
                            index: valueIndex,
                            currentValue: valueMarker,
                            oldValue: null
                        });
                        this.children.push(textValue);
                        valueIndex++;
                    }
                }
            }
        }
    }
    render(values) {
        values.forEach((value, i) => {
            // grab node saved for value and update with new value
            const node = this.children[i];
            switch (node.type) {
                case 'attribute':
                    const attribute = node.container;
                    // find the attribute part that corresponds with
                    // this value index
                    const attributeValues = node.values;
                    const currentValue = attributeValues.find(val => val.index === i);
                    currentValue.oldValue = currentValue.currentValue;
                    currentValue.currentValue = value;
                    // rebuild template from all current values
                    let str = node.template;
                    for (let j = 0; j < attributeValues.length; j++) {
                        str = str.replace(valueMarker, attributeValues[j].currentValue);
                    }
                    attribute.textContent = str;
                    break;
                case 'text':
                    // find the attribute part that corresponds with
                    // this value index
                    const nodeValue = node.values.find(asdf => asdf.index === i);
                    nodeValue.oldValue = nodeValue.currentValue;
                    nodeValue.currentValue = value;
                    // rebuild template from all current values
                    let newTextContent = node.template;
                    for (let j = 0; j < node.values.length; j++) {
                        newTextContent = newTextContent.replace(valueMarker, node.values[j].currentValue);
                    }
                    node.container.textContent = newTextContent;
                    break;
            }
        });
    }
}

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

export { ZenElement, ZenNode, valueMarker, ZenTemplate, zenTemplateCache, zen, containerCache, render };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemVuLWh0bWwuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy96ZW4tdGVtcGxhdGUudHMiLCIuLi9zcmMvemVuLW5vZGUudHMiLCIuLi9zcmMvcmVuZGVyLnRzIiwiLi4vc3JjL3plbi1lbGVtZW50LnRzIiwiLi4vc3JjL3plbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgdmFsdWVNYXJrZXIgPSBgJXplbiVgO1xyXG5leHBvcnQgY2xhc3MgWmVuVGVtcGxhdGUge1xyXG4gICAgcHJpdmF0ZSBzdHJpbmdzO1xyXG4gICAgcHJpdmF0ZSBodG1sO1xyXG4gICAgdmFsdWVzOiBhbnlbXTtcclxuICAgIGNvbnN0cnVjdG9yKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5LCB2YWx1ZXM6IGFueVtdKSB7XHJcbiAgICAgICAgdGhpcy5zdHJpbmdzID0gc3RyaW5ncztcclxuICAgICAgICB0aGlzLnZhbHVlcyA9IHZhbHVlcztcclxuICAgICAgICB0aGlzLmh0bWwgPSB0aGlzLnBhcnNlKHRoaXMuc3RyaW5ncyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFBhcnNlcyB0aGUgdGVtcGxhdGUgc3RyaW5ncyBhbmQgcmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvblxyXG4gICAgICogb2YgYW4gZWxlbWVudCB3aXRoIHZhbHVlcyByZXBsYWNlZCBieSBtYXJrZXJzLlxyXG4gICAgICovXHJcbiAgICBwYXJzZSAoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXkpOiBzdHJpbmcge1xyXG4gICAgICAgIGxldCBodG1sID0gJyc7XHJcbiAgICAgICAgc3RyaW5ncy5mb3JFYWNoKChlbGVtZW50LCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICBodG1sICs9IGVsZW1lbnQgKyAoaW5kZXggPCBzdHJpbmdzLmxlbmd0aCAtIDEgPyB2YWx1ZU1hcmtlciA6ICcnKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gaHRtbDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRUZW1wbGF0ZSAoKTogSFRNTFRlbXBsYXRlRWxlbWVudCB7XHJcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xyXG4gICAgICAgIHRlbXBsYXRlLmlubmVySFRNTCA9IHRoaXMuaHRtbDtcclxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyB2YWx1ZU1hcmtlciB9IGZyb20gJy4vemVuLXRlbXBsYXRlJztcclxuXHJcbmV4cG9ydCBjbGFzcyBaZW5Ob2RlIHtcclxuICAgIHJvb3ROb2RlOiBOb2RlO1xyXG4gICAgY2hpbGRyZW46IGFueVtdID0gW107XHJcbiAgICBjb25zdHJ1Y3RvciAobm9kZTogTm9kZSkge1xyXG4gICAgICAgIHRoaXMucm9vdE5vZGUgPSBub2RlO1xyXG4gICAgICAgIHRoaXMucGFyc2UodGhpcy5yb290Tm9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2UgKHJvb3ROb2RlOiBOb2RlKSB7XHJcbiAgICAgICAgLy8gd2FsayBvdmVyIHRoZSBlbGVtZW50IGFuZCBzYXZlIGFsbCB0aGUgbm9kZXMgdGhhdCBoYXZlIHZhbHVlXHJcbiAgICAgICAgLy8gbWFya2VycyBjb250YWluZWQgaW4gdGhlbSwgYW5kIHNldCB0aGVpciBvcmlnaW5hbCB2YWx1ZXNcclxuICAgICAgICBsZXQgdmFsdWVJbmRleCA9IDA7XHJcbiAgICAgICAgY29uc3QgdHJlZVdhbGtlciA9IGRvY3VtZW50LmNyZWF0ZVRyZWVXYWxrZXIocm9vdE5vZGUsIDUgLyoqIFNob3cgZWxlbWVudHMgYW5kIHRleHQgKi8pO1xyXG4gICAgICAgIHdoaWxlKHRyZWVXYWxrZXIubmV4dE5vZGUoKSkge1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudE5vZGUgPSB0cmVlV2Fsa2VyLmN1cnJlbnROb2RlO1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgZWxlbWVudCwgdHJhdmVyc2UgYXR0cmlidXRlc1xyXG4gICAgICAgICAgICBpZiAoY3VycmVudE5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGN1cnJlbnROb2RlLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50QXR0cmlidXRlID0gY3VycmVudE5vZGUuYXR0cmlidXRlc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudEF0dHJpYnV0ZS50ZXh0Q29udGVudC5pbmRleE9mKHZhbHVlTWFya2VyKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRleHQgbm9kZSBjYW4gY29udGFpbiBtb3JlIHRoYW4gb25lIG1hcmtlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBtdXN0IHNhdmUgdGhlIHdob2xlIHN0cmluZyB3aXRoIG1hcmtlcnMgYW5kXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJ1aWxkIHdob2xlIHN0cmluZyBvbiBlYWNoIHZhbHVlIGNoYW5nZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gY3VycmVudEF0dHJpYnV0ZS50ZXh0Q29udGVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWVzQ291bnQgPSAodGV4dC5tYXRjaChuZXcgUmVnRXhwKHZhbHVlTWFya2VyLCAnZ2knKSkgfHwgW10pLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZVZhbHVlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2F0dHJpYnV0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXI6IGN1cnJlbnRBdHRyaWJ1dGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogY3VycmVudEF0dHJpYnV0ZS50ZXh0Q29udGVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlczogW11cclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvciBlYWNoIHZhbHVlIG1hcmtlciwgc2F2ZSBpdHMgaW5kZXggaW4gdGVtcGxhdGUgc3RyaW5nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzQ291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlVmFsdWUudmFsdWVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiB2YWx1ZUluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZTogdmFsdWVNYXJrZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWU6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKGF0dHJpYnV0ZVZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlSW5kZXgrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIGl0J3Mgbm90IGFuIGVsZW1lbnQsIG11c3QgYmUgaW4gYSB0ZXh0IHBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudE5vZGUudGV4dENvbnRlbnQuaW5kZXhPZih2YWx1ZU1hcmtlcikgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRleHQgbm9kZSBjYW4gY29udGFpbiBtb3JlIHRoYW4gb25lIG1hcmtlclxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHNlZSBob3cgbWFueSB2YWx1ZSBtYXJrZXJzIGFyZSB3aXRoaW4gdGV4dCBub2RlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IGN1cnJlbnROb2RlLnRleHRDb250ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlc0NvdW50ID0gKHRleHQubWF0Y2gobmV3IFJlZ0V4cCh2YWx1ZU1hcmtlciwgJ2dpJykpIHx8IFtdKS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHRWYWx1ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXI6IGN1cnJlbnROb2RlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogY3VycmVudE5vZGUudGV4dENvbnRlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlczogW11cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBmb3IgZWFjaCB2YWx1ZSBtYXJrZXIsIHNhdmUgaXRzIGluZGV4IGluIHRlbXBsYXRlIHN0cmluZ1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzQ291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0VmFsdWUudmFsdWVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IHZhbHVlSW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IHZhbHVlTWFya2VyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWU6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaCh0ZXh0VmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZUluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlciAodmFsdWVzOiBhbnlbXSkge1xyXG4gICAgICAgIHZhbHVlcy5mb3JFYWNoKCh2YWx1ZSwgaSkgPT4ge1xyXG4gICAgICAgICAgICAvLyBncmFiIG5vZGUgc2F2ZWQgZm9yIHZhbHVlIGFuZCB1cGRhdGUgd2l0aCBuZXcgdmFsdWVcclxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuY2hpbGRyZW5baV07XHJcbiAgICAgICAgICAgIHN3aXRjaCAobm9kZS50eXBlKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhdHRyaWJ1dGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IDxBdHRyPm5vZGUuY29udGFpbmVyO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGZpbmQgdGhlIGF0dHJpYnV0ZSBwYXJ0IHRoYXQgY29ycmVzcG9uZHMgd2l0aFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgdmFsdWUgaW5kZXhcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVWYWx1ZXMgPSBub2RlLnZhbHVlcztcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50VmFsdWUgPSBhdHRyaWJ1dGVWYWx1ZXMuZmluZCh2YWwgPT4gdmFsLmluZGV4ID09PSBpKTtcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWUub2xkVmFsdWUgPSBjdXJyZW50VmFsdWUuY3VycmVudFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZS5jdXJyZW50VmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAvLyByZWJ1aWxkIHRlbXBsYXRlIGZyb20gYWxsIGN1cnJlbnQgdmFsdWVzXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHN0ciA9IG5vZGUudGVtcGxhdGU7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGVWYWx1ZXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyID0gc3RyLnJlcGxhY2UodmFsdWVNYXJrZXIsIGF0dHJpYnV0ZVZhbHVlc1tqXS5jdXJyZW50VmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGUudGV4dENvbnRlbnQgPSBzdHI7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd0ZXh0JzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBmaW5kIHRoZSBhdHRyaWJ1dGUgcGFydCB0aGF0IGNvcnJlc3BvbmRzIHdpdGhcclxuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHZhbHVlIGluZGV4XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgbm9kZVZhbHVlID0gbm9kZS52YWx1ZXMuZmluZChhc2RmID0+IGFzZGYuaW5kZXggPT09IGkpO1xyXG4gICAgICAgICAgICAgICAgICAgIG5vZGVWYWx1ZS5vbGRWYWx1ZSA9IG5vZGVWYWx1ZS5jdXJyZW50VmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZVZhbHVlLmN1cnJlbnRWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlYnVpbGQgdGVtcGxhdGUgZnJvbSBhbGwgY3VycmVudCB2YWx1ZXNcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbmV3VGV4dENvbnRlbnQgPSBub2RlLnRlbXBsYXRlO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbm9kZS52YWx1ZXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3VGV4dENvbnRlbnQgPSBuZXdUZXh0Q29udGVudC5yZXBsYWNlKHZhbHVlTWFya2VyLCBub2RlLnZhbHVlc1tqXS5jdXJyZW50VmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBub2RlLmNvbnRhaW5lci50ZXh0Q29udGVudCA9IG5ld1RleHRDb250ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBaZW5Ob2RlIH0gZnJvbSAnLi96ZW4tbm9kZSc7XHJcbmltcG9ydCB7IFplblRlbXBsYXRlIH0gZnJvbSAnLi96ZW4tdGVtcGxhdGUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGNvbnRhaW5lckNhY2hlID0gbmV3IFdlYWtNYXA8Tm9kZSwgWmVuTm9kZT4oKTtcclxuZXhwb3J0IGNvbnN0IHJlbmRlciA9IGZ1bmN0aW9uICh6ZW5UZW1wbGF0ZTogWmVuVGVtcGxhdGUsIGNvbnRhaW5lcjogTm9kZSkge1xyXG4gICAgLy8gY2hlY2sgaWYgemVuIHRlbXBsYXRlIGhhcyBiZWVuIHJlbmRlcmVkIGFuZCBjYWNoZWRcclxuICAgIGxldCB6ZW5SZW5kZXIgPSBjb250YWluZXJDYWNoZS5nZXQoY29udGFpbmVyKTtcclxuICAgIGlmICghemVuUmVuZGVyKSB7XHJcbiAgICAgICAgLy8gY3JlYXRlIHplbiByZW5kZXIgYW5kIGNhY2hlXHJcbiAgICAgICAgemVuUmVuZGVyID0gbmV3IFplbk5vZGUoemVuVGVtcGxhdGUuZ2V0VGVtcGxhdGUoKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKSk7XHJcbiAgICAgICAgY29udGFpbmVyQ2FjaGUuc2V0KGNvbnRhaW5lciwgemVuUmVuZGVyKTtcclxuICAgICAgICAvLyBpbnNlcnQgaW50byBjb250YWluZXJcclxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoemVuUmVuZGVyLnJvb3ROb2RlKTtcclxuICAgIH1cclxuICAgIHplblJlbmRlci5yZW5kZXIoemVuVGVtcGxhdGUudmFsdWVzKTtcclxufSIsImltcG9ydCB7IFplblRlbXBsYXRlIH0gZnJvbSAnLi96ZW4tdGVtcGxhdGUnO1xyXG5pbXBvcnQgeyByZW5kZXIgfSBmcm9tICcuL3JlbmRlcic7XHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgWmVuRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiAnb3BlbicgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29ubmVjdGVkQ2FsbGJhY2sgKCkge1xyXG4gICAgICAgIHJlbmRlcih0aGlzLnJlbmRlcigpLCB0aGlzLnNoYWRvd1Jvb3QpO1xyXG4gICAgfVxyXG5cclxuICAgIGFic3RyYWN0IHJlbmRlcih2YWx1ZXM/OiBhbnlbXSk6IFplblRlbXBsYXRlO1xyXG59IiwiaW1wb3J0IHsgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcblxyXG5leHBvcnQgY29uc3QgemVuVGVtcGxhdGVDYWNoZSA9IG5ldyBXZWFrTWFwPFRlbXBsYXRlU3RyaW5nc0FycmF5LCBaZW5UZW1wbGF0ZT4oKTtcclxuZXhwb3J0IGNvbnN0IHplbiA9IGZ1bmN0aW9uIChzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSwgLi4udmFsdWVzOiBhbnlbXSkge1xyXG4gICAgLy8gY2hlY2sgaWYgdGhpcyB0ZW1wbGF0ZSBzdHJpbmcgYXJyYXkgaGFzIGJlZW4gY2FjaGVkXHJcbiAgICBsZXQgemVuVGVtcGxhdGUgPSB6ZW5UZW1wbGF0ZUNhY2hlLmdldChzdHJpbmdzKTtcclxuICAgIGlmICghemVuVGVtcGxhdGUpIHtcclxuICAgICAgICAvLyBjcmVhdGUgYW5kIGNhY2hlIHRlbXBsYXRlXHJcbiAgICAgICAgemVuVGVtcGxhdGUgPSBuZXcgWmVuVGVtcGxhdGUoc3RyaW5ncywgdmFsdWVzKTtcclxuICAgICAgICB6ZW5UZW1wbGF0ZUNhY2hlLnNldChzdHJpbmdzLCB6ZW5UZW1wbGF0ZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gemVuVGVtcGxhdGU7XHJcbn1cclxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJNQUFhLFdBQVcsR0FBRyxPQUFPLENBQUM7QUFDbkMsTUFBYSxXQUFXO0lBSXBCLFlBQVksT0FBNkIsRUFBRSxNQUFhO1FBQ3BELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDeEM7Ozs7SUFLRCxLQUFLLENBQUUsT0FBNkI7UUFDaEMsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxLQUFLO1lBQzNCLElBQUksSUFBSSxPQUFPLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLFdBQVcsR0FBRyxFQUFFLENBQUMsQ0FBQztTQUNyRSxDQUFDLENBQUM7UUFDSCxPQUFPLElBQUksQ0FBQztLQUNmO0lBRUQsV0FBVztRQUNQLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEQsUUFBUSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQy9CLE9BQU8sUUFBUSxDQUFDO0tBQ25CO0NBQ0o7O01DekJZLE9BQU87SUFHaEIsWUFBYSxJQUFVO1FBRHZCLGFBQVEsR0FB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
