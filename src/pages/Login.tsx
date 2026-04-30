import logoMrivas from "../assets/logo-mrivas.png"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = () => {
    login(email, password)

    if (email === "admin") {
      navigate("/admin")
    } else if (email === "driver") {
      navigate("/driver")
    } else {
      navigate("/client")
    }
  }

  return (
    <div className="login-container">
     <img src={logoMrivas} alt="M. Rivas" className="login-logo" />

      <input
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br /><br />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={handleLogin}>Iniciar sesión</button>
    </div>
  )
}