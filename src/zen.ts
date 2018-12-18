export const valueMarker = '%zen%';

export class ZenTemplate {
    private strings;
    private html;
    values: any[];
    constructor(strings: TemplateStringsArray, values: any[]) {
        this.strings = strings;
        this.values = values;
        this.html = this.parse(this.strings);
    }

    /** Parses the template strings and returns a string representation
     * of an element with values replaced by markers.
     */
    parse (strings: TemplateStringsArray): string {
        let html = '';
        strings.forEach((element, index) => {
            html += element + (index < strings.length - 1 ? valueMarker : '');
        });
        return html;
    }

    getTemplate (): HTMLTemplateElement {
        const template = document.createElement('template');
        template.innerHTML = this.html;
        return template;
    }
}

export class ZenRender {
    zenTemplate: ZenTemplate;
    element: HTMLElement;
    nodes: any[] = [];
    constructor (zenTemplate: ZenTemplate) {
        this.zenTemplate = zenTemplate;
        this.render(zenTemplate);
    }

    render (zenTemplate: ZenTemplate) {
        this.element = this.getElement();
        // walk over the element and save all the nodes that have value
        // markers contained in them, and set their original values
        let valueIndex = 0;
        const treeWalker = document.createTreeWalker(this.element, 5);
        while(treeWalker.nextNode()) {
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
            } else {
                // if it's not an element, must be text
                if (currentNode.textContent.indexOf(valueMarker) > -1) {
                    this.nodes.push({});
                    currentNode.textContent = zenTemplate.values[valueIndex];
                    valueIndex++;
                }
            }
        }
    }

    getElement (): HTMLElement {
        return this.zenTemplate.getTemplate().content.cloneNode(true) as HTMLElement;
    }
}

export const zenTemplateCache = new WeakMap<TemplateStringsArray, ZenTemplate>();
export const zen = function (strings: TemplateStringsArray, ...values: any[]) {
    // check if this template string array has been cached
    let zenTemplate = zenTemplateCache.get(strings);
    if (!zenTemplate) {
        // create and cache template
        zenTemplate = new ZenTemplate(strings, values);
        zenTemplateCache.set(strings, zenTemplate);
    }
    return zenTemplate;
}

export const containerCache = new WeakMap<Node, ZenRender>();
export const render = function (zenTemplate: ZenTemplate, container: Node) {
    // check if zen template has been rendered and cached
    let zenRender = containerCache.get(container);
    if (!zenRender) {
        // create zen render and cache
        zenRender = new ZenRender(zenTemplate);
        containerCache.set(container, zenRender);
        // render into container
        container.appendChild(zenRender.element);
    }
}