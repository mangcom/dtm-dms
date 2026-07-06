import puppeteer, { Browser } from "puppeteer-core";

// ใช้ puppeteer-core (ไม่ใช่ puppeteer เต็มตัว) + Chromium ที่ลงผ่าน apt-get ใน
// Dockerfile (ดู PUPPETEER_EXECUTABLE_PATH ใน docker-compose/Dockerfile) แทนที่
// จะให้ puppeteer ดาวน์โหลด Chromium ของตัวเองตอน npm install — เพราะ
// Alpine/musl (base image เดิม) ไม่มี shared library ที่ Chromium ต้องการ
// (nss, freetype, harfbuzz ฯลฯ) จึงต้องสลับไปใช้ Debian slim + Chromium จาก
// apt แทน (ดูเหตุผลเต็มใน Dockerfile)
let browserPromise: Promise<Browser> | null = null;

function launchBrowser(): Promise<Browser> {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/local/bin/chrome-for-testing";
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
}

/** เปิด browser instance เดียวไว้ตลอดอายุ process (เปิด/ปิดแค่ page ต่อ
 * request) — ประหยัด resource กว่าการเปิด Chromium ใหม่ทุกครั้งบนเครื่อง
 * self-host ขนาดเล็กของสถานศึกษา */
async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = launchBrowser();
  }
  try {
    return await browserPromise;
  } catch (err) {
    browserPromise = null;
    throw err;
  }
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(buffer);
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (!browserPromise) return;
  const browser = await browserPromise;
  browserPromise = null;
  await browser.close();
}
