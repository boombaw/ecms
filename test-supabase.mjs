import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Kredensial Supabase tidak ditemukan atau kosong. Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY sudah diisi di .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Menguji koneksi ke Supabase URL:", supabaseUrl);
  try {
    const { data, error } = await supabase.from('events').select('*').limit(1);
    
    if (error) {
      console.error("❌ Koneksi Gagal atau Error Query:");
      console.error(error);
    } else {
      console.log("✅ Koneksi Berhasil! Tabel 'events' dapat diakses.");
      console.log("Data sampel:", data);
    }
  } catch (err) {
    console.error("❌ Terjadi kesalahan fatal:", err.message);
  }
}

testConnection();
