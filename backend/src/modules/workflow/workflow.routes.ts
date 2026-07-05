import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { canActOnStep } from "./workflow.service";
import { toRequisitionDto } from "../requisitions/requisition.dto";

export const workflowRouter = Router();

const includeRelations = {
  subject: true,
  teacher: true,
  items: { include: { material: true } },
  approvalSteps: { include: { department: true, workSection: true, actor: true } },
} as const;

const actionSchema = z.object({ note: z.string().max(1000).optional() });

/** คิวงานของฉัน: คำขอที่ยังอยู่ระหว่างอนุมัติ (status=submitted) และขั้นปัจจุบัน
 * (stepOrder น้อยสุดที่ยัง pending ของคำขอนั้น) ตรงกับตำแหน่ง+ขอบเขตที่ผู้ใช้
 * สวมอยู่ตอนนี้ — ไม่ใช้ canActOnStep ตรงๆ เพราะต้องกรองเฉพาะ "ขั้นปัจจุบัน" ก่อน
 * (canActOnStep เช็คแค่ตำแหน่ง/ขอบเขต ไม่รู้เรื่องลำดับขั้น) */
workflowRouter.get(
  "/pending",
  requireAuth,
  asyncHandler(async (req, res) => {
    const candidateSteps = await prisma.approvalStep.findMany({
      where: {
        status: "pending",
        positionType: req.user!.activePositionType,
        departmentId: req.user!.activeDepartmentId ?? null,
        workSectionId: req.user!.activeWorkSectionId ?? null,
        requisition: { status: "submitted" },
      },
      select: { id: true, requisitionId: true, stepOrder: true },
    });

    if (candidateSteps.length === 0) {
      return res.json({ requisitions: [] });
    }

    const requisitionIds = [...new Set(candidateSteps.map((s) => s.requisitionId))];
    const requisitions = await prisma.requisition.findMany({
      where: { id: { in: requisitionIds } },
      include: includeRelations,
    });

    const dtos = requisitions
      .map(toRequisitionDto)
      .filter((r) => candidateSteps.some((s) => s.requisitionId === r.id && s.id === r.currentStepId));

    res.json({ requisitions: dtos });
  })
);

async function loadStepOrThrow(requisitionId: string, stepId: string) {
  const requisition = await prisma.requisition.findUnique({
    where: { id: requisitionId },
    include: { approvalSteps: true },
  });
  if (!requisition) throw new HttpError(404, "ไม่พบคำขอ");
  if (requisition.status !== "submitted") throw new HttpError(400, "คำขอนี้ไม่ได้อยู่ระหว่างการอนุมัติ");

  const step = requisition.approvalSteps.find((s) => s.id === stepId);
  if (!step) throw new HttpError(404, "ไม่พบขั้นอนุมัตินี้");

  const currentStep = requisition.approvalSteps
    .filter((s) => s.status === "pending")
    .sort((a, b) => a.stepOrder - b.stepOrder)[0];
  if (!currentStep || currentStep.id !== step.id) {
    throw new HttpError(400, "ยังไม่ถึงลำดับขั้นนี้ในการอนุมัติ");
  }

  return { requisition, step, isLastStep: requisition.approvalSteps.every((s) => s.stepOrder <= step.stepOrder) };
}

workflowRouter.post(
  "/:requisitionId/steps/:stepId/approve",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = actionSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw new HttpError(400, "ข้อมูลไม่ถูกต้อง");

    const { step, isLastStep } = await loadStepOrThrow(req.params.requisitionId, req.params.stepId);
    if (!canActOnStep(step, req.user!)) throw new HttpError(403, "ไม่มีสิทธิ์อนุมัติขั้นนี้");

    await prisma.$transaction(async (tx) => {
      await tx.approvalStep.update({
        where: { id: step.id },
        data: {
          status: "approved",
          actedAt: new Date(),
          actorUserId: req.user!.sub,
          note: parsed.data.note,
        },
      });
      if (isLastStep) {
        await tx.requisition.update({
          where: { id: req.params.requisitionId },
          data: { status: "approved" },
        });
      }
    });

    const requisition = await prisma.requisition.findUniqueOrThrow({
      where: { id: req.params.requisitionId },
      include: includeRelations,
    });
    res.json({ requisition: toRequisitionDto(requisition) });
  })
);

workflowRouter.post(
  "/:requisitionId/steps/:stepId/reject",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = actionSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw new HttpError(400, "ข้อมูลไม่ถูกต้อง");

    const { step } = await loadStepOrThrow(req.params.requisitionId, req.params.stepId);
    if (!canActOnStep(step, req.user!)) throw new HttpError(403, "ไม่มีสิทธิ์ตีกลับขั้นนี้");

    await prisma.$transaction(async (tx) => {
      await tx.approvalStep.update({
        where: { id: step.id },
        data: {
          status: "rejected",
          actedAt: new Date(),
          actorUserId: req.user!.sub,
          note: parsed.data.note,
        },
      });
      await tx.requisition.update({
        where: { id: req.params.requisitionId },
        data: { status: "rejected" },
      });
    });

    const requisition = await prisma.requisition.findUniqueOrThrow({
      where: { id: req.params.requisitionId },
      include: includeRelations,
    });
    res.json({ requisition: toRequisitionDto(requisition) });
  })
);
