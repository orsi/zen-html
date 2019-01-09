export const valueMarker = `%zen%`;
export class ZenTemplate {
    private strings;
    private html;
    values: any[];
    constructor(strings: TemplateStringsArray, values: any[]) {
        this.strings = strings;
        this.values = values;
        this.html = this.parse(this.strings);
    }

    /** Parses the template strings and returns a string representation
     * of an element with values replaced by markers.
     */
    parse (strings: TemplateStringsArray): string {
        let html = '';
        strings.forEach((element, index) => {
            html += element + (index < strings.length - 1 ? valueMarker : '');
        });
        return html;
    }

    getTemplate (): HTMLTemplateElement {
        const template = document.createElement('template');
        template.innerHTML = this.html;
        return template;
    }
}