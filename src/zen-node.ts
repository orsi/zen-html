import { valueMarker } from './zen-template';

export class ZenNode {
    rootNode: Node;
    children: any[] = [];
    constructor (node: Node) {
        this.rootNode = node;
        this.parse(this.rootNode);
    }

    parse (rootNode: Node) {
        // walk over the element and save all the nodes that have value
        // markers contained in them, and set their original values
        let valueIndex = 0;
        const treeWalker = document.createTreeWalker(rootNode, 5 /** Show elements and text */);
        while(treeWalker.nextNode()) {
            let currentNode = treeWalker.currentNode;

            // if element, traverse attributes
            if (currentNode instanceof Element) {
                for (let i = 0; i < currentNode.attributes.length; i++) {
                    const currentAttribute = currentNode.attributes[i];
                    if (currentAttribute.textContent.indexOf(valueMarker) > -1) {
                        // text node can contain more than one marker
                        // must save the whole string with markers and
                        // build whole string on each value change
                        const text = currentAttribute.textContent;
                        const valuesCount = (text.match(new RegExp(valueMarker, 'gi')) || []).length;

                        const attributeValue = {
                            type: 'attribute',
                            container: currentAttribute,
                            template: currentAttribute.textContent,
                            values: []
                        };

                        // for each value marker, save its index in template string
                        for (let i = 0; i < valuesCount; i++) {
                            attributeValue.values.push({
                                index: valueIndex,
                                currentValue: valueMarker,
                                oldValue: null
                            });
                            this.children.push(attributeValue);
                            valueIndex++;
                        }
                    }
                }
            } else {
                // if it's not an element, must be in a text position
                if (currentNode.textContent.indexOf(valueMarker) > -1) {
                    // text node can contain more than one marker
                    // see how many value markers are within text node
                    const text = currentNode.textContent;
                    const valuesCount = (text.match(new RegExp(valueMarker, 'gi')) || []).length;

                    const textValue = {
                        type: 'text',
                        container: currentNode,
                        template: currentNode.textContent,
                        values: []
                    };

                    // for each value marker, save its index in template string
                    for (let i = 0; i < valuesCount; i++) {
                        textValue.values.push({
                            index: valueIndex,
                            currentValue: valueMarker,
                            oldValue: null
                        });
                        this.children.push(textValue);
                        valueIndex++;
                    }
                }
            }
        }
    }

    render (values: any[]) {
        values.forEach((value, i) => {
            // grab node saved for value and update with new value
            const node = this.children[i];
            switch (node.type) {
                case 'attribute':
                    const attribute = <Attr>node.container;
                    // find the attribute part that corresponds with
                    // this value index
                    const attributeValues = node.values;
                    const currentValue = attributeValues.find(val => val.index === i);
                    currentValue.oldValue = currentValue.currentValue;
                    currentValue.currentValue = value;
                    // rebuild template from all current values
                    let str = node.template;
                    for (let j = 0; j < attributeValues.length; j++) {
                        str = str.replace(valueMarker, attributeValues[j].currentValue);
                    }
                    attribute.textContent = str;
                    break;
                case 'text':
                    // find the attribute part that corresponds with
                    // this value index
                    const nodeValue = node.values.find(asdf => asdf.index === i);
                    nodeValue.oldValue = nodeValue.currentValue;
                    nodeValue.currentValue = value;
                    // rebuild template from all current values
                    let newTextContent = node.template;
                    for (let j = 0; j < node.values.length; j++) {
                        newTextContent = newTextContent.replace(valueMarker, node.values[j].currentValue);
                    }
                    node.container.textContent = newTextContent;
                    break;
            }
        });
    }
}