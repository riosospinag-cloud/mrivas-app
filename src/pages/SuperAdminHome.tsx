import React from "react"
import Sidebar from "../components/Sidebar"

const SuperAdminHome: React.FC = () => {
  return (
    <div style={styles.layout}>
      <Sidebar />

      <main style={styles.content}>
        <h1 style={styles.title}>Panel Superadministrador</h1>
        <p style={styles.subtitle}>
          Bienvenido al sistema de gestión M.Rivas
        </p>

        <div style={styles.grid}>
          <Card title="Nuevo Servicio" desc="Crear un nuevo servicio de transporte" />
          <Card title="Conductores" desc="Administrar personal y documentación" />
          <Card title="Vehículos" desc="Control de unidades y asignaciones" />
          <Card title="Clientes" desc="Gestión comercial y empresas" />
          <Card title="Usuarios" desc="Roles y accesos del sistema" />
          <Card title="Reportes" desc="Indicadores y métricas operativas" />
        </div>
      </main>
    </div>
  )
}

type CardProps = {
  title: string
  desc: string
}

const Card: React.FC<CardProps> = ({ title, desc }) => {
  return (
    <div style={styles.card}>
      <h2>{title}</h2>
      <p>{desc}</p>
      <button style={styles.button}>Ver</button>
    </div>
  )
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f4f6f8",
  },
  content: {
    flex: 1,
    padding: "30px",
  },
  title: {
    fontSize: "32px",
    marginBottom: "5px",
  },
  subtitle: {
    color: "#6b7280",
    marginBottom: "30px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
  },
  button: {
    marginTop: "10px",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#111827",
    color: "#fff",
    cursor: "pointer",
  },
}

export default SuperAdminHome