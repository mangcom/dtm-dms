import { ApprovalStep, Department, Material, Requisition, RequisitionItem, Subject, User, WorkSection } from "@prisma/client";

type ItemWithMaterial = RequisitionItem & { material: Material };
type StepWithRelations = ApprovalStep & {
  department: Department | null;
  workSection: WorkSection | null;
  actor: User | null;
};
type RequisitionWithRelations = Requisition & {
  subject: Subject;
  teacher: User;
  items: ItemWithMaterial[];
  approvalSteps?: StepWithRelations[];
};

export function toRequisitionDto(r: RequisitionWithRelations) {
  const steps = (r.approvalSteps ?? [])
    .slice()
    .sort((a, b) => a.stepOrder - b.stepOrder)
    .map((s) => ({
      id: s.id,
      stepOrder: s.stepOrder,
      positionType: s.positionType,
      departmentId: s.departmentId,
      departmentName: s.department?.name ?? null,
      workSectionId: s.workSectionId,
      workSectionName: s.workSection?.name ?? null,
      status: s.status,
      actedAt: s.actedAt,
      note: s.note,
      actorName: s.actor?.fullName ?? null,
    }));
  // ขั้นที่ค้างอยู่ลำดับแรกสุด (stepOrder น้อยสุดที่ยัง pending) = ขั้นที่กำลัง
  // รอการกระทำจริง ณ ตอนนี้ — ขั้นถัดไปที่ pending อยู่หลังจากนี้ยังกระทำไม่ได้
  // จนกว่าขั้นนี้จะเสร็จก่อน (อนุมัติตามลำดับทีละขั้นเท่านั้น)
  const currentStep = steps.find((s) => s.status === "pending") ?? null;

  return {
    id: r.id,
    term: r.term,
    year: r.year,
    status: r.status,
    totalAmount: Number(r.totalAmount),
    submittedAt: r.submittedAt,
    subject: { id: r.subject.id, code: r.subject.code, name: r.subject.name },
    teacherId: r.teacherId,
    teacherName: r.teacher.fullName,
    items: r.items.map((i) => ({
      id: i.id,
      materialId: i.materialId,
      materialName: i.material.name,
      unit: i.material.unit,
      qty: i.qty,
      unitPriceSnapshot: Number(i.unitPriceSnapshot),
      subtotal: Number(i.subtotal),
    })),
    stepCount: steps.length,
    steps,
    currentStepId: currentStep?.id ?? null,
  };
}

export type RequisitionDto = ReturnType<typeof toRequisitionDto>;
