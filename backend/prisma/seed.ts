/**
 * ===========================================================================
 * Seed data อ้างอิงจากฐานข้อมูล RMS จริง (C:\Docker\backup\source_data\data_rms.sql)
 * ===========================================================================
 *
 * ผู้ใช้ได้ให้ไฟล์ dump ฐานข้อมูลระบบ RMS จริงของสถานศึกษา (phpMyAdmin/MariaDB,
 * ฐานข้อมูลชื่อ `ofbs`) มาเป็นตัวอย่าง เพื่อให้ seed data ของ DTM-DMS สมจริงกว่า
 * ชื่อสมมติล้วนๆ จากไฟล์ดีไซน์ (DTM-DMS.dc.html)
 *
 * สิ่งที่ "ใช้ของจริง" จากไฟล์ RMS:
 *   - ชื่อ-นามสกุลครู และตำแหน่ง (ตาราง `teachers` + `users`)
 *   - ชื่อแผนกวิชา (ตาราง `departments`)
 *   - รหัส/ชื่อรายวิชา (ตาราง `subjects`)
 *   - ชื่อกลุ่มเรียนและจำนวนนักเรียนจริง (ตาราง `student_groups` + `students`)
 *
 * สิ่งที่ "ไม่ใช้ของจริง" (จงใจ) — เหตุผลด้านความเป็นส่วนตัว:
 *   - เลขบัตรประชาชน 13 หลัก: ไฟล์ RMS ใช้เลขบัตร ปชช. จริงเป็น username สำหรับ
 *     login ของครู ซึ่งเป็นข้อมูลส่วนบุคคลที่ละเอียดอ่อน หากนำมาใส่ใน seed.ts
 *     ตรงๆ จะถูก commit เข้า git และ push ขึ้น GitHub ถาวร (ลบทีหลังก็ยังอยู่ใน
 *     ประวัติ commit) จึงตั้งเลขลำดับปลอมขึ้นเองแทน (ดูฟังก์ชัน genFakeCitizenId
 *     ด้านล่าง) — โครงสร้าง/checksum ยังถูกต้องตามอัลกอริทึมเลขบัตร ปชช. ไทยจริง
 *     เพื่อความสมจริงของ "รูปแบบ" ข้อมูล แต่ตัวเลขเองไม่เกี่ยวข้องกับไฟล์ RMS เลย
 *     (ระหว่างพัฒนาเคยพลาดเอาเลขจริงจากไฟล์มาคำนวณ checksum ทำให้ได้เลขบัตร
 *     จริงกลับมาโดยไม่ตั้งใจ — แก้ไขแล้วด้วยการบังคับให้เลขปลอมต้องขึ้นต้นด้วย
 *     "9" เสมอ ดูรายละเอียดในฟังก์ชัน genFakeCitizenId)
 *
 * สิ่งที่ "ไม่มีในไฟล์ RMS เลย" จึงต้องสมมติขึ้นเอง:
 *   - ตำแหน่งรองผู้อำนวยการ 4 ฝ่าย และผู้อำนวยการวิทยาลัย — RMS เก็บข้อมูลแค่
 *     ระดับ "ครูผู้สอน" กับ "หัวหน้าแผนกวิชา" (role enum ใน RMS มีแค่ admin/
 *     staff/teacher/hod) ไม่มีระดับผู้บริหารสถานศึกษา ตรงกับที่ระบุไว้ตั้งแต่
 *     ต้นแบบ requirement ว่า "ระบบนี้จะกำหนด role เพิ่มเติมเอง"
 *   - วัสดุฝึก (Materials) — RMS เป็นระบบทะเบียน/บริหารการเรียนการสอน ไม่ได้
 *     เก็บข้อมูลวัสดุฝึกเลย จึงยังคงใช้ชุดตัวอย่างเดิมจากไฟล์ดีไซน์
 */

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "password";

