/**
 * GitHub OAuth Authentication Service
 * Client-side GitHub authentication using OAuth 2.0 flow
 * Integrates with backend user service for complete authentication flow
 */

import { userService, type OAuthCallbackData, type UserProfile } from './user-service'

export interface GitHubAuthConfig {
  clientId: string
  redirectUri: string
  scopes?: string[]
}

export interface GitHubUser {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
  html_url: string
  bio: string | null
  location: string | null
  company: string | null
  blog: string | null
  public_repos: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

export interface GitHubAuthResult {
  success: boolean
  user?: GitHubUser
  accessToken?: string
  backendUser?: UserProfile // Backend user profile
  error?: string
}

/**
 * GitHub OAuth Client Service
 */
export class GitHubAuthClientService {
  private config: GitHubAuthConfig

  constructor(config: GitHubAuthConfig) {
    this.config = config
  }

  /**
   * Initiate GitHub OAuth flow
   */
  async signInWithPopup(): Promise<GitHubAuthResult> {
    try {
      console.log('🔧 Initiating GitHub OAuth with:', {
        clientId: this.config.clientId.substring(0, 20) + '...',
        redirectUri: this.config.redirectUri,
        scopes: this.config.scopes
      })

      const authUrl = this.buildAuthUrl()
      
      // Open popup window for OAuth
      const popup = window.open(
        authUrl,
        'github-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        return {
          success: false,
          error: 'Popup blocked. Please allow popups for this site.'
        }
      }

      // Wait for OAuth callback
      const result = await this.waitForCallback(popup)
      return result

    } catch (error) {
      console.error('GitHub OAuth error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GitHub authentication failed'
      }
    }
  }

  /**
   * Build GitHub OAuth authorization URL
   */
  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: (this.config.scopes || ['user:email']).join(' '),
      state: this.generateState(),
      allow_signup: 'true'
    })

    return `https://github.com/login/oauth/authorize?${params.toString()}`
  }

  /**
   * Generate random state parameter for security
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }

  /**
   * Wait for OAuth callback in popup
   */
  private waitForCallback(popup: Window): Promise<GitHubAuthResult> {
    return new Promise((resolve) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          resolve({
            success: false,
            error: 'Authentication cancelled'
          })
        }
      }, 1000)

      // Listen for message from popup
      const messageHandler = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === 'GITHUB_AUTH_SUCCESS') {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageHandler)
          popup.close()

          try {
            // Exchange code for access token and get user info
            const result = await this.handleCallback(event.data.code)
            resolve(result)
          } catch (error) {
            resolve({
              success: false,
              error: error instanceof Error ? error.message : 'Failed to complete authentication'
            })
          }
        } else if (event.data.type === 'GITHUB_AUTH_ERROR') {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageHandler)
          popup.close()
          resolve({
            success: false,
            error: event.data.error || 'Authentication failed'
          })
        }
      }

      window.addEventListener('message', messageHandler)
    })
  }

  /**
   * Handle OAuth callback and exchange code for token
   */
  private async handleCallback(code: string): Promise<GitHubAuthResult> {
    try {
      console.log('🔄 Processing GitHub authorization code:', code.substring(0, 8) + '...')
      
      // Use Vite API route for token exchange
      const apiUrl = '/api/github-auth'
      
      console.log('🔄 Exchanging code for access token via Vite API...')
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Proxy server error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Token exchange failed')
      }

      console.log('✅ Successfully fetched real GitHub user data:', {
        login: data.user.login,
        name: data.user.name,
        email: data.user.email || 'Not provided'
      })

      // Now create/login user with backend
      try {
        const oauthData: OAuthCallbackData = {
          email: data.user.email || `${data.user.login}@github.local`, // Use login as fallback email
          name: data.user.name || data.user.login,
          provider: 'github',
          provider_id: data.user.id.toString(),
          profile_picture: data.user.avatar_url,
          bio: data.user.bio || undefined
        }

        const backendUser = await userService.handleOAuthCallback(oauthData)

        return {
          success: true,
          user: data.user,
          accessToken: data.accessToken,
          backendUser: backendUser || undefined
        }

      } catch (backendError) {
        console.warn('Backend user creation failed, continuing with frontend-only auth:', backendError)
        
        // Continue with frontend-only authentication if backend fails
        return {
          success: true,
          user: data.user,
          accessToken: data.accessToken,
          error: `Backend integration failed: ${backendError instanceof Error ? backendError.message : 'Unknown error'}`
        }
      }

    } catch (error) {
      console.error('GitHub OAuth error:', error)
      
      // If API endpoint is not available, provide helpful error message
      if (error instanceof Error && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'GitHub API endpoint not available. Please restart your Vite dev server.'
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process GitHub authentication'
      }
    }
  }

  /**
   * Sign out (clear stored data)
   */
  async signOut(): Promise<void> {
    try {
      localStorage.removeItem('github_user')
      localStorage.removeItem('github_access_token')
      console.log('✅ GitHub sign out successful')
    } catch (error) {
      console.error('Error signing out from GitHub:', error)
    }
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    const user = localStorage.getItem('github_user')
    const token = localStorage.getItem('github_access_token')
    return !!(user && token)
  }

  /**
   * Get stored user profile
   */
  getStoredUser(): GitHubUser | null {
    try {
      const userStr = localStorage.getItem('github_user')
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  }

  /**
   * Store user data
   */
  storeUserData(user: GitHubUser, accessToken: string): void {
    localStorage.setItem('github_user', JSON.stringify(user))
    localStorage.setItem('github_access_token', accessToken)
  }

  /**
   * Clear stored user data
   */
  clearStoredData(): void {
    localStorage.removeItem('github_user')
    localStorage.removeItem('github_access_token')
  }
}

/**
 * Environment configuration helper
 */
export const getGitHubClientConfig = (): GitHubAuthConfig => {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI || `${window.location.origin}/auth/github/callback`

  if (!clientId) {
    throw new Error('VITE_GITHUB_CLIENT_ID environment variable is required')
  }

  return { 
    clientId,
    redirectUri,
    scopes: ['user:email', 'read:user']
  }
}

/**
 * Create a configured GitHub Auth Client Service instance
 */
export const createGitHubAuthClientService = (): GitHubAuthClientService => {
  try {
    const config = getGitHubClientConfig()
    return new GitHubAuthClientService(config)
  } catch (error) {
    console.warn('GitHub Auth not configured:', error)
    // Try to get the client ID directly from environment
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    if (clientId) {
      console.log('Using GitHub Client ID from environment:', clientId.substring(0, 20) + '...')
      return new GitHubAuthClientService({ 
        clientId,
        redirectUri: `${window.location.origin}/auth/github/callback`,
        scopes: ['user:email', 'read:user']
      })
    }
    throw new Error('VITE_GITHUB_CLIENT_ID is required but not found in environment variables')
  }
}

/**
 * Utility functions
 */
export const GitHubAuthUtils = {
  /**
   * Format user display name
   */
  formatDisplayName(user: GitHubUser): string {
    return user.name || user.login
  },

  /**
   * Get user initials for avatar
   */
  getUserInitials(user: GitHubUser): string {
    const name = this.formatDisplayName(user)
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  },

  /**
   * Get user profile URL
   */
  getProfileUrl(user: GitHubUser): string {
    return user.html_url
  },

  /**
   * Format user bio
   */
  formatBio(user: GitHubUser): string {
    return user.bio || 'No bio available'
  }
}
