'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.includes('@') || !email.includes('.')) {
      setError('Ju lutem shkruani një email valid.')
      return
    }
    if (password.length < 6) {
      setError('Fjalëkalimi duhet të ketë të paktën 6 karaktere.')
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message === 'Invalid login credentials' 
        ? 'Kredencialet janë të pasakta.' 
        : authError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl mx-auto mb-6 shadow-xl shadow-blue-500/20 flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Mirë se vjen</h1>
        <p className="text-zinc-400 mt-2 text-sm font-medium">Kthehuni në llogarinë tuaj</p>
      </div>

      {/* Messages */}
      <div className="space-y-3 mb-6">
        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p>{message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        {/* Email Input */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Email</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-blue-400 transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              placeholder="emri@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-zinc-900/80 transition-all text-sm"
              required
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1">
          <div className="flex justify-between items-center ml-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fjalëkalimi</label>
            <Link href="/forgot-password" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
              Keni harruar fjalëkalimin?
            </Link>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-blue-400 transition-colors">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3.5 pl-11 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-zinc-900/80 transition-all text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-4 rounded-xl font-semibold shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.7)] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <span className="relative flex items-center gap-2">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Duke u kyçur...
              </>
            ) : (
              <>
                Kyçu tani
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </span>
        </button>
      </form>

      <p className="text-center text-sm text-zinc-400 mt-8">
        Nuk keni llogari?{' '}
        <Link href="/signup" className="text-white font-semibold hover:text-blue-400 transition-colors">
          Regjistrohu këtu
        </Link>
      </p>
    </>
  )
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />
      
      {/* Glassmorphic Card */}
      <div className="w-full max-w-[420px] bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative z-10 transition-all duration-500">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-zinc-400 text-sm">Duke ngarkuar...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}