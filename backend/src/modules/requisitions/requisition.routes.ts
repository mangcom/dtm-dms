import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { toRequisitionDto } from "./requisition.dto";

export const requisitionRouter = Router();

const includeRelations = {
  subject: true,
  teacher: true,
  items: { include: { material: true } },
  approvalSteps: true,
} as const;

const itemSchema = z.object({
  materialId: z.string().min(1),
  qty: z.coerce.number().int().min(1),
});

const createSchema = z.object({
  subjectId: z.string().min(1),
  term: z.string().min(1),
  year: z.string().min(1),
  items: z.array(itemSchema).min(1, "กรุณาเพิ่มรายการวัสดุอย่างน้อย 1 รายการ"),
});

/** คำนวณ unitPriceSnapshot/subtotal จากราคาปัจจุบันของวัสดุแต่ละตัว (ล็อกราคา
 * ณ เวลาที่สร้าง/แก้ไขคำขอ ไม่ผูกกับราคาที่อาจถูกแก้ใน Material master data
 * ภายหลัง — ตรงกับที่ schema ตั้งชื่อ field ไว้ว่า unitPriceSnapshot) */
async function buildItemsData(items: z.infer<typeof itemSchema>[]) {
  const materialIds = items.map((i) => i.materialId);
  const materials = await prisma.material.findMany({ where: { id: { in: materialIds } } });
  const materialById = new Map(materials.map((m) => [m.id, m]));

  return items.map((i) => {
    const material = materialById.get(i.materialId);
    if (!material) throw new HttpError(400, `ไม่พบวัสดุที่เลือก (id: ${i.materialId})`);
    const unitPriceSnapshot = Number(material.pricePerUnit);
    const subtotal = unitPriceSnapshot * i.qty;
    return { materialId: i.materialId, qty: i.qty, unitPriceSnapshot, subtotal };
  });
}

function sumTotal(items: Array<{ subtotal: number }>): number {
  return items.reduce((sum, i) => sum + i.subtotal, 0);
}

requisitionRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const requisitions = await prisma.requisition.findMany({
      where: { teacherId: req.user!.sub },
      include: includeRelations,
      orderBy: { createdAt: "desc" },
    });
    res.json({ requisitions: requisitions.map(toRequisitionDto) });
  })
);

requisitionRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const requisition = await prisma.requisition.findUnique({
      where: { id: req.params.id },
      include: includeRelations,
    });
    if (!requisition) throw new HttpError(404, "ไม่พบคำขอ");
    // เจ้าของคำขอดูของตัวเองได้เสมอ; ผู้มีสิทธิ์อนุมัติดูได้ผ่าน workflow module
    // (เช็คสิทธิ์ตรงนั้นแทน เพื่อไม่ให้ route นี้ต้อง query ทุกแบบซ้ำ)
    if (requisition.teacherId !== req.user!.sub) {
      throw new HttpError(403, "ไม่มีสิทธิ์เข้าถึงคำขอนี้");
    }
    res.json({ requisition: toRequisitionDto(requisition) });
  })
);

requisitionRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง");

    const subject = await prisma.subject.findUnique({ where: { id: parsed.data.subjectId } });
    if (!subject) throw new HttpError(404, "ไม่พบรายวิชา");
    if (subject.teacherId !== req.user!.sub) throw new HttpError(403, "ไม่ใช่รายวิชาของคุณ");

    const itemsData = await buildItemsData(parsed.data.items);
    const totalAmount = sumTotal(itemsData);

    const requisition = await prisma.requisition.create({
      data: {
        subjectId: parsed.data.subjectId,
        teacherId: req.user!.sub,
        term: parsed.data.term,
        year: parsed.data.year,
        totalAmount,
        items: { create: itemsData },
      },
      include: includeRelations,
    });
    res.status(201).json({ requisition: toRequisitionDto(requisition) });
  })
);

requisitionRouter.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง");

    const existing = await prisma.requisition.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "ไม่พบคำขอ");
    if (existing.teacherId !== req.user!.sub) throw new HttpError(403, "ไม่ใช่คำขอของคุณ");
    if (existing.status !== "draft") throw new HttpError(400, "แก้ไขได้เฉพาะคำขอที่ยังไม่ส่งอนุมัติ");

    const itemsData = await buildItemsData(parsed.data.items);
    const totalAmount = sumTotal(itemsData);

    const requisition = await prisma.$transaction(async (tx) => {
      await tx.requisitionItem.deleteMany({ where: { requisitionId: req.params.id } });
      return tx.requisition.update({
        where: { id: req.params.id },
        data: {
          term: parsed.data.term,
          year: parsed.data.year,
          totalAmount,
          items: { create: itemsData },
        },
        include: includeRelations,
      });
    });
    res.json({ requisition: toRequisitionDto(requisition) });
  })
);

requisitionRouter.post(
  "/:id/submit",
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.requisition.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "ไม่พบคำขอ");
    if (existing.teacherId !== req.user!.sub) throw new HttpError(403, "ไม่ใช่คำขอของคุณ");
    if (existing.status !== "draft") throw new HttpError(400, "คำขอนี้ถูกส่งอนุมัติไปแล้ว");

    // การสร้างขั้นตอนอนุมัติ (ApprovalStep chain) อยู่ใน workflow.service.ts —
    // ดู requisition.routes.ts เวอร์ชันถัดไปที่ผูก generateApprovalChain ตรงนี้
    const requisition = await prisma.requisition.update({
      where: { id: req.params.id },
      data: { status: "submitted", submittedAt: new Date() },
      include: includeRelations,
    });
    res.json({ requisition: toRequisitionDto(requisition) });
  })
);
