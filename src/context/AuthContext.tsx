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
  const [user, setUser] = useState<User>(null)

  const login = (email: string, _password: string) => {
    if (email === "admin") {
      setUser({ email, role: "admin" })
    } else if (email === "driver") {
      setUser({ email, role: "driver" })
    } else {
      setUser({ email, role: "client" })
    }
  }

  const logout = () => {
    setUser(null)
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