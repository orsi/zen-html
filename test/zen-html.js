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
        this.parse(zenTemplate);
    }
    parse(zenTemplate) {
        this.element = this.getElement();
        // walk over the element and save all the nodes that have value
        // markers contained in them, and set their original values
        let valueIndex = 0;
        const treeWalker = document.createTreeWalker(this.element, 5 /** Show elements and text */);
        while (treeWalker.nextNode()) {
            let currentNode = treeWalker.currentNode;
            // if element, traverse attributes
            if (currentNode instanceof Element) {
                for (let i = 0; i < currentNode.attributes.length; i++) {
                    const currentAttribute = currentNode.attributes[i];
                    if (currentAttribute.textContent.indexOf(valueMarker) > -1) {
                        this.nodes.push({
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
                    this.nodes.push({
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
    getElement() {
        return this.zenTemplate.getTemplate().content.cloneNode(true);
    }
    render(values) {
        values.forEach((value, i) => {
            // grab node saved for value and update with new value
            const node = this.nodes[i];
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
    zenRender.render(zenTemplate.values);
};
//# sourceMappingURL=render.js.map

//# sourceMappingURL=index.js.map

export { ZenElement, ZenRender, valueMarker, ZenTemplate, zenTemplateCache, zen, containerCache, render };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemVuLWh0bWwuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy96ZW4tZWxlbWVudC50cyIsIi4uL3NyYy96ZW4tdGVtcGxhdGUudHMiLCIuLi9zcmMvemVuLXJlbmRlci50cyIsIi4uL3NyYy96ZW4udHMiLCIuLi9zcmMvcmVuZGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjbGFzcyBaZW5FbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6ICdvcGVuJyB9KTtcclxuICAgIH1cclxufSIsImV4cG9ydCBjb25zdCB2YWx1ZU1hcmtlciA9ICclemVuJSc7XHJcblxyXG5leHBvcnQgY2xhc3MgWmVuVGVtcGxhdGUge1xyXG4gICAgcHJpdmF0ZSBzdHJpbmdzO1xyXG4gICAgcHJpdmF0ZSBodG1sO1xyXG4gICAgdmFsdWVzOiBhbnlbXTtcclxuICAgIGNvbnN0cnVjdG9yKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5LCB2YWx1ZXM6IGFueVtdKSB7XHJcbiAgICAgICAgdGhpcy5zdHJpbmdzID0gc3RyaW5ncztcclxuICAgICAgICB0aGlzLnZhbHVlcyA9IHZhbHVlcztcclxuICAgICAgICB0aGlzLmh0bWwgPSB0aGlzLnBhcnNlKHRoaXMuc3RyaW5ncyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFBhcnNlcyB0aGUgdGVtcGxhdGUgc3RyaW5ncyBhbmQgcmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvblxyXG4gICAgICogb2YgYW4gZWxlbWVudCB3aXRoIHZhbHVlcyByZXBsYWNlZCBieSBtYXJrZXJzLlxyXG4gICAgICovXHJcbiAgICBwYXJzZSAoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXkpOiBzdHJpbmcge1xyXG4gICAgICAgIGxldCBodG1sID0gJyc7XHJcbiAgICAgICAgc3RyaW5ncy5mb3JFYWNoKChlbGVtZW50LCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICBodG1sICs9IGVsZW1lbnQgKyAoaW5kZXggPCBzdHJpbmdzLmxlbmd0aCAtIDEgPyB2YWx1ZU1hcmtlciA6ICcnKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gaHRtbDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRUZW1wbGF0ZSAoKTogSFRNTFRlbXBsYXRlRWxlbWVudCB7XHJcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xyXG4gICAgICAgIHRlbXBsYXRlLmlubmVySFRNTCA9IHRoaXMuaHRtbDtcclxuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBaZW5UZW1wbGF0ZSwgdmFsdWVNYXJrZXIgfSBmcm9tICcuL3plbi10ZW1wbGF0ZSc7XHJcblxyXG5leHBvcnQgY2xhc3MgWmVuUmVuZGVyIHtcclxuICAgIHplblRlbXBsYXRlOiBaZW5UZW1wbGF0ZTtcclxuICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50O1xyXG4gICAgbm9kZXM6IGFueVtdID0gW107XHJcbiAgICBjb25zdHJ1Y3RvciAoemVuVGVtcGxhdGU6IFplblRlbXBsYXRlKSB7XHJcbiAgICAgICAgdGhpcy56ZW5UZW1wbGF0ZSA9IHplblRlbXBsYXRlO1xyXG4gICAgICAgIHRoaXMucGFyc2UoemVuVGVtcGxhdGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlICh6ZW5UZW1wbGF0ZTogWmVuVGVtcGxhdGUpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnQgPSB0aGlzLmdldEVsZW1lbnQoKTtcclxuICAgICAgICAvLyB3YWxrIG92ZXIgdGhlIGVsZW1lbnQgYW5kIHNhdmUgYWxsIHRoZSBub2RlcyB0aGF0IGhhdmUgdmFsdWVcclxuICAgICAgICAvLyBtYXJrZXJzIGNvbnRhaW5lZCBpbiB0aGVtLCBhbmQgc2V0IHRoZWlyIG9yaWdpbmFsIHZhbHVlc1xyXG4gICAgICAgIGxldCB2YWx1ZUluZGV4ID0gMDtcclxuICAgICAgICBjb25zdCB0cmVlV2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcih0aGlzLmVsZW1lbnQsIDUgLyoqIFNob3cgZWxlbWVudHMgYW5kIHRleHQgKi8pO1xyXG4gICAgICAgIHdoaWxlKHRyZWVXYWxrZXIubmV4dE5vZGUoKSkge1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudE5vZGUgPSB0cmVlV2Fsa2VyLmN1cnJlbnROb2RlO1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgZWxlbWVudCwgdHJhdmVyc2UgYXR0cmlidXRlc1xyXG4gICAgICAgICAgICBpZiAoY3VycmVudE5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGN1cnJlbnROb2RlLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50QXR0cmlidXRlID0gY3VycmVudE5vZGUuYXR0cmlidXRlc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudEF0dHJpYnV0ZS50ZXh0Q29udGVudC5pbmRleE9mKHZhbHVlTWFya2VyKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubm9kZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYXR0cmlidXRlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogY3VycmVudEF0dHJpYnV0ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiB2YWx1ZUluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZhbHVlOiBjdXJyZW50QXR0cmlidXRlLnRleHRDb250ZW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWU6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlSW5kZXgrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiBpdCdzIG5vdCBhbiBlbGVtZW50LCBtdXN0IGJlIGluIGEgdGV4dCBwb3NpdGlvblxyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnROb2RlLnRleHRDb250ZW50LmluZGV4T2YodmFsdWVNYXJrZXIpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5vZGVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiB2YWx1ZUluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXI6IGN1cnJlbnROb2RlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IGN1cnJlbnROb2RlLnRleHRDb250ZW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRWYWx1ZTogbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlSW5kZXgrKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRFbGVtZW50ICgpOiBIVE1MRWxlbWVudCB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuemVuVGVtcGxhdGUuZ2V0VGVtcGxhdGUoKS5jb250ZW50LmNsb25lTm9kZSh0cnVlKSBhcyBIVE1MRWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIgKHZhbHVlczogYW55W10pIHtcclxuICAgICAgICB2YWx1ZXMuZm9yRWFjaCgodmFsdWUsIGkpID0+IHtcclxuICAgICAgICAgICAgLy8gZ3JhYiBub2RlIHNhdmVkIGZvciB2YWx1ZSBhbmQgdXBkYXRlIHdpdGggbmV3IHZhbHVlXHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5vZGVzW2ldO1xyXG4gICAgICAgICAgICBub2RlLm9sZFZhbHVlID0gbm9kZS5jdXJyZW50VmFsdWU7XHJcbiAgICAgICAgICAgIG5vZGUuY3VycmVudFZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHN3aXRjaCAobm9kZS50eXBlKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhdHRyaWJ1dGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIChub2RlLmNvbnRhaW5lciBhcyBBdHRyKS50ZXh0Q29udGVudCA9IG5vZGUuY3VycmVudFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndGV4dCc6XHJcbiAgICAgICAgICAgICAgICAgICAgKG5vZGUuY29udGFpbmVyIGFzIEVsZW1lbnQpLnRleHRDb250ZW50ID0gbm9kZS5jdXJyZW50VmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IFplblRlbXBsYXRlIH0gZnJvbSAnLi96ZW4tdGVtcGxhdGUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IHplblRlbXBsYXRlQ2FjaGUgPSBuZXcgV2Vha01hcDxUZW1wbGF0ZVN0cmluZ3NBcnJheSwgWmVuVGVtcGxhdGU+KCk7XHJcbmV4cG9ydCBjb25zdCB6ZW4gPSBmdW5jdGlvbiAoc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIC4uLnZhbHVlczogYW55W10pIHtcclxuICAgIC8vIGNoZWNrIGlmIHRoaXMgdGVtcGxhdGUgc3RyaW5nIGFycmF5IGhhcyBiZWVuIGNhY2hlZFxyXG4gICAgbGV0IHplblRlbXBsYXRlID0gemVuVGVtcGxhdGVDYWNoZS5nZXQoc3RyaW5ncyk7XHJcbiAgICBpZiAoIXplblRlbXBsYXRlKSB7XHJcbiAgICAgICAgLy8gY3JlYXRlIGFuZCBjYWNoZSB0ZW1wbGF0ZVxyXG4gICAgICAgIHplblRlbXBsYXRlID0gbmV3IFplblRlbXBsYXRlKHN0cmluZ3MsIHZhbHVlcyk7XHJcbiAgICAgICAgemVuVGVtcGxhdGVDYWNoZS5zZXQoc3RyaW5ncywgemVuVGVtcGxhdGUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHplblRlbXBsYXRlO1xyXG59XHJcbiIsImltcG9ydCB7IFplblJlbmRlciB9IGZyb20gJy4vemVuLXJlbmRlcic7XHJcbmltcG9ydCB7IFplblRlbXBsYXRlIH0gZnJvbSAnLi96ZW4tdGVtcGxhdGUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGNvbnRhaW5lckNhY2hlID0gbmV3IFdlYWtNYXA8Tm9kZSwgWmVuUmVuZGVyPigpO1xyXG5leHBvcnQgY29uc3QgcmVuZGVyID0gZnVuY3Rpb24gKHplblRlbXBsYXRlOiBaZW5UZW1wbGF0ZSwgY29udGFpbmVyOiBOb2RlKSB7XHJcbiAgICAvLyBjaGVjayBpZiB6ZW4gdGVtcGxhdGUgaGFzIGJlZW4gcmVuZGVyZWQgYW5kIGNhY2hlZFxyXG4gICAgbGV0IHplblJlbmRlciA9IGNvbnRhaW5lckNhY2hlLmdldChjb250YWluZXIpO1xyXG4gICAgaWYgKCF6ZW5SZW5kZXIpIHtcclxuICAgICAgICAvLyBjcmVhdGUgemVuIHJlbmRlciBhbmQgY2FjaGVcclxuICAgICAgICB6ZW5SZW5kZXIgPSBuZXcgWmVuUmVuZGVyKHplblRlbXBsYXRlKTtcclxuICAgICAgICBjb250YWluZXJDYWNoZS5zZXQoY29udGFpbmVyLCB6ZW5SZW5kZXIpO1xyXG4gICAgICAgIC8vIHJlbmRlciBpbnRvIGNvbnRhaW5lclxyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh6ZW5SZW5kZXIuZWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgemVuUmVuZGVyLnJlbmRlcih6ZW5UZW1wbGF0ZS52YWx1ZXMpO1xyXG59Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJNQUFhLFVBQVcsU0FBUSxXQUFXO0lBQ3ZDO1FBQ0ksS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7S0FDdkM7Q0FDSjs7O01DTFksV0FBVyxHQUFHLE9BQU8sQ0FBQztBQUVuQyxNQUFhLFdBQVc7SUFJcEIsWUFBWSxPQUE2QixFQUFFLE1BQWE7UUFDcEQsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUN4Qzs7OztJQUtELEtBQUssQ0FBRSxPQUE2QjtRQUNoQyxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZCxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEtBQUs7WUFDM0IsSUFBSSxJQUFJLE9BQU8sSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsV0FBVyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1NBQ3JFLENBQUMsQ0FBQztRQUNILE9BQU8sSUFBSSxDQUFDO0tBQ2Y7SUFFRCxXQUFXO1FBQ1AsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNwRCxRQUFRLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDL0IsT0FBTyxRQUFRLENBQUM7S0FDbkI7Q0FDSjs7O01DMUJZLFNBQVM7SUFJbEIsWUFBYSxXQUF3QjtRQURyQyxVQUFLLEdBQVUsRUFBRSxDQUFDO1FBRWQsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0IsSUFBSSxD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
