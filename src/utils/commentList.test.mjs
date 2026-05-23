import test from "node:test";
import assert from "node:assert/strict";

import { addCommentToTop, removeComment, replaceComment } from "./commentList.js";

test("addCommentToTop places the new comment first and avoids duplicates", () => {
  const comments = [
    { id: 2, content: "Second" },
    { id: 1, content: "First" },
  ];

  assert.deepEqual(addCommentToTop(comments, { id: 3, content: "Newest" }), [
    { id: 3, content: "Newest" },
    { id: 2, content: "Second" },
    { id: 1, content: "First" },
  ]);

  assert.deepEqual(addCommentToTop(comments, { id: 2, content: "Updated second" }), [
    { id: 2, content: "Updated second" },
    { id: 1, content: "First" },
  ]);
});

test("replaceComment updates an existing comment without changing order", () => {
  const comments = [
    { id: 3, content: "Newest" },
    { id: 2, content: "Second" },
    { id: 1, content: "First" },
  ];

  assert.deepEqual(replaceComment(comments, { id: 2, content: "Edited" }), [
    { id: 3, content: "Newest" },
    { id: 2, content: "Edited" },
    { id: 1, content: "First" },
  ]);
});

test("removeComment removes a comment by id", () => {
  const comments = [
    { id: 3, content: "Newest" },
    { id: 2, content: "Second" },
    { id: 1, content: "First" },
  ];

  assert.deepEqual(removeComment(comments, 2), [
    { id: 3, content: "Newest" },
    { id: 1, content: "First" },
  ]);
});
