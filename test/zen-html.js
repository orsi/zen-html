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
                    this.renderText(renderable);
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
     * Renders a new text value.
     * @param renderable a dynamic text node
     */
    renderText(renderable) {
        renderable.container.textContent = renderable.values[0].currentValue;
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

export { ZenElement, DynamicNode, dynamicMarker, ZenTemplate, zenTemplateCache, zen, containerCache, render };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemVuLWh0bWwuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy96ZW4tdGVtcGxhdGUudHMiLCIuLi9zcmMvZHluYW1pYy1ub2RlLnRzIiwiLi4vc3JjL3JlbmRlci50cyIsIi4uL3NyYy96ZW4tZWxlbWVudC50cyIsIi4uL3NyYy96ZW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IGR5bmFtaWNNYXJrZXIgPSAn4p2NJztcclxuZXhwb3J0IGNsYXNzIFplblRlbXBsYXRlIHtcclxuICAgIGh0bWw6IHN0cmluZyA9ICcnO1xyXG4gICAgc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXk7XHJcbiAgICB2YWx1ZXM6IGFueVtdO1xyXG4gICAgY29uc3RydWN0b3Ioc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIHZhbHVlczogYW55W10pIHtcclxuICAgICAgICB0aGlzLnN0cmluZ3MgPSBzdHJpbmdzO1xyXG4gICAgICAgIHRoaXMudmFsdWVzID0gdmFsdWVzO1xyXG4gICAgICAgIHRoaXMucGFyc2UodGhpcy5zdHJpbmdzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFBhcnNlcyB0aGUgdGVtcGxhdGUgc3RyaW5ncyBhbmQgcmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvblxyXG4gICAgICogb2YgYW4gZWxlbWVudCB3aXRoIHZhbHVlIHBvc2l0aW9ucyByZXBsYWNlZCBieSBtYXJrZXJzLlxyXG4gICAgICogQHBhcmFtIHN0cmluZ3NcclxuICAgICAqL1xyXG4gICAgcGFyc2UgKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5KSB7XHJcbiAgICAgICAgc3RyaW5ncy5mb3JFYWNoKChlbGVtZW50LCBpKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuaHRtbCArPSBlbGVtZW50ICsgKGkgPCBzdHJpbmdzLmxlbmd0aCAtIDEgPyBkeW5hbWljTWFya2VyIDogJycpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhbmQgcmV0dXJucyBhbiBIVE1MIFRlbXBsYXRlIGVsZW1lbnQgZnJvbSB0aGVcclxuICAgICAqIHJhdyBzdHJpbmcuXHJcbiAgICAgKi9cclxuICAgIGdldFRlbXBsYXRlICgpOiBIVE1MVGVtcGxhdGVFbGVtZW50IHtcclxuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XHJcbiAgICAgICAgdGVtcGxhdGUuaW5uZXJIVE1MID0gdGhpcy5odG1sO1xyXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENsb25lcyBhbiBlbGVtZW50IHVzaW5nIHRoaXMgdGVtcGxhdGUuXHJcbiAgICAgKi9cclxuICAgIGNsb25lKCk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRUZW1wbGF0ZSgpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpIGFzIEhUTUxFbGVtZW50O1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgZHluYW1pY01hcmtlciB9IGZyb20gJy4vemVuLXRlbXBsYXRlJztcclxuXHJcbmV4cG9ydCBjbGFzcyBEeW5hbWljTm9kZSB7XHJcbiAgICB2YWx1ZXM6IER5bmFtaWNWYWx1ZVtdID0gW107XHJcbiAgICByZW5kZXJhYmxlczogUmVuZGVyYWJsZUFyZWFbXSA9IFtdO1xyXG4gICAgY29uc3RydWN0b3IgKG5vZGU6IE5vZGUpIHtcclxuICAgICAgICB0aGlzLnBhcnNlKG5vZGUpO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBVcGRhdGVzIGFsbCB2YWx1ZXMgY29udGFpbmVkIGluIHRoZSBkeW5hbWljIG5vZGUuXHJcbiAgICAgKiBAcGFyYW0gdmFsdWVzIGFycmF5IG9mIHZhbHVlcyBmcm9tIGEgemVuIHRlbXBsYXRlXHJcbiAgICAgKi9cclxuICAgIHVwZGF0ZSAodmFsdWVzOiBhbnlbXSkge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tpXTtcclxuICAgICAgICAgICAgbGV0IGR5bmFtaWNWYWx1ZSA9IHRoaXMudmFsdWVzW2ldO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IGR5bmFtaWNWYWx1ZS5jdXJyZW50VmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIGF2b2lkIHVubmVjY2Vzc2FyeSB1cGRhdGVzXHJcbiAgICAgICAgICAgICAgICBkeW5hbWljVmFsdWUub2xkVmFsdWUgPSBkeW5hbWljVmFsdWUuY3VycmVudFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgZHluYW1pY1ZhbHVlLmN1cnJlbnRWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIgKCkge1xyXG4gICAgICAgIGZvciAobGV0IHJlbmRlcmFibGUgb2YgdGhpcy5yZW5kZXJhYmxlcykge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHJlbmRlcmFibGUuYXJlYSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYXR0cmlidXRlJzpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckF0dHJpYnV0ZShyZW5kZXJhYmxlKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHRDb250ZW50JzpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlclRleHQocmVuZGVyYWJsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwYXJzZSAobm9kZTogTm9kZSkge1xyXG4gICAgICAgIC8vIHdhbGsgb3ZlciB0aGUgZWxlbWVudCBhbmQgc2F2ZSBhbGwgZHluYW1pYyBtYXJrZXIgbm9kZXNcclxuICAgICAgICBjb25zdCB0cmVlV2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihub2RlLCA1IC8qKiBvbmx5IGVsZW1lbnRzIGFuZCB0ZXh0ICovKTtcclxuICAgICAgICB3aGlsZSh0cmVlV2Fsa2VyLm5leHROb2RlKCkpIHtcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudE5vZGUgPSB0cmVlV2Fsa2VyLmN1cnJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAoY3VycmVudE5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiBlbGVtZW50LCB0cmF2ZXJzZSBhdHRyaWJ1dGVzXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGN1cnJlbnROb2RlLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY3VycmVudEF0dHJpYnV0ZSA9IGN1cnJlbnROb2RlLmF0dHJpYnV0ZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRBdHRyaWJ1dGUudGV4dENvbnRlbnQuaW5kZXhPZihkeW5hbWljTWFya2VyKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhcnNlIGR5bmFtaWMgdmFsdWVzIGluIGF0dHJpYnV0ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZXh0Q29udGVudCA9IGN1cnJlbnRBdHRyaWJ1dGUudGV4dENvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoZXMgPSB0ZXh0Q29udGVudC5tYXRjaChuZXcgUmVnRXhwKGR5bmFtaWNNYXJrZXIsICdnJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkeW5hbWljVmFsdWVzQ291bnQgPSBtYXRjaGVzID8gbWF0Y2hlcy5sZW5ndGggOiAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkeW5hbWljVmFsdWVzOiBEeW5hbWljVmFsdWVbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGR5bmFtaWNWYWx1ZXNDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkeW5hbWljVmFsdWVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZTogZHluYW1pY01hcmtlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRWYWx1ZTogbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZXMgPSB0aGlzLnZhbHVlcy5jb25jYXQoZHluYW1pY1ZhbHVlcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgcmVuZGVyYWJsZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmFibGVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJlYTogJ2F0dHJpYnV0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXI6IGN1cnJlbnRBdHRyaWJ1dGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogY3VycmVudEF0dHJpYnV0ZS50ZXh0Q29udGVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlczogZHluYW1pY1ZhbHVlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudE5vZGUudGV4dENvbnRlbnQuaW5kZXhPZihkeW5hbWljTWFya2VyKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiBpdCdzIG5vdCBhbiBlbGVtZW50LCBtdXN0IGJlIGluIGEgdGV4dCBwb3NpdGlvblxyXG5cclxuICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICogV2UgY2FuIGJyZWFrIHRoZSB0ZXh0Q29udGVudCBzdHJpbmcgaW50byBtdWx0aXBsZVxyXG4gICAgICAgICAgICAgICAgICogVGV4dE5vZGVzLCBzbyB0aGF0IGVhY2ggZHluYW1pYyBwYXJ0IGlzIGlzb2xhdGVkIGFuZFxyXG4gICAgICAgICAgICAgICAgICogY2FuIHVwZGF0ZSBieSBpdHNlbGYuXHJcbiAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgIGNvbnN0IGR5bmFtaWNNYXJrZXJJbmRpY2VzID0gW107XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0UGFydHMgPSBbXTtcclxuICAgICAgICAgICAgICAgIGxldCB0ZXh0Q29udGVudCA9IGN1cnJlbnROb2RlLnRleHRDb250ZW50O1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRleHRDb250ZW50ICE9PSAnJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwYXJ0O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlSW5kZXggPSB0ZXh0Q29udGVudC5pbmRleE9mKGR5bmFtaWNNYXJrZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZUluZGV4ID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0ZXh0IGNvbnRlbnQgYmVmb3JlIHZhbHVlIG1hcmtlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJ0ID0gdGV4dENvbnRlbnQuc3Vic3RyaW5nKDAsIHZhbHVlSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0Q29udGVudCA9IHRleHRDb250ZW50LnN1YnN0cmluZyh2YWx1ZUluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlSW5kZXggPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdmFsdWUgbWFya2VyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR5bmFtaWNNYXJrZXJJbmRpY2VzLnB1c2godGV4dFBhcnRzLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnQgPSB0ZXh0Q29udGVudC5zdWJzdHJpbmcoMCwgZHluYW1pY01hcmtlci5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0Q29udGVudCA9IHRleHRDb250ZW50LnN1YnN0cmluZyhkeW5hbWljTWFya2VyLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbGFzdCB0ZXh0IGNvbnRlbnQgYWZ0ZXIgdmFsdWUgbWFya2VyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnQgPSB0ZXh0Q29udGVudC5zdWJzdHJpbmcoMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHRDb250ZW50ID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRleHRQYXJ0cy5wdXNoKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHBhcnQpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBlbXB0eSBjdXJyZW50IG5vZGUgYW5kIHJlcGxhY2Ugd2l0aCB0ZXh0IG5vZGVzXHJcbiAgICAgICAgICAgICAgICAvLyAqKiB3YXJuaW5nOiBjYW4ndCBhcHBlbmRDaGlsZCgpIG9yIGVsc2Ugd2Fsa2VyXHJcbiAgICAgICAgICAgICAgICAvLyAqKiB3aWxsIGtlZXAgYWRkaW5nIGFuZCB3YWxraW5nIG92ZXIgbm9kZXMgKipcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSBjdXJyZW50Tm9kZS5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0UGFydHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnROb2RlLmluc2VydEJlZm9yZSh0ZXh0UGFydHNbaV0sIGN1cnJlbnROb2RlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyByZW1vdmUgY3VycmVudCBub2RlIGZyb20gcGFyZW50IG5vdyB0aGF0IHdlJ3ZlXHJcbiAgICAgICAgICAgICAgICAvLyByZXBsYWNlZCBhbGwgdGV4dCBwYXJ0cyB3aXRoaW4gaXRcclxuICAgICAgICAgICAgICAgIHBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY3VycmVudE5vZGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSB2YWx1ZXMgYW5kIHJlbmRlcmFibGVzIGZvciBlYWNoXHJcbiAgICAgICAgICAgICAgICAvLyBkeW5hbWljIHZhbHVlXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGR5bmFtaWNNYXJrZXJJbmRpY2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZHluYW1pY1ZhbHVlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IGR5bmFtaWNNYXJrZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sZFZhbHVlOiBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlcy5wdXNoKGR5bmFtaWNWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJhYmxlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJlYTogJ3RleHRDb250ZW50JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyOiB0ZXh0UGFydHNbZHluYW1pY01hcmtlckluZGljZXNbaV1dLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogZHluYW1pY01hcmtlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzOiBbZHluYW1pY1ZhbHVlXVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVuZGVycyBhIG5ldyBhdHRyaWJ1dGUgdmFsdWUgYnlcclxuICAgICAqIHJlYnVpbGRpbmcgdGhlIHJhdyBzdHJpbmcgYW5kIHJlcGxhY2luZ1xyXG4gICAgICogZWFjaCBkeW5hbWljIHBhcnQgd2l0aCB0aGVpciBjdXJyZW50IHZhbHVlc1xyXG4gICAgICogQHBhcmFtIHJlbmRlcmFibGUgYSBkeW5hbWljIGF0dHJpYnV0ZSB2YWx1ZVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHJlbmRlckF0dHJpYnV0ZShyZW5kZXJhYmxlOiBSZW5kZXJhYmxlQXJlYSkge1xyXG4gICAgICAgIGxldCBhdHRyaWJ1dGVWYWx1ZSA9IHJlbmRlcmFibGUudGVtcGxhdGU7XHJcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCByZW5kZXJhYmxlLnZhbHVlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBhdHRyaWJ1dGVWYWx1ZSA9IGF0dHJpYnV0ZVZhbHVlLnJlcGxhY2UoZHluYW1pY01hcmtlciwgcmVuZGVyYWJsZS52YWx1ZXNbal0uY3VycmVudFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVuZGVyYWJsZS5jb250YWluZXIudGV4dENvbnRlbnQgPSBhdHRyaWJ1dGVWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbmRlcnMgYSBuZXcgdGV4dCB2YWx1ZS5cclxuICAgICAqIEBwYXJhbSByZW5kZXJhYmxlIGEgZHluYW1pYyB0ZXh0IG5vZGVcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSByZW5kZXJUZXh0KHJlbmRlcmFibGU6IFJlbmRlcmFibGVBcmVhKSB7XHJcbiAgICAgICAgcmVuZGVyYWJsZS5jb250YWluZXIudGV4dENvbnRlbnQgPSByZW5kZXJhYmxlLnZhbHVlc1swXS5jdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBEeW5hbWljVmFsdWUge1xyXG4gICAgY3VycmVudFZhbHVlOiBhbnk7XHJcbiAgICBvbGRWYWx1ZTogYW55O1xyXG59XHJcbmludGVyZmFjZSBSZW5kZXJhYmxlQXJlYSB7XHJcbiAgICBhcmVhOiAndGV4dENvbnRlbnQnIHwgJ2F0dHJpYnV0ZSc7XHJcbiAgICBjb250YWluZXI6IE5vZGU7XHJcbiAgICB0ZW1wbGF0ZTogc3RyaW5nO1xyXG4gICAgdmFsdWVzOiBEeW5hbWljVmFsdWVbXTtcclxufSIsImltcG9ydCB7IER5bmFtaWNOb2RlIH0gZnJvbSAnLi9keW5hbWljLW5vZGUnO1xyXG5pbXBvcnQgeyBaZW5UZW1wbGF0ZSB9IGZyb20gJy4vemVuLXRlbXBsYXRlJztcclxuXHJcbi8qKlxyXG4gKiBBIGNhY2hlIG9mIGR5YW5taWMgbm9kZXMgcmVuZGVyZWQgaW50byBjb250YWluZXJzLlxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGNvbnRhaW5lckNhY2hlID0gbmV3IFdlYWtNYXA8Tm9kZSwgRHluYW1pY05vZGU+KCk7XHJcblxyXG4vKipcclxuICogUmVuZGVycyBhIHplbiB0ZW1wbGF0ZSBpbnRvIGEgY29udGFpbmVyIERPTSBlbGVtZW50LlxyXG4gKiBAcGFyYW0gemVuVGVtcGxhdGUgQSB6ZW4gdGVtcGxhdGUgdG8gcmVuZGVyIGludG8gdGhlIERPTVxyXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBET00gZWxlbWVudCB0byByZW5kZXIgaW50b1xyXG4gKi9cclxuZXhwb3J0IGNvbnN0IHJlbmRlciA9IGZ1bmN0aW9uICh6ZW5UZW1wbGF0ZTogWmVuVGVtcGxhdGUsIGNvbnRhaW5lcjogTm9kZSkge1xyXG4gICAgLy8gY2hlY2sgaWYgemVuIHRlbXBsYXRlIGhhcyBiZWVuIHJlbmRlcmVkIGFuZCBjYWNoZWRcclxuICAgIGxldCBkeW5hbWljTm9kZSA9IGNvbnRhaW5lckNhY2hlLmdldChjb250YWluZXIpO1xyXG4gICAgaWYgKCFkeW5hbWljTm9kZSkge1xyXG4gICAgICAgIC8vIGNvbnRhaW5lciBoYXMgbm90IGJlZW4gcmVuZGVyZWQgaW50byBiZWZvcmUuXHJcbiAgICAgICAgLy8gY2xvbmUsIHBhcnNlLCBhbmQgaW5zZXJ0IHRlbXBsYXRlXHJcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSB6ZW5UZW1wbGF0ZS5jbG9uZSgpO1xyXG4gICAgICAgIGR5bmFtaWNOb2RlID0gbmV3IER5bmFtaWNOb2RlKHRlbXBsYXRlKTtcclxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGVtcGxhdGUpO1xyXG4gICAgICAgIGNvbnRhaW5lckNhY2hlLnNldChjb250YWluZXIsIGR5bmFtaWNOb2RlKTtcclxuICAgIH1cclxuICAgIGR5bmFtaWNOb2RlLnVwZGF0ZSh6ZW5UZW1wbGF0ZS52YWx1ZXMpO1xyXG4gICAgZHluYW1pY05vZGUucmVuZGVyKCk7XHJcbn0iLCJpbXBvcnQgeyBaZW5UZW1wbGF0ZSB9IGZyb20gJy4vemVuLXRlbXBsYXRlJztcclxuaW1wb3J0IHsgcmVuZGVyIH0gZnJvbSAnLi9yZW5kZXInO1xyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFplbkVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbm5lY3RlZENhbGxiYWNrICgpIHtcclxuICAgICAgICByZW5kZXIodGhpcy5yZW5kZXIoKSwgdGhpcy5zaGFkb3dSb290KTtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCByZW5kZXIodmFsdWVzPzogYW55W10pOiBaZW5UZW1wbGF0ZTtcclxufSIsImltcG9ydCB7IFplblRlbXBsYXRlIH0gZnJvbSAnLi96ZW4tdGVtcGxhdGUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IHplblRlbXBsYXRlQ2FjaGUgPSBuZXcgV2Vha01hcDxUZW1wbGF0ZVN0cmluZ3NBcnJheSwgWmVuVGVtcGxhdGU+KCk7XHJcbmV4cG9ydCBjb25zdCB6ZW4gPSBmdW5jdGlvbiAoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIC4uLnZhbHVlczogYW55W10pIHtcclxuICAgIC8vIGNoZWNrIGlmIHRoaXMgdGVtcGxhdGUgc3RyaW5nIGFycmF5IGhhcyBiZWVuIGNhY2hlZFxyXG4gICAgbGV0IHplblRlbXBsYXRlID0gemVuVGVtcGxhdGVDYWNoZS5nZXQoc3RyaW5ncyk7XHJcbiAgICBpZiAoIXplblRlbXBsYXRlKSB7XHJcbiAgICAgICAgLy8gY3JlYXRlIGFuZCBjYWNoZSB0ZW1wbGF0ZVxyXG4gICAgICAgIHplblRlbXBsYXRlID0gbmV3IFplblRlbXBsYXRlKHN0cmluZ3MsIHZhbHVlcyk7XHJcbiAgICAgICAgemVuVGVtcGxhdGVDYWNoZS5zZXQoc3RyaW5ncywgemVuVGVtcGxhdGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHplblRlbXBsYXRlO1xyXG59XHJcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiTUFBYSxhQUFhLEdBQUcsR0FBRyxDQUFDO0FBQ2pDLE1BQWEsV0FBVztJQUlwQixZQUFZLE9BQTZCLEVBQUUsTUFBYTtRQUh4RCxTQUFJLEdBQVcsRUFBRSxDQUFDO1FBSWQsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMs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
