'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LogOut, User, Shield, MessageSquare, BookOpen, Send, Loader2, Lock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
    const { user, signOut } = useAuth()
    const [loggingOut, setLoggingOut] = useState(false)
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [response, setResponse] = useState('')
    const [error, setError] = useState('')

    const handleLogout = async () => {
        setLoggingOut(true)
        await signOut()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        setLoading(true)
        setError('')
        setResponse('')

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input }),
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || 'Diçka shkoi keq')
            }

            const data = await res.json()
            setResponse(data.reply)
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const displayName =
        user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
            {/* Premium Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Smart Exam Mode</h1>
                        <p className="text-xs text-zinc-500 font-medium">
                            Mirë se vjen, <span className="text-blue-600 dark:text-blue-400 font-semibold">{displayName}</span>!
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-full border border-zinc-200 dark:border-zinc-700/50">
                        <User className="w-4 h-4 text-zinc-500" />
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{user?.email}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="group flex items-center gap-2 bg-zinc-100 hover:bg-red-50 dark:bg-zinc-800 hover:dark:bg-red-950/30 text-zinc-700 hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-400 text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50 border border-zinc-200 dark:border-zinc-700 hover:border-red-200 dark:hover:border-red-900/50"
                    >
                        {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />}
                        <span className="hidden sm:block">Dil</span>
                    </button>
                </div>
            </header>

            {/* Main content */}
            <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left Column: Info & Actions */}
                <div className="space-y-6 md:col-span-1">
                    {/* User Info Card */}
                    <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 p-6 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <User className="w-24 h-24" />
                        </div>
                        <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Informacion
                        </h2>
                        <div className="space-y-3 relative z-10">
                            <div>
                                <p className="text-xs text-zinc-500">Emri</p>
                                <p className="font-semibold text-zinc-900 dark:text-white">{displayName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500">Email</p>
                                <p className="font-medium text-zinc-900 dark:text-zinc-300 truncate" title={user?.email}>{user?.email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500">ID Llogarisë</p>
                                <p className="font-mono text-xs text-zinc-400 truncate bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded mt-1 border border-zinc-200 dark:border-zinc-800" title={user?.id}>{user?.id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 p-4 shadow-sm flex flex-col gap-3">
                        <Link href="/dashboard/change-password" 
                              className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl hover:shadow-md transition-shadow border border-zinc-100 dark:border-zinc-800 group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-semibold text-zinc-900 dark:text-white">Ndrysho Fjalëkalimin</span>
                            </div>
                        </Link>

                        <div 
                              className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl opacity-60 cursor-not-allowed">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                                    <BookOpen className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-semibold text-zinc-900 dark:text-white">Refleksioni u Dorëzua</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Exam Form */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
                        {/* Chat Header */}
                        <div className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Asistenti i Provimit</h2>
                                <p className="text-xs text-zinc-500">Pyet AI-n për çdo paqartësi</p>
                            </div>
                        </div>
                        
                        {/* Chat History Area (Mocked for now, holding response) */}
                        <div className="flex-1 p-6 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/20">
                            {error && !loading && (
                                <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <div>
                                        <strong className="block mb-1">Ndodhi një gabim:</strong>
                                        <p>{error}</p>
                                    </div>
                                </div>
                            )}

                            {response && !loading && (
                                <div className="mb-4 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm prose prose-sm dark:prose-invert max-w-none">
                                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-100 dark:border-zinc-800 text-blue-600 dark:text-blue-400 font-semibold tracking-wide uppercase text-xs">
                                        <MessageSquare className="w-4 h-4" />
                                        Përgjigja e AI
                                    </div>
                                    <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 leading-relaxed">{response}</p>
                                </div>
                            )}
                            
                            {!response && !error && !loading && (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 text-center space-y-4">
                                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center">
                                        <BookOpen className="w-8 h-8 opacity-50" />
                                    </div>
                                    <p className="max-w-[250px] text-sm">Shkruani një pyetje më poshtë për të nisur. AI është gati t'ju ndihmojë!</p>
                                </div>
                            )}
                            
                            {loading && (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="w-12 h-12 relative flex items-center justify-center">
                                        <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <p className="text-sm font-medium text-zinc-500 animate-pulse">Po analizoj pyetjen...</p>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                            <form onSubmit={handleSubmit} className="relative group">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Si funksionon fotosinteza?..."
                                    className="w-full pl-4 pr-14 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm text-zinc-900 dark:text-white min-h-[80px]"
                                    disabled={loading}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (input.trim() && !loading) handleSubmit(e);
                                        }
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="absolute right-3 bottom-3 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center"
                                    title="Dërgo pyetjen (Enter)"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                                </button>
                            </form>
                            <p className="text-center text-xs text-zinc-400 mt-3">
                                Shtyp <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded mx-1 font-sans">Enter</kbd> për të dërguar, <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded mx-1 font-sans">Shift + Enter</kbd> për rresht të ri
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

