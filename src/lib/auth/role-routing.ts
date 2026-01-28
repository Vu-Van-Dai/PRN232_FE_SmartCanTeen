export function hasAnyRole(userRoles: string[], anyOf: string[]): boolean {
  const set = new Set(userRoles.map((r) => r.toLowerCase()));
  return anyOf.some((r) => set.has(r.toLowerCase()));
}

export function getPrimaryRole(userRoles: string[]): string {
  // Prefer "highest" roles for display.
  const priority = ["AdminSystem", "Manager", "StaffPOS", "StaffKitchen", "StaffCoordination", "Staff", "Parent", "Student"];
  for (const p of priority) {
    if (hasAnyRole(userRoles, [p])) return p;
  }
  return userRoles[0] ?? "User";
}

export function getDefaultPathForRoles(userRoles: string[]): string {
  if (hasAnyRole(userRoles, ["AdminSystem", "Manager"])) return "/admin";
  if (hasAnyRole(userRoles, ["StaffKitchen"])) return "/kitchen/kds";
  if (hasAnyRole(userRoles, ["StaffCoordination"])) return "/kitchen/board";
  if (hasAnyRole(userRoles, ["StaffPOS", "Staff"])) return "/pos";
  if (hasAnyRole(userRoles, ["Student", "Parent"])) return "/student/home";
  return "/student/home";
}
