import mammoth from 'mammoth'
import pdf from 'pdf-parse'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from './supabase/server'

type StoredLectureFile = {
  id: string
  user_id: string
  file_type: string
  name: string
  storage_path: string
}

type LectureContextOptions = {
  maxChars?: number
  maxPdfPages?: number
  fileLimit?: number
}

const DEFAULT_CONTEXT_MAX_CHARS = 25000
const DEFAULT_PDF_MAX_PAGES = 15
const DEFAULT_FILE_LIMIT = 10
const CONTEXT_TRUNCATION_NOTE = '\n... [Source text truncated]'

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const sanitizeStorageFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9.]/g, '_')

const getPathFileName = (path: string) => path.split('/').filter(Boolean).at(-1) || path

const appendSourceContext = (
  currentContext: string,
  fileName: string,
  rawText: string,
  maxChars: number
) => {
  const text = rawText.trim()

  if (!text || currentContext.length >= maxChars) {
    return currentContext
  }

  const header = `\n--- SOURCE: ${fileName} ---\n`
  const remainingChars = maxChars - currentContext.length - header.length

  if (remainingChars <= 0) {
    return currentContext
  }

  const sourceText =
    text.length > remainingChars
      ? `${text.slice(0, Math.max(0, remainingChars - CONTEXT_TRUNCATION_NOTE.length))}${CONTEXT_TRUNCATION_NOTE}`
      : text

  return `${currentContext}${header}${sourceText}\n`
}

async function downloadLectureBlob(
  supabase: SupabaseClient,
  file: StoredLectureFile
) {
  const attemptedPaths = new Set<string>()
  const candidatePaths = [
    file.storage_path,
    file.storage_path.includes('/') ? '' : `${file.user_id}/${file.storage_path}`,
    `${file.user_id}/${sanitizeStorageFileName(file.name)}`,
  ].filter(Boolean)

  for (const path of candidatePaths) {
    attemptedPaths.add(path)
    const { data, error } = await supabase.storage.from('lectures').download(path)

    if (!error && data) {
      return data
    }
  }

  const sanitizedName = sanitizeStorageFileName(file.name).toLowerCase()
  const currentFileName = getPathFileName(file.storage_path).toLowerCase()
  const stem = sanitizedName.replace(/\.[^.]+$/, '')

  const { data: folderFiles, error: listError } = await supabase.storage
    .from('lectures')
    .list(file.user_id, {
      limit: 200,
      sortBy: { column: 'created_at', order: 'desc' },
    })

  if (!listError && folderFiles?.length) {
    const match = folderFiles.find((entry) => {
      const entryName = entry.name.toLowerCase()

      return (
        entryName === currentFileName ||
        entryName === sanitizedName ||
        entryName.endsWith(`-${sanitizedName}`) ||
        Boolean(stem && entryName.includes(stem))
      )
    })

    if (match) {
      const resolvedPath = `${file.user_id}/${match.name}`
      attemptedPaths.add(resolvedPath)
      const { data, error } = await supabase.storage
        .from('lectures')
        .download(resolvedPath)

      if (!error && data) {
        return data
      }
    }
  }

  console.error(
    `AI CONTEXT: Could not download ${file.name}. Tried: ${Array.from(attemptedPaths).join(', ')}`
  )

  return null
}

export async function getLectureContext(
  selectedLectureIds?: string[],
  options: LectureContextOptions = {}
) {
  try {
    const maxChars = clamp(
      Number(options.maxChars) || DEFAULT_CONTEXT_MAX_CHARS,
      1000,
      DEFAULT_CONTEXT_MAX_CHARS
    )
    const maxPdfPages = clamp(
      Number(options.maxPdfPages) || DEFAULT_PDF_MAX_PAGES,
      1,
      100
    )
    const fileLimit = clamp(
      Number(options.fileLimit) || DEFAULT_FILE_LIMIT,
      1,
      25
    )

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return ''
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = typeof profile?.role === 'string' ? profile.role : 'student'

    let query = supabase
      .from('lecture_files')
      .select('id, user_id, name, storage_path, file_type')

    if (selectedLectureIds?.length) {
      query = query.in('id', selectedLectureIds)
    } else if (role !== 'student') {
      query = query.eq('user_id', user.id)
    }

    const { data: files, error: dbError } = await query

    if (dbError || !files?.length) {
      if (dbError) {
        console.error('AI CONTEXT: DB Error:', dbError)
      }
      return ''
    }

    let combinedContext = ''

    for (const file of (files as StoredLectureFile[]).slice(0, fileLimit)) {
      if (combinedContext.length >= maxChars) {
        break
      }

      try {
        const blob = await downloadLectureBlob(supabase, file)

        if (!blob) {
          continue
        }

        const buffer = Buffer.from(await blob.arrayBuffer())
        let text = ''

        if (file.file_type.includes('pdf') || file.name.endsWith('.pdf')) {
          const data = await pdf(buffer, { max: maxPdfPages })
          text = data.text
        } else if (
          file.file_type.includes('wordprocessingml') ||
          file.name.endsWith('.docx')
        ) {
          const result = await mammoth.extractRawText({ buffer })
          text = result.value
        } else if (
          file.file_type.includes('plain') ||
          file.name.endsWith('.txt')
        ) {
          text = buffer.toString('utf-8')
        }

        if (text.trim()) {
          combinedContext = appendSourceContext(
            combinedContext,
            file.name,
            text,
            maxChars
          )
        }
      } catch (fileError) {
        console.error(
          `AI CONTEXT: Failed to process file ${file.name}:`,
          fileError
        )
      }
    }

    if (combinedContext.length > maxChars) {
      return `${combinedContext.slice(0, maxChars)}\n... [Pjesa tjeter e materialit eshte shkurtuar]`
    }

    return combinedContext
  } catch (globalError) {
    console.error('AI CONTEXT: Global Error in getLectureContext:', globalError)
    return ''
  }
}
