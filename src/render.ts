import { DynamicNode } from './dynamic-node';
import { ZenTemplate } from './zen-template';

/**
 * A cache of dyanmic nodes rendered into containers.
 */
export const containerCache = new WeakMap<Node, DynamicNode>();

/**
 * Renders a zen template into a container DOM element.
 * @param zenTemplate A zen template to render into the DOM
 * @param container The DOM element to render into
 */
export const render = function (zenTemplate: ZenTemplate, container: Node) {
    // check if zen template has been rendered and cached
    let dynamicNode = containerCache.get(container);
    if (!dynamicNode) {
        // container has not been rendered into before.
        // clone, parse, and insert template
        const template = zenTemplate.clone();
        dynamicNode = new DynamicNode(template);
        container.appendChild(template);
        containerCache.set(container, dynamicNode);
    }
    dynamicNode.update(zenTemplate.values);
    dynamicNode.render();
}