import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Sidebar() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900
      setIsMobile(mobile)

      if (!mobile) {
        setOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const goTo = (path: string) => {
    navigate(path)
    setOpen(false)
  }

  return (
    <>
      {isMobile && (
        <button style={styles.mobileMenuButton} onClick={() => setOpen(true)}>
          ☰
        </button>
      )}

      {isMobile && open && (
        <div style={styles.overlay} onClick={() => setOpen(false)} />
      )}

      <aside
        style={{
          ...styles.sidebar,
          position: isMobile ? "fixed" : "sticky",
          width: isMobile ? "82vw" : "260px",
          maxWidth: isMobile ? "330px" : "260px",
          minWidth: isMobile ? "0" : "260px",
          transform: isMobile
            ? open
              ? "translateX(0)"
              : "translateX(-110%)"
            : "translateX(0)",
        }}
      >
        {isMobile && (
          <button style={styles.closeButton} onClick={() => setOpen(false)}>
            ✕
          </button>
        )}

        <h2 style={styles.logo}>MRivas</h2>

        <ul style={styles.menu}>
          <li style={styles.item} onClick={() => goTo("/superadmin")}>
            🏠 Inicio
          </li>

          <li style={styles.item} onClick={() => goTo("/superadmin/nuevo-servicio")}>
            ➕ Nuevo Servicio
          </li>

          <li style={styles.item} onClick={() => goTo("/superadmin/aprobaciones")}>
            ✅ Aprobación Solicitudes
          </li>
          <li
            style={styles.item}
            onClick={() => goTo("/superadmin/clientes")}
          >
            🏢 Clientes
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

const styles: any = {
  mobileMenuButton: {
    position: "fixed",
    top: "16px",
    left: "16px",
    zIndex: 3000,
    background: "#0b1f3a",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    width: "46px",
    height: "46px",
    fontSize: "24px",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 2500,
  },

  sidebar: {
    top: 0,
    left: 0,
    height: "100vh",
    background: "#0b1f3a",
    color: "#ffffff",
    padding: "28px 24px",
    boxSizing: "border-box",
    zIndex: 2800,
    transition: "transform 0.25s ease",
    overflowY: "auto",
  },

  closeButton: {
    position: "absolute",
    top: "14px",
    right: "14px",
    background: "rgba(255,255,255,0.12)",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    width: "38px",
    height: "38px",
    fontSize: "18px",
    cursor: "pointer",
  },

  logo: {
    marginTop: "26px",
    marginBottom: "34px",
    fontSize: "30px",
    fontWeight: "bold",
  },

  menu: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },

  item: {
    marginBottom: "22px",
    cursor: "pointer",
    fontSize: "20px",
    lineHeight: 1.25,
    fontWeight: 500,
  },
}