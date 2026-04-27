import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const getSafeNextPath = (value: string | null) => {
  if (!value || !value.startsWith('/')) {
    return '/login'
  }

  return value
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = getSafeNextPath(requestUrl.searchParams.get('next'))

  const redirectUrl = new URL(next, requestUrl.origin)

  if (!tokenHash || !type) {
    redirectUrl.searchParams.set('message', 'Invalid or expired confirmation link.')
    return NextResponse.redirect(redirectUrl)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as
      | 'signup'
      | 'recovery'
      | 'invite'
      | 'email'
      | 'email_change'
      | 'magiclink',
  })

  if (error) {
    redirectUrl.searchParams.set('message', error.message)
    return NextResponse.redirect(redirectUrl)
  }

  if (type === 'recovery') {
    return NextResponse.redirect(redirectUrl)
  }

  redirectUrl.searchParams.set('message', 'Email confirmed. You can sign in now.')
  return NextResponse.redirect(redirectUrl)
}
