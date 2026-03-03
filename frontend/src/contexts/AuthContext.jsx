import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('gradflow_token')
    if (token) {
      authAPI.getMe()
        .then(res => { if (res.data.success) setUser(res.data.user) })
        .catch(() => localStorage.removeItem('gradflow_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await authAPI.login(email, password)
    if (res.data.success) {
      localStorage.setItem('gradflow_token', res.data.token)
      setUser(res.data.user)
    }
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('gradflow_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
