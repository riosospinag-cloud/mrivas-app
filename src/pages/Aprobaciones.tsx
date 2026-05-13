import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import { collection, getDocs, updateDoc, doc } from "firebase/firestore"
import { db } from "../firebase"

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
    return fecha.toLocaleDateString("es-PE", { month: "long" })
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
      (solicitud.codigoSolicitud || "").toLowerCase().includes(textoBusqueda) ||
      (solicitud.cliente || "").toLowerCase().includes(textoBusqueda) ||
      (solicitud.conductor || "").toLowerCase().includes(textoBusqueda) ||
      (solicitud.vehiculo || "").toLowerCase().includes(textoBusqueda) ||
      (solicitud.contactoNombre || "").toLowerCase().includes(textoBusqueda) ||
      (solicitud.contactoTelefono || "").toLowerCase().includes(textoBusqueda)

    const coincideEstado =
      filtroEstados.length === 0 || filtroEstados.includes(estadoActual)

    const coincideCliente =
      filtroClientes.length === 0 || filtroClientes.includes(clienteActual)

    const coincideConductor =
      filtroConductores.length === 0 || filtroConductores.includes(conductorActual)

    const coincideMes =
      filtroMeses.length === 0 || filtroMeses.includes(mesActual)

    const coincideAnio =
      filtroAnios.length === 0 || filtroAnios.includes(anioActual)

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
SOLICITUD DE SERVICIO

Código: ${solicitud.codigoSolicitud || "-"}
Estado: ${solicitud.estado || "pendiente"}

Cliente: ${solicitud.cliente || "-"}
Contacto: ${solicitud.contactoNombre || "-"}
Teléfono: ${solicitud.contactoTelefono || "-"}

Conductor: ${solicitud.conductor || "-"}
Vehículo: ${solicitud.vehiculo || "-"}

Fecha recojo: ${solicitud.fechaRecojo || "-"}
Hora recojo: ${solicitud.horaRecojo || "-"}
Hora llegada: ${solicitud.horaLlegada || "-"}

Contenido: ${solicitud.contenido || "-"}

Ubicación recojo: ${solicitud.ubicacionRecojo || "-"}
Ubicación destino: ${solicitud.ubicacionDestino || "-"}

Link Maps recojo:
${solicitud.linkRecojoMaps || "-"}

Link Maps destino:
${solicitud.linkDestinoMaps || "-"}

Ruta Google Maps:
${solicitud.linkRutaMaps || "-"}

