'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Plus, CheckCircle2, Circle, Clock, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Task {
    id: string
    title: string
    status: string
    created_at: string
}

export default function TasksPage() {
    const { user } = useAuth()
    const supabase = createClient()
    const [tasks, setTasks] = useState<Task[]>([])
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (user) {
            fetchTasks()
        }
    }, [user])

    const fetchTasks = async () => {
        setLoading(true)
        setError('')
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw new Error(error.message)
            setTasks(data || [])
        } catch (err: any) {
            console.error('Error fetching tasks:', err.message || err)
            setError(err.message || 'Gabim gjatë ngarkimit të detyrave.')
        } finally {
            setLoading(false)
        }
    }

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault()
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

            setTasks([data, ...tasks])
            setNewTaskTitle('')
        } catch (err: any) {
            console.error('Error adding task:', err.message || err)
            setError(err.message || 'Ndodhi një problem gjatë shtimit të detyrës.')
        } finally {
            setSubmitting(false)
        }
    }

    const toggleTaskStatus = async (task: Task) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed'
        
        try {
            // Optimistic UI update
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
            
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', task.id)

            if (error) {
                // Revert if error
                setTasks(tasks)
                throw new Error(error.message)
            }
        } catch (err: any) {
            console.error('Error updating task status:', err.message || err)
            fetchTasks() // Refetch to be sure
        }
    }

    const deleteTask = async (taskId: string) => {
        if (!confirm('Jeni i sigurt që doni ta fshini këtë detyrë?')) return

        try {
            setTasks(tasks.filter(t => t.id !== taskId))
            
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId)

            if (error) throw new Error(error.message)
        } catch (err: any) {
            console.error('Error deleting task:', err.message || err)
            fetchTasks()
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link 
                        href="/dashboard" 
                        className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Menaxhimi i Detyrave</h1>
                        <p className="text-sm text-zinc-500">Kjo faqe ruan dhe lexon të dhënat drejtpërdrejt nga Supabase.</p>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {/* CREATE Form */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm shadow-blue-900/5">
                    <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Shto Detyrë të Re</h2>
                    <form onSubmit={handleAddTask} className="flex gap-3">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Shkruaj një detyrë të re..."
                            disabled={submitting}
                            className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white"
                        />
                        <button
                            type="submit"
                            disabled={submitting || !newTaskTitle.trim()}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                        >
                            {submitting ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    <span className="hidden sm:inline">Shto</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* READ List */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Lista e Detyrave ({tasks.length})</h2>
                        <div className="text-xs text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Përditësuar direkt nga Supabase
                        </div>
                    </div>
                    
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {tasks.length === 0 ? (
                            <div className="p-10 text-center text-zinc-500">
                                Nuk keni asnjë detyrë të ruajtur.
                            </div>
                        ) : (
                            tasks.map(task => (
                                <div key={task.id} className={`p-4 flex items-center justify-between gap-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${task.status === 'completed' ? 'opacity-60' : ''}`}>
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <button 
                                            onClick={() => toggleTaskStatus(task)}
                                            className="text-zinc-400 hover:text-blue-500 transition-colors"
                                        >
                                            {task.status === 'completed' ? (
                                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                            ) : (
                                                <Circle className="w-6 h-6" />
                                            )}
                                        </button>
                                        <div className="min-w-0">
                                            <h3 className={`font-medium truncate ${task.status === 'completed' ? 'line-through text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>
                                                {task.title}
                                            </h3>
                                            <p className="text-xs text-zinc-400 mt-0.5">
                                                {new Date(task.created_at).toLocaleString('sq-AL', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Fshi detyrën"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </main>
    )
}
