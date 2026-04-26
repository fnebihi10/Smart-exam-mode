'use client'

import { useState } from 'react'
import { createClient } from './client'

export const useSupabaseBrowserClient = () => {
  const [supabase] = useState(createClient)
  return supabase
}
