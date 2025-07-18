'use client'

export interface User {
  id: string
  email: string
  name: string
  role: string
}

// Simple token-only authentication
export class SimpleAuth {
  private static TOKEN_KEY = 'dt-admin-token'
  private static USER_KEY = 'dt-admin-user'

  // Store user and token
  static setAuth(user: User, token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token)
      localStorage.setItem(this.USER_KEY, JSON.stringify(user))
    }
  }

  // Get current user from localStorage
  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const userStr = localStorage.getItem(this.USER_KEY)
      const token = localStorage.getItem(this.TOKEN_KEY)
      
      if (!userStr || !token) {
        return null
      }

      const user = JSON.parse(userStr)
      
      // Simple validation - check if token looks valid
      if (token.length < 10) {
        this.clearAuth()
        return null
      }

      return user
    } catch (error) {
      console.error('Auth error:', error)
      this.clearAuth()
      return null
    }
  }

  // Get token
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY)
    }
    return null
  }

  // Clear auth data
  static clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY)
      localStorage.removeItem(this.USER_KEY)
    }
  }

  // Simple login
  static async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/simple-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' }
      }

      // Store auth data
      this.setAuth(data.user, data.token)

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Network error occurred' }
    }
  }

  // Simple logout
  static logout(): void {
    this.clearAuth()
  }
}