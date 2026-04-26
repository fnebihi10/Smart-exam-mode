const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const getClientSiteUrl = () => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return trimTrailingSlash(window.location.origin)
  }

  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (envUrl) {
    return trimTrailingSlash(envUrl)
  }

  return 'http://localhost:3000'
}

export const getClientRedirectUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getClientSiteUrl()}${normalizedPath}`
}
