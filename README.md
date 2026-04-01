# Durian Orchard Watering System
ระบบจัดการการให้น้ำสวนทุเรียน

## วิธีการรันในเครื่อง (Local Development)

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

### Backend (FastAPI + SQLite)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## วิธีการ Deploy ขึ้น Server (แบบงานด่วน ง่ายที่สุด ปราศจาก Docker)

ผมจัดการลบไฟล์ Docker ออกไปแล้วครับ หากต้องการวิธีที่เบสิกและง่ายที่สุด เราจะใช้ระบบ **Native Python Web Service** ของ Render ร่วมกับ `build.sh` ที่ผมเตรียมไว้ให้แทนครับ

1. นำ Code ทั้งหมดขึ้น **GitHub** (Push to repository)
2. เข้าไปที่ [Render.com](https://render.com) แล้ว Log in ด้วย GitHub
3. กดที่ปุ่ม `New` -> แล้วเลือก `Web Service` -> เลือก Repository ของโปรเจกต์นี้
4. ตรงส่วนของการตั้งค่า ให้กรอกตามนี้เลยครับ:
   - **Environment**: เลือกเป็น `Python 3`
   - **Build Command**: พิมพ์คำสั่งรันไฟล์บิ้วได้เลย `bash build.sh`
   - **Start Command**: พิมพ์คำสั่งเปิดเซิร์ฟเวอร์ `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. เลื่อนลงมากด **Deploy Web Service** เป็นอันเสร็จสิ้น! Render จะทำการโหลดแพ็กเกจแล้วเปิดเว็บให้อัตโนมัติในคลิกเดียวครับ
