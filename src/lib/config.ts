/**
 * Application Configuration
 * Centralized configuration management for environment variables
 */

export interface AppConfig {
  google: {
    clientId: string
    clientSecret?: string
  }
  app: {
    name: string
    version: string
    environment: 'development' | 'production' | 'test'
  }
}

/**
 * Get Google Auth configuration from environment variables
 */
export const getGoogleConfig = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET

  if (!clientId) {
    console.warn('Missing VITE_GOOGLE_CLIENT_ID environment variable')
    return {
      clientId: '',
      clientSecret: ''
    }
  }

  return {
    clientId,
    clientSecret
  }
}

/**
 * Get application configuration
 */
export const getAppConfig = (): AppConfig => {
  return {
    google: getGoogleConfig(),
    app: {
      name: 'First Signal',
      version: '1.0.0',
      environment: import.meta.env.MODE as 'development' | 'production' | 'test'
    }
  }
}

/**
 * Environment variable validation
 */
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  // Check required environment variables
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    errors.push('VITE_GOOGLE_CLIENT_ID is required')
  }

  // Validate Google Client ID format
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (clientId && !clientId.includes('.apps.googleusercontent.com')) {
    errors.push('VITE_GOOGLE_CLIENT_ID should end with .apps.googleusercontent.com')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Development helpers
 */
export const isDevelopment = () => import.meta.env.MODE === 'development'
export const isProduction = () => import.meta.env.MODE === 'production'

/**
 * Environment setup instructions
 */
export const getSetupInstructions = () => {
  return {
    title: 'Google OAuth Setup Required',
    steps: [
      '1. Go to Google Cloud Console: https://console.cloud.google.com/',
      '2. Create a new project or select an existing one',
      '3. Enable the Google+ API',
      '4. Go to "Credentials" and create OAuth 2.0 Client IDs',
      '5. Add your domain to authorized origins',
      '6. Copy the Client ID and add it to your .env file:',
      '   VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com',
      '7. (Optional) Add Client Secret for server-side validation:',
      '   VITE_GOOGLE_CLIENT_SECRET=your_client_secret'
    ],
    redirectUris: [
      `${window.location.origin}`,
      `${window.location.origin}/auth/google/callback`
    ]
  }
}
