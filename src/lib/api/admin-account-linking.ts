import { apiRequest } from "./http";

export type AdminLinkingStudentListItem = {
  id: string;
  name: string | null;
  email: string;
  studentCode: string | null;
  linkedParentsCount: number;
};

export type AdminLinkingParentListItem = {
  id: string;
  name: string | null;
  email: string;
};

export type AdminLinkingStudentLinksResponse = {
  student: {
    id: string;
    name: string | null;
    email: string;
    studentCode: string | null;
    isStudent: boolean;
  };
  parents: Array<{
    id: string;
    name: string | null;
    email: string;
    relationType: string;
    createdAt: string;
  }>;
};

export function searchStudents(query: string) {
  return apiRequest<AdminLinkingStudentListItem[]>("/api/admin/account-linking/students", {
    method: "GET",
    query: { query },
  });
}

export function searchParents(query: string) {
  return apiRequest<AdminLinkingParentListItem[]>("/api/admin/account-linking/parents", {
    method: "GET",
    query: { query },
  });
}

export function getStudentLinks(studentId: string) {
  return apiRequest<AdminLinkingStudentLinksResponse>(`/api/admin/account-linking/students/${studentId}` as const, {
    method: "GET",
  });
}

export function linkParent(studentId: string, parentId: string) {
  return apiRequest<{ message: string }>(
    `/api/admin/account-linking/students/${studentId}/parents/${parentId}` as const,
    { method: "POST" },
  );
}

export function unlinkParent(studentId: string, parentId: string) {
  return apiRequest<{ message: string }>(
    `/api/admin/account-linking/students/${studentId}/parents/${parentId}` as const,
    { method: "DELETE" },
  );
}
