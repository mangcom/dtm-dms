import { app } from "./app";
import { env } from "./config/env";
import { closeBrowser } from "./lib/pdf";

const server = app.listen(env.port, () => {
  console.log(`DTM-DMS backend listening on port ${env.port}`);
});

// ปิด Puppeteer browser instance ให้เรียบร้อยตอน container หยุด/รีสตาร์ท
// ไม่งั้น Chromium process จะค้างอยู่เบื้องหลังจนกว่า container จะถูกฆ่าจริงๆ
async function shutdown() {
  server.close();
  await closeBrowser();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
