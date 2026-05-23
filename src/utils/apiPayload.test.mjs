import test from "node:test";
import assert from "node:assert/strict";

import {
  extractArray,
  extractCollectionPayload,
  extractPageContent,
  readJsonPayload,
} from "./apiPayload.js";

test("extractArray returns arrays and safely ignores invalid payloads", () => {
  assert.deepEqual(extractArray([{ id: 1 }]), [{ id: 1 }]);
  assert.deepEqual(extractArray("<!doctype html>"), []);
  assert.deepEqual(extractArray(null), []);
});

test("extractPageContent returns pageable content and safely ignores invalid payloads", () => {
  assert.deepEqual(extractPageContent({ content: [{ id: 2 }] }), [{ id: 2 }]);
  assert.deepEqual(extractPageContent({ content: "not-array" }), []);
  assert.deepEqual(extractPageContent("<!doctype html>"), []);
});

test("extractCollectionPayload accepts arrays and pageable responses", () => {
  assert.deepEqual(extractCollectionPayload([{ id: 1 }]), [{ id: 1 }]);
  assert.deepEqual(extractCollectionPayload({ content: [{ id: 2 }] }), [{ id: 2 }]);
  assert.deepEqual(extractCollectionPayload("<!doctype html>"), []);
});

test("readJsonPayload ignores html fallback responses without throwing parser errors", async () => {
  const response = new Response("<!doctype html>", {
    headers: { "content-type": "text/html" },
  });

  assert.equal(await readJsonPayload(response), null);
});

test("readJsonPayload returns json responses", async () => {
  const response = new Response(JSON.stringify({ content: [{ id: 3 }] }), {
    headers: { "content-type": "application/json" },
  });

  assert.deepEqual(await readJsonPayload(response), { content: [{ id: 3 }] });
});
