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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemVuLWh0bWwuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy96ZW4tdGVtcGxhdGUudHMiLCIuLi9zcmMvemVuLW5vZGUudHMiLCIuLi9zcmMvcmVuZGVyLnRzIiwiLi4vc3JjL3plbi1lbGVtZW50LnRzIiwiLi4vc3JjL3plbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgZHluYW1pY01hcmtlciA9IGAlemVuJWA7XHJcbmV4cG9ydCBjbGFzcyBaZW5UZW1wbGF0ZSB7XHJcbiAgICBwcml2YXRlIHN0cmluZ3M7XHJcbiAgICBwcml2YXRlIGh0bWw7XHJcbiAgICB2YWx1ZXM6IGFueVtdO1xyXG4gICAgY29uc3RydWN0b3Ioc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIHZhbHVlczogYW55W10pIHtcclxuICAgICAgICB0aGlzLnN0cmluZ3MgPSBzdHJpbmdzO1xyXG4gICAgICAgIHRoaXMudmFsdWVzID0gdmFsdWVzO1xyXG4gICAgICAgIHRoaXMuaHRtbCA9IHRoaXMucGFyc2UodGhpcy5zdHJpbmdzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogUGFyc2VzIHRoZSB0ZW1wbGF0ZSBzdHJpbmdzIGFuZCByZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uXHJcbiAgICAgKiBvZiBhbiBlbGVtZW50IHdpdGggdmFsdWVzIHJlcGxhY2VkIGJ5IG1hcmtlcnMuXHJcbiAgICAgKi9cclxuICAgIHBhcnNlIChzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSk6IHN0cmluZyB7XHJcbiAgICAgICAgbGV0IGh0bWwgPSAnJztcclxuICAgICAgICBzdHJpbmdzLmZvckVhY2goKGVsZW1lbnQsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIGh0bWwgKz0gZWxlbWVudCArIChpbmRleCA8IHN0cmluZ3MubGVuZ3RoIC0gMSA/IGR5bmFtaWNNYXJrZXIgOiAnJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGh0bWw7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VGVtcGxhdGUgKCk6IEhUTUxUZW1wbGF0ZUVsZW1lbnQge1xyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcclxuICAgICAgICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSB0aGlzLmh0bWw7XHJcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgZHluYW1pY01hcmtlciB9IGZyb20gJy4vemVuLXRlbXBsYXRlJztcclxuXHJcbmV4cG9ydCBjbGFzcyBaZW5Ob2RlIHtcclxuICAgIGNoaWxkcmVuOiBhbnlbXSA9IFtdO1xyXG4gICAgY29uc3RydWN0b3IgKG5vZGU6IE5vZGUpIHtcclxuICAgICAgICB0aGlzLnBhcnNlKG5vZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlciAodmFsdWVzOiBhbnlbXSkge1xyXG4gICAgICAgIC8vIHZhbHVlcyBzaG91bGQgYWx3YXlzIGVxdWFsIGFuZCBiZSBpbiB0aGUgc2FtZVxyXG4gICAgICAgIC8vIG9yZGVyIGFzIHRoaXMgbm9kZSdzIGNoaWxkcmVuXHJcbiAgICAgICAgbGV0IGR5bmFtaWNWYWx1ZTtcclxuICAgICAgICBsZXQgdmFsdWU7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgLy8gdXBkYXRlIGR5bmFtaWMgdmFsdWUgYW5kIHJlbmRlclxyXG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlc1tpXTtcclxuICAgICAgICAgICAgZHluYW1pY1ZhbHVlID0gdGhpcy5jaGlsZHJlbltpXTtcclxuICAgICAgICAgICAgZHluYW1pY1ZhbHVlLm9sZFZhbHVlID0gZHluYW1pY1ZhbHVlLmN1cnJlbnRWYWx1ZTtcclxuICAgICAgICAgICAgZHluYW1pY1ZhbHVlLmN1cnJlbnRWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGR5bmFtaWNWYWx1ZS50eXBlKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhdHRyaWJ1dGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8qKiBUT0RPXHJcbiAgICAgICAgICAgICAgICAgICAgICogIEF0dHJpYnV0ZXMgc2hvdWxkIG9ubHkgcmVuZGVyIG9uY2UsIGV2ZW4gaWYgaXRcclxuICAgICAgICAgICAgICAgICAgICAgKiAgY29udGFpbnMgbXVsdGlwbGUgZHluYW1pYyB2YWx1ZXMuIEN1cnJlbnRseSB0aGlzXHJcbiAgICAgICAgICAgICAgICAgICAgICogIHdpbGwgcmVuZGVyIGZvciBlYWNoIGR5bmFtaWMgdmFsdWUuXHJcbiAgICAgICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJBdHRyaWJ1dGUoZHluYW1pY1ZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyVGV4dChkeW5hbWljVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHBhcnNlIChub2RlOiBOb2RlKSB7XHJcbiAgICAgICAgLy8gd2FsayBvdmVyIHRoZSBlbGVtZW50IGFuZCBzYXZlIGFsbCBkeW5hbWljIG1hcmtlciBub2Rlc1xyXG4gICAgICAgIGNvbnN0IHRyZWVXYWxrZXIgPSBkb2N1bWVudC5jcmVhdGVUcmVlV2Fsa2VyKG5vZGUsIDUgLyoqIG9ubHkgZWxlbWVudHMgYW5kIHRleHQgKi8pO1xyXG4gICAgICAgIHdoaWxlKHRyZWVXYWxrZXIubmV4dE5vZGUoKSkge1xyXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50Tm9kZSA9IHRyZWVXYWxrZXIuY3VycmVudE5vZGU7XHJcbiAgICAgICAgICAgIGlmIChjdXJyZW50Tm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIGVsZW1lbnQsIHRyYXZlcnNlIGF0dHJpYnV0ZXNcclxuICAgICAgICAgICAgICAgIGxldCBjdXJyZW50QXR0cmlidXRlO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjdXJyZW50Tm9kZS5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEF0dHJpYnV0ZSA9IGN1cnJlbnROb2RlLmF0dHJpYnV0ZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRBdHRyaWJ1dGUudGV4dENvbnRlbnQuaW5kZXhPZihkeW5hbWljTWFya2VyKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyc2VBdHRyaWJ1dGUoY3VycmVudEF0dHJpYnV0ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnROb2RlLnRleHRDb250ZW50LmluZGV4T2YoZHluYW1pY01hcmtlcikgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgaXQncyBub3QgYW4gZWxlbWVudCwgbXVzdCBiZSBpbiBhIHRleHQgcG9zaXRpb25cclxuICAgICAgICAgICAgICAgIHRoaXMucGFyc2VUZXh0KGN1cnJlbnROb2RlIGFzIFRleHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcGFyc2VBdHRyaWJ1dGUoY3VycmVudEF0dHJpYnV0ZTogQXR0cikge1xyXG4gICAgICAgIC8qKiBBdHRyaWJ1dGVzIGNhbiBjb250YWluIG1vcmUgdGhhbiBvbmUgZHluYW1pYyB2YWx1ZVxyXG4gICAgICAgICAqICBhbmQgY2Fubm90IGJlIHVwZGF0ZWQgaW5kaXZpZHVhbGx5LCBzbyB3ZVxyXG4gICAgICAgICAqICBoYXZlIHRvIHNhdmUgdGhlIG9yaWdpbmFsIGF0dHJpYnV0ZSBzdHJpbmdcclxuICAgICAgICAgKiAgYW5kIGJ1aWxkIHRoZSBlbnRpcmUgc3RyaW5nIGZyb20gYWxsIGR5bmFtaWNcclxuICAgICAgICAgKiAgdmFsdWVzIGNvbnRhaW5lZCB3aXRoaW4gaXQgd2hlbiBhIHNpbmdsZVxyXG4gICAgICAgICAqICB2YWx1ZSBjaGFuZ2VzLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNvbnN0IHRleHRDb250ZW50ID0gY3VycmVudEF0dHJpYnV0ZS50ZXh0Q29udGVudDtcclxuICAgICAgICBjb25zdCBtYXRjaGVzID0gdGV4dENvbnRlbnQubWF0Y2gobmV3IFJlZ0V4cChkeW5hbWljTWFya2VyLCAnZycpKTtcclxuICAgICAgICBjb25zdCBkeW5hbWljVmFsdWVzQ291bnQgPSBtYXRjaGVzID8gbWF0Y2hlcy5sZW5ndGggOiAwO1xyXG4gICAgICAgIGNvbnN0IGR5bmFtaWNBdHRyaWJ1dGVWYWx1ZXMgPSBbXTtcclxuICAgICAgICBjb25zdCBhdHRyaWJ1dGVUZW1wbGF0ZSA9IHtcclxuICAgICAgICAgICAgcmF3OiBjdXJyZW50QXR0cmlidXRlLnRleHRDb250ZW50LFxyXG4gICAgICAgICAgICB2YWx1ZXM6IGR5bmFtaWNBdHRyaWJ1dGVWYWx1ZXNcclxuICAgICAgICB9O1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZHluYW1pY1ZhbHVlc0NvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgZHluYW1pY1ZhbHVlID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2F0dHJpYnV0ZScsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogaSxcclxuICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogY3VycmVudEF0dHJpYnV0ZSxcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZTogZHluYW1pY01hcmtlcixcclxuICAgICAgICAgICAgICAgIG9sZFZhbHVlOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IGF0dHJpYnV0ZVRlbXBsYXRlXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGR5bmFtaWNBdHRyaWJ1dGVWYWx1ZXMucHVzaChkeW5hbWljVmFsdWUpOyAvLyBwdXNoIGludG8gYXR0cmlidXRlIHRlbXBsYXRlXHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChkeW5hbWljVmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHBhcnNlVGV4dCh0ZXh0OiBUZXh0KSB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogV2UgY2FuIGJyZWFrIHRoZSB0ZXh0Q29udGVudCBzdHJpbmcgaW50byBtdWx0aXBsZVxyXG4gICAgICAgICAqIFRleHROb2Rlcywgc28gdGhhdCBlYWNoIGR5bmFtaWMgcGFydCBpcyBpc29sYXRlZCBhbmRcclxuICAgICAgICAgKiBjYW4gdXBkYXRlIGJ5IGl0c2VsZi5cclxuICAgICAgICAgKi9cclxuICAgICAgICBjb25zdCB2YWx1ZU1hcmtlckluZGljZXMgPSBbXTtcclxuICAgICAgICBjb25zdCB0ZXh0UGFydHMgPSBbXTtcclxuICAgICAgICBsZXQgdGV4dENvbnRlbnQgPSB0ZXh0LnRleHRDb250ZW50O1xyXG4gICAgICAgIHdoaWxlICh0ZXh0Q29udGVudCAhPT0gJycpIHtcclxuICAgICAgICAgICAgbGV0IHBhcnQ7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlSW5kZXggPSB0ZXh0Q29udGVudC5pbmRleE9mKGR5bmFtaWNNYXJrZXIpO1xyXG4gICAgICAgICAgICBpZiAodmFsdWVJbmRleCAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgLy8gdGV4dCBjb250ZW50IGJlZm9yZSB2YWx1ZSBtYXJrZXJcclxuICAgICAgICAgICAgICAgIHBhcnQgPSB0ZXh0Q29udGVudC5zdWJzdHJpbmcoMCwgdmFsdWVJbmRleCk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0Q29udGVudCA9IHRleHRDb250ZW50LnN1YnN0cmluZyh2YWx1ZUluZGV4KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIHZhbHVlIG1hcmtlclxyXG4gICAgICAgICAgICAgICAgdmFsdWVNYXJrZXJJbmRpY2VzLnB1c2godGV4dFBhcnRzLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICBwYXJ0ID0gdGV4dENvbnRlbnQuc3Vic3RyaW5nKDAsIGR5bmFtaWNNYXJrZXIubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIHRleHRDb250ZW50ID0gdGV4dENvbnRlbnQuc3Vic3RyaW5nKGR5bmFtaWNNYXJrZXIubGVuZ3RoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0ZXh0UGFydHMucHVzaChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShwYXJ0KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBzYXZlIHRoZSBkeW5hbWljIHRleHQgcGFydHNcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlTWFya2VySW5kaWNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICAgICAgY29udGFpbmVyOiB0ZXh0UGFydHNbdmFsdWVNYXJrZXJJbmRpY2VzW2ldXSxcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZTogZHluYW1pY01hcmtlcixcclxuICAgICAgICAgICAgICAgIG9sZFZhbHVlOiBudWxsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZW1wdHkgY3VycmVudCBub2RlIGFuZCByZXBsYWNlIHdpdGggdGV4dCBub2Rlc1xyXG4gICAgICAgIC8vICoqIHdhcm5pbmc6IGNhbid0IGFwcGVuZENoaWxkKCkgb3IgZWxzZSB3YWxrZXJcclxuICAgICAgICAvLyAqKiB3aWxsIGtlZXAgYWRkaW5nIGFuZCB3YWxraW5nIG92ZXIgbm9kZXMgKipcclxuICAgICAgICBjb25zdCBwYXJlbnROb2RlID0gdGV4dC5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dFBhcnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRleHRQYXJ0c1tpXSwgdGV4dCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyByZW1vdmUgY3VycmVudCB0ZXh0IG5vZGUgZnJvbSBwYXJlbnRcclxuICAgICAgICBwYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVuZGVycyBhIG5ldyBhdHRyaWJ1dGUgdmFsdWUgYnlcclxuICAgICAqIHJlYnVpbGRpbmcgdGhlIHJhdyBzdHJpbmcgYW5kIHJlcGxhY2luZ1xyXG4gICAgICogZWFjaCBkeW5hbWljIHBhcnQgd2l0aCB0aGVpciBjdXJyZW50IHZhbHVlc1xyXG4gICAgICogQHBhcmFtIGR5bmFtaWNWYWx1ZSBhIGR5bmFtaWMgYXR0cmlidXRlIHZhbHVlXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgcmVuZGVyQXR0cmlidXRlKGR5bmFtaWNWYWx1ZSkge1xyXG4gICAgICAgIGxldCBuZXdBdHRyaWJ1dGVWYWx1ZSA9IGR5bmFtaWNWYWx1ZS50ZW1wbGF0ZS5yYXc7XHJcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBkeW5hbWljVmFsdWUudGVtcGxhdGUudmFsdWVzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIG5ld0F0dHJpYnV0ZVZhbHVlID0gbmV3QXR0cmlidXRlVmFsdWUucmVwbGFjZShkeW5hbWljTWFya2VyLCBkeW5hbWljVmFsdWUudGVtcGxhdGUudmFsdWVzW2pdLmN1cnJlbnRWYWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR5bmFtaWNWYWx1ZS5jb250YWluZXIudGV4dENvbnRlbnQgPSBuZXdBdHRyaWJ1dGVWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbmRlcnMgYSBuZXcgdGV4dCB2YWx1ZS5cclxuICAgICAqIEBwYXJhbSBkeW5hbWljVmFsdWUgYSBkeW5hbWljIHRleHQgbm9kZVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHJlbmRlclRleHQoZHluYW1pY1ZhbHVlKSB7XHJcbiAgICAgICAgZHluYW1pY1ZhbHVlLmNvbnRhaW5lci50ZXh0Q29udGVudCA9IGR5bmFtaWNWYWx1ZS5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBaZW5Ob2RlIH0gZnJvbSAnLi96ZW4tbm9kZSc7XHJcbmltcG9ydCB7IFplblRlbXBsYXRlIH0gZnJvbSAnLi96ZW4tdGVtcGxhdGUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGNvbnRhaW5lckNhY2hlID0gbmV3IFdlYWtNYXA8Tm9kZSwgWmVuTm9kZT4oKTtcclxuZXhwb3J0IGNvbnN0IHJlbmRlciA9IGZ1bmN0aW9uICh6ZW5UZW1wbGF0ZTogWmVuVGVtcGxhdGUsIGNvbnRhaW5lcjogTm9kZSkge1xyXG4gICAgLy8gY2hlY2sgaWYgemVuIHRlbXBsYXRlIGhhcyBiZWVuIHJlbmRlcmVkIGFuZCBjYWNoZWRcclxuICAgIGxldCB6ZW5SZW5kZXIgPSBjb250YWluZXJDYWNoZS5nZXQoY29udGFpbmVyKTtcclxuICAgIGlmICghemVuUmVuZGVyKSB7XHJcbiAgICAgICAgLy8gY3JlYXRlIHplbiByZW5kZXIsIGNhY2hlLCBhbmQgaW5zZXJ0XHJcbiAgICAgICAgY29uc3QgZHluYW1pY05vZGUgPSB6ZW5UZW1wbGF0ZS5nZXRUZW1wbGF0ZSgpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xyXG4gICAgICAgIHplblJlbmRlciA9IG5ldyBaZW5Ob2RlKGR5bmFtaWNOb2RlKTtcclxuICAgICAgICBjb250YWluZXJDYWNoZS5zZXQoY29udGFpbmVyLCB6ZW5SZW5kZXIpO1xyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChkeW5hbWljTm9kZSk7XHJcbiAgICB9XHJcbiAgICB6ZW5SZW5kZXIucmVuZGVyKHplblRlbXBsYXRlLnZhbHVlcyk7XHJcbn0iLCJpbXBvcnQgeyBaZW5UZW1wbGF0ZSB9IGZyb20gJy4vemVuLXRlbXBsYXRlJztcclxuaW1wb3J0IHsgcmVuZGVyIH0gZnJvbSAnLi9yZW5kZXInO1xyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFplbkVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbm5lY3RlZENhbGxiYWNrICgpIHtcclxuICAgICAgICByZW5kZXIodGhpcy5yZW5kZXIoKSwgdGhpcy5zaGFkb3dSb290KTtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCByZW5kZXIodmFsdWVzPzogYW55W10pOiBaZW5UZW1wbGF0ZTtcclxufSIsImltcG9ydCB7IFplblRlbXBsYXRlIH0gZnJvbSAnLi96ZW4tdGVtcGxhdGUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IHplblRlbXBsYXRlQ2FjaGUgPSBuZXcgV2Vha01hcDxUZW1wbGF0ZVN0cmluZ3NBcnJheSwgWmVuVGVtcGxhdGU+KCk7XHJcbmV4cG9ydCBjb25zdCB6ZW4gPSBmdW5jdGlvbiAoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIC4uLnZhbHVlczogYW55W10pIHtcclxuICAgIC8vIGNoZWNrIGlmIHRoaXMgdGVtcGxhdGUgc3RyaW5nIGFycmF5IGhhcyBiZWVuIGNhY2hlZFxyXG4gICAgbGV0IHplblRlbXBsYXRlID0gemVuVGVtcGxhdGVDYWNoZS5nZXQoc3RyaW5ncyk7XHJcbiAgICBpZiAoIXplblRlbXBsYXRlKSB7XHJcbiAgICAgICAgLy8gY3JlYXRlIGFuZCBjYWNoZSB0ZW1wbGF0ZVxyXG4gICAgICAgIHplblRlbXBsYXRlID0gbmV3IFplblRlbXBsYXRlKHN0cmluZ3MsIHZhbHVlcyk7XHJcbiAgICAgICAgemVuVGVtcGxhdGVDYWNoZS5zZXQoc3RyaW5ncywgemVuVGVtcGxhdGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHplblRlbXBsYXRlO1xyXG59XHJcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiTUFBYSxhQUFhLEdBQUcsT0FBTyxDQUFDO0FBQ3JDLE1BQWEsV0FBVztJQUlwQixZQUFZLE9BQTZCLEVBQUUsTUFBYTtRQUNwRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3hDOzs7O0lBS0QsS0FBSyxDQUFFLE9BQTZCO1FBQ2hDLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNkLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsS0FBSztZQUMzQixJQUFJLElBQUksT0FBTyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxhQUFhLEdBQUcsRUFBRSxDQUFDLENBQUM7U0FDdkUsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxJQUFJLENBQUM7S0FDZjtJQUVELFdBQVc7UUFDUCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3BELFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUMvQixPQUFPLFFBQVEsQ0FBQztLQUNuQjtDQUNKOzs7TUN6QlksT0FBTztJQUVoQixZQUFhLElBQVU7UUFEdkIsYUFBUSxHQUFVLEVBQUUsQ0FBQztRQUVqQixJ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
