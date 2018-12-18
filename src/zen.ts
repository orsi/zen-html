import { ZenTemplate } from './zen-template';

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
