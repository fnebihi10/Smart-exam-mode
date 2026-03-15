'use client';

import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Reset old states
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      const data = await res.json();
      setResponse(data.reply);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Smart Exam Mode</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Shkruaj pyetjen tuaj..."
          className="w-full p-3 border rounded-lg h-32 resize-none disabled:opacity-50"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Duke menduar...' : 'Dërgo'}
        </button>
      </form>

      {/* Loading State */}
      {loading && (
        <div className="mt-6 flex items-center gap-3 text-gray-600">
          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span>AI po analizon pyetjen tuaj...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <strong>Gabim:</strong> {error}
          <button
            onClick={() => setError('')}
            className="ml-2 text-sm underline"
          >
            Mbyll
          </button>
        </div>
      )}

      {/* Response State */}
      {response && !loading && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="font-semibold text-green-800 mb-2">Përgjigja e AI:</h2>
          <p className="text-gray-800 whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </main>
  );
}