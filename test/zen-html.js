class ZenElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
}
//# sourceMappingURL=zen-element.js.map

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

class ZenRender {
    constructor(zenTemplate) {
        this.nodes = [];
        this.zenTemplate = zenTemplate;
        this.render(zenTemplate);
    }
    render(zenTemplate) {
        this.element = this.getElement();
        // walk over the element and save all the nodes that have value
        // markers contained in them, and set their original values
        let valueIndex = 0;
        const treeWalker = document.createTreeWalker(this.element, 5);
        while (treeWalker.nextNode()) {
            let currentNode = treeWalker.currentNode;
            // if element, traverse attributes
            if (currentNode instanceof Element) {
                for (let i = 0; i < currentNode.attributes.length; i++) {
                    const currentAttribute = currentNode.attributes[i];
                    if (currentAttribute.textContent.indexOf(valueMarker) > -1) {
                        this.nodes.push({});
                        currentAttribute.textContent = zenTemplate.values[valueIndex];
                        valueIndex++;
                    }
                }
            }
            else {
                // if it's not an element, must be text
                if (currentNode.textContent.indexOf(valueMarker) > -1) {
                    this.nodes.push({});
                    currentNode.textContent = zenTemplate.values[valueIndex];
                    valueIndex++;
                }
            }
        }
    }
    getElement() {
        return this.zenTemplate.getTemplate().content.cloneNode(true);
    }
}
//# sourceMappingURL=zen-render.js.map

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

const containerCache = new WeakMap();
const render = function (zenTemplate, container) {
    // check if zen template has been rendered and cached
    let zenRender = containerCache.get(container);
    if (!zenRender) {
        // create zen render and cache
        zenRender = new ZenRender(zenTemplate);
        containerCache.set(container, zenRender);
        // render into container
        container.appendChild(zenRender.element);
    }
};
//# sourceMappingURL=render.js.map

