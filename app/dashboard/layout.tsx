'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
                    <p className="text-gray-500 text-sm">Duke kontrolluar sesionin...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return <>{children}</>
}
