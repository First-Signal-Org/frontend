/**
 * Browser-only Google Authentication Service
 * Uses Google Identity Services (no server-side dependencies)
 * Optimized for React frontend applications
 */

export interface GoogleAuthConfig {
  clientId: string
}

export interface GoogleCredentialResponse {
  credential: string // JWT ID token
  select_by?: string
}

export interface GoogleUserProfile {
  iss: string
  aud: string
  sub: string // Google user ID
  email: string
  email_verified: boolean
  name: string
  picture: string
  given_name: string
  family_name: string
  iat: number
  exp: number
}

export interface GoogleAuthResult {
  success: boolean
  profile?: GoogleUserProfile
  credential?: string
  error?: string
}

/**
 * Client-side Google Auth Service using Google Identity Services
 */
export class GoogleAuthClientService {
  private config: GoogleAuthConfig
  private isInitialized = false

  constructor(config: GoogleAuthConfig) {
    this.config = config
  }

  /**
   * Initialize Google Identity Services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    // Load Google Identity Services script
    await this.loadGoogleScript()
    
    // Initialize Google Identity Services
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: this.config.clientId,
        callback: () => {}, // Will be overridden by specific methods
        auto_select: false,
        cancel_on_tap_outside: true
      })
      
      this.isInitialized = true
    } else {
      throw new Error('Failed to load Google Identity Services')
    }
  }

  /**
   * Load Google Identity Services script
   */
  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (window.google?.accounts?.id) {
        resolve()
        return
      }

      // Check if script element already exists
      const existingScript = document.querySelector('script[src*="accounts.google.com"]')
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve())
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google script')))
        return
      }

      // Create and load script
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Google script'))
      
      document.head.appendChild(script)
    })
  }

  /**
   * Decode JWT ID token
   */
  private decodeJWT(token: string): GoogleUserProfile {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('Error decoding JWT:', error)
      throw new Error('Invalid JWT token')
    }
  }

  /**
   * Sign in with Google using popup
   */
  async signInWithPopup(): Promise<GoogleAuthResult> {
    try {
      await this.initialize()

      return new Promise((resolve) => {
        window.google.accounts.id.initialize({
          client_id: this.config.clientId,
          callback: (response: GoogleCredentialResponse) => {
            try {
              const profile = this.decodeJWT(response.credential)
              resolve({
                success: true,
                profile,
                credential: response.credential
              })
            } catch (error) {
              resolve({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to decode token'
              })
            }
          }
        })

        // Trigger the sign-in prompt
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to renderButton if prompt is not displayed
            this.renderSignInButton('google-signin-button-temp')
          }
        })
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }

  /**
   * Render Google Sign-In button
   */
  renderSignInButton(
    elementId: string,
    options?: {
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill' | 'circle' | 'square'
      logo_alignment?: 'left' | 'center'
      width?: number
    }
  ): Promise<GoogleAuthResult> {
    return new Promise(async (resolve) => {
      try {
        await this.initialize()

        const element = document.getElementById(elementId)
        if (!element) {
          resolve({
            success: false,
            error: `Element with id '${elementId}' not found`
          })
          return
        }

        window.google.accounts.id.initialize({
          client_id: this.config.clientId,
          callback: (response: GoogleCredentialResponse) => {
            try {
              const profile = this.decodeJWT(response.credential)
              resolve({
                success: true,
                profile,
                credential: response.credential
              })
            } catch (error) {
              resolve({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to decode token'
              })
            }
          }
        })

        window.google.accounts.id.renderButton(element, {
          theme: options?.theme || 'outline',
          size: options?.size || 'large',
          text: options?.text || 'signin_with',
          shape: options?.shape || 'rectangular',
          logo_alignment: options?.logo_alignment || 'left',
          width: options?.width
        })
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to render button'
        })
      }
    })
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await this.initialize()
      
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect()
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  /**
   * Check if user is signed in (from stored credential)
   */
  isSignedIn(): boolean {
    // Check if we have a stored credential
    const credential = localStorage.getItem('google_credential')
    if (!credential) return false

    try {
      const profile = this.decodeJWT(credential)
      // Check if token is not expired
      return profile.exp * 1000 > Date.now()
    } catch {
      return false
    }
  }

  /**
   * Get stored user profile
   */
  getStoredProfile(): GoogleUserProfile | null {
    const credential = localStorage.getItem('google_credential')
    if (!credential) return null

    try {
      return this.decodeJWT(credential)
    } catch {
      return null
    }
  }

  /**
   * Store credential in localStorage
   */
  storeCredential(credential: string): void {
    localStorage.setItem('google_credential', credential)
  }

  /**
   * Clear stored credential
   */
  clearStoredCredential(): void {
    localStorage.removeItem('google_credential')
  }
}

/**
 * Environment configuration helper
 */
export const getGoogleClientConfig = (): GoogleAuthConfig => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID environment variable is required')
  }

  return { clientId }
}

/**
 * Create a configured Google Auth Client Service instance
 */
export const createGoogleAuthClientService = (): GoogleAuthClientService => {
  try {
    const config = getGoogleClientConfig()
    return new GoogleAuthClientService(config)
  } catch (error) {
    console.warn('Google Auth not configured:', error)
    // Return a mock service for development
    return new GoogleAuthClientService({ clientId: 'mock-client-id' })
  }
}

/**
 * Utility functions
 */
export const GoogleAuthClientUtils = {
  /**
   * Format user display name
   */
  formatDisplayName(profile: GoogleUserProfile): string {
    return profile.name || `${profile.given_name} ${profile.family_name}`.trim()
  },

  /**
   * Get user initials for avatar
   */
  getUserInitials(profile: GoogleUserProfile): string {
    const name = this.formatDisplayName(profile)
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  },

  /**
   * Check if email is verified
   */
  isEmailVerified(profile: GoogleUserProfile): boolean {
    return profile.email_verified === true
  },

  /**
   * Get time until token expires
   */
  getTimeUntilExpiry(profile: GoogleUserProfile): number {
    return profile.exp * 1000 - Date.now()
  },

  /**
   * Check if token will expire soon (within 5 minutes)
   */
  willExpireSoon(profile: GoogleUserProfile): boolean {
    return this.getTimeUntilExpiry(profile) < 5 * 60 * 1000
  }
}

// Global type declarations
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: (callback?: (notification: any) => void) => void
          renderButton: (element: HTMLElement, options: any) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}
