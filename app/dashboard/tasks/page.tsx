'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useAppLocale } from '@/components/i18n/useAppLocale'

interface Task {
  id: string
  title: string
  status: string
  created_at: string
}

const copy = {
  en: {
    back: 'Back to dashboard',
    title: 'Your study tasks',
    description: 'This screen follows the same visual system and keeps the workflow focused on one thing: action.',
    total: 'Total',
    clearer: 'Clearer task flow',
    clearerBody: 'The list is easier to scan, and the actions are more obvious.',
    newTitle: 'Add a new task',
    newBody: 'Keep it short and specific, for example: Review chapter 3.',
    placeholder: 'Write your next task...',
    saving: 'Saving...',
    add: 'Add task',
    listTitle: 'Task list',
    listSubtitle: 'Updated directly from Supabase.',
    emptyTitle: 'No tasks yet',
    emptyBody: 'Add a small task and use this page as your operational list.',
    delete: 'Delete',
    deleteConfirm: 'Do you want to delete this task?',
    loadError: 'Failed to load tasks.',
    addError: 'There was a problem while adding the task.',
  },
  sq: {
    back: 'Kthehu te dashboard',
    title: 'Detyrat e tua te studimit',
    description: 'Kjo faqe ndjek te njejtin sistem vizual dhe e mban rrjedhen e punes te fokusuar te veprimi.',
    total: 'Totali',
    clearer: 'Rrjedhe me e qarte',
    clearerBody: 'Lista lexohet me lehte dhe veprimet duken me qarte.',
    newTitle: 'Shto nje detyre te re',
    newBody: 'Mbaje te shkurter dhe te qarte, per shembull: Perserit kapitullin 3.',
    placeholder: 'Shkruaj detyren e radhes...',
    saving: 'Po ruhet...',
    add: 'Shto detyre',
    listTitle: 'Lista e detyrave',
    listSubtitle: 'Perditesuar direkt nga Supabase.',
    emptyTitle: 'Nuk ka detyra ende',
    emptyBody: 'Shto nje detyre te vogel dhe perdore kete faqe si listen tende operative.',
    delete: 'Fshi',
    deleteConfirm: 'Deshiron ta fshish kete detyre?',
    loadError: 'Gabim gjate ngarkimit te detyrave.',
    addError: 'Ndodhi nje problem gjate shtimit te detyres.',
  },
} as const

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export default function TasksPage() {
  const { user } = useAuth()
  const { locale } = useAppLocale()
  const t = useMemo(() => copy[locale], [locale])
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      setTasks(data || [])
    } catch (err: unknown) {
      setError(getErrorMessage(err, t.loadError))
    } finally {
      setLoading(false)
    }
  }, [supabase, t.loadError])

  useEffect(() => {
    if (user) {
      void fetchTasks()
    }
  }, [fetchTasks, user])

  const handleAddTask = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newTaskTitle.trim() || !user) return

    setSubmitting(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ title: newTaskTitle.trim(), user_id: user.id }])
        .select()
        .single()

      if (error) throw new Error(error.message)

      setTasks((current) => [data, ...current])
      setNewTaskTitle('')
    } catch (err: unknown) {
      setError(getErrorMessage(err, t.addError))
    } finally {
      setSubmitting(false)
    }
  }

  const toggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed'
    const previousTasks = tasks

    try {
      setTasks((current) => current.map((entry) => (entry.id === task.id ? { ...entry, status: nextStatus } : entry)))
      const { error } = await supabase.from('tasks').update({ status: nextStatus }).eq('id', task.id)
      if (error) throw new Error(error.message)
    } catch {
      setTasks(previousTasks)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!window.confirm(t.deleteConfirm)) return

    try {
      setTasks((current) => current.filter((task) => task.id !== taskId))
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)
      if (error) throw new Error(error.message)
    } catch {
      void fetchTasks()
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-4">
      <section className="surface animate-fade-in-up p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/dashboard" className="secondary-button px-4 py-2">
              <ArrowLeft className="h-4 w-4" />
              {t.back}
            </Link>
            <h1 className="page-title mt-5 text-3xl md:text-4xl">{t.title}</h1>
            <p className="page-copy mt-4">{t.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="surface-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {t.total}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{tasks.length}</p>
            </div>
            <div className="surface-muted p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                {t.clearer}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{t.clearerBody}</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="surface-muted border-rose-200/70 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
          {error}
        </div>
      )}

      <section className="surface animate-fade-in-up p-6 sm:p-7">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.newTitle}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.newBody}</p>

        <form onSubmit={handleAddTask} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            placeholder={t.placeholder}
            disabled={submitting}
            className="field-input flex-1 px-4"
          />
          <button type="submit" disabled={submitting || !newTaskTitle.trim()} className="primary-button justify-center">
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                {t.saving}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                {t.add}
              </>
            )}
          </button>
        </form>
      </section>

      <section className="surface animate-fade-in-up overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t.listTitle}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.listSubtitle}</p>
          </div>
          <span className="status-pill">
            <Clock3 className="h-3.5 w-3.5" />
            {tasks.length}
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-[20rem] items-center justify-center p-6">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--accent)]" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{t.emptyTitle}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.emptyBody}</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {tasks.map((task) => {
              const completed = task.status === 'completed'

              return (
                <article key={task.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <button type="button" onClick={() => toggleTaskStatus(task)} className="mt-1 text-[var(--accent)]">
                      {completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </button>
                    <div className="min-w-0">
                      <h3 className={`text-sm font-medium ${completed ? 'text-slate-500 line-through dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {task.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(task.created_at).toLocaleString(locale === 'en' ? 'en-US' : 'sq-AL', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="secondary-button self-start px-4 py-2 text-rose-600 dark:text-rose-300 sm:self-center"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t.delete}
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
