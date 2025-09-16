import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/auth/github/callback')({
  component: GitHubCallbackComponent,
})

function GitHubCallbackComponent() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')

    if (error) {
      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GITHUB_AUTH_ERROR',
          error: errorDescription || error
        }, window.location.origin)
      }
      window.close()
      return
    }

    if (code) {
      // Send success code to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GITHUB_AUTH_SUCCESS',
          code: code
        }, window.location.origin)
      }
      window.close()
      return
    }

    // No code or error - something went wrong
    if (window.opener) {
      window.opener.postMessage({
        type: 'GITHUB_AUTH_ERROR',
        error: 'No authorization code received'
      }, window.location.origin)
    }
    window.close()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Processing GitHub authentication...</p>
      </div>
    </div>
  )
}
