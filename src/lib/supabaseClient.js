import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ekburueukqsdhzykzijx.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_TlfC61p9zr2Nj8MVFavizQ_xg4S2qbD'

export const supabase = createClient(supabaseUrl, supabaseKey)
