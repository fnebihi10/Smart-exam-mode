'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { updatePassword } = useAuth()
  const router = useRouter()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError('Fjalëkalimi duhet të ketë të paktën 6 karaktere.')
      return
    }
    if (password !== confirmPassword) {
      setError('Fjalëkalimet nuk përputhen.')
      return
    }

    setLoading(true)

    const { error: updateError } = await updatePassword(password)

    if (updateError) {
      setError(updateError.message || 'Ndodhi një gabim gjatë përditësimit të fjalëkalimit. Ndoshta linku ka skaduar.')
      setLoading(false)
    } else {
      setSuccess('Fjalëkalimi u ndryshua me sukses!')
      setLoading(false)
      setTimeout(() => router.push('/login?message=Fjalëkalimi u përditësua. Tani mund të kyçeni.'), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 relative overflow-hidden flex items-center justify-center">
      {/* Premium Background Effects */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px] pointer-events-none" />
      
      <div className="w-full max-w-[420px] bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative z-10 transition-all duration-500">
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Krijo fjalëkalim të ri</h1>
          <p className="text-zinc-400 mt-2 text-sm font-medium">Shkruani fjalëkalimin e ri për llogarinë tuaj.</p>
        </div>

        {/* Messages */}
        <div className="space-y-3 mb-6">
          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p>{success}</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Fjalëkalimi i Ri</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-purple-400 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 karaktere"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-3.5 pl-11 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm"
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
                    <div className="mt-2 flex gap-1 h-1.5 w-full animate-in fade-in">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div 
                          key={level} 
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            strength >= level ? strengthColor : 'bg-zinc-800'
                          }`} 
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Konfirmo Fjalëkalimin</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-purple-400 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Përsërit fjalëkalimin"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full bg-zinc-900/50 border rounded-xl py-3.5 pl-11 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all text-sm
                        ${confirmPassword.length > 0 && password !== confirmPassword 
                          ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
                          : 'border-white/5 focus:ring-purple-500/50 focus:border-purple-500/50'
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
                  className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white py-4 rounded-xl font-semibold shadow-[0_0_40px_-10px_rgba(147,51,234,0.5)] hover:shadow-[0_0_60px_-15px_rgba(147,51,234,0.7)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative flex items-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Duke ruajtur...
                      </>
                    ) : (
                      <>
                        Ruaj Fjalëkalimin
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-zinc-500 hover:text-white text-sm transition-colors border-b border-transparent hover:border-white pb-0.5">
              Kthehu tek Kyçja
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
