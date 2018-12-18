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

//# sourceMappingURL=index.js.map

export { ZenElement, valueMarker, ZenTemplate, ZenRender, zenTemplateCache, zen, containerCache, render };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemVuLWh0bWwuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy96ZW4tZWxlbWVudC50cyIsIi4uL3NyYy96ZW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIFplbkVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pO1xyXG4gICAgfVxyXG59IiwiZXhwb3J0IGNvbnN0IHZhbHVlTWFya2VyID0gJyV6ZW4lJztcclxuXHJcbmV4cG9ydCBjbGFzcyBaZW5UZW1wbGF0ZSB7XHJcbiAgICBwcml2YXRlIHN0cmluZ3M7XHJcbiAgICBwcml2YXRlIGh0bWw7XHJcbiAgICB2YWx1ZXM6IGFueVtdO1xyXG4gICAgY29uc3RydWN0b3Ioc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksIHZhbHVlczogYW55W10pIHtcclxuICAgICAgICB0aGlzLnN0cmluZ3MgPSBzdHJpbmdzO1xyXG4gICAgICAgIHRoaXMudmFsdWVzID0gdmFsdWVzO1xyXG4gICAgICAgIHRoaXMuaHRtbCA9IHRoaXMucGFyc2UodGhpcy5zdHJpbmdzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogUGFyc2VzIHRoZSB0ZW1wbGF0ZSBzdHJpbmdzIGFuZCByZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uXHJcbiAgICAgKiBvZiBhbiBlbGVtZW50IHdpdGggdmFsdWVzIHJlcGxhY2VkIGJ5IG1hcmtlcnMuXHJcbiAgICAgKi9cclxuICAgIHBhcnNlIChzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSk6IHN0cmluZyB7XHJcbiAgICAgICAgbGV0IGh0bWwgPSAnJztcclxuICAgICAgICBzdHJpbmdzLmZvckVhY2goKGVsZW1lbnQsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIGh0bWwgKz0gZWxlbWVudCArIChpbmRleCA8IHN0cmluZ3MubGVuZ3RoIC0gMSA/IHZhbHVlTWFya2VyIDogJycpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBodG1sO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFRlbXBsYXRlICgpOiBIVE1MVGVtcGxhdGVFbGVtZW50IHtcclxuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XHJcbiAgICAgICAgdGVtcGxhdGUuaW5uZXJIVE1MID0gdGhpcy5odG1sO1xyXG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFplblJlbmRlciB7XHJcbiAgICB6ZW5UZW1wbGF0ZTogWmVuVGVtcGxhdGU7XHJcbiAgICBlbGVtZW50OiBIVE1MRWxlbWVudDtcclxuICAgIG5vZGVzOiBhbnlbXSA9IFtdO1xyXG4gICAgY29uc3RydWN0b3IgKHplblRlbXBsYXRlOiBaZW5UZW1wbGF0ZSkge1xyXG4gICAgICAgIHRoaXMuemVuVGVtcGxhdGUgPSB6ZW5UZW1wbGF0ZTtcclxuICAgICAgICB0aGlzLnJlbmRlcih6ZW5UZW1wbGF0ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyICh6ZW5UZW1wbGF0ZTogWmVuVGVtcGxhdGUpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnQgPSB0aGlzLmdldEVsZW1lbnQoKTtcclxuICAgICAgICAvLyB3YWxrIG92ZXIgdGhlIGVsZW1lbnQgYW5kIHNhdmUgYWxsIHRoZSBub2RlcyB0aGF0IGhhdmUgdmFsdWVcclxuICAgICAgICAvLyBtYXJrZXJzIGNvbnRhaW5lZCBpbiB0aGVtLCBhbmQgc2V0IHRoZWlyIG9yaWdpbmFsIHZhbHVlc1xyXG4gICAgICAgIGxldCB2YWx1ZUluZGV4ID0gMDtcclxuICAgICAgICBjb25zdCB0cmVlV2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcih0aGlzLmVsZW1lbnQsIDUpO1xyXG4gICAgICAgIHdoaWxlKHRyZWVXYWxrZXIubmV4dE5vZGUoKSkge1xyXG4gICAgICAgICAgICBsZXQgY3VycmVudE5vZGUgPSB0cmVlV2Fsa2VyLmN1cnJlbnROb2RlO1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgZWxlbWVudCwgdHJhdmVyc2UgYXR0cmlidXRlc1xyXG4gICAgICAgICAgICBpZiAoY3VycmVudE5vZGUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGN1cnJlbnROb2RlLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50QXR0cmlidXRlID0gY3VycmVudE5vZGUuYXR0cmlidXRlc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudEF0dHJpYnV0ZS50ZXh0Q29udGVudC5pbmRleE9mKHZhbHVlTWFya2VyKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubm9kZXMucHVzaCh7fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRBdHRyaWJ1dGUudGV4dENvbnRlbnQgPSB6ZW5UZW1wbGF0ZS52YWx1ZXNbdmFsdWVJbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlSW5kZXgrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiBpdCdzIG5vdCBhbiBlbGVtZW50LCBtdXN0IGJlIHRleHRcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50Tm9kZS50ZXh0Q29udGVudC5pbmRleE9mKHZhbHVlTWFya2VyKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ub2Rlcy5wdXNoKHt9KTtcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50Tm9kZS50ZXh0Q29udGVudCA9IHplblRlbXBsYXRlLnZhbHVlc1t2YWx1ZUluZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZUluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RWxlbWVudCAoKTogSFRNTEVsZW1lbnQge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnplblRlbXBsYXRlLmdldFRlbXBsYXRlKCkuY29udGVudC5jbG9uZU5vZGUodHJ1ZSkgYXMgSFRNTEVsZW1lbnQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCB6ZW5UZW1wbGF0ZUNhY2hlID0gbmV3IFdlYWtNYXA8VGVtcGxhdGVTdHJpbmdzQXJyYXksIFplblRlbXBsYXRlPigpO1xyXG5leHBvcnQgY29uc3QgemVuID0gZnVuY3Rpb24gKHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5LCAuLi52YWx1ZXM6IGFueVtdKSB7XHJcbiAgICAvLyBjaGVjayBpZiB0aGlzIHRlbXBsYXRlIHN0cmluZyBhcnJheSBoYXMgYmVlbiBjYWNoZWRcclxuICAgIGxldCB6ZW5UZW1wbGF0ZSA9IHplblRlbXBsYXRlQ2FjaGUuZ2V0KHN0cmluZ3MpO1xyXG4gICAgaWYgKCF6ZW5UZW1wbGF0ZSkge1xyXG4gICAgICAgIC8vIGNyZWF0ZSBhbmQgY2FjaGUgdGVtcGxhdGVcclxuICAgICAgICB6ZW5UZW1wbGF0ZSA9IG5ldyBaZW5UZW1wbGF0ZShzdHJpbmdzLCB2YWx1ZXMpO1xyXG4gICAgICAgIHplblRlbXBsYXRlQ2FjaGUuc2V0KHN0cmluZ3MsIHplblRlbXBsYXRlKTtcclxuICAgIH1cclxuICAgIHJldHVybiB6ZW5UZW1wbGF0ZTtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGNvbnRhaW5lckNhY2hlID0gbmV3IFdlYWtNYXA8Tm9kZSwgWmVuUmVuZGVyPigpO1xyXG5leHBvcnQgY29uc3QgcmVuZGVyID0gZnVuY3Rpb24gKHplblRlbXBsYXRlOiBaZW5UZW1wbGF0ZSwgY29udGFpbmVyOiBOb2RlKSB7XHJcbiAgICAvLyBjaGVjayBpZiB6ZW4gdGVtcGxhdGUgaGFzIGJlZW4gcmVuZGVyZWQgYW5kIGNhY2hlZFxyXG4gICAgbGV0IHplblJlbmRlciA9IGNvbnRhaW5lckNhY2hlLmdldChjb250YWluZXIpO1xyXG4gICAgaWYgKCF6ZW5SZW5kZXIpIHtcclxuICAgICAgICAvLyBjcmVhdGUgemVuIHJlbmRlciBhbmQgY2FjaGVcclxuICAgICAgICB6ZW5SZW5kZXIgPSBuZXcgWmVuUmVuZGVyKHplblRlbXBsYXRlKTtcclxuICAgICAgICBjb250YWluZXJDYWNoZS5zZXQoY29udGFpbmVyLCB6ZW5SZW5kZXIpO1xyXG4gICAgICAgIC8vIHJlbmRlciBpbnRvIGNvbnRhaW5lclxyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh6ZW5SZW5kZXIuZWxlbWVudCk7XHJcbiAgICB9XHJcbn0iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ik1BQWEsVUFBVyxTQUFRLFdBQVc7SUFDdkM7UUFDSSxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztLQUN2QztDQUNKOzs7TUNMWSxXQUFXLEdBQUcsT0FBTyxDQUFDO0FBRW5DLE1BQWEsV0FBVztJQUlwQixZQUFZLE9BQTZCLEVBQUUsTUFBYTtRQUNwRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3hDOzs7O0lBS0QsS0FBSyxDQUFFLE9BQTZCO1FBQ2hDLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNkLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsS0FBSztZQUMzQixJQUFJLElBQUksT0FBTyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxXQUFXLEdBQUcsRUFBRSxDQUFDLENBQUM7U0FDckUsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxJQUFJLENBQUM7S0FDZjtJQUVELFdBQVc7UUFDUCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3BELFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUMvQixPQUFPLFFBQVEsQ0FBQztLQUNuQjtDQUNKO0FBRUQsTUFBYSxTQUFTO0lBSWxCLFlBQWEsV0FBd0I7UUFEckMsVUFBSyxHQUFVLEVBQUUsQ0FBQztRQUVkLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBQy9CLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7S0FDNUI7SUFFRCxNQUFNLENBQUUsV0FBd0I7UUFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7OztRQUdqQyxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFDbkIsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDOUQsT0FBTSxVQUFVLENBQUMsUUFBUSxFQUFFLEVBQUU7WUFDekIsSUFBSSxXQUFXLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQzs7WUFHekMsSUFBSSxXQUFXLFlBQVksT0FBTyxFQUFFO2dCQUNoQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ3BELE1BQU0sZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbkQsSUFBSSxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO3dCQUN4RCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDcEIsZ0JBQWdCLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQzlELFVBQVUsRUFBRSxDQUFDO3FCQUNoQjtpQkFDSjthQUNKO2lCQUFNOztnQkFFSCxJQUFJLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO29CQUNuRCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDcEIsV0FBVyxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUN6RCxVQUFVLEVBQUUsQ0FBQztpQkFDaEI7YUFDSjtTQUNKO0tBQ0o7SUFFRCxVQUFVO1FBQ04sT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFnQixDQUFDO0tBQ2hGO0NBQ0o7QUFFRCxNQUFhLGdCQUFnQixHQUFHLElBQUksT0FBTyxFQUFxQyxDQUFDO0FBQ2pGLE1BQWEsR0FBRyxHQUFHLFVBQVUsT0FBNkIsRUFBRSxHQUFHLE1BQWE7O0lBRXhFLElBQUksV0FBVyxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNoRCxJQUFJLENBQUMsV0FBVyxFQUFFOztRQUVkLFdBQVcsR0FBRyxJQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDL0MsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQztLQUM5QztJQUNELE9BQU8sV0FBVyxDQUFDO0NBQ3RCLENBQUE7QUFFRCxNQUFhLGNBQWMsR0FBRyxJQUFJLE9BQU8sRUFBbUIsQ0FBQztBQUM3RCxNQUFhLE1BQU0sR0FBRyxVQUFVLFdBQXdCLEVBQUUsU0FBZTs7SUFFckUsSUFBSSxTQUFTLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM5QyxJQUFJLENBQUMsU0FBUyxFQUFFOztRQUVaLFNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN2QyxjQUFjLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQzs7UUFFekMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDNUM7Q0FDSjs7Ozs7OyJ9
