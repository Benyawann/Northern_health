// js/config.js

// ⚠️ คำเตือน: ในระบบ Production จริง ไม่ควรเก็บ Key ไว้ใน Client-side JS โดยตรง
// ควรใช้ Environment Variables และจัดการผ่าน Server หรือใช้ Row Level Security (RLS) ใน Supabase ให้แน่นหนา

const SUPABASE_CONFIG = {
    URL: 'YOUR_SUPABASE_URL',      // ใส่ URL ของโปรเจกต์คุณที่นี่ (เช่น https://xyz.supabase.co)
    ANON_KEY: 'YOUR_SUPABASE_KEY'  // ใส่ anon/public key ของคุณที่นี่
};

// Mock Data (ใช้สำหรับทดสอบเมื่อไม่ได้ต่อฐานข้อมูลจริง)
const MOCK_CHARTERS = [
    { id: 1, name: 'ธรรมนูญสุขภาพ ต.แม่เหียะ', province: 'เชียงใหม่', district: 'เมือง', year: 2566, status: 'active', has_m12: true },
    { id: 2, name: 'ธรรมนูญสุขภาพ ต.สุเทพ', province: 'เชียงใหม่', district: 'เมือง', year: 2565, status: 'draft', has_m12: false },
    { id: 3, name: 'ธรรมนูญสุขภาพ ต.เวียง', province: 'เชียงราย', district: 'เมือง', year: 2567, status: 'active', has_m12: true },
    { id: 4, name: 'ธรรมนูญสุขภาพ ต.บ้านกลาง', province: 'ลำพูน', district: 'เมือง', year: 2564, status: 'update', has_m12: true },
];