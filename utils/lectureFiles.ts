import type { SupabaseClient } from '@supabase/supabase-js'

export interface LectureFileListItem {
  id: string
  name: string
  file_type: string
  created_at: string
}

export interface LectureFileRecord extends LectureFileListItem {
  storage_path: string
  size: number
}

const DEFAULT_LECTURE_FILE_COLUMNS =
  'id, name, storage_path, file_type, size, created_at'

export const EXAM_BUILDER_LECTURE_COLUMNS = 'id, name, file_type, created_at'

export async function listLectureFiles<
  T extends LectureFileListItem | LectureFileRecord,
>(
  supabase: SupabaseClient,
  userId: string,
  columns = DEFAULT_LECTURE_FILE_COLUMNS
) {
  const { data, error } = await supabase
    .from('lecture_files')
    .select(columns)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as unknown as T[])
}

export async function createLecturePreviewUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 60 * 60
) {
  const { data, error } = await supabase.storage
    .from('lectures')
    .createSignedUrl(storagePath, expiresInSeconds)

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Could not create a preview link.')
  }

  return data.signedUrl
}

export async function deleteLectureFile(
  supabase: SupabaseClient,
  {
    fileId,
    storagePath,
    userId,
  }: {
    fileId: string
    storagePath: string
    userId: string
  }
) {
  const { error: storageError } = await supabase.storage
    .from('lectures')
    .remove([storagePath])

  if (storageError) {
    throw new Error(storageError.message)
  }

  const { error: dbError } = await supabase
    .from('lecture_files')
    .delete()
    .eq('id', fileId)
    .eq('user_id', userId)

  if (dbError) {
    throw new Error(dbError.message)
  }
}
