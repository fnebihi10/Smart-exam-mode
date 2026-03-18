'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Mail, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { resetPasswordForEmail } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email.includes('@') || !email.includes('.')) {
      setError('Ju lutem shkruani një email valid.')
      return
    }

    setLoading(true)

    const { error: resetError } = await resetPasswordForEmail(email)

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
    } else {
      setSuccess('Të kemi dërguar një email me lidhjen për të rikthyer fjalëkalimin.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none" />
      
      {/* Glassmorphic Card */}
      <div className="w-full max-w-[420px] bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative z-10">
        
        <Link href="/login" className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Kthehu
        </Link>
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Keni harruar fjalëkalimin?</h1>
          <p className="text-zinc-400 mt-2 text-sm font-medium leading-relaxed">Mos u shqetësoni, ndodh. Shkruani email-in tuaj dhe ne do t'ju dërgojmë një lidhje për të krijuar një fjalëkalim të ri.</p>
        </div>

        {/* Messages */}
        <div className="space-y-3 mb-6">
          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p className="leading-relaxed">{success}</p>
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
                        Duke dërguar...
                      </>
                    ) : (
                      <>
                        Dërgo lidhjen
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
