import { ZenTemplate, valueMarker } from './zen-template';

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