import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/auth/google/callback')({
  component: GoogleCallbackComponent,
})

function GoogleCallbackComponent() {
  useEffect(() => {
    // Close the popup or redirect back to login
    if (window.opener) {
      window.close()
    } else {
      window.location.href = '/login'
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Processing Google Sign-In...</h2>
        <p className="text-muted-foreground">Please wait while we complete your authentication.</p>
      </div>
    </div>
  )
}