/**
 * สร้างเลข "หน้าตาเหมือน" บัตรประชาชนไทย 13 หลัก (checksum ถูกต้องตามสูตรจริง
 * ของกรมการปกครอง) จากเลขลำดับปลอมที่ตั้งขึ้นเอง — ใช้แทนเลขบัตร ปชช. จริงจาก
 * ไฟล์ RMS เพื่อไม่ให้ข้อมูลส่วนบุคคลของจริงหลุดเข้าไปใน git history
 *
 * ⚠️ สำคัญ: ค่า seedDigits ที่ส่งเข้าฟังก์ชันนี้ "ห้ามตัดมาจากเลขบัตรจริงในไฟล์
 * data_rms.sql แม้แต่หลักเดียว" — เพราะ checksum (หลักที่ 13) คำนวณจาก 12 หลัก
 * แรกแบบตายตัวเสมอ (ไม่ใช่ค่าสุ่ม) ถ้าเผลอเอา 12 หลักแรกของเลขจริงมาใส่ ฟังก์ชัน
 * นี้จะคำนวณ checksum ออกมาตรงกับเลขบัตรจริงทั้งเลขทันที (เพราะเลขจริงก็ต้อง
 * ผ่านสูตรเดียวกัน) กลายเป็นคัดลอกเลขบัตรจริงมาทั้งเลขโดยไม่ตั้งใจ — จุดนี้เคย
 * พลาดมาแล้วระหว่างพัฒนา จึงบังคับให้ seedDigits ต้องขึ้นต้นด้วย "9" เสมอ (เลข
 * บัตร ปชช. จริงของบุคคลทั่วไปจะไม่ขึ้นต้นด้วย 9) เพื่อกันความผิดพลาดซ้ำ
 */
function genFakeCitizenId(seedDigits: string): string {
  if (!seedDigits.startsWith("9")) {
    throw new Error("genFakeCitizenId: seedDigits ต้องขึ้นต้นด้วย '9' เพื่อยืนยันว่าเป็นเลขปลอมที่ตั้งขึ้นเอง ไม่ใช่เลขที่ตัดมาจากไฟล์ข้อมูลจริง");
  }
  const base = seedDigits.padStart(12, "0").slice(0, 12).split("").map(Number);
  const sum = base.reduce((acc, d, i) => acc + d * (13 - i), 0);
  const checkDigit = (11 - (sum % 11)) % 10;
  return base.join("") + String(checkDigit);
}

interface SeedUser {
  rmsCode: string;
  username: string;
  fullName: string;
  department: string;
  position: string;
  role: Role;
}

/**
 * รายชื่อผู้ใช้ทดสอบ — อ้างอิงชื่อ/แผนก/ตำแหน่งจริงจากตาราง `teachers` และ
 * `users` ใน data_rms.sql (แผนกวิชาเทคโนโลยีสารสนเทศ dept_code '1901' เป็นหลัก
 * เพื่อให้ตรงกับแผนกที่ระบุไว้ในไฟล์ดีไซน์ DTM-DMS.dc.html)
 *
 * rmsCode ในที่นี้ = เลขบัตร ปชช. ปลอม (ดู genFakeCitizenId) ใช้แทนตำแหน่ง
 * username ที่ RMS จริงใช้ login — ส่วน username ของระบบเรายังคงเป็นชื่อที่จำ
 * ง่ายสำหรับทดสอบ (ไม่ได้ผูกกับ RMS โดยตรงในเฟสนี้ เพราะยังไม่เชื่อมต่อจริง)
 */
