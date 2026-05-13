import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { collection, getDocs, updateDoc, doc } from "firebase/firestore"
import { db } from "../firebase"

const isMobile = window.innerWidth <= 768

export default function Aprobaciones() {
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any | null>(null)
  const [busqueda, setBusqueda] = useState("")

  const [filtroEstados, setFiltroEstados] = useState<string[]>([])
  const [filtroClientes, setFiltroClientes] = useState<string[]>([])
  const [filtroConductores, setFiltroConductores] = useState<string[]>([])
  const [filtroMeses, setFiltroMeses] = useState<string[]>([])
  const [filtroAnios, setFiltroAnios] = useState<string[]>([])

  useEffect(() => {
    obtenerSolicitudes()
  }, [])

  async function obtenerSolicitudes() {
    const querySnapshot = await getDocs(collection(db, "solicitudes_servicio"))

    const lista: any[] = []

    querySnapshot.forEach((documento) => {
      lista.push({
        id: documento.id,
        ...documento.data(),
      })
    })

    setSolicitudes(lista)
  }

  async function cambiarEstado(id: string, estado: string) {
    const solicitudRef = doc(db, "solicitudes_servicio", id)

    await updateDoc(solicitudRef, { estado })

    obtenerSolicitudes()
  }

  function obtenerFechaCreacion(solicitud: any) {
    if (solicitud.creadoEn?.toDate) return solicitud.creadoEn.toDate()
    return null
  }

  function obtenerMes(solicitud: any) {
    const fecha = obtenerFechaCreacion(solicitud)

    if (!fecha) return "Sin mes"

    return fecha.toLocaleDateString("es-PE", {
      month: "long",
    })
  }

  function obtenerAnio(solicitud: any) {
    const fecha = obtenerFechaCreacion(solicitud)

    if (!fecha) return "Sin año"

    return String(fecha.getFullYear())
  }

  const estadosDisponibles = ["pendiente", "aprobado", "rechazado"]

  const clientesDisponibles = Array.from(
    new Set(solicitudes.map((s) => s.cliente).filter(Boolean))
  )

  const conductoresDisponibles = Array.from(
    new Set(solicitudes.map((s) => s.conductor).filter(Boolean))
  )

  const mesesDisponibles = Array.from(
    new Set(solicitudes.map((s) => obtenerMes(s)))
  )

  const aniosDisponibles = Array.from(
    new Set(solicitudes.map((s) => obtenerAnio(s)))
  )

  function toggleFiltro(
    valor: string,
    lista: string[],
    setLista: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    if (lista.includes(valor)) {
      setLista(lista.filter((item) => item !== valor))
    } else {
      setLista([...lista, valor])
    }
  }

  function limpiarFiltros() {
    setBusqueda("")
    setFiltroEstados([])
    setFiltroClientes([])
    setFiltroConductores([])
    setFiltroMeses([])
    setFiltroAnios([])
  }

  const solicitudesFiltradas = solicitudes.filter((solicitud) => {
    const estadoActual = solicitud.estado || "pendiente"
    const clienteActual = solicitud.cliente || ""
    const conductorActual = solicitud.conductor || ""
    const mesActual = obtenerMes(solicitud)
    const anioActual = obtenerAnio(solicitud)

    const textoBusqueda = busqueda.toLowerCase()

    const coincideBusqueda =
      (solicitud.codigoSolicitud || "")
        .toLowerCase()
        .includes(textoBusqueda) ||
      (solicitud.cliente || "")
        .toLowerCase()
        .includes(textoBusqueda) ||
      (solicitud.conductor || "")
        .toLowerCase()
        .includes(textoBusqueda) ||
      (solicitud.vehiculo || "")
        .toLowerCase()
        .includes(textoBusqueda)

    const coincideEstado =
      filtroEstados.length === 0 ||
      filtroEstados.includes(estadoActual)

    const coincideCliente =
      filtroClientes.length === 0 ||
      filtroClientes.includes(clienteActual)

    const coincideConductor =
      filtroConductores.length === 0 ||
      filtroConductores.includes(conductorActual)

    const coincideMes =
      filtroMeses.length === 0 ||
      filtroMeses.includes(mesActual)

    const coincideAnio =
      filtroAnios.length === 0 ||
      filtroAnios.includes(anioActual)

    return (
      coincideBusqueda &&
      coincideEstado &&
      coincideCliente &&
      coincideConductor &&
      coincideMes &&
      coincideAnio
    )
  })

  function descargarSolicitud(solicitud: any) {
    const contenido = `
M.RIVAS TRANSERVICE

Código: ${solicitud.codigoSolicitud || "-"}
Estado: ${solicitud.estado || "pendiente"}

Cliente: ${solicitud.cliente || "-"}
Conductor: ${solicitud.conductor || "-"}
Vehículo: ${solicitud.vehiculo || "-"}

Fecha recojo: ${solicitud.fechaRecojo || "-"}
Hora recojo: ${solicitud.horaRecojo || "-"}

Ruta:
${solicitud.ubicacionRecojo || "-"}
→
${solicitud.ubicacionDestino || "-"}
`

    const blob = new Blob([contenido], {
      type: "text/plain",
    })

    const url = window.URL.createObjectURL(blob)

    const a = document.createElement("a")

    a.href = url
    a.download = `${solicitud.codigoSolicitud || "solicitud"}.txt`
    a.click()

    window.URL.revokeObjectURL(url)
  }

  return (
    <div style={styles.layout}>
      <Sidebar />

      <main style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            Aprobación de Solicitudes
          </h1>

          <p style={styles.subtitle}>
            Revisa, aprueba o rechaza solicitudes.
          </p>
        </div>

        <div style={styles.summaryGrid}>
          <SummaryCard
            label="Total"
            value={solicitudes.length}
          />

          <SummaryCard
            label="Pendientes"
            value={
              solicitudes.filter(
                (s) =>
                  (s.estado || "pendiente") ===
                  "pendiente"
              ).length
            }
          />

          <SummaryCard
            label="Aprobadas"
            value={
              solicitudes.filter(
                (s) => s.estado === "aprobado"
              ).length
            }
          />

          <SummaryCard
            label="Rechazadas"
            value={
              solicitudes.filter(
                (s) => s.estado === "rechazado"
              ).length
            }
          />
        </div>

        <div style={styles.filterBar}>
          <input
            style={styles.searchInput}
            placeholder="Buscar solicitud..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
          />

          <MultiFilter
            label="Estado"
            options={estadosDisponibles}
            selected={filtroEstados}
            onToggle={(valor) =>
              toggleFiltro(
                valor,
                filtroEstados,
                setFiltroEstados
              )
            }
          />

          <MultiFilter
            label="Cliente"
            options={clientesDisponibles}
            selected={filtroClientes}
            onToggle={(valor) =>
              toggleFiltro(
                valor,
                filtroClientes,
                setFiltroClientes
              )
            }
          />

          <MultiFilter
            label="Conductor"
            options={conductoresDisponibles}
            selected={filtroConductores}
            onToggle={(valor) =>
              toggleFiltro(
                valor,
                filtroConductores,
                setFiltroConductores
              )
            }
          />

          <MultiFilter
            label="Mes"
            options={mesesDisponibles}
            selected={filtroMeses}
            onToggle={(valor) =>
              toggleFiltro(
                valor,
                filtroMeses,
                setFiltroMeses
              )
            }
          />

          <MultiFilter
            label="Año"
            options={aniosDisponibles}
            selected={filtroAnios}
            onToggle={(valor) =>
              toggleFiltro(
                valor,
                filtroAnios,
                setFiltroAnios
              )
            }
          />

          <button
            style={styles.clearButton}
            onClick={limpiarFiltros}
          >
            Limpiar
          </button>
        </div>

        <div style={styles.cardsGrid}>
          {solicitudesFiltradas.map((solicitud) => (
            <div
              key={solicitud.id}
              style={styles.card}
            >
              <div style={styles.cardTop}>
                <div>
                  <span style={styles.codeLabel}>
                    Código
                  </span>

                  <h3 style={styles.code}>
                    {solicitud.codigoSolicitud || "-"}
                  </h3>
                </div>

                <div style={styles.cardTopActions}>
                  <button
                    style={styles.iconButton}
                    onClick={() =>
                      setSolicitudSeleccionada(
                        solicitud
                      )
                    }
                  >
                    👁️
                  </button>

                  <button
                    style={styles.iconButton}
                    onClick={() =>
                      descargarSolicitud(
                        solicitud
                      )
                    }
                  >
                    📥
                  </button>

                  <span
                    style={{
                      ...styles.badge,

                      background:
                        solicitud.estado ===
                        "aprobado"
                          ? "#dcfce7"
                          : solicitud.estado ===
                            "rechazado"
                          ? "#fee2e2"
                          : "#fef3c7",

                      color:
                        solicitud.estado ===
                        "aprobado"
                          ? "#166534"
                          : solicitud.estado ===
                            "rechazado"
                          ? "#991b1b"
                          : "#92400e",
                    }}
                  >
                    {solicitud.estado ||
                      "pendiente"}
                  </span>
                </div>
              </div>

              <div style={styles.infoGrid}>
                <Info
                  label="Cliente"
                  value={solicitud.cliente}
                />

                <Info
                  label="Conductor"
                  value={
                    solicitud.conductor ||
                    "Sin asignar"
                  }
                />

                <Info
                  label="Fecha"
                  value={solicitud.fechaRecojo}
                />

                <Info
                  label="Hora"
                  value={solicitud.horaRecojo}
                />
              </div>

              <div style={styles.routeBox}>
                <span style={styles.routeLabel}>
                  Ruta
                </span>

                <strong>
                  {solicitud.ubicacionRecojo ||
                    "-"}{" "}
                  →{" "}
                  {solicitud.ubicacionDestino ||
                    "-"}
                </strong>
              </div>

              <div style={styles.actions}>
                {(solicitud.estado ||
                  "pendiente") ===
                  "pendiente" && (
                  <>
                    <button
                      style={styles.approveButton}
                      onClick={() =>
                        cambiarEstado(
                          solicitud.id,
                          "aprobado"
                        )
                      }
                    >
                      Aprobar
                    </button>

                    <button
                      style={styles.rejectButton}
                      onClick={() =>
                        cambiarEstado(
                          solicitud.id,
                          "rechazado"
                        )
                      }
                    >
                      Rechazar
                    </button>
                  </>
                )}

                {solicitud.estado ===
                  "aprobado" && (
                  <div
                    style={styles.statusApproved}
                  >
                    ✅ Aprobada
                  </div>
                )}

                {solicitud.estado ===
                  "rechazado" && (
                  <div
                    style={styles.statusRejected}
                  >
                    ❌ Rechazada
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {solicitudSeleccionada && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h2>Detalle Solicitud</h2>

                <button
                  style={styles.closeIcon}
                  onClick={() =>
                    setSolicitudSeleccionada(null)
                  }
                >
                  ✕
                </button>
              </div>

              <div style={styles.modalGrid}>
                <Info
                  label="Código"
                  value={
                    solicitudSeleccionada.codigoSolicitud
                  }
                />

                <Info
                  label="Cliente"
                  value={
                    solicitudSeleccionada.cliente
                  }
                />

                <Info
                  label="Conductor"
                  value={
                    solicitudSeleccionada.conductor
                  }
                />

                <Info
                  label="Vehículo"
                  value={
                    solicitudSeleccionada.vehiculo
                  }
                />

                <Info
                  label="Fecha"
                  value={
                    solicitudSeleccionada.fechaRecojo
                  }
                />

                <Info
                  label="Hora"
                  value={
                    solicitudSeleccionada.horaRecojo
                  }
                />

                <Info
                  label="Ruta"
                  value={`${solicitudSeleccionada.ubicacionRecojo} → ${solicitudSeleccionada.ubicacionDestino}`}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div style={styles.summaryCard}>
      <span style={styles.summaryLabel}>
        {label}
      </span>

      <strong style={styles.summaryValue}>
        {value}
      </strong>
    </div>
  )
}

function MultiFilter({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (valor: string) => void
}) {
  return (
    <details style={styles.multiFilter}>
      <summary style={styles.multiSummary}>
        {label}

        {selected.length > 0 && (
          <span style={styles.filterCount}>
            {selected.length}
          </span>
        )}
      </summary>

      <div style={styles.multiOptions}>
        {options.map((option) => (
          <label
            key={option}
            style={styles.checkboxOption}
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() =>
                onToggle(option)
              }
            />

            {option}
          </label>
        ))}
      </div>
    </details>
  )
}

function Info({
  label,
  value,
}: {
  label: string
  value?: string
}) {
  return (
    <div style={styles.infoItem}>
      <span style={styles.infoLabel}>
        {label}
      </span>

      <strong style={styles.infoValue}>
        {value || "-"}
      </strong>
    </div>
  )
}

const styles: any = {
  layout: {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    background: "#f3f4f6",
    minHeight: "100vh",
  },

  content: {
    flex: 1,
    padding: isMobile
      ? "72px 14px 24px"
      : "34px",

    width: "100%",
    boxSizing: "border-box",
  },

  header: {
    marginBottom: "18px",
  },

  title: {
    fontSize: isMobile
      ? "28px"
      : "46px",

    fontWeight: "bold",
    margin: 0,
    color: "#0f172a",
  },

  subtitle: {
    color: "#6b7280",
    marginTop: "8px",
    fontSize: isMobile
      ? "13px"
      : "15px",
  },

  summaryGrid: {
    display: "grid",

    gridTemplateColumns: isMobile
      ? "1fr 1fr"
      : "repeat(4, minmax(0, 1fr))",

    gap: "12px",
    marginBottom: "16px",
  },

  summaryCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: isMobile
      ? "14px"
      : "18px",

    boxShadow:
      "0 8px 22px rgba(15,23,42,0.05)",

    border: "1px solid #e5e7eb",
  },

  summaryLabel: {
    color: "#64748b",
    fontSize: "12px",
  },

  summaryValue: {
    display: "block",
    marginTop: "6px",

    fontSize: isMobile
      ? "22px"
      : "30px",

    fontWeight: "bold",
    color: "#0b1f3a",
  },

  filterBar: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "12px",

    display: "grid",

    gridTemplateColumns: isMobile
      ? "1fr"
      : "1.8fr repeat(5, 120px) 110px",

    gap: "10px",
    marginBottom: "16px",

    boxShadow:
      "0 8px 22px rgba(15,23,42,0.05)",

    border: "1px solid #e5e7eb",
  },

  searchInput: {
    width: "100%",
    background: "#f9fafb",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    padding: "11px 12px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },

  multiFilter: {
    position: "relative",
    width: "100%",
  },

  multiSummary: {
    listStyle: "none",
    background: "#f9fafb",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    padding: "11px 12px",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer",

    display: "flex",
    justifyContent: "space-between",
  },

  filterCount: {
    background: "#0b1f3a",
    color: "#fff",
    borderRadius: "999px",
    padding: "2px 7px",
    fontSize: "11px",
  },

  multiOptions: {
    position: "absolute",
    top: "48px",
    left: 0,

    width: isMobile
      ? "100%"
      : "220px",

    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "10px",

    boxShadow:
      "0 12px 32px rgba(0,0,0,0.15)",

    zIndex: 50,
  },

  checkboxOption: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    fontSize: "13px",
  },

  clearButton: {
    background: "#0b1f3a",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    height: "42px",
    fontWeight: "bold",
    width: "100%",
  },

  cardsGrid: {
    display: "grid",

    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(420px, 1fr))",

    gap: "16px",
  },

  card: {
    background: "#fff",
    borderRadius: "20px",

    padding: isMobile
      ? "15px"
      : "18px",

    boxShadow:
      "0 8px 24px rgba(15,23,42,0.06)",

    border: "1px solid #e5e7eb",

    width: "100%",
    boxSizing: "border-box",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "14px",
  },

  cardTopActions: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },

  codeLabel: {
    fontSize: "10px",
    color: "#6b7280",
    fontWeight: "bold",
  },

  code: {
    margin: "4px 0 0",
    color: "#0b1f3a",

    fontSize: isMobile
      ? "16px"
      : "18px",

    fontWeight: "bold",
  },

  iconButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
  },

  badge: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "bold",
  },

  infoGrid: {
    display: "grid",

    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(2, minmax(0, 1fr))",

    gap: "9px",
  },

  infoItem: {
    background: "#f8fafc",
    borderRadius: "11px",
    padding: "10px",
    border: "1px solid #e2e8f0",
  },

  infoLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "10px",
    marginBottom: "4px",
  },

  infoValue: {
    color: "#111827",
    fontSize: "12px",
    fontWeight: "bold",
    wordBreak: "break-word",
  },

  routeBox: {
    marginTop: "10px",
    background: "#eef2ff",
    borderRadius: "12px",
    padding: "11px",
    color: "#1e3a8a",
    fontSize: "12px",
  },

  routeLabel: {
    fontSize: "11px",
    fontWeight: "bold",
  },

  actions: {
    display: "flex",

    flexDirection: isMobile
      ? "column"
      : "row",

    gap: "10px",
    marginTop: "12px",
  },

  approveButton: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px",
    fontWeight: "bold",
    width: isMobile
      ? "100%"
      : undefined,
  },

  rejectButton: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px",
    fontWeight: "bold",
    width: isMobile
      ? "100%"
      : undefined,
  },

  statusApproved: {
    background: "#dcfce7",
    color: "#166534",
    padding: "10px",
    borderRadius: "10px",
    fontSize: "12px",
    textAlign: "center",
  },

  statusRejected: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "10px",
    borderRadius: "10px",
    fontSize: "12px",
    textAlign: "center",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(15,23,42,0.65)",

    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    padding: isMobile
      ? "10px"
      : "0",

    zIndex: 999,
  },

  modal: {
    background: "#fff",

    width: isMobile
      ? "100%"
      : "900px",

    padding: isMobile
      ? "18px"
      : "28px",

    borderRadius: "24px",

    maxHeight: "88vh",
    overflowY: "auto",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "22px",
  },

  closeIcon: {
    background: "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "10px 14px",
  },

  modalGrid: {
    display: "grid",

    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(2, minmax(0, 1fr))",

    gap: "14px",
  },
}