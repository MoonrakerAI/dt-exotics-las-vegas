'use client'

export interface User {
  id: string
  email: string
  name: string
  role: string
}

// Client-side authentication utilities
export class ClientAuth {
  private static TOKEN_KEY = 'admin-session-token'

  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token)
    }
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY)
    }
    return null
  }

  static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY)
    }
  }

  static async login(email: string, password: string, callbackUrl?: string): Promise<{ success: boolean; user?: User; error?: string; redirectUrl?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          callbackUrl
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' }
      }

      // Store token in localStorage as backup
      if (data.token) {
        this.setToken(data.token)
      }

      return { success: true, user: data.user, redirectUrl: data.redirectUrl }
    } catch (error) {
      return { success: false, error: 'Network error occurred' }
    }
  }

  static async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.removeToken()
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    // Prevent execution during SSR/build
    if (typeof window === 'undefined') {
      return null
    }

    try {
      // Try cookie-based auth first with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      let response = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          return data.user
        }
      } else if (response.status === 401) {
        // Try token-based auth as fallback only if cookie auth fails with 401
        const token = this.getToken()
        if (token) {
          const controller2 = new AbortController()
          const timeoutId2 = setTimeout(() => controller2.abort(), 10000)
          
          response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            cache: 'no-store',
            signal: controller2.signal
          })

          clearTimeout(timeoutId2)

          if (response.ok) {
            const data = await response.json()
            if (data.user) {
              return data.user
            }
          } else if (response.status === 401) {
            // Both auth methods failed, clear invalid token
            this.removeToken()
          }
        }
      }

      return null
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Auth request timed out')
      } else {
        console.error('Auth check error:', error)
      }
      return null
    }
  }
}