const USERS: SeedUser[] = [
  // teachers.id=155, user_id=64 ใน RMS จริง — เป็น head_teacher_id ของแผนก
  // เทคโนโลยีสารสนเทศ (departments.id=8) และ users.role='hod' ตรงกันพอดี
  // (rmsCode "91...0001" เป็นเลขปลอมที่ตั้งขึ้นเอง ไม่เกี่ยวกับเลขบัตรจริงของ
  // บุคคลนี้ในไฟล์ RMS แต่อย่างใด — ดูคำเตือนในฟังก์ชัน genFakeCitizenId ด้านบน)
  {
    rmsCode: genFakeCitizenId("910000000001"),
    username: "pornchai.t",
    fullName: "นายพรชัย ตุ่นแก้ว",
    department: "แผนกวิชาเทคโนโลยีสารสนเทศ",
    position: "หัวหน้าแผนกวิชา",
    role: "dept_head",
  },
  // teachers.id=152, user_id=61 ใน RMS จริง — role='teacher' แผนกเดียวกับด้านบน
  // (ชื่อนี้ตรงกับครูผู้สอนในตัวอย่างฟอร์ม สผ.1.2/1.3 จริงที่ผู้ใช้แนบมาด้วย)
  {
    rmsCode: genFakeCitizenId("910000000002"),
    username: "pornjira.n",
    fullName: "นางพรจิรา เงินเจริญ",
    department: "แผนกวิชาเทคโนโลยีสารสนเทศ",
    position: "ครูผู้สอน",
    role: "teacher",
  },
  // teachers.id=151, user_id=60 ใน RMS จริง — role='teacher' แผนกเดียวกัน
  {
    rmsCode: genFakeCitizenId("910000000003"),
    username: "apinat.r",
    fullName: "นายอภินัทธ์ ไรมันซา",
    department: "แผนกวิชาเทคโนโลยีสารสนเทศ",
    position: "ครูผู้สอน",
    role: "teacher",
  },
  // teachers.id=142, user_id=51 ใน RMS จริง — เป็น head_teacher_id ของแผนก
  // คอมพิวเตอร์ธุรกิจ (departments.id=9, role='hod') แต่ในระบบ DTM-DMS เรา
  // กำหนดบทบาทเพิ่มเติมให้ดูแลงานหลักสูตรทั้งวิทยาลัย (ข้ามแผนกได้ ตามที่
  // requirement ระบุไว้สำหรับตำแหน่ง "หัวหน้างานหลักสูตร")
  {
    rmsCode: genFakeCitizenId("910000000004"),
    username: "supachai.k",
    fullName: "นายศุภชัย แก้ววิลัย",
    department: "งานพัฒนาหลักสูตรและการสอน",
    position: "หัวหน้างานหลักสูตร",
    role: "curriculum_head",
  },
  // ---- ต่อจากนี้ไม่มีข้อมูลใน RMS เลย (RMS ไม่เก็บระดับผู้บริหารสถานศึกษา)
  // ต้องสมมติชื่อขึ้นเองทั้งหมด ระบุไว้ชัดเจนเพื่อไม่ให้เข้าใจผิดว่าเป็นข้อมูลจริง ----
  {
    rmsCode: genFakeCitizenId("999000000001"),
    username: "anong.w",
    fullName: "ดร.อนงค์ วัฒนา (ข้อมูลสมมติ)",
    department: "ฝ่ายวิชาการ",
    position: "รองผู้อำนวยการฝ่ายวิชาการ",
    role: "deputy_academic",
  },
  {
    rmsCode: genFakeCitizenId("999000000002"),
    username: "suriya.p",
    fullName: "นายสุริยา แผนงาม (ข้อมูลสมมติ)",
    department: "ฝ่ายแผนงานและยุทธศาสตร์",
    position: "รองผู้อำนวยการฝ่ายแผนงานและยุทธศาสตร์",
    role: "deputy_plan",
  },
  {
    rmsCode: genFakeCitizenId("999000000003"),
    username: "resource.dep",
    fullName: "นายวิเชียร บริหารทรัพย์ (ข้อมูลสมมติ)",
    department: "ฝ่ายบริหารทรัพยากร",
    position: "รองผู้อำนวยการฝ่ายบริหารทรัพยากร",
    role: "deputy_resource",
  },
  {
    rmsCode: genFakeCitizenId("999000000004"),
    username: "student.affairs",
    fullName: "นางกาญจนา พัฒนากิจ (ข้อมูลสมมติ)",
    department: "ฝ่ายพัฒนากิจการนักเรียนนักศึกษา",
    position: "รองผู้อำนวยการฝ่ายพัฒนากิจการนักเรียนนักศึกษา",
    role: "deputy_student_affairs",
  },
  {
    rmsCode: genFakeCitizenId("999000000005"),
    username: "banjong.p",
    fullName: "ดร.บรรจง ผู้นำ (ข้อมูลสมมติ)",
    department: "ผู้บริหารสูงสุด",
    position: "ผู้อำนวยการวิทยาลัย",
    role: "director",
  },
  // users.id=1 ใน RMS จริง username='admin' role='admin' ตรงกันเป๊ะ ใช้ตรงๆ ได้เลย
  {
    rmsCode: "RMS-ADMIN",
    username: "admin",
    fullName: "ทีมสารสนเทศ",
    department: "งานศูนย์ข้อมูลสารสนเทศ",
    position: "ผู้ดูแลระบบ",
    role: "admin",
  },
];

