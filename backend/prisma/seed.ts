import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "password";

const USERS: Array<{
  rmsCode: string;
  username: string;
  fullName: string;
  department: string;
  position: string;
  role: Role;
}> = [
  { rmsCode: "RMS-1042", username: "somchai.j", fullName: "สมชาย ใจดี", department: "แผนกวิชาเทคโนโลยีสารสนเทศ", position: "ครูผู้สอน", role: "teacher" },
  { rmsCode: "RMS-2201", username: "pimchanok.s", fullName: "พิมพ์ชนก ศรีสุข", department: "แผนกวิชาเทคโนโลยีสารสนเทศ", position: "ครูผู้สอน", role: "teacher" },
  { rmsCode: "RMS-1088", username: "wipawadee.t", fullName: "วิภาวดี ทองคำ", department: "แผนกวิชาเทคโนโลยีสารสนเทศ", position: "หัวหน้าแผนกวิชา", role: "dept_head" },
  { rmsCode: "RMS-0921", username: "prasong.m", fullName: "ประสงค์ มั่นคง", department: "งานพัฒนาหลักสูตรและการสอน", position: "หัวหน้างานหลักสูตร", role: "curriculum_head" },
  { rmsCode: "RMS-0455", username: "anong.w", fullName: "ดร.อนงค์ วัฒนา", department: "ฝ่ายวิชาการ", position: "รองผู้อำนวยการฝ่ายวิชาการ", role: "deputy_academic" },
  { rmsCode: "RMS-0460", username: "suriya.p", fullName: "สุริยา แผนงาม", department: "ฝ่ายแผนงานและยุทธศาสตร์", position: "รองผู้อำนวยการฝ่ายแผนงานและยุทธศาสตร์", role: "deputy_plan" },
  { rmsCode: "RMS-0700", username: "resource.dep", fullName: "วิเชียร บริหารทรัพย์", department: "ฝ่ายบริหารทรัพยากร", position: "รองผู้อำนวยการฝ่ายบริหารทรัพยากร", role: "deputy_resource" },
  { rmsCode: "RMS-0800", username: "student.affairs", fullName: "กาญจนา พัฒนากิจ", department: "ฝ่ายพัฒนากิจการนักเรียนนักศึกษา", position: "รองผู้อำนวยการฝ่ายพัฒนากิจการนักเรียนนักศึกษา", role: "deputy_student_affairs" },
  { rmsCode: "RMS-0001", username: "banjong.p", fullName: "ดร.บรรจง ผู้นำ", department: "ผู้บริหารสูงสุด", position: "ผู้อำนวยการวิทยาลัย", role: "director" },
  { rmsCode: "RMS-9000", username: "admin", fullName: "ทีมสารสนเทศ", department: "งานศูนย์ข้อมูลสารสนเทศ", position: "ผู้ดูแลระบบ", role: "admin" },
];

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

  console.log(`Seeded ${USERS.length} users and ${MATERIALS.length} materials.`);
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
