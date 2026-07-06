FROM node:22-slim

# สลับจาก node:22-alpine (musl/Alpine) มาเป็น Debian slim ตั้งแต่ Milestone 8
# (PDF export) เพราะ Puppeteer/Chromium ต้องการ shared library ที่ Alpine ไม่มี
# ให้ครบ (nss, freetype, harfbuzz ฯลฯ) fonts-thai-tlwg ให้ฟอนต์ไทยสำหรับ render
# เอกสาร PDF แบบ offline (container ไม่มีอินเทอร์เน็ตตอน render จึงพึ่ง Google
# Fonts ไม่ได้เหมือนฝั่งเว็บ)
#
# ติดตั้ง apt's `chromium` ไว้เพื่อเอา shared library ที่มันดึงมาเป็น
# dependency เท่านั้น (nss, gtk3, atk ฯลฯ) — ตัว browser ที่ apt แพ็กมาเอง
# (เวอร์ชัน 150) crash ด้วย "Trace/breakpoint trap (core dumped)" (SIGTRAP)
# ทันทีที่ launch บนโฮสต์นี้ แม้รันแบบ --privileged/--security-opt
# seccomp=unconfined ก็ตาม (ตัว build ของ Debian คอมไพล์มาแบบ CET/shadow-stack
# hardening ที่ไม่เข้ากับ CPU ที่ virtualize ผ่าน Docker Desktop) จึงต้อง
# ดาวน์โหลด Chrome for Testing (build อย่างเป็นทางการจาก Google ที่ puppeteer
# ทดสอบด้วย) มาใช้แทน โดยใช้ shared library ชุดเดียวกันนี้ได้ปกติ — ห้าม
# purge/autoremove ตัว chromium package ทีหลัง เพราะ apt จะถือว่า
# dependency พวกนี้เป็น "auto" แล้วลบทิ้งไปด้วย ทำให้ Chrome for Testing
# ใช้งานไม่ได้
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium fonts-thai-tlwg ca-certificates unzip \
    && npx --yes @puppeteer/browsers install chrome@stable --path /opt/chrome-for-testing \
    && ln -s "$(find /opt/chrome-for-testing -maxdepth 4 -name chrome -type f)" /usr/local/bin/chrome-for-testing \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/local/bin/chrome-for-testing

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && npm run dev"]