/**
 * วัสดุฝึก (Materials) — ไม่มีข้อมูลนี้ใน RMS (RMS ไม่ได้ทำหน้าที่จัดซื้อวัสดุฝึก)
 * จึงยังคงใช้ชุดตัวอย่างเดิมจากไฟล์ดีไซน์ DTM-DMS.dc.html
 */
const MATERIALS: Array<{
  code: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  vendor: string;
}> = [
  { code: "MT-001", name: "สาย UTP CAT6 (กล่อง 305 ม.)", unit: "กล่อง", pricePerUnit: 2450, vendor: "ร้านไอทีเน็ตเวิร์ค" },
  { code: "MT-002", name: "หัวต่อ RJ-45 CAT6", unit: "ตัว", pricePerUnit: 6, vendor: "ร้านไอทีเน็ตเวิร์ค" },
  { code: "MT-003", name: "Gigabit Switch 8 Port", unit: "เครื่อง", pricePerUnit: 890, vendor: "บจก. คอมเทรด" },
  { code: "MT-004", name: "Wireless Access Point", unit: "เครื่อง", pricePerUnit: 1250, vendor: "บจก. คอมเทรด" },
  { code: "MT-005", name: "คีมเข้าหัวสาย LAN", unit: "ด้าม", pricePerUnit: 260, vendor: "ร้านช่างอะไหล่" },
  { code: "MT-006", name: "บอร์ด Arduino Uno R3", unit: "บอร์ด", pricePerUnit: 320, vendor: "ร้านอิเล็กทรอนิกส์ไทย" },
  { code: "MT-007", name: "เซนเซอร์อุณหภูมิ DHT22", unit: "ตัว", pricePerUnit: 145, vendor: "ร้านอิเล็กทรอนิกส์ไทย" },
  { code: "MT-008", name: "Breadboard 830 จุด", unit: "ชิ้น", pricePerUnit: 85, vendor: "ร้านอิเล็กทรอนิกส์ไทย" },
  { code: "MT-009", name: "สายจัมเปอร์ M-M (แพ็ค 40)", unit: "แพ็ค", pricePerUnit: 45, vendor: "ร้านอิเล็กทรอนิกส์ไทย" },
  { code: "MT-010", name: "Relay Module 1 Channel", unit: "ตัว", pricePerUnit: 40, vendor: "ร้านอิเล็กทรอนิกส์ไทย" },
];

/**
 * ห้องเรียน (Classroom) — schema-only ในเฟสนี้ (ยังไม่มี UI/API ตามแผน) แต่ใส่
 * ข้อมูลตัวอย่างจากกลุ่มเรียนจริงในไฟล์ RMS (ตาราง `student_groups`) พร้อมนับ
 * จำนวนนักเรียนจริงจากตาราง `students` เพื่อให้พร้อมใช้งานเมื่อถึงเวลา
 */
const CLASSROOMS: Array<{ label: string; studentCount: number }> = [
  // student_groups.id=97 'ชทส.1/1' (ปวช.ปีที่ 1 เทคโนโลยีสารสนเทศ) — นับจาก
  // students ที่ student_group_id=97 ได้จริง 24 คน
  { label: "ชทส.1/1 (ปวช.1 เทคโนโลยีสารสนเทศ)", studentCount: 24 },
  // student_groups.id=113 'สทส.1/1' (ปวส.ปีที่ 1 เทคโนโลยีสารสนเทศ) — นับจาก
  // students ที่ student_group_id=113 ได้จริง 15 คน
  { label: "สทส.1/1 (ปวส.1 เทคโนโลยีสารสนเทศ)", studentCount: 15 },
];

