export const DYNAMIC_MARKER = "❍";
export class ZenTemplate {
  html = "";
  strings: TemplateStringsArray;
  values: unknown[];
  constructor(strings: TemplateStringsArray, values: unknown[]) {
    this.strings = strings;
    this.values = values;
    this.parse(this.strings);
  }

  /**
   * Parses the template strings and returns a string representation
   * of an element with value positions replaced by markers.
   * @param strings
   */
  parse(strings: TemplateStringsArray) {
    strings.forEach((element, i) => {
      this.html += element + (i < strings.length - 1 ? DYNAMIC_MARKER : "");
    });
  }

  /**
   * Creates and returns an HTML Template element from the
   * raw string.
   */
  getTemplate(): HTMLTemplateElement {
    const template = document.createElement("template");
    template.innerHTML = this.html;
    return template;
  }

  /**
   * Clones an element using this template.
   */
  clone(): HTMLElement {
    return this.getTemplate().content.cloneNode(true) as HTMLElement;
  }
}
