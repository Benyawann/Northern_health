const SUPABASE_URL = 'https://zfnualnoorhtdkrqwjpa.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmbnVhbG5vb3JodGRrcnF3anBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDkyNzEsImV4cCI6MjA5MDQyNTI3MX0._XuqPMrt9_Rx5aFybAqrxmKrlnU5g4JzKKz3aK2SORg'
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// Realtime subscription
const channel = supabase
  .channel('health-realtime')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'health_data'
  }, (payload) => {
    console.log('🔄 มีการเปลี่ยนแปลง:', payload)
    // เรียกฟังก์ชัน reload ข้อมูลใน index.html
    loadData()
  })
  .subscribe()