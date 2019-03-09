import { dynamicMarker } from './zen-template';

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
                    if (currentAttribute.textContent.indexOf(dynamicMarker) > -1) {
                        // text node can contain more than one marker
                        // must save the whole string with markers and
                        // build whole string on each value change
                        const text = currentAttribute.textContent;
                        const valuesCount = (text.match(new RegExp(dynamicMarker, 'gi')) || []).length;

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
                                currentValue: dynamicMarker,
                                oldValue: null
                            });
                            this.children.push(attributeValue);
                            valueIndex++;
                        }
                    }
                }
            } else {
                // if it's not an element, must be in a text position
                if (currentNode.textContent.indexOf(dynamicMarker) > -1) {
                    /**
                     * We can break the textContent string into multiple
                     * TextNodes, so that each dynamic part is isolated and
                     * can update by itself.
                     */
                    const valueMarkerIndices = [];
                    const textParts = [];
                    let textContent = currentNode.textContent;
                    while (textContent !== '') {
                        let part;
                        const valueIndex = textContent.indexOf(dynamicMarker);
                        if (valueIndex !== 0) {
                            // text content before value marker
                            part = textContent.substring(0, valueIndex);
                            textContent = textContent.substring(valueIndex);
                        } else {
                            // value marker
                            valueMarkerIndices.push(textParts.length);
                            part = textContent.substring(0, dynamicMarker.length);
                            textContent = textContent.substring(dynamicMarker.length);
                        }
                        textParts.push(document.createTextNode(part));
                    }

                    // save the dynamic text parts
                    for (let i = 0; i < valueMarkerIndices.length; i++) {
                        this.children.push({
                            type: 'text',
                            index: valueIndex,
                            container: textParts[valueMarkerIndices[i]],
                            currentValue: dynamicMarker,
                            oldValue: null
                        });
                        valueIndex++;
                    }

                    // empty current node and replace with text nodes
                    // ** warning: can't appendChild() or else walker
                    // ** will keep adding and walking over nodes **
                    const parentNode = currentNode.parentElement;
                    for (let i = 0; i < textParts.length; i++) {
                        parentNode.insertBefore(textParts[i], currentNode);
                    }

                    // remove current text node from parent
                    parentNode.removeChild(currentNode);
                }
            }
        }
    }

    render (values: any[]) {
        values.forEach((value, i) => {
            // grab node saved for value and update with new value
            const dynamicValue = this.children[i];
            switch (dynamicValue.type) {
                case 'attribute':
                    const attribute = <Attr>dynamicValue.container;
                    // find the attribute part that corresponds with
                    // this value index
                    const attributeValues = dynamicValue.values;
                    const currentValue = attributeValues.find(val => val.index === i);
                    currentValue.oldValue = currentValue.currentValue;
                    currentValue.currentValue = value;
                    // rebuild template from all current values
                    let str = dynamicValue.template;
                    for (let j = 0; j < attributeValues.length; j++) {
                        str = str.replace(dynamicMarker, attributeValues[j].currentValue);
                    }
                    attribute.textContent = str;
                    break;
                case 'text':
                    // find the attribute part that corresponds with
                    // this value index
                    dynamicValue.oldValue = dynamicValue.currentValue;
                    dynamicValue.currentValue = value;
                    dynamicValue.container.textContent = dynamicValue.currentValue;
                    break;
            }
        });
    }
}