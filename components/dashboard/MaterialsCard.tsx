'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Database,
  FileText,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useAppLocale } from '@/components/i18n/useAppLocale'

interface LectureFile {
  id: string
  name: string
  storage_path: string
  file_type: string
  size: number
  created_at: string
}

const copy = {
  en: {
    badge: 'Lecture library',
    title: 'Uploaded materials',
    description: 'This is now the single home for lecture files, which keeps the rest of the dashboard cleaner.',
    state: 'Status',
    formats: 'Formats',
    stored: 'stored files',
    formatValue: 'PDF, DOCX and TXT up to 10MB',
    upload: 'Upload material',
    uploading: 'Uploading...',
    uploadError: 'Upload failed',
    uploadUnknown: 'Unknown error',
    onlyTypes: 'Only PDF, DOCX and TXT are allowed.',
    tooBig: 'The file must be smaller than 10MB.',
    storageError: 'Storage: check the bucket and access policies in Supabase.',
    dbError: 'The file uploaded, but saving it in the database failed.',
    uploadSuccess: 'Material uploaded successfully.',
    uploadRetry: 'Upload failed. Please try again.',
    deleteConfirm: 'Do you want to delete',
    deleteSuccess: 'Material deleted successfully.',
    deleteError: 'Deleting the material failed.',
    loading: 'Checking stored materials...',
    emptyTitle: 'No materials yet',
    emptyBody: 'Upload a lecture and this area becomes your main study library.',
    delete: 'Delete',
  },
  sq: {
    badge: 'Biblioteka e leksioneve',
    title: 'Materiale te ngarkuara',
    description: 'Kjo eshte tani zona e vetme per skedaret e leksioneve, qe pjesa tjeter e dashboard te mbetet me e paster.',
    state: 'Gjendja',
    formats: 'Formatet',
    stored: 'materiale te ruajtura',
    formatValue: 'PDF, DOCX dhe TXT deri ne 10MB',
    upload: 'Ngarko material',
    uploading: 'Po ngarkohet...',
    uploadError: 'Deshtoi ngarkimi',
    uploadUnknown: 'Gabim i panjohur',
    onlyTypes: 'Lejohen vetem PDF, DOCX dhe TXT.',
    tooBig: 'Skedari duhet te jete me i vogel se 10MB.',
    storageError: 'Storage: kontrollo bucket-in dhe politikat e aksesit ne Supabase.',
    dbError: 'Skedari u ngarkua, por regjistrimi ne databaze deshtoi.',
    uploadSuccess: 'Materiali u ngarkua me sukses.',
    uploadRetry: 'Deshtoi ngarkimi. Provo perseri.',
    deleteConfirm: 'Deshiron ta fshish',
    deleteSuccess: 'Materiali u fshi me sukses.',
    deleteError: 'Deshtoi fshirja e materialit.',
    loading: 'Po kontrollohen materialet e ruajtura...',
    emptyTitle: 'Nuk ka materiale ende',
    emptyBody: 'Ngarko nje leksion dhe kjo zone do te kthehet ne biblioteken tende kryesore te pergatitjes.',
    delete: 'Fshi',
  },
} as const

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export default function MaterialsCard() {
  const { user } = useAuth()
  const { locale } = useAppLocale()
  const t = copy[locale]
  const supabase = createClient()

  const [files, setFiles] = useState<LectureFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('lecture_files')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (err: unknown) {
      setError(`${t.uploadError}: ${getErrorMessage(err, t.uploadUnknown)}`)
    } finally {
      setLoading(false)
    }
  }, [supabase, t.uploadError, t.uploadUnknown])

  useEffect(() => {
    if (user) {
      void fetchFiles()
    }
  }, [fetchFiles, user])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]

    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.docx')) {
      setError(t.onlyTypes)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(t.tooBig)
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const storagePath = `${user.id}/${fileName}`

      const { error: storageError } = await supabase.storage.from('lectures').upload(storagePath, file)
      if (storageError) {
        throw new Error(t.storageError)
      }

      const { error: dbError } = await supabase.from('lecture_files').insert({
        user_id: user.id,
        name: file.name,
        storage_path: storagePath,
        file_type: file.type || 'application/octet-stream',
        size: file.size,
      })

      if (dbError) {
        throw new Error(t.dbError)
      }

      setSuccess(t.uploadSuccess)
      await fetchFiles()
    } catch (err: unknown) {
      setError(getErrorMessage(err, t.uploadRetry))
    } finally {
      setUploading(false)
      if (event.target) event.target.value = ''
    }
  }

  const handleDelete = async (file: LectureFile) => {
    if (!window.confirm(`${t.deleteConfirm} "${file.name}"?`)) return

    try {
      await supabase.storage.from('lectures').remove([file.storage_path])
      await supabase.from('lecture_files').delete().eq('id', file.id)
      setFiles((current) => current.filter((entry) => entry.id !== file.id))
      setSuccess(t.deleteSuccess)
    } catch {
      setError(t.deleteError)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB']
    const index = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${parseFloat((bytes / Math.pow(1024, index)).toFixed(2))} ${units[index]}`
  }

  return (
    <section className="surface animate-fade-in-up p-6 sm:p-7">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="eyebrow">{t.badge}</span>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">{t.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{t.description}</p>
          </div>

          <label className="primary-button cursor-pointer">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {uploading ? t.uploading : t.upload}
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
              accept=".pdf,.docx,.txt"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="surface-muted flex items-center gap-3 p-4">
            <div className="icon-shell h-11 w-11 text-[var(--accent)]">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {t.state}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{files.length} {t.stored}</p>
            </div>
          </div>

          <div className="surface-muted flex items-center gap-3 p-4">
            <div className="icon-shell h-11 w-11 text-amber-600 dark:text-amber-300">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {t.formats}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{t.formatValue}</p>
            </div>
          </div>
        </div>

        {(error || success) && (
          <div className="space-y-3">
            {error && (
              <div className="surface-muted flex items-start justify-between gap-3 border-rose-200/70 bg-rose-50/80 p-4 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-sm leading-6">{error}</p>
                </div>
                <button type="button" onClick={() => setError('')} className="rounded-full p-1 transition hover:bg-white/70 dark:hover:bg-slate-900/70">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {success && (
              <div className="surface-muted flex items-start justify-between gap-3 border-emerald-200/70 bg-emerald-50/80 p-4 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-sm leading-6">{success}</p>
                </div>
                <button type="button" onClick={() => setSuccess('')} className="rounded-full p-1 transition hover:bg-white/70 dark:hover:bg-slate-900/70">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="custom-scrollbar min-h-[18rem] space-y-3 overflow-y-auto pr-1">
          {loading ? (
            <div className="surface-muted flex min-h-[18rem] flex-col items-center justify-center p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t.loading}</p>
            </div>
          ) : files.length === 0 ? (
            <div className="surface-muted flex min-h-[18rem] flex-col items-center justify-center border-dashed p-8 text-center">
              <div className="icon-shell h-14 w-14 text-[var(--accent)]">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{t.emptyTitle}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{t.emptyBody}</p>
            </div>
          ) : (
            files.map((file) => (
              <article
                key={file.id}
                className="surface-muted flex items-start justify-between gap-4 p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/25"
              >
                <div className="flex min-w-0 gap-4">
                  <div className="icon-shell h-11 w-11 text-[var(--accent)]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white" title={file.name}>
                      {file.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="status-pill">{formatSize(file.size)}</span>
                      <span className="status-pill">{file.file_type.split('/').pop()?.toUpperCase() || 'FILE'}</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(file.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'sq-AL')}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(file)}
                  className="secondary-button px-4 py-2 text-rose-600 dark:text-rose-300"
                >
                  <Trash2 className="h-4 w-4" />
                  {t.delete}
                </button>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
