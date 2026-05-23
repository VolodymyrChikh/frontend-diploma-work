import test from "node:test";
import assert from "node:assert/strict";

import { formatCommentCount } from "./commentText.js";

test("formatCommentCount uses correct Ukrainian comment forms", () => {
  assert.equal(formatCommentCount(0), "0 коментарів");
  assert.equal(formatCommentCount(1), "1 коментар");
  assert.equal(formatCommentCount(2), "2 коментарі");
  assert.equal(formatCommentCount(5), "5 коментарів");
  assert.equal(formatCommentCount(11), "11 коментарів");
  assert.equal(formatCommentCount(21), "21 коментар");
  assert.equal(formatCommentCount(24), "24 коментарі");
});
