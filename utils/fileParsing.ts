import mammoth from 'mammoth'
import pdf from 'pdf-parse'
import { createClient } from './supabase/server'

type StoredLectureFile = {
  id: string
  file_type: string
  name: string
  storage_path: string
}

export async function getLectureContext(selectedLectureIds?: string[]) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('AI CONTEXT: No user detected', authError)
      return ''
    }

    let query = supabase
      .from('lecture_files')
      .select('id, name, storage_path, file_type')
      .eq('user_id', user.id)

    if (selectedLectureIds?.length) {
      query = query.in('id', selectedLectureIds)
    }

    const { data: files, error: dbError } = await query

    if (dbError || !files?.length) {
      if (dbError) {
        console.error('AI CONTEXT: DB Error:', dbError)
      }
      return ''
    }

    let combinedContext = ''

    for (const file of files as StoredLectureFile[]) {
      try {
        const { data: blob, error: storageError } = await supabase.storage
          .from('lectures')
          .download(file.storage_path)

        if (storageError || !blob) {
          console.error(
            `AI CONTEXT: Error downloading ${file.name}:`,
            storageError
          )
          continue
        }

        const buffer = Buffer.from(await blob.arrayBuffer())
        let text = ''

        if (file.file_type.includes('pdf') || file.name.endsWith('.pdf')) {
          const data = await pdf(buffer)
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
          combinedContext += `\n--- SOURCE: ${file.name} ---\n${text}\n`
        }
      } catch (fileError) {
        console.error(
          `AI CONTEXT: Failed to process file ${file.name}:`,
          fileError
        )
      }
    }

    const maxChars = 25000
    if (combinedContext.length > maxChars) {
      return `${combinedContext.slice(0, maxChars)}\n... [Pjesa tjeter e materialit eshte shkurtuar]`
    }

    return combinedContext
  } catch (globalError) {
    console.error('AI CONTEXT: Global Error in getLectureContext:', globalError)
    return ''
  }
}
