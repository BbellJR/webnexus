import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vbqktemiotutpuejrvqy.supabase.co'
const supabaseKey = 'sb_publishable_uv5F9nu-MpfxMpTd5UMBuw_FKN98PpP'

export const supabase = createClient(supabaseUrl, supabaseKey)
