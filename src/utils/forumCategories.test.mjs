import test from "node:test";
import assert from "node:assert/strict";

import {
  FORUM_CATEGORY_NAMES,
  getForumCategories,
  getForumCategoryNames,
} from "./forumCategories.js";

test("forum category names stay in the intended display order", () => {
  assert.deepEqual(FORUM_CATEGORY_NAMES, ["Навчання", "Події", "Поради", "FAQ", "Гумор"]);
});

test("getForumCategories preserves API ids and filters unrelated categories", () => {
  const apiCategories = [
    { id: 5, name: "Документи", type: "MEDIA" },
    { id: 9, name: "Гумор", type: "FORUM" },
    { id: 3, name: "Навчання", type: "FORUM" },
    { id: 8, name: "FAQ", type: "FORUM" },
  ];

  assert.deepEqual(getForumCategories(apiCategories), [
    { id: 3, name: "Навчання", type: "FORUM" },
    { id: 8, name: "FAQ", type: "FORUM" },
    { id: 9, name: "Гумор", type: "FORUM" },
  ]);
});

test("getForumCategories falls back to known names for legacy category payloads", () => {
  const legacyCategories = [
    { id: 5, name: "Документи" },
    { id: 11, name: "Гумор" },
  ];

  assert.deepEqual(getForumCategories(legacyCategories), [
    { id: 11, name: "Гумор" },
  ]);
});

test("getForumCategoryNames returns only display names", () => {
  assert.deepEqual(getForumCategoryNames([
    { id: 9, name: "Поради", type: "FORUM" },
    { id: 5, name: "Документи", type: "MEDIA" },
  ]), ["Поради"]);
});
