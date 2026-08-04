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

/**
 * Convert a File or Blob to a storable { dataUrl, name, type } object.
 * Uses FileReader so it works in all browsers without needing arrayBuffer support.
 */
export function fileToStorable(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve({ dataUrl: reader.result, name: file.name, type: file.type });
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Reconstruct a File from a stored { dataUrl, name, type } object.
 */
export function storableToFile({ dataUrl, name, type }) {
  const [, b64] = dataUrl.split(',');
  const bytes   = atob(b64);
  const arr     = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], name, { type });
}

/**
 * Save a draft.
 * `files`       — map of { key: File } for base64-serialised files (image only; PDFs go server-side).
 * `serverFiles` — map of server-relative paths already uploaded to /api/draft-files,
 *                 e.g. { aadhaarPath: 'drafts/...', idCardPath: 'drafts/...', ... }
 */
export async function saveDraft(id, form, files = {}, serverFiles = {}) {
  const drafts = getDrafts();
  const now    = new Date().toISOString();

  // Serialise every File that was passed
  const serialisedFiles = {};
  for (const [key, file] of Object.entries(files)) {
    if (file instanceof File || file instanceof Blob) {
      try {
        serialisedFiles[key] = await fileToStorable(file);
      } catch {
        // skip files that can't be read (e.g. revoked blob URLs used as File)
      }
    }
  }

  const idx   = drafts.findIndex((d) => d.id === id);
  const entry = {
    id,
    form,
    files: serialisedFiles,
    serverFiles, // server-relative paths for PDFs uploaded via /api/draft-files
    createdAt: idx >= 0 ? drafts[idx].createdAt : now,
    updatedAt: now,
  };

  if (idx >= 0) {
    drafts[idx] = entry;
  } else {
    drafts.unshift(entry);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // Quota exceeded — retry storing without file data so text fields are at least preserved
    const stripped = drafts.map((d) => ({ ...d, files: {} }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
    } catch {
      /* nothing we can do */
    }
    throw new Error('Documents are too large to save in the draft. Text fields were saved successfully.');
  }
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

/** Count how many document files are stored in a draft (base64 + server-side) */
export function draftFileCount(draft) {
  let count = 0;
  if (draft?.files) count += Object.keys(draft.files).length;
  if (draft?.serverFiles) count += Object.values(draft.serverFiles).filter(Boolean).length;
  return count;
}
