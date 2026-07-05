import { ApprovalStep, Material, Requisition, RequisitionItem, Subject, User } from "@prisma/client";

type ItemWithMaterial = RequisitionItem & { material: Material };
type RequisitionWithRelations = Requisition & {
  subject: Subject;
  teacher: User;
  items: ItemWithMaterial[];
  approvalSteps?: ApprovalStep[];
};

export function toRequisitionDto(r: RequisitionWithRelations) {
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
    stepCount: r.approvalSteps?.length ?? 0,
  };
}

export type RequisitionDto = ReturnType<typeof toRequisitionDto>;
