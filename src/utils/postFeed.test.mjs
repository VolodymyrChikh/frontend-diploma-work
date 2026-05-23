import test from "node:test";
import assert from "node:assert/strict";

import { removePostFromFeed, updatePostInFeed } from "./postFeed.js";

const posts = [
  { id: 1, title: "First", likes: 0 },
  { id: 2, title: "Second", likes: 4 },
  { id: 3, title: "Third", likes: 2 },
];

test("removePostFromFeed removes a post by id", () => {
  assert.deepEqual(removePostFromFeed(posts, 2), [
    { id: 1, title: "First", likes: 0 },
    { id: 3, title: "Third", likes: 2 },
  ]);
});

test("updatePostInFeed replaces the matching post and keeps list order", () => {
  assert.deepEqual(updatePostInFeed(posts, { id: 2, title: "Second updated", likes: 5 }), [
    { id: 1, title: "First", likes: 0 },
    { id: 2, title: "Second updated", likes: 5 },
    { id: 3, title: "Third", likes: 2 },
  ]);
});

test("updatePostInFeed leaves the feed unchanged when the post is not present", () => {
  assert.deepEqual(updatePostInFeed(posts, { id: 99, title: "Missing" }), posts);
});
