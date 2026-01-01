import { createClient } from '@supabase/supabase-js';

// Credenciais do projeto Supabase fornecidas
const SUPABASE_URL = 'https://avcehgqorohntyieehdt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VtuHbBrRYHcD9NLORxjDiw_6bfqyu3Z';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);