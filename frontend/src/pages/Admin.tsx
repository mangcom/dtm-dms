import { Fragment, FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "../lib/apiClient";
import { useToast } from "../context/ToastContext";
import { POSITION_LABEL, PositionType } from "../lib/roles";
import { EditIcon, PlusIcon, TrashIcon } from "../components/icons";

type AdminTab = "users" | "departments" | "work-sections";

const TAB_LABEL: Record<AdminTab, string> = {
  users: "ผู้ใช้ / ตำแหน่ง",
  departments: "แผนกวิชา",
  "work-sections": "งาน",
};

export function Admin() {
  const [tab, setTab] = useState<AdminTab>("users");

  return (
    <div className="animate-fadein">
      <div className="mb-1 text-[22px] font-bold">จัดการผู้ใช้และสิทธิ์ (RBAC)</div>
      <div className="mb-[22px] text-sm text-text-2">
        มอบหมายหัวหน้าแผนกวิชาและหัวหน้างานได้เองที่นี่ — คนเดียวถือได้หลายตำแหน่งพร้อมกัน
      </div>

      <div className="mb-[22px] flex w-fit gap-1 rounded-[10px] bg-surface-2 p-1">
        {(Object.keys(TAB_LABEL) as AdminTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-[18px] py-2 text-[13.5px] font-semibold ${
              tab === t ? "bg-primary text-white" : "text-text-2"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "departments" && <DepartmentsTab />}
      {tab === "work-sections" && <WorkSectionsTab />}
    </div>
  );
}

/* ============================== Users tab ============================== */

interface AdminPosition {
  id: string;
  positionType: PositionType;
  departmentId: string | null;
  departmentName: string | null;
  workSectionId: string | null;
  workSectionName: string | null;
  label: string | null;
}

interface AdminUser {
  id: string;
  rmsCode: string;
  username: string;
  fullName: string;
  department: { id: string; name: string; shortName: string | null } | null;
  active: boolean;
  positions: AdminPosition[];
}

interface Department {
  id: string;
  name: string;
}

interface WorkSection {
  id: string;
  name: string;
}

const SCOPED_TO_DEPARTMENT: PositionType[] = ["dept_head"];
const SCOPED_TO_WORK_SECTION: PositionType[] = ["work_section_head"];

function positionLabel(p: AdminPosition): string {
  if (p.label) return p.label;
  const scope = p.departmentName ?? p.workSectionName;
  return scope ? `${POSITION_LABEL[p.positionType]} (${scope})` : POSITION_LABEL[p.positionType];
}

function UsersTab() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [addingForUserId, setAddingForUserId] = useState<string | null>(null);
  const [newPositionType, setNewPositionType] = useState<PositionType>("teacher");
  const [newScopeId, setNewScopeId] = useState("");

  const { data: users = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => (await api.get<{ users: AdminUser[] }>("/users")).data.users,
  });
  const { data: departments = [] } = useQuery({
    queryKey: ["departments", "all"],
    queryFn: async () => (await api.get<{ departments: Department[] }>("/departments")).data.departments,
  });
  const { data: workSections = [] } = useQuery({
    queryKey: ["work-sections", "all"],
    queryFn: async () => (await api.get<{ workSections: WorkSection[] }>("/work-sections")).data.workSections,
  });

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const addPositionMutation = useMutation({
    mutationFn: async (userId: string) => {
      const payload: Record<string, unknown> = { userId, positionType: newPositionType };
      if (SCOPED_TO_DEPARTMENT.includes(newPositionType)) payload.departmentId = newScopeId;
      if (SCOPED_TO_WORK_SECTION.includes(newPositionType)) payload.workSectionId = newScopeId;
      return (await api.post("/positions", payload)).data;
    },
    onSuccess: () => {
      invalidateUsers();
      showToast("เพิ่มตำแหน่งเรียบร้อย");
      setAddingForUserId(null);
      setNewScopeId("");
    },
    onError: (err) => showToast(getApiErrorMessage(err)),
  });

  const removePositionMutation = useMutation({
    mutationFn: async (positionId: string) => api.delete(`/positions/${positionId}`),
    onSuccess: () => {
      invalidateUsers();
      showToast("ถอดตำแหน่งแล้ว");
    },
    onError: (err) => showToast(getApiErrorMessage(err)),
  });

  const needsScope = SCOPED_TO_DEPARTMENT.includes(newPositionType) || SCOPED_TO_WORK_SECTION.includes(newPositionType);
  const scopeOptions = SCOPED_TO_DEPARTMENT.includes(newPositionType) ? departments : workSections;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr className="bg-surface-2 text-left text-text-3">
            <th className="px-[18px] py-3 font-semibold">รหัส RMS</th>
            <th className="px-3 py-3 font-semibold">ชื่อ-สกุล</th>
            <th className="px-3 py-3 font-semibold">แผนก/ฝ่าย</th>
            <th className="px-3 py-3 font-semibold">ตำแหน่ง</th>
            <th className="w-[70px] px-[18px] py-3 text-center font-semibold">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <Fragment key={u.id}>
              <tr className="border-t border-border align-top">
                <td className="px-[18px] py-3 font-mono text-[12.5px] text-text-2">{u.rmsCode}</td>
                <td className="px-3 py-3 font-medium">{u.fullName}</td>
                <td className="px-3 py-3 text-text-2">{u.department?.name ?? "-"}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {u.positions.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[12px] font-semibold text-primary"
                      >
                        {positionLabel(p)}
                        <button
                          onClick={() => {
                            if (confirm(`ถอดตำแหน่ง "${positionLabel(p)}" ของ ${u.fullName} ใช่หรือไม่?`)) {
                              removePositionMutation.mutate(p.id);
                            }
                          }}
                          className="text-primary/60 hover:text-danger"
                          title="ถอดตำแหน่งนี้"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-[18px] py-3 text-center">
                  <button
                    onClick={() => setAddingForUserId(addingForUserId === u.id ? null : u.id)}
                    title="เพิ่มตำแหน่ง"
                    className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-border bg-surface text-text-2 hover:border-primary hover:text-primary"
                  >
                    <PlusIcon width={15} height={15} strokeWidth={2} />
                  </button>
                </td>
              </tr>
              {addingForUserId === u.id && (
                <tr className="border-t border-border bg-surface-2">
                  <td colSpan={5} className="px-[18px] py-3">
                    <div className="flex flex-wrap items-end gap-2.5">
                      <div>
                        <label className="mb-1 block text-[12px] font-semibold text-text-2">ตำแหน่งใหม่</label>
                        <select
                          value={newPositionType}
                          onChange={(e) => {
                            setNewPositionType(e.target.value as PositionType);
                            setNewScopeId("");
                          }}
                          className="rounded-lg border border-border bg-surface px-2.5 py-2 text-[13px] outline-none"
                        >
                          {(Object.keys(POSITION_LABEL) as PositionType[]).map((pt) => (
                            <option key={pt} value={pt}>
                              {POSITION_LABEL[pt]}
                            </option>
                          ))}
                        </select>
                      </div>
                      {needsScope && (
                        <div>
                          <label className="mb-1 block text-[12px] font-semibold text-text-2">
                            {SCOPED_TO_DEPARTMENT.includes(newPositionType) ? "แผนก" : "งาน"}
                          </label>
                          <select
                            value={newScopeId}
                            onChange={(e) => setNewScopeId(e.target.value)}
                            className="rounded-lg border border-border bg-surface px-2.5 py-2 text-[13px] outline-none"
                          >
                            <option value="">-- เลือก --</option>
                            {scopeOptions.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          if (needsScope && !newScopeId) {
                            showToast("กรุณาเลือกแผนก/งาน");
                            return;
                          }
                          addPositionMutation.mutate(u.id);
                        }}
                        disabled={addPositionMutation.isPending}
                        className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-h disabled:opacity-60"
                      >
                        เพิ่มตำแหน่ง
                      </button>
                      <button
                        onClick={() => setAddingForUserId(null)}
                        className="rounded-lg border border-border bg-surface px-4 py-2 text-[13px] font-semibold text-text-2"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================== Departments tab ============================ */

interface DeptRecord {
  id: string;
  name: string;
  shortName: string | null;
  active: boolean;
}

function DepartmentsTab() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ open: false, editId: null as string | null, name: "", shortName: "" });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", "admin"],
    queryFn: async () => (await api.get<{ departments: DeptRecord[] }>("/departments?all=true")).data.departments,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["departments"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name.trim(), shortName: form.shortName.trim() || undefined };
      if (form.editId) return (await api.put(`/departments/${form.editId}`, payload)).data;
      return (await api.post("/departments", payload)).data;
    },
    onSuccess: () => {
      invalidate();
      showToast(form.editId ? "บันทึกการแก้ไขแล้ว" : "เพิ่มแผนกใหม่เรียบร้อย");
      setForm({ open: false, editId: null, name: "", shortName: "" });
    },
    onError: (err) => showToast(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/departments/${id}`),
    onSuccess: () => {
      invalidate();
      showToast("ปิดใช้งานแผนกแล้ว");
    },
    onError: (err) => showToast(getApiErrorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("กรุณากรอกชื่อแผนก");
      return;
    }
    saveMutation.mutate();
  }

  return (
    <div>
      <div className="mb-[18px] flex justify-end">
        <button
          onClick={() => setForm({ open: true, editId: null, name: "", shortName: "" })}
          className="flex items-center gap-2 rounded-[9px] bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-h"
        >
          <PlusIcon width={17} height={17} stroke="#fff" strokeWidth={2.1} />
          เพิ่มแผนก
        </button>
      </div>

      {form.open && (
        <form onSubmit={onSubmit} className="mb-[18px] rounded-xl border border-primary bg-surface p-5 shadow-card">
          <div className="mb-4 text-[15px] font-bold">{form.editId ? "แก้ไขแผนก" : "เพิ่มแผนกใหม่"}</div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-2">ชื่อแผนก (เต็ม)</label>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="แผนกวิชาเทคโนโลยีสารสนเทศ"
                className="w-full rounded-lg border border-border bg-surface px-[11px] py-2.5 text-[13.5px] outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-2">ชื่อย่อ (ใช้ในเอกสาร)</label>
              <input
                value={form.shortName}
                onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
                placeholder="เทคโนโลยีสารสนเทศ"
                className="w-full rounded-lg border border-border bg-surface px-[11px] py-2.5 text-[13.5px] outline-none"
              />
            </div>
          </div>
          <div className="mt-[18px] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setForm({ open: false, editId: null, name: "", shortName: "" })}
              className="rounded-lg border border-border bg-surface px-4 py-2.5 text-[13.5px] font-semibold text-text-2"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="rounded-lg bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-white hover:bg-primary-h disabled:opacity-60"
            >
              บันทึก
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-surface-2 text-left text-text-3">
              <th className="px-[18px] py-3 font-semibold">ชื่อแผนก</th>
              <th className="px-3 py-3 font-semibold">ชื่อย่อ</th>
              <th className="px-3 py-3 text-center font-semibold">สถานะ</th>
              <th className="w-[90px] px-[18px] py-3 text-center font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="px-[18px] py-3 font-medium">{d.name}</td>
                <td className="px-3 py-3 text-text-2">{d.shortName ?? "-"}</td>
                <td className="px-3 py-3 text-center">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                      d.active ? "bg-success-soft text-success" : "bg-surface-2 text-text-3"
                    }`}
                  >
                    {d.active ? "ใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </td>
                <td className="px-[18px] py-3">
                  <div className="flex justify-center gap-1.5">
                    <button
                      onClick={() => setForm({ open: true, editId: d.id, name: d.name, shortName: d.shortName ?? "" })}
                      title="แก้ไข"
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-border bg-surface text-text-2 hover:border-primary hover:text-primary"
                    >
                      <EditIcon />
                    </button>
                    {d.active && (
                      <button
                        onClick={() => {
                          if (confirm(`ปิดใช้งานแผนก "${d.name}" ใช่หรือไม่?`)) deleteMutation.mutate(d.id);
                        }}
                        title="ปิดใช้งาน"
                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-border bg-surface text-text-2 hover:border-danger hover:text-danger"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================== Work sections tab =========================== */

interface WorkSectionRecord {
  id: string;
  name: string;
  managesMaterials: boolean;
  isProcurementReview: boolean;
  active: boolean;
}

function WorkSectionsTab() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    open: false,
    editId: null as string | null,
    name: "",
    managesMaterials: false,
    isProcurementReview: false,
  });

  const { data: workSections = [] } = useQuery({
    queryKey: ["work-sections", "admin"],
    queryFn: async () => (await api.get<{ workSections: WorkSectionRecord[] }>("/work-sections?all=true")).data.workSections,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["work-sections"] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        managesMaterials: form.managesMaterials,
        isProcurementReview: form.isProcurementReview,
      };
      if (form.editId) return (await api.put(`/work-sections/${form.editId}`, payload)).data;
      return (await api.post("/work-sections", payload)).data;
    },
    onSuccess: () => {
      invalidate();
      showToast(form.editId ? "บันทึกการแก้ไขแล้ว" : "เพิ่มงานใหม่เรียบร้อย");
      setForm({ open: false, editId: null, name: "", managesMaterials: false, isProcurementReview: false });
    },
    onError: (err) => showToast(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/work-sections/${id}`),
    onSuccess: () => {
      invalidate();
      showToast("ปิดใช้งานแล้ว");
    },
    onError: (err) => showToast(getApiErrorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("กรุณากรอกชื่องาน");
      return;
    }
    saveMutation.mutate();
  }

  return (
    <div>
      <div className="mb-[18px] flex justify-end">
        <button
          onClick={() => setForm({ open: true, editId: null, name: "", managesMaterials: false, isProcurementReview: false })}
          className="flex items-center gap-2 rounded-[9px] bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-h"
        >
          <PlusIcon width={17} height={17} stroke="#fff" strokeWidth={2.1} />
          เพิ่มงาน
        </button>
      </div>

      {form.open && (
        <form onSubmit={onSubmit} className="mb-[18px] rounded-xl border border-primary bg-surface p-5 shadow-card">
          <div className="mb-4 text-[15px] font-bold">{form.editId ? "แก้ไขงาน" : "เพิ่มงานใหม่"}</div>
          <div className="mb-3.5">
            <label className="mb-1.5 block text-[12.5px] font-semibold text-text-2">ชื่องาน</label>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="งานพัสดุ"
              className="w-full max-w-sm rounded-lg border border-border bg-surface px-[11px] py-2.5 text-[13.5px] outline-none"
            />
          </div>
          <div className="flex flex-col gap-2 text-[13.5px]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.managesMaterials}
                onChange={(e) => setForm((f) => ({ ...f, managesMaterials: e.target.checked }))}
              />
              หัวหน้างานนี้เพิ่ม/แก้ไขวัสดุฝึกได้
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isProcurementReview}
                onChange={(e) => setForm((f) => ({ ...f, isProcurementReview: e.target.checked }))}
              />
              เป็นขั้นตรวจสอบในสายอนุมัติ (procurement review)
            </label>
          </div>
          <div className="mt-[18px] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setForm({ open: false, editId: null, name: "", managesMaterials: false, isProcurementReview: false })}
              className="rounded-lg border border-border bg-surface px-4 py-2.5 text-[13.5px] font-semibold text-text-2"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="rounded-lg bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-white hover:bg-primary-h disabled:opacity-60"
            >
              บันทึก
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-surface-2 text-left text-text-3">
              <th className="px-[18px] py-3 font-semibold">ชื่องาน</th>
              <th className="px-3 py-3 text-center font-semibold">จัดการวัสดุได้</th>
              <th className="px-3 py-3 text-center font-semibold">ขั้นอนุมัติ</th>
              <th className="px-3 py-3 text-center font-semibold">สถานะ</th>
              <th className="w-[90px] px-[18px] py-3 text-center font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {workSections.map((w) => (
              <tr key={w.id} className="border-t border-border">
                <td className="px-[18px] py-3 font-medium">{w.name}</td>
                <td className="px-3 py-3 text-center">{w.managesMaterials ? "✓" : "-"}</td>
                <td className="px-3 py-3 text-center">{w.isProcurementReview ? "✓" : "-"}</td>
                <td className="px-3 py-3 text-center">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                      w.active ? "bg-success-soft text-success" : "bg-surface-2 text-text-3"
                    }`}
                  >
                    {w.active ? "ใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </td>
                <td className="px-[18px] py-3">
                  <div className="flex justify-center gap-1.5">
                    <button
                      onClick={() =>
                        setForm({
                          open: true,
                          editId: w.id,
                          name: w.name,
                          managesMaterials: w.managesMaterials,
                          isProcurementReview: w.isProcurementReview,
                        })
                      }
                      title="แก้ไข"
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-border bg-surface text-text-2 hover:border-primary hover:text-primary"
                    >
                      <EditIcon />
                    </button>
                    {w.active && (
                      <button
                        onClick={() => {
                          if (confirm(`ปิดใช้งาน "${w.name}" ใช่หรือไม่?`)) deleteMutation.mutate(w.id);
                        }}
                        title="ปิดใช้งาน"
                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-border bg-surface text-text-2 hover:border-danger hover:text-danger"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
