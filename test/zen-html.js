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

export { zenTemplateCache, zen, dynamicMarker, ZenTemplate, containerCache, render, templateCache, DynamicNode };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemVuLWh0bWwuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy96ZW4tdGVtcGxhdGUudHMiLCIuLi9zcmMvemVuLnRzIiwiLi4vc3JjL2R5bmFtaWMtbm9kZS50cyIsIi4uL3NyYy9yZW5kZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IGR5bmFtaWNNYXJrZXIgPSAn4p2NJztcclxuZXhwb3J0IGNsYXNzIFplblRlbXBsYXRlIHtcclxuICAgIGh0bWw6IHN0cmluZyA9ICcnO1xyXG4gICAgc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXk7XHJcbiAgICB2YWx1ZXM6IGFueVtdO1xyXG4gICAgY29uc3RydWN0b3Ioc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIHZhbHVlczogYW55W10pIHtcclxuICAgICAgICB0aGlzLnN0cmluZ3MgPSBzdHJpbmdzO1xyXG4gICAgICAgIHRoaXMudmFsdWVzID0gdmFsdWVzO1xyXG4gICAgICAgIHRoaXMucGFyc2UodGhpcy5zdHJpbmdzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFBhcnNlcyB0aGUgdGVtcGxhdGUgc3RyaW5ncyBhbmQgcmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvblxyXG4gICAgICogb2YgYW4gZWxlbWVudCB3aXRoIHZhbHVlIHBvc2l0aW9ucyByZXBsYWNlZCBieSBtYXJrZXJzLlxyXG4gICAgICogQHBhcmFtIHN0cmluZ3NcclxuICAgICAqL1xyXG4gICAgcGFyc2UgKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5KSB7XHJcbiAgICAgICAgc3RyaW5ncy5mb3JFYWNoKChlbGVtZW50LCBpKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuaHRtbCArPSBlbGVtZW50ICsgKGkgPCBzdHJpbmdzLmxlbmd0aCAtIDEgPyBkeW5hbWljTWFya2VyIDogJycpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhbmQgcmV0dXJucyBhbiBIVE1MIFRlbXBsYXRlIGVsZW1lbnQgZnJvbSB0aGVcclxuICAgICAqIHJhdyBzdHJpbmcuXHJcbiAgICAgKi9cclxuICAgIGdldFRlbXBsYXRlICgpOiBIVE1MVGVtcGxhdGVFbGVtZW50IHtcclxuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XHJcbiAgICAgICAgdGVtcGxhdGUuaW5uZXJIVE1MID0gdGhpcy5odG1sO1xyXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENsb25lcyBhbiBlbGVtZW50IHVzaW5nIHRoaXMgdGVtcGxhdGUuXHJcbiAgICAgKi9cclxuICAgIGNsb25lKCk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRUZW1wbGF0ZSgpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpIGFzIEhUTUxFbGVtZW50O1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcblxyXG5leHBvcnQgY29uc3QgemVuVGVtcGxhdGVDYWNoZSA9IG5ldyBXZWFrTWFwPFRlbXBsYXRlU3RyaW5nc0FycmF5LCBaZW5UZW1wbGF0ZT4oKTtcclxuZXhwb3J0IGNvbnN0IHplbiA9IGZ1bmN0aW9uIChzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSwgLi4udmFsdWVzOiBhbnlbXSkge1xyXG4gICAgLy8gY2hlY2sgaWYgdGhpcyB0ZW1wbGF0ZSBzdHJpbmcgYXJyYXkgaGFzIGJlZW4gY2FjaGVkXHJcbiAgICBsZXQgemVuVGVtcGxhdGUgPSB6ZW5UZW1wbGF0ZUNhY2hlLmdldChzdHJpbmdzKTtcclxuICAgIGlmICghemVuVGVtcGxhdGUpIHtcclxuICAgICAgICAvLyBjcmVhdGUgYW5kIGNhY2hlIHRlbXBsYXRlXHJcbiAgICAgICAgemVuVGVtcGxhdGUgPSBuZXcgWmVuVGVtcGxhdGUoc3RyaW5ncywgdmFsdWVzKTtcclxuICAgICAgICB6ZW5UZW1wbGF0ZUNhY2hlLnNldChzdHJpbmdzLCB6ZW5UZW1wbGF0ZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gemVuVGVtcGxhdGU7XHJcbn1cclxuIiwiaW1wb3J0IHsgZHluYW1pY01hcmtlciwgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcbmltcG9ydCB7IHJlbmRlciB9IGZyb20gJy4vcmVuZGVyJztcclxuXHJcbi8qKlxyXG4gKiBBIGNhY2hlIG9mIG5lc3RlZCB0ZW1wbGF0ZXMuXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgdGVtcGxhdGVDYWNoZSA9IG5ldyBXZWFrTWFwPE5vZGUsIER5bmFtaWNOb2RlPigpO1xyXG5cclxuZXhwb3J0IGNsYXNzIER5bmFtaWNOb2RlIHtcclxuICAgIHZhbHVlczogRHluYW1pY1ZhbHVlW10gPSBbXTtcclxuICAgIHJlbmRlcmFibGVzOiBSZW5kZXJhYmxlQXJlYVtdID0gW107XHJcbiAgICBjb25zdHJ1Y3RvciAobm9kZTogTm9kZSkge1xyXG4gICAgICAgIHRoaXMucGFyc2Uobm9kZSk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIFVwZGF0ZXMgYWxsIHZhbHVlcyBjb250YWluZWQgaW4gdGhlIGR5bmFtaWMgbm9kZS5cclxuICAgICAqIEBwYXJhbSB2YWx1ZXMgYXJyYXkgb2YgdmFsdWVzIGZyb20gYSB6ZW4gdGVtcGxhdGVcclxuICAgICAqL1xyXG4gICAgdXBkYXRlICh2YWx1ZXM6IGFueVtdKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW2ldO1xyXG4gICAgICAgICAgICBsZXQgZHluYW1pY1ZhbHVlID0gdGhpcy52YWx1ZXNbaV07XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gZHluYW1pY1ZhbHVlLmN1cnJlbnRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gYXZvaWQgdW5uZWNjZXNzYXJ5IHVwZGF0ZXNcclxuICAgICAgICAgICAgICAgIGR5bmFtaWNWYWx1ZS5vbGRWYWx1ZSA9IGR5bmFtaWNWYWx1ZS5jdXJyZW50VmFsdWU7XHJcbiAgICAgICAgICAgICAgICBkeW5hbWljVmFsdWUuY3VycmVudFZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlciAoKSB7XHJcbiAgICAgICAgZm9yIChsZXQgcmVuZGVyYWJsZSBvZiB0aGlzLnJlbmRlcmFibGVzKSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAocmVuZGVyYWJsZS5hcmVhKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhdHRyaWJ1dGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyQXR0cmlidXRlKHJlbmRlcmFibGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndGV4dENvbnRlbnQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyVGV4dENvbnRlbnQocmVuZGVyYWJsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwYXJzZSAobm9kZTogTm9kZSkge1xyXG4gICAgICAgIC8vIHdhbGsgb3ZlciB0aGUgZWxlbWVudCBhbmQgc2F2ZSBhbGwgZHluYW1pYyBtYXJrZXIgbm9kZXNcclxuICAgICAgICBjb25zdCB0cmVlV2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihub2RlLCA1IC8qKiBvbmx5IGVsZW1lbnRzIGFuZCB0ZXh0ICovKTtcclxuICAgICAgICBjb25zdCBub2Rlc1RvUmVtb3ZlID0gW107XHJcbiAgICAgICAgd2hpbGUodHJlZVdhbGtlci5uZXh0Tm9kZSgpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnROb2RlID0gdHJlZVdhbGtlci5jdXJyZW50Tm9kZTtcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnROb2RlIGluc3RhbmNlb2YgRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgZWxlbWVudCwgdHJhdmVyc2UgYXR0cmlidXRlc1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjdXJyZW50Tm9kZS5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGN1cnJlbnRBdHRyaWJ1dGUgPSBjdXJyZW50Tm9kZS5hdHRyaWJ1dGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50QXR0cmlidXRlLnRleHRDb250ZW50LmluZGV4T2YoZHluYW1pY01hcmtlcikgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJzZSBkeW5hbWljIHZhbHVlcyBpbiBhdHRyaWJ1dGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGV4dENvbnRlbnQgPSBjdXJyZW50QXR0cmlidXRlLnRleHRDb250ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gdGV4dENvbnRlbnQubWF0Y2gobmV3IFJlZ0V4cChkeW5hbWljTWFya2VyLCAnZycpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZHluYW1pY1ZhbHVlc0NvdW50ID0gbWF0Y2hlcyA/IG1hdGNoZXMubGVuZ3RoIDogMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZHluYW1pY1ZhbHVlczogRHluYW1pY1ZhbHVlW10gPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkeW5hbWljVmFsdWVzQ291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHluYW1pY1ZhbHVlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IGR5bmFtaWNNYXJrZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWU6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzID0gdGhpcy52YWx1ZXMuY29uY2F0KGR5bmFtaWNWYWx1ZXMpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRlIHJlbmRlcmFibGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJhYmxlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZWE6ICdhdHRyaWJ1dGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyOiBjdXJyZW50QXR0cmlidXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGU6IGN1cnJlbnRBdHRyaWJ1dGUudGV4dENvbnRlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXM6IGR5bmFtaWNWYWx1ZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnROb2RlLnRleHRDb250ZW50LmluZGV4T2YoZHluYW1pY01hcmtlcikgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgaXQncyBub3QgYW4gZWxlbWVudCwgbXVzdCBiZSBpbiBhIHRleHQgcG9zaXRpb25cclxuXHJcbiAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAqIFdlIGNhbiBicmVhayB0aGUgdGV4dENvbnRlbnQgc3RyaW5nIGludG8gbXVsdGlwbGVcclxuICAgICAgICAgICAgICAgICAqIFRleHROb2Rlcywgc28gdGhhdCBlYWNoIGR5bmFtaWMgcGFydCBpcyBpc29sYXRlZCBhbmRcclxuICAgICAgICAgICAgICAgICAqIGNhbiB1cGRhdGUgYnkgaXRzZWxmLlxyXG4gICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICBjb25zdCBkeW5hbWljTWFya2VySW5kaWNlcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGV4dFBhcnRzID0gW107XHJcbiAgICAgICAgICAgICAgICBsZXQgdGV4dENvbnRlbnQgPSBjdXJyZW50Tm9kZS50ZXh0Q29udGVudDtcclxuICAgICAgICAgICAgICAgIHdoaWxlICh0ZXh0Q29udGVudCAhPT0gJycpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcGFydDtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZUluZGV4ID0gdGV4dENvbnRlbnQuaW5kZXhPZihkeW5hbWljTWFya2VyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWVJbmRleCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGV4dCBjb250ZW50IGJlZm9yZSB2YWx1ZSBtYXJrZXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFydCA9IHRleHRDb250ZW50LnN1YnN0cmluZygwLCB2YWx1ZUluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dENvbnRlbnQgPSB0ZXh0Q29udGVudC5zdWJzdHJpbmcodmFsdWVJbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZUluZGV4ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZhbHVlIG1hcmtlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkeW5hbWljTWFya2VySW5kaWNlcy5wdXNoKHRleHRQYXJ0cy5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJ0ID0gdGV4dENvbnRlbnQuc3Vic3RyaW5nKDAsIGR5bmFtaWNNYXJrZXIubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dENvbnRlbnQgPSB0ZXh0Q29udGVudC5zdWJzdHJpbmcoZHluYW1pY01hcmtlci5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxhc3QgdGV4dCBjb250ZW50IGFmdGVyIHZhbHVlIG1hcmtlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJ0ID0gdGV4dENvbnRlbnQuc3Vic3RyaW5nKDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0Q29udGVudCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0ZXh0UGFydHMucHVzaChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShwYXJ0KSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaW5zZXJ0IG5ldyB0ZXh0IG5vZGVzIGJlZm9yZSBjdXJyZW50IG5vZGVcclxuICAgICAgICAgICAgICAgIC8vICoqIHdhcm5pbmc6IGNhbid0IGFwcGVuZENoaWxkKCkgb3IgZWxzZSB3YWxrZXJcclxuICAgICAgICAgICAgICAgIC8vICoqIHdpbGwga2VlcCBhZGRpbmcgYW5kIHdhbGtpbmcgb3ZlciBub2RlcyAqKlxyXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IGN1cnJlbnROb2RlLnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRQYXJ0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRleHRQYXJ0c1tpXSwgY3VycmVudE5vZGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIG11c3QgY2xlYW4gdXAgYWZ0ZXJ3YXJkIHRvIHByZXZlbnQgd2Fsa2VyIGZyb20gYnJlYWtpbmdcclxuICAgICAgICAgICAgICAgIG5vZGVzVG9SZW1vdmUucHVzaChjdXJyZW50Tm9kZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIHZhbHVlcyBhbmQgcmVuZGVyYWJsZXMgZm9yIGVhY2hcclxuICAgICAgICAgICAgICAgIC8vIGR5bmFtaWMgdmFsdWVcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZHluYW1pY01hcmtlckluZGljZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkeW5hbWljVmFsdWUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZTogZHluYW1pY01hcmtlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWU6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzLnB1c2goZHluYW1pY1ZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcmFibGVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmVhOiAndGV4dENvbnRlbnQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXI6IHRleHRQYXJ0c1tkeW5hbWljTWFya2VySW5kaWNlc1tpXV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBkeW5hbWljTWFya2VyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXM6IFtkeW5hbWljVmFsdWVdXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGNsZWFuIHVwIG9sZCBub2Rlc1xyXG4gICAgICAgIGZvciAobGV0IG5vZGVUb1JlbW92ZSBvZiBub2Rlc1RvUmVtb3ZlKSB7XHJcbiAgICAgICAgICAgIG5vZGVUb1JlbW92ZS5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKG5vZGVUb1JlbW92ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVuZGVycyBhIG5ldyBhdHRyaWJ1dGUgdmFsdWUgYnlcclxuICAgICAqIHJlYnVpbGRpbmcgdGhlIHJhdyBzdHJpbmcgYW5kIHJlcGxhY2luZ1xyXG4gICAgICogZWFjaCBkeW5hbWljIHBhcnQgd2l0aCB0aGVpciBjdXJyZW50IHZhbHVlc1xyXG4gICAgICogQHBhcmFtIHJlbmRlcmFibGUgYSBkeW5hbWljIGF0dHJpYnV0ZSB2YWx1ZVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHJlbmRlckF0dHJpYnV0ZShyZW5kZXJhYmxlOiBSZW5kZXJhYmxlQXJlYSkge1xyXG4gICAgICAgIGxldCBhdHRyaWJ1dGVWYWx1ZSA9IHJlbmRlcmFibGUudGVtcGxhdGU7XHJcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCByZW5kZXJhYmxlLnZhbHVlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBhdHRyaWJ1dGVWYWx1ZSA9IGF0dHJpYnV0ZVZhbHVlLnJlcGxhY2UoZHluYW1pY01hcmtlciwgcmVuZGVyYWJsZS52YWx1ZXNbal0uY3VycmVudFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVuZGVyYWJsZS5jb250YWluZXIudGV4dENvbnRlbnQgPSBhdHRyaWJ1dGVWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbmRlcnMgdmFsdWUgaW50byBhIHRleHRDb250ZW50IGFyZWEuIFByaW1pdGl2ZSB2YWx1ZXNcclxuICAgICAqIGNhbiBiZSBkaXJlY3RseSByZW5kZXJlZCBpbnRvIHRleHRDb250ZW50LCBob3dldmVyLCBaZW5UZW1wbGF0ZVxyXG4gICAgICogdmFsdWVzIG11c3QgYmUgcGFyc2VkIGNvcnJlY3RseS5cclxuICAgICAqIEBwYXJhbSByZW5kZXJhYmxlIGEgZHluYW1pYyB0ZXh0IG5vZGVcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSByZW5kZXJUZXh0Q29udGVudChyZW5kZXJhYmxlOiBSZW5kZXJhYmxlQXJlYSkge1xyXG4gICAgICAgIC8vIGRldGVybWluZSB2YWx1ZVxyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gcmVuZGVyYWJsZS52YWx1ZXNbMF07XHJcbiAgICAgICAgaWYgKHZhbHVlLmN1cnJlbnRWYWx1ZSBpbnN0YW5jZW9mIFplblRlbXBsYXRlKSB7XHJcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoaXMgdGVtcGxhdGUgd2FzIHJlbmRlcmVkIGJlZm9yZVxyXG4gICAgICAgICAgICBpZiAodmFsdWUuY3VycmVudFZhbHVlICE9PSB2YWx1ZS5vbGRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gdGhpcyB0ZW1wbGF0ZSBoYXNuJ3QgYmVlbiByZW5kZXJlZCBiZWZvcmVcclxuICAgICAgICAgICAgICAgIGxldCBkeW5hbWljTm9kZSA9IHRlbXBsYXRlQ2FjaGUuZ2V0KHJlbmRlcmFibGUuY29udGFpbmVyKTtcclxuICAgICAgICAgICAgICAgIGlmICghZHluYW1pY05vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb250YWluZXIgaGFzIG5vdCBiZWVuIHJlbmRlcmVkIGludG8gYmVmb3JlLlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNsb25lLCBwYXJzZSwgYW5kIGluc2VydCB0ZW1wbGF0ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gdmFsdWUuY3VycmVudFZhbHVlLmNsb25lKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZHluYW1pY05vZGUgPSBuZXcgRHluYW1pY05vZGUodGVtcGxhdGUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgY29tbWVudCBtYXJrZXIgYW5kIHJlcGxhY2UgdGV4dCBjb250ZW50XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tbWVudE1hcmtlciA9IGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQoJycpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmFibGUuY29udGFpbmVyLnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNvbW1lbnRNYXJrZXIsIHJlbmRlcmFibGUuY29udGFpbmVyKTtcclxuICAgICAgICAgICAgICAgICAgICByZW5kZXJhYmxlLmNvbnRhaW5lci5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZSh0ZW1wbGF0ZSwgcmVuZGVyYWJsZS5jb250YWluZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmFibGUuY29udGFpbmVyLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQocmVuZGVyYWJsZS5jb250YWluZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmFibGUuY29udGFpbmVyID0gY29tbWVudE1hcmtlcjtcclxuICAgICAgICAgICAgICAgICAgICAvLyBzZXQgY29udGFpbmVyXHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVDYWNoZS5zZXQocmVuZGVyYWJsZS5jb250YWluZXIsIGR5bmFtaWNOb2RlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGR5bmFtaWNOb2RlLnVwZGF0ZSh2YWx1ZS5jdXJyZW50VmFsdWUudmFsdWVzKTtcclxuICAgICAgICAgICAgICAgIGR5bmFtaWNOb2RlLnJlbmRlcigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVuZGVyYWJsZS5jb250YWluZXIudGV4dENvbnRlbnQgPSByZW5kZXJhYmxlLnZhbHVlc1swXS5jdXJyZW50VmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgRHluYW1pY1ZhbHVlIHtcclxuICAgIGN1cnJlbnRWYWx1ZTogYW55O1xyXG4gICAgb2xkVmFsdWU6IGFueTtcclxufVxyXG5pbnRlcmZhY2UgUmVuZGVyYWJsZUFyZWEge1xyXG4gICAgYXJlYTogJ3RleHRDb250ZW50JyB8ICdhdHRyaWJ1dGUnO1xyXG4gICAgY29udGFpbmVyOiBOb2RlO1xyXG4gICAgdGVtcGxhdGU6IHN0cmluZztcclxuICAgIHZhbHVlczogRHluYW1pY1ZhbHVlW107XHJcbn0iLCJpbXBvcnQgeyBEeW5hbWljTm9kZSB9IGZyb20gJy4vZHluYW1pYy1ub2RlJztcclxuaW1wb3J0IHsgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcblxyXG4vKipcclxuICogQSBjYWNoZSBvZiBkeWFubWljIG5vZGVzIHJlbmRlcmVkIGludG8gY29udGFpbmVycy5cclxuICovXHJcbmV4cG9ydCBjb25zdCBjb250YWluZXJDYWNoZSA9IG5ldyBXZWFrTWFwPE5vZGUsIER5bmFtaWNOb2RlPigpO1xyXG5cclxuLyoqXHJcbiAqIFJlbmRlcnMgYSB6ZW4gdGVtcGxhdGUgaW50byBhIGNvbnRhaW5lciBET00gZWxlbWVudC5cclxuICogQHBhcmFtIHplblRlbXBsYXRlIEEgemVuIHRlbXBsYXRlIHRvIHJlbmRlciBpbnRvIHRoZSBET01cclxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgRE9NIGVsZW1lbnQgdG8gcmVuZGVyIGludG9cclxuICovXHJcbmV4cG9ydCBjb25zdCByZW5kZXIgPSBmdW5jdGlvbiAoemVuVGVtcGxhdGU6IFplblRlbXBsYXRlLCBjb250YWluZXI6IE5vZGUpIHtcclxuICAgIC8vIGNoZWNrIGlmIHplbiB0ZW1wbGF0ZSBoYXMgYmVlbiByZW5kZXJlZCBhbmQgY2FjaGVkXHJcbiAgICBsZXQgZHluYW1pY05vZGUgPSBjb250YWluZXJDYWNoZS5nZXQoY29udGFpbmVyKTtcclxuICAgIGlmICghZHluYW1pY05vZGUpIHtcclxuICAgICAgICAvLyBjb250YWluZXIgaGFzIG5vdCBiZWVuIHJlbmRlcmVkIGludG8gYmVmb3JlLlxyXG4gICAgICAgIC8vIGNsb25lLCBwYXJzZSwgYW5kIGluc2VydCB0ZW1wbGF0ZVxyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gemVuVGVtcGxhdGUuY2xvbmUoKTtcclxuICAgICAgICBkeW5hbWljTm9kZSA9IG5ldyBEeW5hbWljTm9kZSh0ZW1wbGF0ZSk7XHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRlbXBsYXRlKTtcclxuICAgICAgICBjb250YWluZXJDYWNoZS5zZXQoY29udGFpbmVyLCBkeW5hbWljTm9kZSk7XHJcbiAgICB9XHJcbiAgICBkeW5hbWljTm9kZS51cGRhdGUoemVuVGVtcGxhdGUudmFsdWVzKTtcclxuICAgIGR5bmFtaWNOb2RlLnJlbmRlcigpO1xyXG59Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJNQUFhLGFBQWEsR0FBRyxHQUFHLENBQUM7QUFDakMsTUFBYSxXQUFXO0lBSXBCLFlBQVksT0FBNkIsRUFBRSxNQUFhO1FBSHhELFNBQUksR0FBVyxFQUFFLENBQUM7UUFJZCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUM1Qjs7Ozs7O0lBT0QsS0FBSyxDQUFFLE9BQTZCO1FBQ2hDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN2QixJQUFJLENBQUMsSUFBSSxJQUFJLE9BQU8sSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsYUFBYSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1NBQ3hFLENBQUMsQ0FBQztLQUNOOzs7OztJQU1ELFdB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
