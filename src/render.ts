import { ZenRender } from './zen-render';
import { ZenTemplate } from './zen-template';

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

    zenRender.render(zenTemplate.values);
}