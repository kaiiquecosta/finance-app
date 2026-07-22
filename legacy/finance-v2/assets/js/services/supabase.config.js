/* supabase.config.js — Credenciais e cliente Supabase */


/* =============================================================
   assets/js/supabase.config.js
   ⚠️  SUBSTITUA os valores abaixo pelos do seu projeto Supabase:
   Dashboard → Settings → API
   ============================================================= */

const SUPABASE_URL  = 'https://rxireyhmphkybjvqbawf.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4aXJleWhtcGhreWJqdnFiYXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjkxMDgsImV4cCI6MjA4OTM0NTEwOH0.uwielq2GvpDUCMnY8U8lU3st7qY_7rpj49djs7C-SIc';

// Inicializa o cliente Supabase (SDK carregado via CDN no index.html)
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

