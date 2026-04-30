import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../App.css"

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = () => {
    if (!email || !password) {
      alert("Completa todos los campos")
      return
    }

    // Simulación de roles (luego será backend real)
    if (email === "admin") {
      navigate("/admin")
    } else if (email === "driver") {
      navigate("/driver")
    } else {
      navigate("/client")
    }
  }

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>M. RIVAS</h1>
      <h3>TRANSPORTE EMPRESARIAL</h3>

      <h2>Bienvenido de vuelta 👋</h2>
      <p>Inicia sesión para continuar</p>

      <div style={{ marginTop: "20px" }}>
        <input
          type="text"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div style={{ marginTop: "10px" }}>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div style={{ marginTop: "20px" }}>
        <button onClick={handleLogin}>
          Iniciar sesión
        </button>
      </div>

      <p style={{ marginTop: "15px" }}>
        ¿No tienes cuenta? <strong>Regístrate</strong>
      </p>
    </div>
  )
}