import type { SupabaseClient } from '@supabase/supabase-js'

export interface LectureFileListItem {
  id: string
  user_id?: string
  name: string
  storage_path?: string
  file_type: string
  created_at: string
}

export interface LectureFileRecord extends LectureFileListItem {
  storage_path: string
  size: number
}

export type LectureFileScope = 'own' | 'visible'

const DEFAULT_LECTURE_FILE_COLUMNS =
  'id, name, storage_path, file_type, size, created_at'

export const EXAM_BUILDER_LECTURE_COLUMNS = 'id, name, storage_path, file_type, created_at'

const ensureStoragePathColumn = (columns: string) =>
  columns.includes('storage_path') ? columns : `${columns}, storage_path`

const ensureUserIdColumn = (columns: string) =>
  columns.includes('user_id') ? columns : `${columns}, user_id`

const sanitizeStorageFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9.]/g, '_')

const getPathFileName = (path: string) => path.split('/').filter(Boolean).at(-1) || path

async function canSignStoragePath(supabase: SupabaseClient, storagePath: string) {
  const { error } = await supabase.storage
    .from('lectures')
    .createSignedUrl(storagePath, 60)

  return !error
}

async function deleteStaleLectureFileRow(
  supabase: SupabaseClient,
  file: LectureFileListItem | LectureFileRecord
) {
  await supabase
    .from('lecture_files')
    .delete()
    .eq('id', file.id)
}

async function filterExistingStorageFiles<
  T extends LectureFileListItem | LectureFileRecord,
>(supabase: SupabaseClient, files: T[]) {
  const resolvedFiles: Array<T | null> = await Promise.all(
    files.map(async (file): Promise<T | null> => {
      if (!file.storage_path) return file

      if (await canSignStoragePath(supabase, file.storage_path)) {
        return file
      }

      const ownerId = file.user_id || file.storage_path.split('/')[0]
      const sanitizedName = sanitizeStorageFileName(file.name).toLowerCase()
      const currentFileName = getPathFileName(file.storage_path).toLowerCase()
      const stem = sanitizedName.replace(/\.[^.]+$/, '')

      const { data: folderFiles, error: listError } = await supabase.storage
        .from('lectures')
        .list(ownerId, {
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
          const resolvedPath = `${ownerId}/${match.name}`

          if (await canSignStoragePath(supabase, resolvedPath)) {
            return {
              ...file,
              storage_path: resolvedPath,
            } as T
          }
        }
      }

      await deleteStaleLectureFileRow(supabase, file)
      return null
    })
  )

  return resolvedFiles.filter((file): file is T => file !== null)
}

export async function listLectureFiles<
  T extends LectureFileListItem | LectureFileRecord,
>(
  supabase: SupabaseClient,
  userId: string,
  columns = DEFAULT_LECTURE_FILE_COLUMNS,
  scope: LectureFileScope = 'own'
) {
  let query = supabase
    .from('lecture_files')
    .select(ensureUserIdColumn(ensureStoragePathColumn(columns)))

  if (scope === 'own') {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const files = ((data ?? []) as unknown as T[])

  return filterExistingStorageFiles(supabase, files)
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
