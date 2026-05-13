import { useNavigate } from "react-router-dom"

export default function Sidebar() {
  const navigate = useNavigate()

  const itemStyle = {
    marginBottom: "12px",
    cursor: "pointer",
    fontSize: "18px",
  }

  return (
    <div
      style={{
        width: "250px",
        height: "100vh",
        background: "#0b1f3a",
        color: "white",
        padding: "20px",
      }}
    >
      <h2>MRivas</h2>

      <ul style={{ listStyle: "none", padding: 0 }}>
        <li style={itemStyle} onClick={() => navigate("/superadmin")}>
          🏠 Inicio
        </li>

        <li style={itemStyle} onClick={() => navigate("/superadmin/nuevo-servicio")}>
          ➕ Nuevo Servicio
        </li>

        <li style={itemStyle} onClick={() => navigate("/superadmin/aprobaciones")}>
          ✅ Aprobación Solicitudes
        </li>

        <li style={itemStyle}>👤 Conductores</li>
        <li style={itemStyle}>🚗 Vehículos</li>
        <li style={itemStyle}>💰 Finanzas</li>
        <li style={itemStyle}>⚠️ Incidencias</li>
        <li style={itemStyle}>📊 Reportes</li>
        <li style={itemStyle}>⚙️ Configuración</li>
      </ul>
    </div>
  )
}