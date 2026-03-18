'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <div className="text-5xl mb-6">🎓</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Smart Exam Mode</h1>
        <p className="text-gray-500 text-lg mb-8">
          Platforma inteligjente që të ndihmon të përgatitesh për provim me ndihmën e AI-t.
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Kyçu
          </a>
          <a
            href="/signup"
            className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
          >
            Regjistrohu
          </a>
        </div>
      </div>
    </main>
  )
}