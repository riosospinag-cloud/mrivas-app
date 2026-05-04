import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function ProtectedRoute({ children }: any) {
  const { user } = useAuth()
  const storedUser = localStorage.getItem("user")

  if (!user && !storedUser) {
    return <Navigate to="/" />
  }

  return children
}