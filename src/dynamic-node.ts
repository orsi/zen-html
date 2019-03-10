import { dynamicMarker } from './zen-template';

export class DynamicNode {
    values: DynamicValue[] = [];
    renderables: DynamicRenderable[] = [];
    constructor (node: Node) {
        this.parse(node);
    }
    /**
     * Updates all values contained in the dynamic node.
     * @param values array of values from a zen template
     */
    update (values: any[]) {
        for (let i = 0; i < values.length; i++) {
            let value = values[i];
            let dynamicValue = this.values[i];
            if (value !== dynamicValue.currentValue) {
                // avoid unneccessary updates
                dynamicValue.oldValue = dynamicValue.currentValue;
                dynamicValue.currentValue = value;
            }
        };
    }

    render () {
        for (let renderable of this.renderables) {
            switch (renderable.type) {
                case 'attribute':
                    this.renderAttribute(renderable);
                    break;
                case 'text':
                    this.renderText(renderable);
                    break;
                case 'template':
                    this.renderTemplate(renderable);
                    break;
            }
        }
    }

    private parse (node: Node) {
        // walk over the element and save all dynamic marker nodes
        const treeWalker = document.createTreeWalker(node, 5 /** only elements and text */);
        while(treeWalker.nextNode()) {
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
                        const dynamicValues: DynamicValue[] = [];
                        for (let i = 0; i < dynamicValuesCount; i++) {
                            dynamicValues.push({
                                currentValue: dynamicMarker,
                                oldValue: null
                            });
                        }
                        this.values = this.values.concat(dynamicValues);

                        // create renderable
                        const attributeRenderable = {
                            type: 'attribute',
                            container: currentAttribute,
                            template: currentAttribute.textContent,
                            values: dynamicValues
                        };
                        this.renderables.push(attributeRenderable);
                    }
                }
            } else if (currentNode.textContent.indexOf(dynamicMarker) > -1) {
                // if it's not an element, must be in a text position

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

                // empty current node and replace with text nodes
                // ** warning: can't appendChild() or else walker
                // ** will keep adding and walking over nodes **
                const parentNode = currentNode.parentElement;
                for (let i = 0; i < textParts.length; i++) {
                    parentNode.insertBefore(textParts[i], currentNode);
                }

                // remove current text node from parent
                parentNode.removeChild(currentNode);

                // parse each new text node
                for (let i = 0; i < valueMarkerIndices.length; i++) {
                    const dynamicValue = {
                        currentValue: dynamicMarker,
                        oldValue: null
                    };
                    this.values.push(dynamicValue);
                    this.renderables.push({
                        type: 'text',
                        container: textParts[valueMarkerIndices[i]],
                        template: dynamicMarker,
                        values: [dynamicValue]
                    });
                }
            }
        }
    }

    /**
     * Renders a new attribute value by
     * rebuilding the raw string and replacing
     * each dynamic part with their current values
     * @param renderable a dynamic attribute value
     */
    private renderAttribute(renderable: DynamicRenderable) {
        let attributeValue = renderable.template;
        for (let j = 0; j < renderable.values.length; j++) {
            attributeValue = attributeValue.replace(dynamicMarker, renderable.values[j].currentValue);
        }
        renderable.container.textContent = attributeValue;
    }

    /**
     * Renders a new text value.
     * @param renderable a dynamic text node
     */
    private renderText(renderable: DynamicRenderable) {
        renderable.container.textContent = renderable.values[0].currentValue;
    }

    /**
     * Renders a nested zen template.
     * @param renderable a dynamic text node
     */
    private renderTemplate(renderable: DynamicRenderable) {
        throw new Error('Not Implemented');
        // renderable.container.textContent = renderable.values[0].currentValue;
    }
}

interface DynamicValue {
    currentValue: any;
    oldValue: any;
}
interface DynamicRenderable {
    type: string;
    container: Node;
    template: string;
    values: DynamicValue[];
}