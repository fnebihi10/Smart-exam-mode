'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowUp,
  Bot,
  Eraser,
  Sparkles,
  User as UserIcon,
} from 'lucide-react'
import { useAppLocale } from '@/components/i18n/useAppLocale'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const copy = {
  en: {
    title: 'AI mentor',
    active: 'Active',
    subtitle: 'Ask focused questions based on your uploaded lecture materials.',
    clear: 'Clear',
    emptyTitle: 'Ask with real context',
    emptyBody: 'Choose a starter prompt or write your own question to analyze your uploaded materials.',
    prompts: [
      'Give me a summary of the latest lecture.',
      'Create 5 exam questions from my uploaded material.',
      'Explain the difference between CPU and GPU in simple language.',
    ],
    sendPlaceholder: 'Ask about your material, request an exam quiz, or ask for a summary...',
    sendTitle: 'Send question',
    keyHint: 'Press Enter to send, Shift + Enter for a new line.',
    sourceHint: 'The assistant works with the materials uploaded in your account.',
    clearConfirm: 'Do you want to clear the conversation?',
    user: 'You',
    assistant: 'AI mentor',
    errorFallback: 'Communication with AI failed.',
  },
  sq: {
    title: 'Mentori AI',
    active: 'Aktiv',
    subtitle: 'Bej pyetje te fokusuara bazuar ne materialet e leksioneve qe ke ngarkuar.',
    clear: 'Pastro',
    emptyTitle: 'Pyet me kontekst real',
    emptyBody: 'Zgjidh nje pyetje fillestare ose shkruaj pyetjen tende per te analizuar materialet e ngarkuara.',
    prompts: [
      'Me jep nje permbledhje te leksionit te fundit.',
      'Krijo 5 pyetje provimi nga materiali i ngarkuar.',
      'Shpjego dallimin mes CPU dhe GPU me gjuhe te thjeshte.',
    ],
    sendPlaceholder: 'Pyet per materialin tend, kerko pyetje provimi ose permbledhje...',
    sendTitle: 'Dergo pyetjen',
    keyHint: 'Shtyp Enter per dergim, Shift + Enter per rresht te ri.',
    sourceHint: 'Asistenti perdor materialet qe ke ngarkuar ne llogarine tende.',
    clearConfirm: 'Deshiron ta pastrosh biseden?',
    user: 'Ti',
    assistant: 'Mentori AI',
    errorFallback: 'Deshtoi komunikimi me AI.',
  },
} as const

export default function AIChatCard() {
  const { locale } = useAppLocale()
  const t = useMemo(() => copy[locale], [locale])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scrollRef.current) return

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [loading, messages])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setError('')
    setMessages((current) => [...current, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t.errorFallback)
      }

      const data = await response.json()
      setMessages((current) => [...current, { role: 'assistant', content: data.reply }])
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    if (!messages.length) return
    if (window.confirm(t.clearConfirm)) {
      setMessages([])
      setError('')
    }
  }

  return (
    <section className="surface animate-fadeInScale flex min-h-[42rem] flex-col overflow-hidden">
      <header className="card-header-divider px-6 py-5 sm:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-[var(--accent)] to-emerald-400 text-white shadow-[0_22px_34px_-24px_rgba(15,118,110,0.8)]">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t.title}</h2>
                <span className="status-pill">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {t.active}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearChat}
            disabled={!messages.length}
            className="secondary-button self-start px-4 py-2 disabled:opacity-40"
          >
            <Eraser className="h-4 w-4" />
            {t.clear}
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="custom-scrollbar dashboard-scroll-mask flex-1 overflow-y-auto px-6 py-6 sm:px-7">
        {messages.length === 0 && !loading ? (
          <div className="flex h-full flex-col justify-center">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--accent-soft)] text-[var(--accent)]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white">{t.emptyTitle}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{t.emptyBody}</p>
            </div>

            <div className="mx-auto mt-8 grid w-full max-w-3xl gap-3 md:grid-cols-3">
              {t.prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="surface-muted p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)]/25"
                >
                  <p className="text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">{prompt}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message, index) => {
              const isUser = message.role === 'user'

              return (
                <div key={`${message.role}-${index}`} className={`animate-fadeInUp flex gap-3 [animation-fill-mode:both] ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="icon-shell h-10 w-10 shrink-0 text-[var(--accent)]">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      style={
                        isUser
                          ? { borderRight: '3px solid rgba(var(--color-primary-rgb), 0.55)' }
                          : { borderLeft: '3px solid rgba(var(--color-muted-accent-rgb), 0.5)' }
                      }
                      className={`rounded-[24px] border-y border-transparent px-4 py-3 text-sm leading-7 shadow-depth-sm ${
                        isUser
                          ? 'bg-slate-900 text-white dark:bg-teal-500 dark:text-slate-950'
                          : 'surface-muted text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <span className="mt-2 px-1 text-xs text-slate-400 dark:text-slate-500">
                      {isUser ? t.user : t.assistant}
                    </span>
                  </div>

                  {isUser && (
                    <div className="icon-shell h-10 w-10 shrink-0 text-slate-700 dark:text-slate-200">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>
              )
            })}

            {loading && (
              <div className="flex gap-3">
                <div className="icon-shell h-10 w-10 shrink-0 text-[var(--accent)]">
                  <Bot className="h-4 w-4" />
                </div>
                <div
                  style={{ borderLeft: '3px solid rgba(var(--color-muted-accent-rgb), 0.5)' }}
                  className="surface-muted rounded-[24px] px-4 py-4 shadow-depth-sm"
                >
                  <div className="flex gap-2">
                    <span className="typing-dot h-2 w-2 rounded-full bg-[var(--accent)] [animation-delay:-0.24s]" />
                    <span className="typing-dot h-2 w-2 rounded-full bg-[var(--accent)] [animation-delay:-0.12s]" />
                    <span className="typing-dot h-2 w-2 rounded-full bg-[var(--accent)]" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="surface-muted flex items-start gap-3 border-rose-200/70 bg-rose-50/80 p-4 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm leading-6">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--surface-divider)] px-6 py-5 sm:px-7">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.sendPlaceholder}
              className="field-input custom-scrollbar min-h-[7rem] resize-none px-5 pr-16"
              disabled={loading}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  if (input.trim() && !loading) {
                    handleSubmit(event)
                  }
                }
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="primary-button absolute bottom-4 right-4 h-11 w-11 rounded-2xl px-0 hover:scale-[1.03] hover:shadow-glow-primary active:scale-95"
              title={t.sendTitle}
            >
              {loading ? <span className="spinner-arc h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>{t.keyHint}</p>
            <p>{t.sourceHint}</p>
          </div>
        </form>
      </div>
    </section>
  )
}
