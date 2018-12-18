import { ZenTemplate, valueMarker } from './zen-template';

export class ZenRender {
    zenTemplate: ZenTemplate;
    element: HTMLElement;
    nodes: any[] = [];
    constructor (zenTemplate: ZenTemplate) {
        this.zenTemplate = zenTemplate;
        this.parse(zenTemplate);
    }

    parse (zenTemplate: ZenTemplate) {
        this.element = this.getElement();
        // walk over the element and save all the nodes that have value
        // markers contained in them, and set their original values
        let valueIndex = 0;
        const treeWalker = document.createTreeWalker(this.element, 5 /** Show elements and text */);
        while(treeWalker.nextNode()) {
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
            } else {
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

    getElement (): HTMLElement {
        return this.zenTemplate.getTemplate().content.cloneNode(true) as HTMLElement;
    }

    render (values: any[]) {
        values.forEach((value, i) => {
            // grab node saved for value and update with new value
            const node = this.nodes[i];
            node.oldValue = node.currentValue;
            node.currentValue = value;
            switch (node.type) {
                case 'attribute':
                    (node.container as Attr).textContent = node.currentValue;
                    break;
                case 'text':
                    (node.container as Element).textContent = node.currentValue;
                    break;
            }
        });
    }
}