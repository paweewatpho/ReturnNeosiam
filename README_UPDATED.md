# Return Operations Hub - returnneosiam-pro

ระบบจัดการการคืนสินค้าแบบครบวงจรสำหรับ Neo Siam

## ✨ ฟีเจอร์ที่เพิ่มเติม

### 1. NCR Report - ฟิลเตอร์ข้อมูลขั้นสูง
- **Date Range Filter**: กรองข้อมูลตามช่วงวันที่ (Start Date และ End Date)
- **NCR Number Search**: ค้นหารายการตามหมายเลข NCR โดยตรง
- **Combined Filtering**: สามารถใช้ฟิลเตอร์หลายตัวพร้อมกันได้

### 2. Return Operations Hub - การแจ้งเตือน
- **Selection Validation**: ตรวจสอบการเลือกรายการก่อนสร้างเอกสาร
- **Error Messages**: แสดงข้อความแจ้งเตือนอย่างชัดเจนเมื่อไม่ได้เลือกรายการ
- **Better UX**: ป้องกันการสร้างเอกสารที่ไม่สมบูรณ์

### 3. Stock Summary - การคำนวณที่ถูกต้อง
- **Accurate Stock Calculation**: นับเฉพาะรายการที่มีสถานะ 'Graded' หรือ 'Documented'
- **Disposition Grouping**: จัดกลุ่มสินค้าตามประเภท (Restock, Claim, Internal Use, Recycle)
- **Latest Price Tracking**: ใช้ราคาล่าสุดสำหรับการคำนวณมูลค่ารวม

## 🚀 การปรับใช้บน Vercel

### วิธีที่ 1: ใช้ Vercel CLI (แนะนำ)

```bash
# ติดตั้ง Vercel CLI
pnpm add -g vercel

# ปรับใช้จากโฟลเดอร์โปรเจค
cd returnneosiam-pro
vercel
```

### วิธีที่ 2: ใช้ GitHub Integration

1. Push code ไปยัง GitHub
2. ไปที่ https://vercel.com/import
3. เลือก repository ของคุณ
4. Vercel จะตั้งค่าอัตโนมัติ
5. คลิก Deploy

## 📋 ตัวแปรสภาพแวดล้อม

ในการปรับใช้บน Vercel ต้องตั้งค่าตัวแปรต่อไปนี้:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_GEMINI_API_KEY
```

ดูรายละเอียดใน `.env.example`

## 🔧 เทคโนโลยี

- **Frontend**: React 19 + Vite 6
- **UI Components**: Lucide React
- **Charts**: Recharts
- **Backend**: Firebase
- **AI**: Google Generative AI (Gemini)
- **Build Tool**: Vite
- **Package Manager**: pnpm

## 📁 โครงสร้างโปรเจค

```
returnneosiam-pro/
├── components/
│   ├── NCRReport.tsx          # ตาราง NCR Report พร้อมฟิลเตอร์
│   ├── Operations.tsx          # ศูนย์ปฏิบัติการคืนสินค้า
│   ├── StockSummary.tsx        # สรุปสต็อกคงคลัง
│   └── ...
├── App.tsx                     # Component หลัก
├── DataContext.tsx             # Context สำหรับจัดการข้อมูล
├── firebase.ts                 # Firebase configuration
├── types.ts                    # TypeScript types
├── vite.config.ts              # Vite configuration
├── vercel.json                 # Vercel deployment config
└── dist/                       # Production build output
```

## 🛠️ คำสั่งที่ใช้บ่อย

```bash
# ติดตั้ง dependencies
pnpm install

# เริ่ม dev server
pnpm dev

# สร้าง production build
pnpm build

# ดูตัวอย่าง production build
pnpm preview
```

## 📝 หมายเหตุ

- ไฟล์ `vercel.json` ตั้งค่า build command และ output directory
- ไฟล์ `.vercelignore` กำหนดไฟล์ที่ไม่ต้อง deploy
- ดู `DEPLOYMENT.md` สำหรับรายละเอียดการปรับใช้เพิ่มเติม

## 🔗 ลิงก์ที่เกี่ยวข้อง

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)

---

**เวอร์ชัน**: 0.0.0  
**สถานะ**: Ready for Deployment
