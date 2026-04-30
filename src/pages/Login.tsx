import { loginWithGoogle } from "../services/auth"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = () => {
    if (!email || !password) {
      alert("Completa todos los campos")
      return
    }

    if (email === "admin" && password === "123") {
      login(email, password)
      navigate("/admin")
    } else if (email === "driver" && password === "123") {
      login(email, password)
      navigate("/driver")
    } else if (email === "client" && password === "123") {
      login(email, password)
      navigate("/client")
    } else {
      alert("Credenciales incorrectas")
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle()

      console.log("Usuario Google:", user)

      localStorage.setItem("user", JSON.stringify(user))

      alert("Login con Google exitoso")

      navigate("/client")
    } catch (error) {
      console.error("ERROR GOOGLE:", error)
      alert("Error en login con Google. Abre F12 → Console")
    }
  }

  return (
    <div className="login-container">
      <img src="/logo.png" alt="M. Rivas" className="login-logo" />

      <h2 className="login-title">Bienvenido de vuelta 👋</h2>
      <p className="login-subtitle">Inicia sesión para continuar</p>

      <input
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Iniciar sesión</button>

      <button type="button" onClick={handleGoogleLogin}>
        Iniciar con Google
      </button>

      <p className="login-register">
        ¿No tienes cuenta? <strong>Regístrate</strong>
      </p>
    </div>
  )
}