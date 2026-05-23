import test from "node:test";
import assert from "node:assert/strict";

import { getFileExtensionFromUrl, getMediaTypeLabel } from "./mediaResource.js";

test("getMediaTypeLabel returns Ukrainian media type labels", () => {
  assert.equal(getMediaTypeLabel("DOCUMENT"), "Документ");
  assert.equal(getMediaTypeLabel("VIDEO_LINK"), "Відео");
  assert.equal(getMediaTypeLabel("EXTERNAL_LINK"), "Лінк");
  assert.equal(getMediaTypeLabel("IMAGE"), "Світлина");
});

test("getMediaTypeLabel falls back to resource label", () => {
  assert.equal(getMediaTypeLabel("UNKNOWN"), "Матеріал");
  assert.equal(getMediaTypeLabel(""), "Матеріал");
});

test("getFileExtensionFromUrl extracts extension without query params", () => {
  assert.equal(getFileExtensionFromUrl("https://example.com/folder/file.pdf?download=1"), "PDF");
  assert.equal(getFileExtensionFromUrl("https://example.com/image.webp#preview"), "WEBP");
  assert.equal(getFileExtensionFromUrl("https://example.com/no-extension"), "DOC");
});
