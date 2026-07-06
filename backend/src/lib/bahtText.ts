// Port ของ frontend/src/lib/format.ts::bahtText — เอกสารราชการ (สผ.1.1-1.3,
// ใบประมาณราคา) ต้องมีข้อความ "(ตัวอักษร) ... บาทถ้วน" กำกับจำนวนเงินเสมอ
// เหมือนกับที่ตัวอย่างไฟล์จริง (ใบประมาณราคา.pdf) แสดงไว้ ถ้าแก้อัลกอริทึมนี้
// ต้องแก้ไฟล์ frontend คู่กันด้วย เพราะทั้งสองฝั่งต้องให้ผลลัพธ์ตรงกันเป๊ะ
const THAI_DIGIT = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const THAI_UNIT = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

function convertDigits(numStr: string): string {
  let s = "";
  const len = numStr.length;
  for (let i = 0; i < len; i++) {
    const d = Number(numStr[i]);
    const p = (len - i - 1) % 6;
    if (d === 0) {
      if (len - i - 1 === 6) s += "ล้าน";
      continue;
    }
    if (p === 1 && d === 1) s += "สิบ";
    else if (p === 1 && d === 2) s += "ยี่สิบ";
    else if (p === 0 && d === 1 && len > 1 && i !== 0) s += "เอ็ด";
    else s += THAI_DIGIT[d] + THAI_UNIT[p];
    if (len - i - 1 === 6) s += "ล้าน";
  }
  return s;
}

export function bahtText(amount: number): string {
  const rounded = Math.round(Number(amount || 0) * 100) / 100;
  const baht = Math.floor(rounded);
  const satang = Math.round((rounded - baht) * 100);
  let out = (baht === 0 ? "ศูนย์" : convertDigits(String(baht))) + "บาท";
  out += satang === 0 ? "ถ้วน" : convertDigits(String(satang)) + "สตางค์";
  return out;
}

export function fmt(n: number | string | null | undefined): string {
  return Number(n || 0).toLocaleString("en-US");
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

/** วันที่แบบไทย พ.ศ. (เลขอารบิก ไม่ใช่เลขไทย — ให้สอดคล้องกับที่ Workflow.tsx
 * ใช้ toLocaleDateString('th-TH') อยู่แล้วในฝั่ง frontend) */
export function thaiDateLong(date: Date): string {
  return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
}