Observaciones:
${solicitud.observaciones || "-"}
`

    const blob = new Blob([contenido], { type: "text/plain" })
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
          <h1 style={styles.title}>Aprobación de Solicitudes</h1>
          <p style={styles.subtitle}>
            Revisa, aprueba o rechaza las solicitudes registradas.
          </p>
        </div>

        <div style={styles.summaryGrid}>
          <SummaryCard label="Total" value={solicitudes.length} />

          <SummaryCard
            label="Pendientes"
            value={
              solicitudes.filter(
                (s) => (s.estado || "pendiente") === "pendiente"
              ).length
            }
          />

          <SummaryCard
            label="Aprobadas"
            value={solicitudes.filter((s) => s.estado === "aprobado").length}
          />

          <SummaryCard
            label="Rechazadas"
            value={solicitudes.filter((s) => s.estado === "rechazado").length}
          />
        </div>

        <div style={styles.filterBar}>
          <input
            style={styles.searchInput}
            placeholder="Buscar solicitud..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <MultiFilter
            label="Estado"
            options={estadosDisponibles}
            selected={filtroEstados}
            onToggle={(valor) =>
              toggleFiltro(valor, filtroEstados, setFiltroEstados)
            }
          />

          <MultiFilter
            label="Cliente"
            options={clientesDisponibles}
            selected={filtroClientes}
            onToggle={(valor) =>
              toggleFiltro(valor, filtroClientes, setFiltroClientes)
            }
          />

          <MultiFilter
            label="Conductor"
            options={conductoresDisponibles}
            selected={filtroConductores}
            onToggle={(valor) =>
              toggleFiltro(valor, filtroConductores, setFiltroConductores)
            }
          />

          <MultiFilter
            label="Mes"
            options={mesesDisponibles}
            selected={filtroMeses}
            onToggle={(valor) =>
              toggleFiltro(valor, filtroMeses, setFiltroMeses)
            }
          />

          <MultiFilter
            label="Año"
            options={aniosDisponibles}
            selected={filtroAnios}
            onToggle={(valor) =>
              toggleFiltro(valor, filtroAnios, setFiltroAnios)
            }
          />

          <button style={styles.clearButton} onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>

        <div style={styles.resultText}>
          Mostrando {solicitudesFiltradas.length} solicitud(es)
        </div>

        <div style={styles.cardsGrid}>
          {solicitudesFiltradas.map((solicitud) => (
            <div key={solicitud.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div>
                  <span style={styles.codeLabel}>Código</span>
                  <h3 style={styles.code}>{solicitud.codigoSolicitud || "-"}</h3>
                </div>

                <div style={styles.cardTopActions}>
                  <button
                    style={styles.iconButton}
                    title="Ver detalle"
                    onClick={() => setSolicitudSeleccionada(solicitud)}
                  >
                    👁️
                  </button>

                  <button
                    style={styles.iconButton}
                    title="Descargar"
                    onClick={() => descargarSolicitud(solicitud)}
                  >
                    📥
                  </button>

                  <span
                    style={{
                      ...styles.badge,
                      background:
                        solicitud.estado === "aprobado"
                          ? "#dcfce7"
                          : solicitud.estado === "rechazado"
                          ? "#fee2e2"
                          : "#fef3c7",
                      color:
                        solicitud.estado === "aprobado"
                          ? "#166534"
                          : solicitud.estado === "rechazado"
                          ? "#991b1b"
                          : "#92400e",
                    }}
                  >
                    {solicitud.estado || "pendiente"}
                  </span>
                </div>
              </div>

              <div style={styles.infoGrid}>
                <Info label="Cliente" value={solicitud.cliente} />
                <Info
                  label="Contacto"
                  value={`${solicitud.contactoNombre || "-"} / ${
                    solicitud.contactoTelefono || "-"
                  }`}
                />
                <Info label="Fecha recojo" value={solicitud.fechaRecojo} />
                <Info label="Hora recojo" value={solicitud.horaRecojo} />
                <Info
                  label="Conductor"
                  value={solicitud.conductor || "Sin asignar"}
                />
                <Info
                  label="Vehículo"
                  value={solicitud.vehiculo || "Sin asignar"}
                />
              </div>

              <div style={styles.routeBox}>
                <span style={styles.routeLabel}>Ruta</span>
                <strong>
                  {solicitud.ubicacionRecojo || "-"} →{" "}
                  {solicitud.ubicacionDestino || "-"}
                </strong>
              </div>

              <div style={styles.actions}>
                {(solicitud.estado || "pendiente") === "pendiente" && (
                  <>
                    <button
                      style={styles.approveButton}
                      onClick={() => cambiarEstado(solicitud.id, "aprobado")}
                    >
                      Aprobar
                    </button>

                    <button
                      style={styles.rejectButton}
                      onClick={() => cambiarEstado(solicitud.id, "rechazado")}
                    >
                      Rechazar
                    </button>
                  </>
                )}

                {solicitud.estado === "aprobado" && (
                  <div style={styles.statusApproved}>
                    ✅ Solicitud aprobada
                  </div>
                )}

                {solicitud.estado === "rechazado" && (
                  <div style={styles.statusRejected}>
                    ❌ Solicitud rechazada
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {solicitudesFiltradas.length === 0 && (
          <div style={styles.emptyCard}>
            No hay solicitudes que coincidan con la búsqueda o filtro.
          </div>
        )}

        {solicitudSeleccionada && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h2>Detalle de Solicitud</h2>

                <button
                  style={styles.closeIcon}
                  onClick={() => setSolicitudSeleccionada(null)}
                >
                  ✕
                </button>
              </div>

              <div style={styles.modalGrid}>
                <Info label="Código" value={solicitudSeleccionada.codigoSolicitud} />
                <Info label="Estado" value={solicitudSeleccionada.estado || "pendiente"} />
                <Info label="Cliente" value={solicitudSeleccionada.cliente} />
                <Info label="Contacto" value={solicitudSeleccionada.contactoNombre} />
                <Info label="Teléfono" value={solicitudSeleccionada.contactoTelefono} />
                <Info label="Conductor" value={solicitudSeleccionada.conductor} />
                <Info label="Vehículo" value={solicitudSeleccionada.vehiculo} />
                <Info label="Fecha recojo" value={solicitudSeleccionada.fechaRecojo} />
                <Info label="Hora recojo" value={solicitudSeleccionada.horaRecojo} />
                <Info label="Hora llegada" value={solicitudSeleccionada.horaLlegada} />
                <Info label="Contenido" value={solicitudSeleccionada.contenido} />
                <Info label="Ubicación recojo" value={solicitudSeleccionada.ubicacionRecojo} />
                <Info label="Ubicación destino" value={solicitudSeleccionada.ubicacionDestino} />
                <Info label="Link Maps recojo" value={solicitudSeleccionada.linkRecojoMaps} />
                <Info label="Link Maps destino" value={solicitudSeleccionada.linkDestinoMaps} />
                <Info label="Ruta Google Maps" value={solicitudSeleccionada.linkRutaMaps} />
                <Info label="Observaciones" value={solicitudSeleccionada.observaciones} />
              </div>

              <div style={styles.modalActions}>
                <button
                  style={styles.downloadButton}
                  onClick={() => descargarSolicitud(solicitudSeleccionada)}
                >
                  📥 Descargar
                </button>

                {(solicitudSeleccionada.estado || "pendiente") === "pendiente" && (
                  <>
                    <button
                      style={styles.approveButton}
                      onClick={() => {
                        cambiarEstado(solicitudSeleccionada.id, "aprobado")
                        setSolicitudSeleccionada(null)
                      }}
                    >
                      Aprobar
                    </button>

                    <button
                      style={styles.rejectButton}
                      onClick={() => {
                        cambiarEstado(solicitudSeleccionada.id, "rechazado")
                        setSolicitudSeleccionada(null)
                      }}
                    >
                      Rechazar
                    </button>
                  </>
                )}
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
      <span style={styles.summaryLabel}>{label}</span>
      <strong style={styles.summaryValue}>{value}</strong>
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
          <span style={styles.filterCount}>{selected.length}</span>
        )}
      </summary>

      <div style={styles.multiOptions}>
        {options.length === 0 && (
          <span style={styles.noOptions}>Sin opciones</span>
        )}

        {options.map((option) => (
          <label key={option} style={styles.checkboxOption}>
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
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
      <span style={styles.infoLabel}>{label}</span>
      <strong style={styles.infoValue}>{value || "-"}</strong>
    </div>
  )
}

const styles: any = {
  layout: {
    display: "flex",
    background: "#f3f4f6",
    minHeight: "100vh",
  },

  content: {
    flex: 1,
    padding: "34px",
  },

  header: {
    marginBottom: "22px",
  },

  title: {
    fontSize: "46px",
    fontWeight: "bold",
    margin: 0,
    color: "#0f172a",
  },

  subtitle: {
    color: "#6b7280",
    marginTop: "8px",
    fontSize: "15px",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },

  summaryCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
    border: "1px solid #e5e7eb",
  },

  summaryLabel: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: 500,
  },

  summaryValue: {
    display: "block",
    marginTop: "8px",
    fontSize: "30px",
    fontWeight: "bold",
    color: "#0b1f3a",
  },

  filterBar: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "12px",
    display: "grid",
    gridTemplateColumns: "1.8fr repeat(5, 120px) 110px",
    gap: "10px",
    alignItems: "center",
    marginBottom: "16px",
    boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
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
    color: "#111827",
  },

  multiFilter: {
    position: "relative",
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
    color: "#334155",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  filterCount: {
    background: "#0b1f3a",
    color: "#ffffff",
    borderRadius: "999px",
    padding: "2px 7px",
    fontSize: "11px",
  },

  multiOptions: {
    position: "absolute",
    top: "48px",
    left: 0,
    width: "220px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "10px",
    boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
    zIndex: 50,
  },

  checkboxOption: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    fontSize: "13px",
    cursor: "pointer",
    color: "#111827",
  },

  noOptions: {
    color: "#6b7280",
    fontSize: "13px",
  },

  clearButton: {
    background: "#0b1f3a",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    height: "42px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },

  resultText: {
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "16px",
    fontWeight: 500,
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
    gap: "16px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
    border: "1px solid #e5e7eb",
    maxWidth: "520px",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "14px",
    gap: "10px",
  },

  cardTopActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  codeLabel: {
    fontSize: "10px",
    color: "#6b7280",
    textTransform: "uppercase",
    fontWeight: "bold",
    letterSpacing: "1px",
  },

  code: {
    margin: "4px 0 0",
    color: "#0b1f3a",
    fontSize: "18px",
    fontWeight: "bold",
    lineHeight: 1.1,
  },

  iconButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
    padding: "2px",
  },

  badge: {
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "bold",
    textTransform: "capitalize",
    whiteSpace: "nowrap",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
    fontWeight: 500,
  },

  infoValue: {
    color: "#111827",
    fontSize: "12px",
    fontWeight: "bold",
  },

  routeBox: {
    marginTop: "10px",
    background: "#eef2ff",
    borderRadius: "12px",
    padding: "11px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    color: "#1e3a8a",
    border: "1px solid #c7d2fe",
    fontSize: "12px",
  },

  routeLabel: {
    fontSize: "11px",
    fontWeight: "bold",
  },

  actions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "12px",
    flexWrap: "wrap",
  },

  approveButton: {
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "9px 13px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "12px",
    minWidth: "95px",
  },

  rejectButton: {
    background: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "9px 13px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "12px",
    minWidth: "95px",
  },

  statusApproved: {
    background: "#dcfce7",
    color: "#166534",
    padding: "9px 12px",
    borderRadius: "10px",
    fontWeight: "bold",
    fontSize: "12px",
  },

  statusRejected: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "9px 12px",
    borderRadius: "10px",
    fontWeight: "bold",
    fontSize: "12px",
  },

  emptyCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "34px",
    color: "#6b7280",
    textAlign: "center",
    fontSize: "15px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.65)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    backdropFilter: "blur(4px)",
  },

  modal: {
    background: "#ffffff",
    padding: "28px",
    borderRadius: "24px",
    width: "900px",
    maxHeight: "88vh",
    overflowY: "auto",
    boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
  },

  closeIcon: {
    background: "#0f172a",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },

  modalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  },

  modalActions: {
    display: "flex",
    gap: "14px",
    marginTop: "24px",
    flexWrap: "wrap",
  },

  downloadButton: {
    background: "#0b1f3a",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    padding: "11px 16px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },
}