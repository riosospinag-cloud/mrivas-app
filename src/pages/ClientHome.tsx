import { Link } from "react-router-dom"
import Sidebar from "../components/Sidebar"

export default function ClientHome() {
  return (
    <div style={styles.layout}>
      <Sidebar />

      <main style={styles.content}>
        <h1 style={styles.title}>Panel Cliente</h1>

        <p style={styles.subtitle}>
          Gestiona tus solicitudes de servicio y consulta su estado.
        </p>

        <div style={styles.grid}>
          <Link to="/client/nuevo-servicio" style={styles.card}>
            <h2>➕ Nueva Solicitud</h2>
            <p>Registra una nueva solicitud de viaje o servicio.</p>
          </Link>

          <Link to="/client/solicitudes" style={styles.card}>
            <h2>📋 Mis Solicitudes</h2>
            <p>Consulta el estado y detalle de tus solicitudes.</p>
          </Link>
        </div>
      </main>
    </div>
  )
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#f4f6f8",
  },
  content: {
    flex: 1,
    padding: "34px",
  },
  title: {
    fontSize: "34px",
    marginBottom: "8px",
    color: "#020617",
  },
  subtitle: {
    color: "#64748b",
    marginBottom: "24px",
    fontSize: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "28px",
    border: "1px solid #e5e7eb",
    textDecoration: "none",
    color: "#0b1f3a",
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
  },
}