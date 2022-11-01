export const DYNAMIC_MARKER = "❍";

export const zenTemplateCache = new WeakMap<
  TemplateStringsArray,
  string
>();

/**
 * Parses the template strings and returns a string representation
 * of an element with value positions replaced by markers.
 * @param templateStrings
 */
function parse(templateStrings: TemplateStringsArray, values: unknown[]) {
  let htmlString = "";
  templateStrings.forEach((item, i) => {
    htmlString += item + (i < templateStrings.length - 1 ? values[i] : "");
  });
  return htmlString;
}

export const useEffect = (effectFunction: () => void | (() => void)) => {
  const effectCleanupFunction = effectFunction();
  if (effectCleanupFunction) {
    effectCleanupFunction();
  }
};
export const useReference = (value: unknown) => {
  return {
    current: value,
  };
};
export const useState = (value: unknown) => {
  return value;
};

export const zen = function (
  templateStrings: TemplateStringsArray,
  ...values: unknown[]
) {
  // check if this component been cached
  let component = zenTemplateCache.get(templateStrings);
  if (!component) {
    // create and cache template
    component = parse(templateStrings, values);
    zenTemplateCache.set(templateStrings, component);
  }
  return component;
};
