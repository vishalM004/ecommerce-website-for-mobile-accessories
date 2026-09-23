import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://homjndcqgzvggbagnegz.supabase.co'

const supabaseKey = 'sb_publishable_HkeQAsezN9CLXDepidog3Q_1ZVhs1nU'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)