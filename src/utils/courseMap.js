export function formatSubjectCount(count) {
  const safeCount = Number.isFinite(Number(count)) ? Math.abs(Number(count)) : 0;
  const lastTwoDigits = safeCount % 100;
  const lastDigit = safeCount % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${count} предметів`;
  }

  if (lastDigit === 1) {
    return `${count} предмет`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} предмети`;
  }

  return `${count} предметів`;
}

export function getTotalCredits(subjects) {
  return subjects.reduce((total, subject) => {
    const credits = Number(subject?.credits);
    return Number.isFinite(credits) ? total + credits : total;
  }, 0);
}

export function formatCreditCount(count) {
  const safeCount = Number.isFinite(Number(count)) ? Math.abs(Number(count)) : 0;
  const lastTwoDigits = safeCount % 100;
  const lastDigit = safeCount % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${count} кредитів`;
  }

  if (lastDigit === 1) {
    return `${count} кредит`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} кредити`;
  }

  return `${count} кредитів`;
}
