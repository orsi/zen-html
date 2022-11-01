import { assertEquals } from "https://deno.land/std@0.161.0/testing/asserts.ts";
import { zen } from "./zen.ts";

Deno.test("#1", () => {
  const x = zen`<h1>hi</h1>`;
  const y = zen`<h1>hi</h1>`;
  console.log(x, y);
  assertEquals(x, y);
});
