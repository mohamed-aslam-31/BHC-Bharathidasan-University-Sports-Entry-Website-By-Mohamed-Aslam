/* ─── Draft utilities (localStorage) ──────────────────────────────────────── */

const STORAGE_KEY = 'bhc_sports_drafts';

export function getDrafts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getDraft(id) {
  return getDrafts().find((d) => d.id === id) || null;
}

export function saveDraft(id, form) {
  const drafts = getDrafts();
  const now = new Date().toISOString();
  const idx = drafts.findIndex((d) => d.id === id);
  if (idx >= 0) {
    drafts[idx] = { ...drafts[idx], form, updatedAt: now };
  } else {
    drafts.unshift({ id, form, createdAt: now, updatedAt: now });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function deleteDraft(id) {
  const drafts = getDrafts().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function clearAllDrafts() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check whether a draft with the same rollNo + year + game already exists.
 * Pass excludeId to skip the current draft (useful when updating an existing draft).
 */
export function isDraftDuplicate(rollNo, year, game, excludeId = null) {
  if (!rollNo || !year || !game) return null;
  return getDrafts().find(
    (d) =>
      d.id !== excludeId &&
      d.form?.rollNo === rollNo &&
      d.form?.year === year &&
      d.form?.nameOfTheGame === game,
  ) || null;
}

/** Count how many of the 24 required fields are non-empty */
export function completionPercent(form) {
  const required = [
    'year', 'rollNo', 'nameOfTheGame', 'gender', 'bloodGroup', 'shift',
    'studentType', 'dayType',
    'studentName', 'fatherName', 'motherName', 'dob', 'address',
    'aadharNumber', 'phoneNumber',
    'university', 'presentClass', 'nameOfThePresentClass', 'durationOfCourse',
    'graduateCourse', 'pgCourse', 'presentCourse', 'nameOfExam', 'dateAndYear',
  ];
  const filled = required.filter((k) => form[k] && String(form[k]).trim()).length;
  return Math.round((filled / required.length) * 100);
}
