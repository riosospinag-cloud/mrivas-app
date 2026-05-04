export default function Sidebar() {
  return (
    <div style={{
      width: "250px",
      height: "100vh",
      background: "#0b1f3a",
      color: "white",
      padding: "20px"
    }}>
      
      <h2>MRivas</h2>

      <ul style={{ listStyle: "none", padding: 0 }}>
        <li>🏠 Inicio</li>
        <li>➕ Nuevo Servicio</li>
        <li>👤 Conductores</li>
        <li>🚗 Vehículos</li>
        <li>💰 Finanzas</li>
        <li>⚠️ Incidencias</li>
        <li>📊 Reportes</li>
        <li>⚙️ Configuración</li>
      </ul>

    </div>
  )
}