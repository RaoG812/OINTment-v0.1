'use client'
import { useCallback } from 'react'
import { Github } from 'lucide-react'

export default function AuthControls({ isLoggedIn }: { isLoggedIn: boolean }) {
  const handleReset = useCallback(() => {
    if (confirm('Reset all analysis results?')) {
      localStorage.clear()
      location.reload()
    }
  }, [])

  return (
    <div className="ml-auto flex items-center gap-4">
      <button onClick={handleReset} className="hover:text-emerald-400">
        Reset
      </button>
      {isLoggedIn ? (
        <a
          href="/api/github/logout"
          className="hover:text-emerald-400 flex items-center gap-1"
        >
          <Github className="w-4 h-4" /> Logout
        </a>
      ) : (
        <a
          href="/api/github/auth"
          className="hover:text-emerald-400 flex items-center gap-1"
        >
          <Github className="w-4 h-4" /> Login
        </a>
      )}
    </div>
  )
}
