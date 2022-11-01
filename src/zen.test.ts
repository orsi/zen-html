import { assertExists } from "https://deno.land/std@0.161.0/testing/asserts.ts";
import { useEffect, useReference, useState, zen } from "./zen.ts";

function MyComponent() {
  const testState = useState(1);
  const testReference = useReference(true);

  useEffect(() => {
    console.log("effect");
    return () => {
      console.log("cleanup");
    };
  });

  return zen`<div>
  <h1>zen-html</h1>
  <div>useState: ${testState}</div>
  <div>useReference: ${testReference.current}</div>
</div>`;
}

Deno.test("#1", () => {
  const dynamicComponent = MyComponent();
  console.log(dynamicComponent);
  assertExists(dynamicComponent);
});
