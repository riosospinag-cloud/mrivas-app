import { createContext, useContext, useState } from "react"
import type { ReactNode } from "react"

type Role = "superadmin" | "admin" | "driver" | "client"

type User = {
  email: string
  role: Role
} | null

type AuthContextType = {
  user: User
  login: (email: string) => User
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const getRoleByEmail = (email: string): Role => {
  if (email === "kevin.r.h250298@gmail.com") return "superadmin"
  if (email === "riosospinag@gmail.com") return "admin"

  return "client"
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    const storedUser = localStorage.getItem("user")
    return storedUser ? JSON.parse(storedUser) : null
  })

  const login = (email: string) => {
    const role = getRoleByEmail(email)

    const userData = { email, role }

    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))

    return userData
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