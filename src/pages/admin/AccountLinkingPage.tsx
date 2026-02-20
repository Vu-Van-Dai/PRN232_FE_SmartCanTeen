import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminAccountLinkingApi } from "@/lib/api";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

type LinkingImportRow = {
  rowNumber: number;
  studentEmail: string;
  parentEmail: string;
  studentName?: string;
  parentName?: string;
};

type LinkingImportFailure = {
  rowNumber: number;
  studentName?: string;
  studentEmail: string;
  parentName?: string;
  parentEmail: string;
  error: string;
};

function normalizeHeaderKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

function getRowValue(row: Record<string, unknown>, candidateKeys: string[]) {
  const keys = Object.keys(row);
  for (const k of keys) {
    const nk = normalizeHeaderKey(k);
    if (candidateKeys.includes(nk)) return row[k];
  }
  return undefined;
}

async function parseLinkingExcel(file: File): Promise<LinkingImportRow[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];

  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  const parsed: LinkingImportRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] ?? {};
    const rowNumber = i + 2;

    const studentName = String(getRowValue(r, ["tenhocsinh", "tenthocsinh", "studentname", "student"]) ?? "").trim();
    const parentName = String(getRowValue(r, ["tenchame", "tenchame", "parentname", "parent"]) ?? "").trim();
    const studentEmail = String(getRowValue(r, ["emailhocsinh", "studentemail", "emailsinhvien", "emailsv"]) ?? "").trim();
    const parentEmail = String(getRowValue(r, ["emailchame", "parentemail"]) ?? "").trim();

    const allEmpty = !studentEmail && !parentEmail && !studentName && !parentName;
    if (allEmpty) continue;

    parsed.push({
      rowNumber,
      studentEmail,
      parentEmail,
      studentName: studentName || undefined,
      parentName: parentName || undefined,
    });
  }

  return parsed;
}

function downloadAccountLinkingTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([["Tên Học Sinh", "Email Học Sinh", "Tên Cha/Mẹ", "Email Cha/Mẹ"]]);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  const data = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "account-linking-template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadAccountLinkingErrorReport(failures: LinkingImportFailure[]) {
  const wb = XLSX.utils.book_new();
  const headers = [["Họ và tên học sinh", "Email học sinh", "Tên cha/mẹ", "Email cha/mẹ", "Lỗi"]];
  const data = failures.map((f) => [f.studentName ?? "", f.studentEmail ?? "", f.parentName ?? "", f.parentEmail ?? "", f.error]);
  const ws = XLSX.utils.aoa_to_sheet([...headers, ...data]);
  XLSX.utils.book_append_sheet(wb, ws, "Errors");

  const bytes = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "account-linking-import-errors.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function AccountLinkingPage() {
  const qc = useQueryClient();
  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  const [studentQuery, setStudentQuery] = useState("");
  const debouncedStudentQuery = useDebouncedValue(studentQuery, 250);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [parentQuery, setParentQuery] = useState("");
  const debouncedParentQuery = useDebouncedValue(parentQuery, 250);
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);

  const [unlinkTarget, setUnlinkTarget] = useState<{ parentId: string; parentName: string } | null>(null);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImportResultOpen, setIsImportResultOpen] = useState(false);
  const [importResult, setImportResult] = useState<{
    total: number;
    success: number;
    failures: LinkingImportFailure[];
  } | null>(null);

  const studentsQuery = useQuery({
    queryKey: ["admin", "account-linking", "students", debouncedStudentQuery],
    queryFn: () => adminAccountLinkingApi.searchStudents(debouncedStudentQuery),
  });

  const selectedLinksQuery = useQuery({
    queryKey: ["admin", "account-linking", "student-links", selectedStudentId],
    queryFn: () => {
      if (!selectedStudentId) throw new Error("No student selected");
      return adminAccountLinkingApi.getStudentLinks(selectedStudentId);
    },
    enabled: !!selectedStudentId,
  });

  const parentsQuery = useQuery({
    queryKey: ["admin", "account-linking", "parents", debouncedParentQuery],
    queryFn: () => adminAccountLinkingApi.searchParents(debouncedParentQuery),
    enabled: !!selectedStudentId && debouncedParentQuery.trim().length > 0,
  });

  const linkedParentIds = useMemo(() => {
    const items = selectedLinksQuery.data?.parents ?? [];
    return new Set(items.map((p) => p.id));
  }, [selectedLinksQuery.data?.parents]);

  const selectedParents = useMemo(() => {
    const items = parentsQuery.data ?? [];
    const byId = new Map(items.map((p) => [p.id, p] as const));
    return selectedParentIds
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => p != null);
  }, [parentsQuery.data, selectedParentIds]);

  const toggleParentSelected = (parentId: string) => {
    setSelectedParentIds((prev) => (prev.includes(parentId) ? prev.filter((id) => id !== parentId) : [...prev, parentId]));
  };

  const linkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudentId) throw new Error("Missing student selection");
      const parentIdsToLink = selectedParentIds.filter((id) => !linkedParentIds.has(id));
      if (parentIdsToLink.length === 0) throw new Error("No parent selected");

      const results = await Promise.allSettled(parentIdsToLink.map((parentId) => adminAccountLinkingApi.linkParent(selectedStudentId, parentId)));
      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        throw new Error(`Link failed for ${failures.length}/${results.length} parent(s)`);
      }
      return { linkedCount: results.length };
    },
    onSuccess: async () => {
      toast({ title: "Đã liên kết" });
      setSelectedParentIds([]);
      setParentQuery("");
      await qc.invalidateQueries({ queryKey: ["admin", "account-linking", "student-links", selectedStudentId] });
      await qc.invalidateQueries({ queryKey: ["admin", "account-linking", "students"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Không thể liên kết";
      toast({ title: "Liên kết thất bại", description: msg, variant: "destructive" });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (parentId: string) => {
      if (!selectedStudentId) throw new Error("No student selected");
      return adminAccountLinkingApi.unlinkParent(selectedStudentId, parentId);
    },
    onSuccess: async () => {
      toast({ title: "Đã hủy liên kết" });
      setUnlinkTarget(null);
      await qc.invalidateQueries({ queryKey: ["admin", "account-linking", "student-links", selectedStudentId] });
      await qc.invalidateQueries({ queryKey: ["admin", "account-linking", "students"] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Không thể hủy liên kết";
      toast({ title: "Hủy liên kết thất bại", description: msg, variant: "destructive" });
    },
  });

  const importLinkingMutation = useMutation({
    mutationFn: async (file: File) => {
      const rows = await parseLinkingExcel(file);
      if (rows.length === 0) throw new Error("File không có dữ liệu hợp lệ");

      // Cache lookups for performance
      const studentIdByEmail = new Map<string, string>();
      const parentIdByEmail = new Map<string, string>();

      let success = 0;
      const failures: LinkingImportFailure[] = [];

      const normalizeEmail = (email: string) => email.trim().toLowerCase();

      for (const r of rows) {
        const studentEmail = r.studentEmail.trim();
        const parentEmail = r.parentEmail.trim();

        if (!studentEmail || !parentEmail) {
          failures.push({
            rowNumber: r.rowNumber,
            studentName: r.studentName,
            studentEmail,
            parentName: r.parentName,
            parentEmail,
            error: "Thiếu Email học sinh/Email cha/mẹ",
          });
          continue;
        }

        const studentKey = normalizeEmail(studentEmail);
        const parentKey = normalizeEmail(parentEmail);

        try {
          let studentId = studentIdByEmail.get(studentKey);
          if (!studentId) {
            const students = await adminAccountLinkingApi.searchStudents(studentEmail);
            const found = students.find((s) => (s.email ?? "").toLowerCase() === studentKey);
            if (!found) {
              failures.push({
                rowNumber: r.rowNumber,
                studentName: r.studentName,
                studentEmail,
                parentName: r.parentName,
                parentEmail,
                error: `Không tìm thấy học sinh: ${studentEmail}`,
              });
              continue;
            }
            studentId = found.id;
            studentIdByEmail.set(studentKey, studentId);
          }

          let parentId = parentIdByEmail.get(parentKey);
          if (!parentId) {
            const parents = await adminAccountLinkingApi.searchParents(parentEmail);
            const found = parents.find((p) => (p.email ?? "").toLowerCase() === parentKey);
            if (!found) {
              failures.push({
                rowNumber: r.rowNumber,
                studentName: r.studentName,
                studentEmail,
                parentName: r.parentName,
                parentEmail,
                error: `Không tìm thấy phụ huynh: ${parentEmail}`,
              });
              continue;
            }
            parentId = found.id;
            parentIdByEmail.set(parentKey, parentId);
          }

          await adminAccountLinkingApi.linkParent(studentId, parentId);
          success += 1;
        } catch (err) {
          failures.push({
            rowNumber: r.rowNumber,
            studentName: r.studentName,
            studentEmail,
            parentName: r.parentName,
            parentEmail,
            error: err instanceof Error ? err.message : "Không thể liên kết",
          });
        }
      }

      return { total: rows.length, success, failures };
    },
    onSuccess: async (result) => {
      setIsImportOpen(false);
      setImportFile(null);

      await qc.invalidateQueries({ queryKey: ["admin", "account-linking", "students"] });
      if (selectedStudentId) {
        await qc.invalidateQueries({ queryKey: ["admin", "account-linking", "student-links", selectedStudentId] });
      }

      setImportResult(result);
      setIsImportResultOpen(true);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Không thể import file";
      toast({ title: "Import thất bại", description: msg, variant: "destructive" });
    },
  });

  const students = studentsQuery.data ?? [];
  const selectedStudent = selectedLinksQuery.data?.student ?? null;
  const linkedParents = selectedLinksQuery.data?.parents ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Account Linking</h1>
          <p className="text-muted-foreground mt-1">Liên kết tài khoản phụ huynh và học sinh</p>
        </div>

        <Dialog
          open={isImportOpen}
          onOpenChange={(open) => {
            setIsImportOpen(open);
            if (!open) setImportFile(null);
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" disabled={importLinkingMutation.isPending}>
              {importLinkingMutation.isPending ? "Đang import..." : "Import Excel"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Account Linking</DialogTitle>
              <DialogDescription>
                Import danh sách liên kết. Một parent có thể liên kết với nhiều student.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={downloadAccountLinkingTemplate}>
                  Tải file mẫu
                </Button>

                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!importFileInputRef.current) return;
                    importFileInputRef.current.value = "";
                    importFileInputRef.current.click();
                  }}
                >
                  Chọn file
                </Button>
                <div className="text-sm text-muted-foreground truncate flex-1">{importFile ? importFile.name : "Chưa chọn file"}</div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                Hủy
              </Button>
              <Button
                disabled={importLinkingMutation.isPending || !importFile}
                onClick={() => importFile && importLinkingMutation.mutate(importFile)}
              >
                {importLinkingMutation.isPending ? "Đang import..." : "Import"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isImportResultOpen} onOpenChange={(open) => !open && setIsImportResultOpen(false)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Kết quả import liên kết</DialogTitle>
            <DialogDescription>
              {importResult
                ? `Thành công ${importResult.success}/${importResult.total}. Không liên kết được: ${importResult.failures.length} dòng.`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              {importResult ? `Tổng lỗi: ${importResult.failures.length}` : ""}
            </div>
            <Button
              variant="outline"
              disabled={!importResult || importResult.failures.length === 0}
              onClick={() => importResult && downloadAccountLinkingErrorReport(importResult.failures)}
            >
              Xuất file lỗi (Excel)
            </Button>
          </div>

          <div className="border rounded-md overflow-auto max-h-[55vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học sinh</TableHead>
                  <TableHead>Email học sinh</TableHead>
                  <TableHead>Cha/Mẹ</TableHead>
                  <TableHead>Email cha/mẹ</TableHead>
                  <TableHead>Lỗi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(importResult?.failures ?? []).map((f, idx) => (
                  <TableRow key={`${f.rowNumber}-${idx}`}>
                    <TableCell className="font-medium">{f.studentName ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.studentEmail || "—"}</TableCell>
                    <TableCell className="font-medium">{f.parentName ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.parentEmail || "—"}</TableCell>
                    <TableCell className="text-sm text-destructive">{f.error}</TableCell>
                  </TableRow>
                ))}

                {importResult && importResult.failures.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Không có lỗi.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportResultOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: Select Student */}
        <Card className="p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="flex-1">
              <Label htmlFor="studentSearch">Tìm học sinh</Label>
              <Input
                id="studentSearch"
                placeholder="Tìm theo email / tên / mã học sinh"
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
              />
            </div>
            <Badge variant="secondary">Student</Badge>
          </div>

          <div className="mt-4 max-h-[65vh] overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học sinh</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Linked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => {
                  const active = s.id === selectedStudentId;
                  return (
                    <TableRow
                      key={s.id}
                      className={active ? "bg-muted/50" : undefined}
                      onClick={() => {
                        setSelectedStudentId(s.id);
                        setParentQuery("");
                        setSelectedParentIds([]);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <TableCell>
                        <div className="font-medium">{s.name ?? "(No name)"}</div>
                        <div className="text-xs text-muted-foreground">{s.studentCode ?? "—"}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                      <TableCell className="text-right">
                        {s.linkedParentsCount === 0 ? (
                          <Badge variant="destructive">0</Badge>
                        ) : (
                          <Badge variant="secondary">{s.linkedParentsCount}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!studentsQuery.isLoading && students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                      Không tìm thấy học sinh.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {studentsQuery.isError && (
            <div className="text-sm text-destructive mt-3">
              {String((studentsQuery.error as Error)?.message ?? "Không tải được danh sách học sinh")}
            </div>
          )}
        </Card>

        {/* RIGHT: Link Parent */}
        <Card className="p-4">
          {!selectedStudentId ? (
            <div className="text-sm text-muted-foreground">Chọn 1 học sinh ở cột trái để bắt đầu.</div>
          ) : selectedLinksQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Đang tải liên kết...</div>
          ) : selectedLinksQuery.isError ? (
            <div className="text-sm text-destructive">
              {String((selectedLinksQuery.error as Error)?.message ?? "Không tải được dữ liệu")}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Student đang chọn</div>
                    <div className="text-lg font-semibold mt-1">{selectedStudent?.name ?? "(No name)"}</div>
                    <div className="text-sm text-muted-foreground">{selectedStudent?.email}</div>
                    <div className="text-sm text-muted-foreground">Mã học sinh: {selectedStudent?.studentCode ?? "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Linked parents</div>
                    <div className="text-2xl font-bold">{linkedParents.length}</div>
                    {linkedParents.length === 0 && <Badge variant="destructive">Student has no linked parent</Badge>}
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold mb-2">Parent đã liên kết</div>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parent</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linkedParents.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name ?? "(No name)"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUnlinkTarget({ parentId: p.id, parentName: p.name ?? p.email })}
                            >
                              Huỷ liên kết
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {linkedParents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                            Chưa có parent liên kết.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <div className="font-semibold mb-2">Thêm Parent</div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="parentSearch">Tìm parent</Label>
                    <Input
                      id="parentSearch"
                      placeholder="Chỉ tìm user role = Parent (email / tên)"
                      value={parentQuery}
                      onChange={(e) => {
                        setParentQuery(e.target.value);
                      }}
                    />
                    <div className="text-xs text-muted-foreground mt-1">Admin phải chọn rõ ràng parent trước khi link.</div>
                  </div>

                  {parentQuery.trim().length > 0 && (
                    <div className="border rounded-md max-h-48 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Parent</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Chọn</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(parentsQuery.data ?? []).map((p) => {
                            const disabled = linkedParentIds.has(p.id);
                            const active = selectedParentIds.includes(p.id);
                            return (
                              <TableRow key={p.id} className={active ? "bg-muted/50" : undefined}>
                                <TableCell className="font-medium">{p.name ?? "(No name)"}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                                <TableCell className="text-right">
                                  {disabled ? (
                                    <Badge variant="secondary">Đã link</Badge>
                                  ) : (
                                    <Button variant="outline" size="sm" onClick={() => toggleParentSelected(p.id)}>
                                      {active ? "Bỏ chọn" : "Chọn"}
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}

                          {!parentsQuery.isLoading && (parentsQuery.data ?? []).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                                Không tìm thấy parent.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      Đã chọn: <span className="font-medium text-foreground">{selectedParentIds.length}</span> parent
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedParentIds([])}
                        disabled={linkMutation.isPending || selectedParentIds.length === 0}
                      >
                        Clear selection
                      </Button>
                      <Button
                        onClick={() => linkMutation.mutate()}
                        disabled={linkMutation.isPending || !selectedStudentId || selectedParentIds.length === 0}
                      >
                        Link selected
                      </Button>
                    </div>
                  </div>

                  {selectedParents.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedParents.map((p) => (
                        <Badge key={p.id} variant="secondary" className="gap-2">
                          {p.name ?? p.email}
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => toggleParentSelected(p.id)}
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {parentsQuery.isError && (
                    <div className="text-sm text-destructive">
                      {String((parentsQuery.error as Error)?.message ?? "Không tải được danh sách parent")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <AlertDialog open={!!unlinkTarget} onOpenChange={(open) => !open && setUnlinkTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm unlink</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink this parent{unlinkTarget ? `: ${unlinkTarget.parentName}` : ""}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unlinkMutation.isPending}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              disabled={unlinkMutation.isPending || !unlinkTarget}
              onClick={() => unlinkTarget && unlinkMutation.mutate(unlinkTarget.parentId)}
            >
              Huỷ liên kết
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
