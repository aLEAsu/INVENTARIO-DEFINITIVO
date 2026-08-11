import { createClient } from '@supabase/supabase-js'
import type { Database } from '../data/database.types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copia .env.example a .env.local y completa los valores del proyecto.',
  )
}

// Solo la clave publica (anon/publishable). La service_role nunca debe vivir
// en codigo de cliente ni en variables VITE_* (estas quedan embebidas en el
// bundle que se sirve al navegador).
export const supabase = createClient<Database>(url, anonKey)