/**
 * รายวิชา (Subjects) — ใช้รหัสวิชา/ชื่อวิชาจริงจากตาราง `subjects` ใน RMS
 * (กรองเฉพาะวิชาสายเทคโนโลยีสารสนเทศ/คอมพิวเตอร์ที่มีชื่อวิชาสมบูรณ์แล้ว —
 * วิชารหัส 209xx บางตัวในไฟล์ RMS ยังเป็น "รออัปเดตชื่อวิชา" จึงข้ามไป)
 * ผูกกับครูและห้องเรียนที่ seed ไว้ด้านบน เตรียมไว้สำหรับ Phase 2
 *
 * หมายเหตุ: ตาราง subjects ใน RMS ไม่มีข้อมูลภาคเรียน/ปีการศึกษา (เป็นเพียง
 * รายวิชาตามหลักสูตร ไม่ผูกกับรอบการสอนจริง) ค่า term/year ด้านล่างจึงเป็น
 * ค่าสมมติสำหรับตัวอย่าง (ภาคเรียนปัจจุบันของระบบ DTM-DMS)
 */
const SUBJECTS: Array<{
  code: string;
  name: string;
  level: string;
  levelYear: string;
  teacherUsername: string;
  classroomLabel: string;
  roomCount: number;
}> = [
  {
    code: "21900-1005",
    name: "เครือข่ายคอมพิวเตอร์",
    level: "ปวช.",
    levelYear: "1",
    teacherUsername: "pornchai.t",
    classroomLabel: "ชทส.1/1 (ปวช.1 เทคโนโลยีสารสนเทศ)",
    roomCount: 1,
  },
  {
    code: "21901-2006",
    name: "การโปรแกรมควบคุมอุปกรณ์",
    level: "ปวส.",
    levelYear: "1",
    teacherUsername: "pornchai.t",
    classroomLabel: "สทส.1/1 (ปวส.1 เทคโนโลยีสารสนเทศ)",
    roomCount: 1,
  },
  {
    code: "21901-2022",
    name: "โครงงานด้านเทคโนโลยีสารสนเทศ 1",
    level: "ปวส.",
    levelYear: "1",
    teacherUsername: "pornjira.n",
    classroomLabel: "สทส.1/1 (ปวส.1 เทคโนโลยีสารสนเทศ)",
    roomCount: 1,
  },
];

const TERM = "1";
const YEAR = "2568";

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const u of USERS) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { ...u, passwordHash },
    });
  }

  for (const m of MATERIALS) {
    await prisma.material.upsert({
      where: { code: m.code },
      update: {},
      create: m,
    });
  }

  // Classroom ไม่มี unique key ตามธรรมชาตินอกจาก id (schema-only ตามแผน) จึง
  // เช็คจาก label ก่อนสร้าง เพื่อให้รัน seed ซ้ำได้โดยไม่เกิดข้อมูลซ้ำ
  const classroomByLabel = new Map<string, { id: string; studentCount: number }>();
  for (const c of CLASSROOMS) {
    const existing = await prisma.classroom.findFirst({ where: { label: c.label } });
    const record = existing ?? (await prisma.classroom.create({ data: c }));
    classroomByLabel.set(c.label, { id: record.id, studentCount: record.studentCount });
  }

  for (const s of SUBJECTS) {
    const teacher = await prisma.user.findUnique({ where: { username: s.teacherUsername } });
    if (!teacher) throw new Error(`ไม่พบครูผู้สอน username=${s.teacherUsername} สำหรับวิชา ${s.code}`);

    const classroom = classroomByLabel.get(s.classroomLabel);
    const existing = await prisma.subject.findFirst({
      where: { code: s.code, term: TERM, year: YEAR, teacherId: teacher.id },
    });
    if (existing) continue;

    await prisma.subject.create({
      data: {
        code: s.code,
        name: s.name,
        level: s.level,
        levelYear: s.levelYear,
        term: TERM,
        year: YEAR,
        roomCount: s.roomCount,
        // studentCount ดึงมาจากจำนวนนักเรียนจริงของห้องเรียนที่ผูกไว้ (ดู CLASSROOMS ด้านบน)
        studentCount: classroom?.studentCount ?? 0,
        classroomId: classroom?.id,
        teacherId: teacher.id,
      },
    });
  }

  console.log(`Seeded ${USERS.length} users, ${MATERIALS.length} materials, ${CLASSROOMS.length} classrooms, ${SUBJECTS.length} subjects.`);
  console.log(`All seeded users share the password: "${DEFAULT_PASSWORD}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
