'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Calculate password strength
  const strength = useMemo(() => {
    let score = 0
    if (password.length > 5) score += 1
    if (password.length > 8) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    return score
  }, [password])

  const strengthColor = 
    strength === 0 ? 'bg-zinc-800' :
    strength === 1 ? 'bg-red-500' :
    strength === 2 ? 'bg-orange-500' :
    strength === 3 ? 'bg-yellow-500' :
    strength === 4 ? 'bg-emerald-400' : 'bg-emerald-500'
    
  const strengthLabel = 
    strength === 0 ? '' :
    strength === 1 ? 'I dobët' :
    strength <= 3 ? 'Mesatar' : 'I fortë'


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (name.trim().length < 2) {
      setError('Ju lutem shkruani emrin tuaj të plotë.')
      return
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Ju lutem shkruani një email valid.')
      return
    }
    if (password.length < 6) {
      setError('Fjalëkalimi duhet të ketë të paktën 6 karaktere.')
      return
    }
    if (password !== confirmPassword) {
      setError('Fjalëkalimet nuk përputhen.')
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push('/login?message=Konfirmo email-in tënd pastaj kyçu')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Glassmorphic Card */}
      <div className="w-full max-w-[460px] bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative z-10 transition-all duration-500 my-8">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-2xl mx-auto mb-6 shadow-xl shadow-indigo-500/20 flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Krijo llogari</h1>
          <p className="text-zinc-400 mt-2 text-sm font-medium">Bashkohuni me platformën tonë sot</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-5">
          {/* Name Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Emri i plotë</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="p.sh. Arta Berisha"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-zinc-900/80 transition-all text-sm"
                required
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                placeholder="emri@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-zinc-900/80 transition-all text-sm"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Fjalëkalimi</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 karaktere"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3.5 pl-11 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-zinc-900/80 transition-all text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1.5 animate-in fade-in">
                <div className="flex gap-1 h-1.5 w-full">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div 
                      key={level} 
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        strength >= level ? strengthColor : 'bg-zinc-800'
                      }`} 
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className={strength >= 4 ? 'text-emerald-400' : 'text-zinc-500'}>
                    {strengthLabel}
                  </span>
                  {strength < 2 && (
                    <span className="text-red-400">Shto karaktere & numra</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Konfirmo Fjalëkalimin</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Përsërit fjalëkalimin"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-zinc-900/50 border rounded-xl py-3.5 pl-11 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-zinc-900/80 transition-all text-sm
                  ${confirmPassword.length > 0 && password !== confirmPassword 
                    ? 'border-red-500/50 focus:border-red-500/50' 
                    : 'border-white/5 focus:border-indigo-500/50'
                  }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (confirmPassword.length > 0 && password !== confirmPassword) || strength === 0}
            className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white py-4 rounded-xl font-semibold shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_0_60px_-15px_rgba(79,70,229,0.7)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative flex items-center gap-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Duke u regjistruar...
                </>
              ) : (
                <>
                  Krijo llogarinë
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
          </button>
        </form>

        <p className="text-center text-sm text-zinc-400 mt-8">
          Keni tashmë një llogari?{' '}
          <Link href="/login" className="text-white font-semibold hover:text-indigo-400 transition-colors">
            Kyçu këtu
          </Link>
        </p>
      </div>
    </div>
  )
}