import React from "react";

const SuperAdminHome: React.FC = () => {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Panel Superadministrador</h1>
      <p style={styles.subtitle}>
        Bienvenido al sistema de gestión M.Rivas
      </p>

      <div style={styles.grid}>
        <Card title="Viajes" desc="Gestionar rutas y estados" />
        <Card title="Conductores" desc="Administrar personal" />
        <Card title="Vehículos" desc="Control de unidades" />
        <Card title="Clientes" desc="Gestión comercial" />
        <Card title="Usuarios" desc="Roles del sistema" />
        <Card title="Reportes" desc="Indicadores y métricas" />
      </div>
    </div>
  );
};

type CardProps = {
  title: string;
  desc: string;
};

const Card: React.FC<CardProps> = ({ title, desc }) => {
  return (
    <div style={styles.card}>
      <h2>{title}</h2>
      <p>{desc}</p>
      <button style={styles.button}>Ver</button>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f4f6f8",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
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
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#111827",
    color: "#fff",
    cursor: "pointer",
  },
};

export default SuperAdminHome;