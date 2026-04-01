# 🚀 แผนการ Deployment (Render.com + Supabase)

เพื่อให้การ Deploy ง่ายและ **ฟรี 100%** เราจะใช้วิธี **Mono-deploy** (รวม Frontend และ Backend อยู่ใต้ Service เดียวกัน) ซึ่งทางเราเตรียม Code ไว้ให้รองรับอยู่แล้วครับ

## 1. เตรียมความพร้อมของ Code
- [x] **Backend**: ให้ FastAPI ทำหน้าที่เป็น API และเป็นตัว Serve ไฟล์ React (จัดเตรียมใน `main.py` แล้ว)
- [x] **Frontend**: มีสคริปต์สำหรับการ build ไฟล์เพื่อนำไปใส่ใน `dist/` สั่งผ่าน `build.sh` ได้เลย
- [x] **Database**: ใช้ Supabase Cloud อยู่แล้ว ไม่ต้องกังวลเรื่องการตั้งค่าเครื่องเซิร์ฟเวอร์

## 2. ขั้นตอนการ Deploy บน Render.com (ฟรี)

1. **สร้างบัญชี [Render.com](https://render.com/)** และเชื่อมต่อกับ GitHub Repo ของคุณ
2. **กด "New +" > "Web Service"** และเลือก Repo ของโปรเจกต์นี้
3. **ตั้งค่าการ Build และ Start:**
   - **Name**: `durian-watering-system` (หรือกตามใจชอบ)
   - **Environment**: `Python 3`
   - **Region**: `Singapore` (เพื่อให้ลดความหน่วงในไทย)
   - **Build Command**: `bash build.sh`
   - **Start Command**: `cd backend && gunicorn -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT`

4. **ตั้งค่า Environment Variables (ปุ่ม Advanced):**
   - `SUPABASE_URL`: (ค่า URL จาก Supabase Dashboard)
   - `SUPABASE_KEY`: (ค่า Service Role หรือ Key จาก Supabase Dashboard)

## 3. สิ่งที่เราต้องแก้ไขเพิ่มเติมก่อนเริ่ม

### 🛠️ อัปเดต `backend/requirements.txt`
เราจำเป็นต้องมี `gunicorn` เพื่อเป็น Production Server ที่เสถียรกว่า uvicorn เปล่าๆ

```text
fastapi
uvicorn
supabase
pydantic
gunicorn
python-multipart
```

### 🛠️ ตรวจสอบ `build.sh`
เพื่อให้แน่ใจว่า Render จะหาไฟล์ `requirements.txt` เจอและติดตั้งถูกที่

```bash
#!/usr/bin/env bash
# exit on error
set -o errexit

echo ">>> Building Frontend..."
cd frontend
npm install
npm run build

echo ">>> Installing Backend Dependencies..."
cd ..
pip install -r backend/requirements.txt
```

---

> [!TIP]
> วิธีนี้ประหยัดมาก เพราะใช้เพียง **1 Web Service** (ประหยัดโควตาฟรีของ Render) และไม่ต้องรอนานในการ Build แยกระหว่างหน้าบ้านหลังบ้านครับ
