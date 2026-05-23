import test from "node:test";
import assert from "node:assert/strict";

import { formatCreditCount, formatSubjectCount, getTotalCredits } from "./courseMap.js";

test("formatSubjectCount returns correct Ukrainian subject forms", () => {
  assert.equal(formatSubjectCount(0), "0 предметів");
  assert.equal(formatSubjectCount(1), "1 предмет");
  assert.equal(formatSubjectCount(2), "2 предмети");
  assert.equal(formatSubjectCount(5), "5 предметів");
  assert.equal(formatSubjectCount(11), "11 предметів");
  assert.equal(formatSubjectCount(21), "21 предмет");
});

test("getTotalCredits sums only numeric subject credits", () => {
  assert.equal(getTotalCredits([{ credits: 5 }, { credits: "4" }, { credits: null }, {}]), 9);
});

test("formatCreditCount returns correct Ukrainian credit forms", () => {
  assert.equal(formatCreditCount(1), "1 кредит");
  assert.equal(formatCreditCount(3), "3 кредити");
  assert.equal(formatCreditCount(12), "12 кредитів");
  assert.equal(formatCreditCount(25), "25 кредитів");
});
