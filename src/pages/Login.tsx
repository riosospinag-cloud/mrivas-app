import { loginWithGoogle, getGoogleRedirectUser } from "../services/auth"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const { login } = useAuth()
  const navigate = useNavigate()

  const goByRole = (role: string) => {
    if (role === "superadmin") {
      navigate("/superadmin")
    } else if (role === "admin") {
      navigate("/admin")
    } else if (role === "driver") {
      navigate("/driver")
    } else {
      navigate("/client")
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      const googleUser = await getGoogleRedirectUser()

      if (googleUser?.email) {
        const loggedUser = login(googleUser.email)

        if (loggedUser) {
          localStorage.setItem("user", JSON.stringify(loggedUser))
          goByRole(loggedUser.role)
        }
      }
    }

    checkUser()
  }, [])

  const handleLogin = () => {
    if (!email || !password) {
      alert("Completa todos los campos")
      return
    }

    // SUPERADMIN
    if (email === "superadmin" && password === "123") {
      const loggedUser = login("kevin.r.h250298@gmail.com")

      if (loggedUser) {
        localStorage.setItem("user", JSON.stringify(loggedUser))
        goByRole(loggedUser.role)
      }

    // ADMIN
    } else if (email === "admin" && password === "123") {
      const loggedUser = login("riosospinag@gmail.com")

      if (loggedUser) {
        localStorage.setItem("user", JSON.stringify(loggedUser))
        goByRole(loggedUser.role)
      }

    // CONDUCTOR PRUEBA
    } else if (
      email === "riosospinag@gmail.com" &&
      password === "12345678"
    ) {
      const loggedUser = {
        email: "riosospinag@gmail.com",
        role: "driver",
      }

      localStorage.setItem("user", JSON.stringify(loggedUser))
      goByRole(loggedUser.role)

    } else {
      alert("Credenciales incorrectas")
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
    } catch (error: any) {
      console.error("ERROR GOOGLE COMPLETO:", error)
      alert(`Error Google: ${error.code || error.message}`)
    }
  }

  return (
    <div className="login-container">
      <img src="/logo.png" alt="M. Rivas" className="login-logo" />

      <h2 className="login-title">Bienvenido de vuelta 👋</h2>
      <p className="login-subtitle">
        Inicia sesión para continuar
      </p>

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

      <button onClick={handleLogin}>
        Iniciar sesión
      </button>

      <button
        type="button"
        onClick={handleGoogleLogin}
      >
        Iniciar con Google
      </button>

      <p className="login-register">
        ¿No tienes cuenta? <strong>Regístrate</strong>
      </p>
    </div>
  )
}