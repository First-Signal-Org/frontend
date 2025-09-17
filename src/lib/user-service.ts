/**
 * User Service Client
 * Handles API calls to the backend user service
 */

export interface UserProfile {
  id: string
  email: string
  name: string
  profile_picture?: string
  bio?: string
  phone_number?: string
  provider?: string
  provider_id?: string
  created_at?: string
  updated_at?: string
}

export interface OAuthCallbackData {
  email: string
  name: string
  provider: string
  provider_id: string
  profile_picture?: string
  bio?: string
}

export interface UserSearchResult {
  users: UserProfile[]
}

export interface ApiResponse<T> {
  success?: boolean
  message?: string
  user?: T
  users?: T[]
  error?: string
}

/**
 * User Service Client Class
 */
export class UserServiceClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:10000'
  }

  /**
   * Handle OAuth callback - create or login user
   */
  async handleOAuthCallback(data: OAuthCallbackData): Promise<UserProfile | null> {
    try {
      console.log('🔄 Sending OAuth callback to backend:', {
        email: data.email,
        name: data.name,
        provider: data.provider
      })

      const response = await fetch(`${this.baseUrl}/api/auth/oauth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result: ApiResponse<UserProfile> = await response.json()

      if (!result.user) {
        throw new Error(result.error || 'No user data received')
      }

      console.log('✅ OAuth callback successful:', {
        userId: result.user.id,
        email: result.user.email
      })

      return result.user

    } catch (error) {
      console.error('OAuth callback error:', error)
      throw error
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/by-email?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.status === 404) {
        return null // User not found
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result: ApiResponse<UserProfile> = await response.json()
      return result.user || null

    } catch (error) {
      console.error('Get user by email error:', error)
      throw error
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.status === 404) {
        return null // User not found
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result: ApiResponse<UserProfile> = await response.json()
      return result.user || null

    } catch (error) {
      console.error('Get user profile error:', error)
      throw error
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      console.log('🔄 Updating user profile:', {
        userId,
        updates: Object.keys(updates)
      })

      const response = await fetch(`${this.baseUrl}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result: ApiResponse<any> = await response.json()
      
      console.log('✅ Profile update successful')
      return true

    } catch (error) {
      console.error('Update user profile error:', error)
      throw error
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserProfile[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/users/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result: UserSearchResult = await response.json()
      return result.users || []

    } catch (error) {
      console.error('Search users error:', error)
      throw error
    }
  }
}

/**
 * Create a singleton instance of the user service
 */
export const userService = new UserServiceClient()

/**
 * Utility functions for user data
 */
export const UserUtils = {
  /**
   * Format display name
   */
  formatDisplayName(user: UserProfile): string {
    return user.name || user.email
  },

  /**
   * Get user initials for avatar
   */
  getUserInitials(user: UserProfile): string {
    const name = this.formatDisplayName(user)
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  },

  /**
   * Check if user has complete profile
   */
  hasCompleteProfile(user: UserProfile): boolean {
    return !!(user.name && user.email && user.profile_picture)
  },

  /**
   * Get provider display name
   */
  getProviderDisplayName(provider?: string): string {
    switch (provider) {
      case 'google':
        return 'Google'
      case 'github':
        return 'GitHub'
      default:
        return 'Unknown'
    }
  }
}
