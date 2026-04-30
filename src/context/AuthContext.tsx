import { createContext, useContext, useState } from "react"
import type { ReactNode } from "react"

type User = {
  email: string
  role: "admin" | "driver" | "client"
} | null

type AuthContextType = {
  user: User
  login: (email: string, password: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<User>(() => {
    const storedUser = localStorage.getItem("user")
    return storedUser ? JSON.parse(storedUser) : null
  })

  const login = (email: string, _password: string) => {
    if (email === "admin") {
      const userData = { email, role: "admin" as const }
      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
    } else if (email === "driver") {
      const userData = { email, role: "driver" as const }
      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
    } else {
      const userData = { email, role: "client" as const }
      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}