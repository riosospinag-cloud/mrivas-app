import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Sidebar() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const goTo = (path: string) => {
    navigate(path)
    setOpen(false)
  }

  return (
    <>
      <button style={styles.mobileButton} onClick={() => setOpen(true)}>
        ☰
      </button>

      {open && <div style={styles.overlay} onClick={() => setOpen(false)} />}

      <aside
        style={{
          ...styles.sidebar,
          transform: open ? "translateX(0)" : undefined,
        }}
      >
        <h2 style={styles.logo}>MRivas</h2>

        <ul style={styles.menu}>
          <li style={styles.item} onClick={() => goTo("/superadmin")}>
            🏠 Inicio
          </li>

          <li
            style={styles.item}
            onClick={() => goTo("/superadmin/nuevo-servicio")}
          >
            ➕ Nuevo Servicio
          </li>

          <li
            style={styles.item}
            onClick={() => goTo("/superadmin/aprobaciones")}
          >
            ✅ Aprobación Solicitudes
          </li>

          <li style={styles.item}>👤 Conductores</li>
          <li style={styles.item}>🚗 Vehículos</li>
          <li style={styles.item}>💰 Finanzas</li>
          <li style={styles.item}>⚠️ Incidencias</li>
          <li style={styles.item}>📊 Reportes</li>
          <li style={styles.item}>⚙️ Configuración</li>
        </ul>
      </aside>
    </>
  )
}

const isMobile = window.innerWidth <= 768

const styles: any = {
  mobileButton: {
    display: isMobile ? "block" : "none",
    position: "fixed",
    top: "14px",
    left: "14px",
    zIndex: 1001,
    background: "#0b1f3a",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "22px",
    cursor: "pointer",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 999,
  },

  sidebar: {
    width: "250px",
    minWidth: "250px",
    height: "100vh",
    background: "#0b1f3a",
    color: "white",
    padding: "22px",
    boxSizing: "border-box",
    position: isMobile ? "fixed" : "sticky",
    top: 0,
    left: 0,
    zIndex: 1000,
    transform: isMobile ? "translateX(-110%)" : "none",
    transition: "transform 0.25s ease",
  },

  logo: {
    marginTop: 0,
    marginBottom: "30px",
    fontSize: "28px",
  },

  menu: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },

  item: {
    marginBottom: "18px",
    cursor: "pointer",
    fontSize: "17px",
    lineHeight: 1.25,
  },
}