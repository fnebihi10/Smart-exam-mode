'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowUp,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Eraser,
  Search,
  Sparkles,
  User as UserIcon,
} from 'lucide-react'
import { useAppLocale } from '@/components/i18n/useAppLocale'
import { useAuth } from '@/contexts/AuthContext'
import {
  EXAM_BUILDER_LECTURE_COLUMNS,
  listLectureFiles,
  type LectureFileListItem,
} from '@/utils/lectureFiles'
import { useSupabaseBrowserClient } from '@/utils/supabase/browser-client'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const copy = {
  en: {
    title: 'AI mentor',
    active: 'Ready',
    mode: 'General mode',
    lectureMode: 'Lecture mode',
    subtitle: 'Study plans, explanations, revision help, and quick practice.',
    contextTitle: 'Study context',
    contextBody: 'Choose what the assistant should use',
    searchLectures: 'Search lectures',
    lectures: 'lectures',
    generalChat: 'General study chat',
    generalChatBody: 'Planning, revision, and exam advice',
    lectureChatBody: 'Ask only about this lecture',
    clear: 'Clear',
    emptyTitle: 'Start with a focused question',
    emptyBody: 'Pick a prompt or ask your own study question.',
    prompts: [
      'Make a study plan for my next exam.',
      'Explain how I should review weak topics.',
      'Give me practice questions for today.',
    ],
    sendPlaceholder: 'Ask a study question',
    sendButton: 'Send',
    sendTitle: 'Send question',
    keyHint: 'Enter sends. Shift + Enter adds a line.',
    sourceHint: 'General study chat.',
    clearConfirm: 'Do you want to clear the conversation?',
    user: 'You',
    assistant: 'AI mentor',
    errorFallback: 'Communication with AI failed.',
  },} as const

