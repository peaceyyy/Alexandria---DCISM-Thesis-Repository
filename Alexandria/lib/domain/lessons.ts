export const LESSON_MAX_LENGTH = 120;

export function parseLessonEntries(value: string | null | undefined) {
  return value
    ? value
        .split(/\r?\n/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
}

export function serializeLessonEntries(entries: string[]) {
  return entries
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join("\n");
}
