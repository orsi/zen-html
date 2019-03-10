import { ZenNode } from './zen-node';
import { ZenTemplate } from './zen-template';

export const containerCache = new WeakMap<Node, ZenNode>();

/**
 * Renders a zen template into a container DOM element.
 * @param zenTemplate A zen template to render into the DOM
 * @param container The DOM element to render into
 */
export const render = function (zenTemplate: ZenTemplate, container: Node) {
    // check if zen template has been rendered and cached
    let zenRender = containerCache.get(container);
    if (!zenRender) {
        // create zen render, cache, and insert
        const dynamicNode = zenTemplate.clone();
        zenRender = new ZenNode(dynamicNode);
        containerCache.set(container, zenRender);
        container.appendChild(dynamicNode);
    }
    zenRender.render(zenTemplate.values);
}