export default function AIChatCard() {
  const { locale } = useAppLocale()
  const { role, roleLoading, user } = useAuth()
  const supabase = useSupabaseBrowserClient()
  const searchParams = useSearchParams()
  const t = useMemo(() => copy[locale], [locale])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState('')
  const [lectureSearch, setLectureSearch] = useState('')
  const [lectures, setLectures] = useState<LectureFileListItem[]>([])
  const [selectedContext, setSelectedContext] = useState('general')
  const scrollRef = useRef<HTMLDivElement>(null)
  const lectureRequestRef = useRef(0)
  const requestedLectureId = searchParams.get('lecture')

  useEffect(() => {
    if (!scrollRef.current) return

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [loading, messages])

  useEffect(() => {
    if (!user) {
      setLectures([])
      setSelectedContext('general')
      return
    }

    if (roleLoading) return

    const requestId = lectureRequestRef.current + 1
    lectureRequestRef.current = requestId

    const loadLectures = async () => {
      try {
        const nextLectures = await listLectureFiles<LectureFileListItem>(
          supabase,
          user.id,
          EXAM_BUILDER_LECTURE_COLUMNS,
          role === 'teacher' ? 'own' : 'visible'
        )
        if (lectureRequestRef.current !== requestId) return
        setLectures(nextLectures)
      } catch {
        if (lectureRequestRef.current !== requestId) return
        setLectures([])
      }
    }

    void loadLectures()
  }, [role, roleLoading, supabase, user])

  useEffect(() => {
    if (
      selectedContext !== 'general' &&
      !lectures.some((lecture) => lecture.id === selectedContext)
    ) {
      setSelectedContext('general')
    }
  }, [lectures, selectedContext])

  useEffect(() => {
    if (!requestedLectureId) return
    if (!lectures.some((lecture) => lecture.id === requestedLectureId)) return

    setSelectedContext(requestedLectureId)
  }, [lectures, requestedLectureId])

  const filteredLectures = useMemo(() => {
    const query = lectureSearch.trim().toLowerCase()

    if (!query) return lectures

    return lectures
      .filter((lecture) => lecture.name.toLowerCase().includes(query))
  }, [lectureSearch, lectures])

  const selectedLecture = useMemo(
    () => lectures.find((lecture) => lecture.id === selectedContext),
    [lectures, selectedContext]
  )

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
        body: JSON.stringify({
          message: userMessage,
          mode: selectedContext === 'general' ? 'general' : 'lecture',
          selectedLectureIds: selectedContext === 'general' ? [] : [selectedContext],
        }),
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
    <section className="surface animate-fadeInScale grid min-h-[31rem] overflow-hidden lg:grid-cols-[18rem_1fr]">
      <aside className="flex min-h-0 flex-col border-b border-[var(--surface-divider)] p-4 lg:border-b-0 lg:border-r">
        <span className="eyebrow">{t.contextTitle}</span>
        <h2 className="mt-3 max-w-52 text-lg font-semibold leading-6 text-slate-900 dark:text-white">{t.contextBody}</h2>

        <label className="relative mt-4 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={lectureSearch}
            onChange={(event) => setLectureSearch(event.target.value)}
            placeholder={t.searchLectures}
            className="field-input h-10 rounded-full pl-9 pr-3 text-xs"
          />
        </label>

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          {filteredLectures.length}/{lectures.length} {t.lectures}
        </p>

        <div className="custom-scrollbar mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => setSelectedContext('general')}
            className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left shadow-depth-sm transition ${
              selectedContext === 'general'
                ? 'border-[var(--accent)]/25 bg-[var(--accent-soft)]'
                : 'border-[var(--border)] bg-white/55 hover:bg-white/75 dark:bg-slate-950/25'
            }`}
          >
            <div className="icon-shell h-9 w-9 shrink-0 text-[var(--accent)]">
              <BriefcaseBusiness className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{t.generalChat}</p>
              <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t.generalChatBody}</p>
            </div>
          </button>

          {filteredLectures.map((lecture) => (
            <button
              key={lecture.id}
              type="button"
              onClick={() => setSelectedContext(lecture.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left shadow-depth-sm transition ${
                selectedContext === lecture.id
                  ? 'border-[var(--accent)]/25 bg-[var(--accent-soft)]'
                  : 'border-[var(--border)] bg-white/55 hover:bg-white/75 dark:bg-slate-950/25'
              }`}
            >
              <div className="icon-shell h-9 w-9 shrink-0 text-[var(--accent)]">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{lecture.name}</p>
                <p className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t.lectureChatBody}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex min-h-0 flex-col">
        <header className="card-header-divider px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-emerald-400 text-white shadow-[0_18px_28px_-22px_rgba(15,118,110,0.8)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      {selectedContext === 'general' ? t.mode : t.lectureMode}
                    </p>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      {selectedLecture?.name || t.generalChat}
                    </h2>
                  </div>
                  <span className="status-pill">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {t.active}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.subtitle}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={clearChat}
              disabled={!messages.length}
              className="secondary-button self-start px-3 py-2 text-xs disabled:opacity-40"
            >
              <Eraser className="h-4 w-4" />
              {t.clear}
            </button>
          </div>
        </header>

      <div ref={scrollRef} className="custom-scrollbar dashboard-scroll-mask flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {messages.length === 0 && !loading ? (
          <div className="flex h-full flex-col justify-center">
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{t.emptyTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{t.emptyBody}</p>
            </div>

            <div className="mx-auto mt-4 grid w-full max-w-3xl gap-2 md:grid-cols-3">
              {t.prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="rounded-2xl border border-[var(--border)] bg-white/50 p-3 text-left shadow-depth-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)]/25 dark:bg-slate-950/25"
                >
                  <p className="text-xs font-semibold leading-5 text-slate-700 dark:text-slate-200">{prompt}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isUser = message.role === 'user'

              return (
                <div key={`${message.role}-${index}`} className={`animate-fadeInUp flex gap-3 [animation-fill-mode:both] ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="icon-shell h-8 w-8 shrink-0 text-[var(--accent)]">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      style={
                        isUser
                          ? { borderRight: '3px solid rgba(var(--color-primary-rgb), 0.38)' }
                          : { borderLeft: '3px solid rgba(var(--color-muted-accent-rgb), 0.5)' }
                      }
                      className={`rounded-2xl px-3 py-2 text-sm leading-6 shadow-depth-sm ${
                        isUser
                          ? 'border border-[var(--accent)]/20 bg-[var(--accent-soft)] text-slate-900 dark:text-teal-50'
                          : 'surface-muted text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <span className="mt-1 px-1 text-[11px] text-slate-400 dark:text-slate-500">
                      {isUser ? t.user : t.assistant}
                    </span>
                  </div>

                  {isUser && (
                    <div className="icon-shell h-8 w-8 shrink-0 text-slate-700 dark:text-slate-200">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>
              )
            })}

            {loading && (
              <div className="flex gap-3">
                <div className="icon-shell h-8 w-8 shrink-0 text-[var(--accent)]">
                  <Bot className="h-4 w-4" />
                </div>
                <div
                  style={{ borderLeft: '3px solid rgba(var(--color-muted-accent-rgb), 0.5)' }}
                  className="surface-muted rounded-2xl px-3 py-3 shadow-depth-sm"
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

      <div className="border-t border-[var(--surface-divider)] px-4 py-3 sm:px-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="rounded-2xl border border-[var(--border)] bg-white/50 p-2 shadow-depth-sm dark:bg-slate-950/25">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.sendPlaceholder}
              className="custom-scrollbar min-h-[4.25rem] w-full resize-none rounded-xl border-0 bg-transparent px-3 py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed dark:text-slate-100 dark:placeholder:text-slate-500"
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

            <div className="section-divider mx-2 my-1.5" />

            <div className="flex flex-col gap-2 px-2 pb-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                <p>{t.keyHint}</p>
                <p>{t.sourceHint}</p>
              </div>

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="primary-button min-w-[7rem] justify-center self-end px-4 py-2 text-xs sm:self-auto"
                title={t.sendTitle}
              >
                {loading ? <span className="spinner-arc h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                {t.sendButton}
              </button>
            </div>
          </div>
        </form>
      </div>
      </div>
    </section>
  )
}
