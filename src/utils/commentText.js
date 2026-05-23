export function getCommentWord(count) {
  const normalizedCount = Math.abs(Number(count) || 0);
  const lastTwoDigits = normalizedCount % 100;
  const lastDigit = normalizedCount % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "коментарів";
  }

  if (lastDigit === 1) {
    return "коментар";
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "коментарі";
  }

  return "коментарів";
}

export function formatCommentCount(count) {
  const normalizedCount = Number.isFinite(Number(count)) ? Number(count) : 0;
  return `${normalizedCount} ${getCommentWord(normalizedCount)}`;
}