export { ZenElement, ZenRender, valueMarker, ZenTemplate, zenTemplateCache, zen, containerCache, render };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemVuLWh0bWwuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy96ZW4tZWxlbWVudC50cyIsIi4uL3NyYy96ZW4tdGVtcGxhdGUudHMiLCIuLi9zcmMvemVuLXJlbmRlci50cyIsIi4uL3NyYy96ZW4udHMiLCIuLi9zcmMvcmVuZGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjbGFzcyBaZW5FbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6ICdvcGVuJyB9KTtcclxuICAgIH1cclxufSIsImV4cG9ydCBjb25zdCB2YWx1ZU1hcmtlciA9ICclemVuJSc7XHJcblxyXG5leHBvcnQgY2xhc3MgWmVuVGVtcGxhdGUge1xyXG4gICAgcHJpdmF0ZSBzdHJpbmdzO1xyXG4gICAgcHJpdmF0ZSBodG1sO1xyXG4gICAgdmFsdWVzOiBhbnlbXTtcclxuICAgIGNvbnN0cnVjdG9yKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5LCB2YWx1ZXM6IGFueVtdKSB7XHJcbiAgICAgICAgdGhpcy5zdHJpbmdzID0gc3RyaW5ncztcclxuICAgICAgICB0aGlzLnZhbHVlcyA9IHZhbHVlcztcclxuICAgICAgICB0aGlzLmh0bWwgPSB0aGlzLnBhcnNlKHRoaXMuc3RyaW5ncyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFBhcnNlcyB0aGUgdGVtcGxhdGUgc3RyaW5ncyBhbmQgcmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvblxyXG4gICAgICogb2YgYW4gZWxlbWVudCB3aXRoIHZhbHVlcyByZXBsYWNlZCBieSBtYXJrZXJzLlxyXG4gICAgICovXHJcbiAgICBwYXJzZSAoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXkpOiBzdHJpbmcge1xyXG4gICAgICAgIGxldCBodG1sID0gJyc7XHJcbiAgICAgICAgc3RyaW5ncy5mb3JFYWNoKChlbGVtZW50LCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICBodG1sICs9IGVsZW1lbnQgKyAoaW5kZXggPCBzdHJpbmdzLmxlbmd0aCAtIDEgPyB2YWx1ZU1hcmtlciA6ICcnKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gaHRtbDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRUZW1wbGF0ZSAoKTogSFRNTFRlbXBsYXRlRWxlbWVudCB7XHJcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xyXG4gICAgICAgIHRlbXBsYXRlLmlubmVySFRNTCA9IHRoaXMuaHRtbDtcclxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBaZW5UZW1wbGF0ZSwgdmFsdWVNYXJrZXIgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcblxyXG5leHBvcnQgY2xhc3MgWmVuUmVuZGVyIHtcclxuICAgIHplblRlbXBsYXRlOiBaZW5UZW1wbGF0ZTtcclxuICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50O1xyXG4gICAgbm9kZXM6IGFueVtdID0gW107XHJcbiAgICBjb25zdHJ1Y3RvciAoemVuVGVtcGxhdGU6IFplblRlbXBsYXRlKSB7XHJcbiAgICAgICAgdGhpcy56ZW5UZW1wbGF0ZSA9IHplblRlbXBsYXRlO1xyXG4gICAgICAgIHRoaXMucmVuZGVyKHplblRlbXBsYXRlKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIgKHplblRlbXBsYXRlOiBaZW5UZW1wbGF0ZSkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudCA9IHRoaXMuZ2V0RWxlbWVudCgpO1xyXG4gICAgICAgIC8vIHdhbGsgb3ZlciB0aGUgZWxlbWVudCBhbmQgc2F2ZSBhbGwgdGhlIG5vZGVzIHRoYXQgaGF2ZSB2YWx1ZVxyXG4gICAgICAgIC8vIG1hcmtlcnMgY29udGFpbmVkIGluIHRoZW0sIGFuZCBzZXQgdGhlaXIgb3JpZ2luYWwgdmFsdWVzXHJcbiAgICAgICAgbGV0IHZhbHVlSW5kZXggPSAwO1xyXG4gICAgICAgIGNvbnN0IHRyZWVXYWxrZXIgPSBkb2N1bWVudC5jcmVhdGVUcmVlV2Fsa2VyKHRoaXMuZWxlbWVudCwgNSk7XHJcbiAgICAgICAgd2hpbGUodHJlZVdhbGtlci5uZXh0Tm9kZSgpKSB7XHJcbiAgICAgICAgICAgIGxldCBjdXJyZW50Tm9kZSA9IHRyZWVXYWxrZXIuY3VycmVudE5vZGU7XHJcblxyXG4gICAgICAgICAgICAvLyBpZiBlbGVtZW50LCB0cmF2ZXJzZSBhdHRyaWJ1dGVzXHJcbiAgICAgICAgICAgIGlmIChjdXJyZW50Tm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY3VycmVudE5vZGUuYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRBdHRyaWJ1dGUgPSBjdXJyZW50Tm9kZS5hdHRyaWJ1dGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50QXR0cmlidXRlLnRleHRDb250ZW50LmluZGV4T2YodmFsdWVNYXJrZXIpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ub2Rlcy5wdXNoKHt9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudEF0dHJpYnV0ZS50ZXh0Q29udGVudCA9IHplblRlbXBsYXRlLnZhbHVlc1t2YWx1ZUluZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVJbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIGl0J3Mgbm90IGFuIGVsZW1lbnQsIG11c3QgYmUgdGV4dFxyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnROb2RlLnRleHRDb250ZW50LmluZGV4T2YodmFsdWVNYXJrZXIpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5vZGVzLnB1c2goe30pO1xyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnROb2RlLnRleHRDb250ZW50ID0gemVuVGVtcGxhdGUudmFsdWVzW3ZhbHVlSW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlSW5kZXgrKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRFbGVtZW50ICgpOiBIVE1MRWxlbWVudCB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuemVuVGVtcGxhdGUuZ2V0VGVtcGxhdGUoKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKSBhcyBIVE1MRWxlbWVudDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IFplblRlbXBsYXRlIH0gZnJvbSAnLi96ZW4tdGVtcGxhdGUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IHplblRlbXBsYXRlQ2FjaGUgPSBuZXcgV2Vha01hcDxUZW1wbGF0ZVN0cmluZ3NBcnJheSwgWmVuVGVtcGxhdGU+KCk7XHJcbmV4cG9ydCBjb25zdCB6ZW4gPSBmdW5jdGlvbiAoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIC4uLnZhbHVlczogYW55W10pIHtcclxuICAgIC8vIGNoZWNrIGlmIHRoaXMgdGVtcGxhdGUgc3RyaW5nIGFycmF5IGhhcyBiZWVuIGNhY2hlZFxyXG4gICAgbGV0IHplblRlbXBsYXRlID0gemVuVGVtcGxhdGVDYWNoZS5nZXQoc3RyaW5ncyk7XHJcbiAgICBpZiAoIXplblRlbXBsYXRlKSB7XHJcbiAgICAgICAgLy8gY3JlYXRlIGFuZCBjYWNoZSB0ZW1wbGF0ZVxyXG4gICAgICAgIHplblRlbXBsYXRlID0gbmV3IFplblRlbXBsYXRlKHN0cmluZ3MsIHZhbHVlcyk7XHJcbiAgICAgICAgemVuVGVtcGxhdGVDYWNoZS5zZXQoc3RyaW5ncywgemVuVGVtcGxhdGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHplblRlbXBsYXRlO1xyXG59XHJcbiIsImltcG9ydCB7IFplblJlbmRlciB9IGZyb20gJy4vemVuLXJlbmRlcic7XHJcbmltcG9ydCB7IFplblRlbXBsYXRlIH0gZnJvbSAnLi96ZW4tdGVtcGxhdGUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGNvbnRhaW5lckNhY2hlID0gbmV3IFdlYWtNYXA8Tm9kZSwgWmVuUmVuZGVyPigpO1xyXG5leHBvcnQgY29uc3QgcmVuZGVyID0gZnVuY3Rpb24gKHplblRlbXBsYXRlOiBaZW5UZW1wbGF0ZSwgY29udGFpbmVyOiBOb2RlKSB7XHJcbiAgICAvLyBjaGVjayBpZiB6ZW4gdGVtcGxhdGUgaGFzIGJlZW4gcmVuZGVyZWQgYW5kIGNhY2hlZFxyXG4gICAgbGV0IHplblJlbmRlciA9IGNvbnRhaW5lckNhY2hlLmdldChjb250YWluZXIpO1xyXG4gICAgaWYgKCF6ZW5SZW5kZXIpIHtcclxuICAgICAgICAvLyBjcmVhdGUgemVuIHJlbmRlciBhbmQgY2FjaGVcclxuICAgICAgICB6ZW5SZW5kZXIgPSBuZXcgWmVuUmVuZGVyKHplblRlbXBsYXRlKTtcclxuICAgICAgICBjb250YWluZXJDYWNoZS5zZXQoY29udGFpbmVyLCB6ZW5SZW5kZXIpO1xyXG4gICAgICAgIC8vIHJlbmRlciBpbnRvIGNvbnRhaW5lclxyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh6ZW5SZW5kZXIuZWxlbWVudCk7XHJcbiAgICB9XHJcbn0iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ik1BQWEsVUFBVyxTQUFRLFdBQVc7SUFDdkM7UUFDSSxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztLQUN2QztDQUNKOzs7TUNMWSxXQUFXLEdBQUcsT0FBTyxDQUFDO0FBRW5DLE1BQWEsV0FBVztJQUlwQixZ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
