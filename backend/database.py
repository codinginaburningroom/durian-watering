import os
from supabase import create_client, Client

# สามารถครอบด้วย Environment Variables ได้ แต่เพื่อความรวดเร็วในการ Test เราใส่ค่าตรงไว้เลย
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://txafooiwxotgogzpfdvo.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "sb_publishable_iQRyfSni5jq8iKSbHdxHkg_nf77_DnX")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
