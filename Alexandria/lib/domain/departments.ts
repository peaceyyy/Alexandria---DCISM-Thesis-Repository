export const DEPARTMENTS = ["CS", "IT", "IS"] as const;

export type Department = (typeof DEPARTMENTS)[number];

export function isDepartment(value: string): value is Department {
  return DEPARTMENTS.includes(value as Department);
}
