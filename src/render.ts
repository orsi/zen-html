import { ZenNode } from './zen-node';
import { ZenTemplate } from './zen-template';

export const containerCache = new WeakMap<Node, ZenNode>();
export const render = function (zenTemplate: ZenTemplate, container: Node) {
    // check if zen template has been rendered and cached
    let zenRender = containerCache.get(container);
    if (!zenRender) {
        // create zen render and cache
        zenRender = new ZenNode(zenTemplate.getTemplate().content.cloneNode(true));
        containerCache.set(container, zenRender);
        // insert into container
        container.appendChild(zenRender.rootNode);
    }
    zenRender.render(zenTemplate.values);
}