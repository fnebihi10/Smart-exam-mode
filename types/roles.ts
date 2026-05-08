export type UserRole = 'admin' | 'teacher' | 'student'

export const USER_ROLES: UserRole[] = ['admin', 'teacher', 'student']

export interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
  requested_role?: Exclude<UserRole, 'admin'> | null
  created_at?: string
  updated_at?: string
}

export const normalizeUserRole = (
  value: unknown,
  fallback: UserRole = 'student'
): UserRole => {
  if (value === 'admin' || value === 'teacher' || value === 'student') {
    return value
  }

  return fallback
}

export const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
}
