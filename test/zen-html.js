const valueMarker = '%zen%';
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
                    if (currentAttribute.textContent.indexOf(valueMarker) > -1) {
                        this.children.push({
                            type: 'attribute',
                            container: currentAttribute,
                            index: valueIndex,
                            currentValue: currentAttribute.textContent,
                            oldValue: null
                        });
                        valueIndex++;
                    }
                }
            }
            else {
                // if it's not an element, must be in a text position
                if (currentNode.textContent.indexOf(valueMarker) > -1) {
                    this.children.push({
                        type: 'text',
                        index: valueIndex,
                        container: currentNode,
                        currentValue: currentNode.textContent,
                        oldValue: null
                    });
                    valueIndex++;
                }
            }
        }
    }
    render(values) {
        values.forEach((value, i) => {
            // grab node saved for value and update with new value
            const node = this.children[i];
            node.oldValue = node.currentValue;
            node.currentValue = value;
            switch (node.type) {
                case 'attribute':
                    node.container.textContent = node.currentValue;
                    break;
                case 'text':
                    node.container.textContent = node.currentValue;
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

//# sourceMappingURL=index.js.map

export { ZenElement, ZenNode, valueMarker, ZenTemplate, zenTemplateCache, zen, containerCache, render };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemVuLWh0bWwuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy96ZW4tdGVtcGxhdGUudHMiLCIuLi9zcmMvemVuLW5vZGUudHMiLCIuLi9zcmMvcmVuZGVyLnRzIiwiLi4vc3JjL3plbi1lbGVtZW50LnRzIiwiLi4vc3JjL3plbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgdmFsdWVNYXJrZXIgPSAnJXplbiUnO1xyXG5cclxuZXhwb3J0IGNsYXNzIFplblRlbXBsYXRlIHtcclxuICAgIHByaXZhdGUgc3RyaW5ncztcclxuICAgIHByaXZhdGUgaHRtbDtcclxuICAgIHZhbHVlczogYW55W107XHJcbiAgICBjb25zdHJ1Y3RvcihzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSwgdmFsdWVzOiBhbnlbXSkge1xyXG4gICAgICAgIHRoaXMuc3RyaW5ncyA9IHN0cmluZ3M7XHJcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB2YWx1ZXM7XHJcbiAgICAgICAgdGhpcy5odG1sID0gdGhpcy5wYXJzZSh0aGlzLnN0cmluZ3MpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBQYXJzZXMgdGhlIHRlbXBsYXRlIHN0cmluZ3MgYW5kIHJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb25cclxuICAgICAqIG9mIGFuIGVsZW1lbnQgd2l0aCB2YWx1ZXMgcmVwbGFjZWQgYnkgbWFya2Vycy5cclxuICAgICAqL1xyXG4gICAgcGFyc2UgKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5KTogc3RyaW5nIHtcclxuICAgICAgICBsZXQgaHRtbCA9ICcnO1xyXG4gICAgICAgIHN0cmluZ3MuZm9yRWFjaCgoZWxlbWVudCwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgaHRtbCArPSBlbGVtZW50ICsgKGluZGV4IDwgc3RyaW5ncy5sZW5ndGggLSAxID8gdmFsdWVNYXJrZXIgOiAnJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGh0bWw7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VGVtcGxhdGUgKCk6IEhUTUxUZW1wbGF0ZUVsZW1lbnQge1xyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcclxuICAgICAgICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSB0aGlzLmh0bWw7XHJcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgdmFsdWVNYXJrZXIgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcblxyXG5leHBvcnQgY2xhc3MgWmVuTm9kZSB7XHJcbiAgICByb290Tm9kZTogTm9kZTtcclxuICAgIGNoaWxkcmVuOiBhbnlbXSA9IFtdO1xyXG4gICAgY29uc3RydWN0b3IgKG5vZGU6IE5vZGUpIHtcclxuICAgICAgICB0aGlzLnJvb3ROb2RlID0gbm9kZTtcclxuICAgICAgICB0aGlzLnBhcnNlKHRoaXMucm9vdE5vZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlIChyb290Tm9kZTogTm9kZSkge1xyXG4gICAgICAgIC8vIHdhbGsgb3ZlciB0aGUgZWxlbWVudCBhbmQgc2F2ZSBhbGwgdGhlIG5vZGVzIHRoYXQgaGF2ZSB2YWx1ZVxyXG4gICAgICAgIC8vIG1hcmtlcnMgY29udGFpbmVkIGluIHRoZW0sIGFuZCBzZXQgdGhlaXIgb3JpZ2luYWwgdmFsdWVzXHJcbiAgICAgICAgbGV0IHZhbHVlSW5kZXggPSAwO1xyXG4gICAgICAgIGNvbnN0IHRyZWVXYWxrZXIgPSBkb2N1bWVudC5jcmVhdGVUcmVlV2Fsa2VyKHJvb3ROb2RlLCA1IC8qKiBTaG93IGVsZW1lbnRzIGFuZCB0ZXh0ICovKTtcclxuICAgICAgICB3aGlsZSh0cmVlV2Fsa2VyLm5leHROb2RlKCkpIHtcclxuICAgICAgICAgICAgbGV0IGN1cnJlbnROb2RlID0gdHJlZVdhbGtlci5jdXJyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgICAgIC8vIGlmIGVsZW1lbnQsIHRyYXZlcnNlIGF0dHJpYnV0ZXNcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnROb2RlIGluc3RhbmNlb2YgRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjdXJyZW50Tm9kZS5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEF0dHJpYnV0ZSA9IGN1cnJlbnROb2RlLmF0dHJpYnV0ZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRBdHRyaWJ1dGUudGV4dENvbnRlbnQuaW5kZXhPZih2YWx1ZU1hcmtlcikgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2F0dHJpYnV0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXI6IGN1cnJlbnRBdHRyaWJ1dGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogdmFsdWVJbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZTogY3VycmVudEF0dHJpYnV0ZS50ZXh0Q29udGVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFZhbHVlOiBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZUluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgaXQncyBub3QgYW4gZWxlbWVudCwgbXVzdCBiZSBpbiBhIHRleHQgcG9zaXRpb25cclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50Tm9kZS50ZXh0Q29udGVudC5pbmRleE9mKHZhbHVlTWFya2VyKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogdmFsdWVJbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyOiBjdXJyZW50Tm9kZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZhbHVlOiBjdXJyZW50Tm9kZS50ZXh0Q29udGVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWU6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZUluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyICh2YWx1ZXM6IGFueVtdKSB7XHJcbiAgICAgICAgdmFsdWVzLmZvckVhY2goKHZhbHVlLCBpKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIGdyYWIgbm9kZSBzYXZlZCBmb3IgdmFsdWUgYW5kIHVwZGF0ZSB3aXRoIG5ldyB2YWx1ZVxyXG4gICAgICAgICAgICBjb25zdCBub2RlID0gdGhpcy5jaGlsZHJlbltpXTtcclxuICAgICAgICAgICAgbm9kZS5vbGRWYWx1ZSA9IG5vZGUuY3VycmVudFZhbHVlO1xyXG4gICAgICAgICAgICBub2RlLmN1cnJlbnRWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYXR0cmlidXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAobm9kZS5jb250YWluZXIgYXMgQXR0cikudGV4dENvbnRlbnQgPSBub2RlLmN1cnJlbnRWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxyXG4gICAgICAgICAgICAgICAgICAgIChub2RlLmNvbnRhaW5lciBhcyBFbGVtZW50KS50ZXh0Q29udGVudCA9IG5vZGUuY3VycmVudFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBaZW5Ob2RlIH0gZnJvbSAnLi96ZW4tbm9kZSc7XHJcbmltcG9ydCB7IFplblRlbXBsYXRlIH0gZnJvbSAnLi96ZW4tdGVtcGxhdGUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGNvbnRhaW5lckNhY2hlID0gbmV3IFdlYWtNYXA8Tm9kZSwgWmVuTm9kZT4oKTtcclxuZXhwb3J0IGNvbnN0IHJlbmRlciA9IGZ1bmN0aW9uICh6ZW5UZW1wbGF0ZTogWmVuVGVtcGxhdGUsIGNvbnRhaW5lcjogTm9kZSkge1xyXG4gICAgLy8gY2hlY2sgaWYgemVuIHRlbXBsYXRlIGhhcyBiZWVuIHJlbmRlcmVkIGFuZCBjYWNoZWRcclxuICAgIGxldCB6ZW5SZW5kZXIgPSBjb250YWluZXJDYWNoZS5nZXQoY29udGFpbmVyKTtcclxuICAgIGlmICghemVuUmVuZGVyKSB7XHJcbiAgICAgICAgLy8gY3JlYXRlIHplbiByZW5kZXIgYW5kIGNhY2hlXHJcbiAgICAgICAgemVuUmVuZGVyID0gbmV3IFplbk5vZGUoemVuVGVtcGxhdGUuZ2V0VGVtcGxhdGUoKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKSk7XHJcbiAgICAgICAgY29udGFpbmVyQ2FjaGUuc2V0KGNvbnRhaW5lciwgemVuUmVuZGVyKTtcclxuICAgICAgICAvLyBpbnNlcnQgaW50byBjb250YWluZXJcclxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoemVuUmVuZGVyLnJvb3ROb2RlKTtcclxuICAgIH1cclxuICAgIHplblJlbmRlci5yZW5kZXIoemVuVGVtcGxhdGUudmFsdWVzKTtcclxufSIsImltcG9ydCB7IFplblRlbXBsYXRlIH0gZnJvbSAnLi96ZW4tdGVtcGxhdGUnO1xyXG5pbXBvcnQgeyByZW5kZXIgfSBmcm9tICcuL3JlbmRlcic7XHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgWmVuRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiAnb3BlbicgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29ubmVjdGVkQ2FsbGJhY2sgKCkge1xyXG4gICAgICAgIHJlbmRlcih0aGlzLnJlbmRlcigpLCB0aGlzLnNoYWRvd1Jvb3QpO1xyXG4gICAgfVxyXG5cclxuICAgIGFic3RyYWN0IHJlbmRlcih2YWx1ZXM/OiBhbnlbXSk6IFplblRlbXBsYXRlO1xyXG59IiwiaW1wb3J0IHsgWmVuVGVtcGxhdGUgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcblxyXG5leHBvcnQgY29uc3QgemVuVGVtcGxhdGVDYWNoZSA9IG5ldyBXZWFrTWFwPFRlbXBsYXRlU3RyaW5nc0FycmF5LCBaZW5UZW1wbGF0ZT4oKTtcclxuZXhwb3J0IGNvbnN0IHplbiA9IGZ1bmN0aW9uIChzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSwgLi4udmFsdWVzOiBhbnlbXSkge1xyXG4gICAgLy8gY2hlY2sgaWYgdGhpcyB0ZW1wbGF0ZSBzdHJpbmcgYXJyYXkgaGFzIGJlZW4gY2FjaGVkXHJcbiAgICBsZXQgemVuVGVtcGxhdGUgPSB6ZW5UZW1wbGF0ZUNhY2hlLmdldChzdHJpbmdzKTtcclxuICAgIGlmICghemVuVGVtcGxhdGUpIHtcclxuICAgICAgICAvLyBjcmVhdGUgYW5kIGNhY2hlIHRlbXBsYXRlXHJcbiAgICAgICAgemVuVGVtcGxhdGUgPSBuZXcgWmVuVGVtcGxhdGUoc3RyaW5ncywgdmFsdWVzKTtcclxuICAgICAgICB6ZW5UZW1wbGF0ZUNhY2hlLnNldChzdHJpbmdzLCB6ZW5UZW1wbGF0ZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gemVuVGVtcGxhdGU7XHJcbn1cclxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJNQUFhLFdBQVcsR0FBRyxPQUFPLENBQUM7QUFFbkMsTUFBYSxXQUFXO0lBSXBCLFlBQVksT0FBNkIsRUFBRSxNQUFhO1FBQ3BELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDeEM7Ozs7SUFLRCxLQUFLLENBQUUsT0FBNkI7UUFDaEMsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxLQUFLO1lBQzNCLElBQUksSUFBSSxPQUFPLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLFdBQVcsR0FBRyxFQUFFLENBQUMsQ0FBQztTQUNyRSxDQUFDLENBQUM7UUFDSCxPQUFPLElBQUksQ0FBQztLQUNmO0lBRUQsV0FBVztRQUNQLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEQsUUFBUSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQy9CLE9BQU8sUUFBUSxDQUFDO0tBQ25CO0NBQ0o7OztNQzFCWSxPQUFPO0lBR2hCLFlBQWEsSUFBVTtRQUR2QixhQUFRLEdBQVUsRUFBRSxDQUFDO1FBRWpCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQzdCO0lBRUQsS0FBSyxDQUFFLFFBQWM7OztRQUdqQixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFDbkIs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
