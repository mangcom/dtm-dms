# DTM-DMS

ระบบสารสนเทศเพื่อการบริหารจัดการเอกสารวัสดุฝึกประจำแผนกวิชา
(Departmental Training Materials Document Management System)

สำหรับสถานศึกษาอาชีวศึกษาสังกัดรัฐบาล ใช้บริหารจัดการรายการวัสดุฝึกที่ครูผู้สอนแต่ละคนต้องใช้
ในแต่ละรายวิชา ตั้งแต่เสนอรายการ อนุมัติตามลำดับขั้น ไปจนถึงออกเอกสารสรุปเพื่อจัดซื้อ
(สผ.1.1 / สผ.1.2 / สผ.1.3)

## โครงสร้างโปรเจกต์

```
/backend            Express + TypeScript + Prisma API
/frontend           React (Vite) + TypeScript + Tailwind SPA
/design-reference    ไฟล์ดีไซน์ต้นฉบับจาก Claude Design (DTM-DMS.dc.html, support.js)
                      และตัวอย่างฟอร์มราชการจริง (uploads/) — ใช้อ้างอิงเท่านั้น ไม่ใช่ส่วนของแอปที่รัน
docker-compose.yml   postgres + backend + frontend
```

## เริ่มต้นใช้งาน (Docker)

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:4000/api
- Postgres: localhost:5432

ผู้ใช้ทดสอบทุกบัญชี รหัสผ่านคือ `password` เช่น `somchai.j` (ครูผู้สอน), `wipawadee.t`
(หัวหน้าแผนกวิชา), `admin` (ผู้ดูแลระบบ) — ดูรายชื่อทั้งหมดใน `backend/prisma/seed.ts`

## พัฒนาแบบ local (ไม่ผ่าน Docker)

```bash
# Backend
cd backend
cp .env.example .env   # แก้ DATABASE_URL ให้ชี้ไปที่ Postgres ที่รันอยู่
npm install
npx prisma migrate dev
npm run seed
npm run dev             # http://localhost:4000

# Frontend (อีก terminal)
cd frontend
npm install
npm run dev              # http://localhost:5173 (proxy /api ไปที่ backend:4000)
```

## Tech Stack

- **Backend**: Node.js + Express + TypeScript, Prisma ORM, PostgreSQL, JWT (httpOnly cookie) auth
- **Frontend**: React + Vite + TypeScript + TailwindCSS (ธีมสีอ้างอิงจาก design-reference),
  React Router, TanStack Query
- **PDF Export** (Phase 3): Puppeteer

## สถานะการพัฒนา

- **Phase 1 (เสร็จแล้ว)**: Project scaffolding, Authentication (RBAC), Master data วัสดุฝึก
- **Phase 2**: ฟอร์มครูผู้สอนเลือกรายวิชา + workflow อนุมัติตามลำดับขั้น
- **Phase 3**: Export PDF (สผ.1.1/1.2/1.3 + ใบประมาณราคา), หน้า Admin เต็มรูปแบบ, Docker hardening
