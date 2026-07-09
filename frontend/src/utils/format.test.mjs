// Unit tests for the pure XLM/stroop conversion helpers.
// Run with: npm test  (uses Node's built-in test runner, no extra deps)
import test from "node:test";
import assert from "node:assert/strict";
import { toStroops, fromStroops, STROOPS_PER_XLM } from "./format.js";

test("toStroops converts whole XLM to stroops as BigInt", () => {
  assert.equal(toStroops(1), 10_000_000n);
  assert.equal(toStroops(0), 0n);
  assert.equal(typeof toStroops(1), "bigint");
});

test("toStroops handles fractional XLM and floors sub-stroop amounts", () => {
  assert.equal(toStroops(0.5), 5_000_000n);
  assert.equal(toStroops(1.2345678), 12_345_678n);
  // 0.00000009 XLM = 0.9 stroops -> floors to 0
  assert.equal(toStroops(0.00000009), 0n);
});

test("fromStroops converts stroops back to an XLM string", () => {
  assert.equal(fromStroops(10_000_000), "1");
  assert.equal(fromStroops(5_000_000n), "0.5");
  assert.equal(fromStroops("12345678"), "1.2345678");
});

test("fromStroops returns '0' for falsy input", () => {
  assert.equal(fromStroops(0), "0");
  assert.equal(fromStroops(null), "0");
  assert.equal(fromStroops(undefined), "0");
});

test("toStroops and fromStroops round-trip for typical ticket prices", () => {
  for (const xlm of [1, 2.5, 10, 0.1]) {
    assert.equal(fromStroops(toStroops(xlm)), String(xlm));
  }
});

test("STROOPS_PER_XLM matches the 7-decimal native asset precision", () => {
  assert.equal(STROOPS_PER_XLM, 10 ** 7);
});
