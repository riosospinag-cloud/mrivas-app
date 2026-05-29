import { useEffect, useMemo, useState, type ReactNode } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { db } from "../firebase"
import Sidebar from "../components/Sidebar"
import { useAuth } from "../context/AuthContext"

type PuntoRecojo = {
  personal?: string
  direccion?: string
  googleMaps?: string
  telefono?: string
}

type AsignacionConductor = {
  conductor: string
  vehiculo: string
  puntosAsignados: number[]
}

type CronogramaPunto = {
  puntoIndex: number
  direccion: string
  fechaLlegada: string
  horaLlegada: string
}

type Solicitud = {
  id: string
  codigoSolicitud?: string
  cliente?: string
  contactoNombre?: string
  contactoTelefono?: string
  modalidad?: string
  viajeDirigido?: string
  numeroPuntosRecojo?: number
  puntosRecojo?: PuntoRecojo[]
  horaInicial?: string
  horaLlegada?: string
  fechaServicio?: string
  observaciones?: string
  estado?: string
  solicitanteEmail?: string
  solicitanteRol?: string
  creadoEn?: any
  revisada?: boolean
  conductoresAsignados?: AsignacionConductor[]
  cronogramaViaje?: CronogramaPunto[]
}

export default function ClienteSolicitudes() {
  const { user } = useAuth()

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState("todos")
  const [clienteFiltro, setClienteFiltro] = useState("todos")
  const [mesFiltro, setMesFiltro] = useState("todos")
  const [anioFiltro, setAnioFiltro] = useState("todos")
  const [solicitudDetalle, setSolicitudDetalle] = useState<Solicitud | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "solicitudes_servicio"), (snapshot) => {
      const lista: Solicitud[] = snapshot.docs.map((documento) => ({
        id: documento.id,
        ...(documento.data() as Omit<Solicitud, "id">),
      }))

      const soloMisSolicitudes = lista.filter(
        (solicitud) => solicitud.solicitanteEmail === user?.email
      )

      soloMisSolicitudes.sort(
        (a, b) => obtenerTimestamp(b.creadoEn) - obtenerTimestamp(a.creadoEn)
      )

      setSolicitudes(soloMisSolicitudes)
    })

    return () => unsubscribe()
  }, [user?.email])

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter((solicitud) => {
      const textoBusqueda = busqueda.toLowerCase()

      const coincideBusqueda =
        !busqueda ||
        solicitud.codigoSolicitud?.toLowerCase().includes(textoBusqueda) ||
        solicitud.cliente?.toLowerCase().includes(textoBusqueda) ||
        solicitud.contactoNombre?.toLowerCase().includes(textoBusqueda) ||
        solicitud.contactoTelefono?.toLowerCase().includes(textoBusqueda)

      const coincideEstado = estadoFiltro === "todos" || solicitud.estado === estadoFiltro
      const coincideCliente = clienteFiltro === "todos" || solicitud.cliente === clienteFiltro

      const fecha = convertirFechaCreacion(solicitud.creadoEn)

      const coincideMes =
        mesFiltro === "todos" || (fecha && String(fecha.getMonth() + 1) === mesFiltro)

      const coincideAnio =
        anioFiltro === "todos" || (fecha && String(fecha.getFullYear()) === anioFiltro)

      return coincideBusqueda && coincideEstado && coincideCliente && coincideMes && coincideAnio
    })
  }, [solicitudes, busqueda, estadoFiltro, clienteFiltro, mesFiltro, anioFiltro])

  const total = solicitudes.length
  const pendientes = solicitudes.filter((s) => s.estado === "pendiente").length
  const aprobadas = solicitudes.filter((s) => s.estado === "aprobado").length
  const rechazadas = solicitudes.filter((s) => s.estado === "rechazado").length

  const clientesUnicos = Array.from(new Set(solicitudes.map((s) => s.cliente).filter(Boolean)))

  const aniosUnicos = Array.from(
    new Set(
      solicitudes
        .map((s) => convertirFechaCreacion(s.creadoEn))
        .filter(Boolean)
        .map((fecha) => String(fecha?.getFullYear()))
    )
  )

  const limpiarFiltros = () => {
    setBusqueda("")
    setEstadoFiltro("todos")
    setClienteFiltro("todos")
    setMesFiltro("todos")
    setAnioFiltro("todos")
  }

  const descargarSolicitud = (solicitud: Solicitud) => {
    const pdf = new jsPDF("p", "mm", "a4")
    const codigo = solicitud.codigoSolicitud || "solicitud"
    const fechaDescarga = new Date().toLocaleString("es-PE")

    pdf.setFontSize(18)
    pdf.setFont("helvetica", "bold")
    pdf.text("M. RIVAS TRANSERVICE", 14, 18)

    pdf.setFontSize(14)
    pdf.text("SOLICITUD DE SERVICIO", 14, 28)

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text(`Documento generado: ${fechaDescarga}`, 14, 35)

    autoTable(pdf, {
      startY: 42,
      head: [["Campo", "Detalle"]],
      body: [
        ["Código de solicitud", solicitud.codigoSolicitud || "-"],
        ["Estado", solicitud.estado || "-"],
        ["Registrado", formatearFechaHora(solicitud.creadoEn)],
        ["Cliente", solicitud.cliente || "-"],
        ["Contacto cliente", solicitud.contactoNombre || "-"],
        ["Teléfono contacto", solicitud.contactoTelefono || "-"],
        ["Modalidad", solicitud.modalidad || "-"],
        ["Viaje dirigido a", solicitud.viajeDirigido || "-"],
        ["Fecha servicio", solicitud.fechaServicio || "-"],
        ["Hora inicial", solicitud.horaInicial || "-"],
        ["Hora llegada", solicitud.horaLlegada || "-"],
        ["Ruta", obtenerRuta(solicitud)],
      ],
    })

    autoTable(pdf, {
      startY: (pdf as any).lastAutoTable.finalY + 10,
      head: [["#", "Personal", "Dirección", "Google Maps", "Teléfono"]],
      body:
        solicitud.puntosRecojo?.map((punto, index) => [
          String(index + 1),
          punto.personal || "-",
          punto.direccion || "-",
          punto.googleMaps || "-",
          punto.telefono || "-",
        ]) || [["-", "-", "-", "-", "-"]],
    })

    autoTable(pdf, {
      startY: (pdf as any).lastAutoTable.finalY + 10,
      head: [["Observaciones adicionales"]],
      body: [[solicitud.observaciones || "-"]],
    })

    pdf.save(`${codigo}_mi_solicitud.pdf`)
  }

  return (
    <div style={styles.layout}>
      <Sidebar />

      <main style={styles.content}>
        <h1 style={styles.title}>Mis Solicitudes</h1>

        <p style={styles.subtitle}>
          Consulta el estado de tus solicitudes de servicio.
        </p>

        <div style={styles.statsGrid}>
          <StatCard label="Total" value={total} />
          <StatCard label="Pendientes" value={pendientes} />
          <StatCard label="Aprobadas" value={aprobadas} />
          <StatCard label="Rechazadas" value={rechazadas} />
        </div>

        <div style={styles.filtersCard}>
          <input
            style={styles.searchInput}
            placeholder="Buscar solicitud..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select style={styles.filterInput} value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
            <option value="todos">Estado</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>

          <select style={styles.filterInput} value={clienteFiltro} onChange={(e) => setClienteFiltro(e.target.value)}>
            <option value="todos">Cliente</option>
            {clientesUnicos.map((cliente) => (
              <option key={cliente} value={cliente}>
                {cliente}
              </option>
            ))}
          </select>

          <select style={styles.filterInput} value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)}>
            <option value="todos">Mes</option>
            <option value="1">Enero</option>
            <option value="2">Febrero</option>
            <option value="3">Marzo</option>
            <option value="4">Abril</option>
            <option value="5">Mayo</option>
            <option value="6">Junio</option>
            <option value="7">Julio</option>
            <option value="8">Agosto</option>
            <option value="9">Septiembre</option>
            <option value="10">Octubre</option>
            <option value="11">Noviembre</option>
            <option value="12">Diciembre</option>
          </select>

          <select style={styles.filterInput} value={anioFiltro} onChange={(e) => setAnioFiltro(e.target.value)}>
            <option value="todos">Año</option>
            {aniosUnicos.map((anio) => (
              <option key={anio} value={anio}>
                {anio}
              </option>
            ))}
          </select>

          <button style={styles.cleanButton} onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>

        {solicitudesFiltradas.length === 0 ? (
          <div style={styles.emptyCard}>No tienes solicitudes registradas.</div>
        ) : (
          <div style={styles.cardsGrid}>
            {solicitudesFiltradas.map((solicitud) => (
              <div key={solicitud.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <span style={styles.smallLabel}>Código</span>
                    <h2 style={styles.code}>{solicitud.codigoSolicitud || "-"}</h2>

                    <p style={styles.metaText}>
                      <strong>Registrado:</strong> {formatearFechaHora(solicitud.creadoEn)}
                    </p>

                    <p style={styles.metaText}>
                      <strong>Solicitante:</strong> {solicitud.solicitanteEmail || "-"}
                    </p>
                  </div>

                  <div style={styles.iconActions}>
                    <button style={styles.iconButton} title="Ver detalle" onClick={() => setSolicitudDetalle(solicitud)}>
                      👁️
                    </button>

                    <button style={styles.iconButton} title="Descargar PDF" onClick={() => descargarSolicitud(solicitud)}>
                      📥
                    </button>
                  </div>
                </div>

                <div style={styles.statusWrap}>
                  <span style={getStatusStyle(solicitud.estado)}>
                    {solicitud.estado || "pendiente"}
                  </span>
                </div>

                <div style={styles.infoGrid}>
                  <InfoBox label="Cliente" value={solicitud.cliente || "-"} />
                  <InfoBox label="Modalidad" value={solicitud.modalidad || "-"} />
                  <InfoBox label="Viaje dirigido a" value={solicitud.viajeDirigido || "-"} />
                  <InfoBox label="Fecha servicio" value={solicitud.fechaServicio || "-"} />
                  <InfoBox label="Hora inicial" value={solicitud.horaInicial || "-"} />
                  <InfoBox label="Hora llegada" value={solicitud.horaLlegada || "-"} />
                </div>

                <div style={styles.routeBox}>
                  <strong>Ruta:</strong> {obtenerRuta(solicitud)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {solicitudDetalle && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalLarge}>
            <button style={styles.xButton} onClick={() => setSolicitudDetalle(null)}>
              ×
            </button>

            <h2 style={styles.modalTitle}>Detalle de solicitud</h2>

            <Section title="Registro">
              <DetailItem label="Código" value={solicitudDetalle.codigoSolicitud || "-"} />
              <DetailItem label="Registrado" value={formatearFechaHora(solicitudDetalle.creadoEn)} />
              <DetailItem label="Solicitante" value={solicitudDetalle.solicitanteEmail || "-"} />
              <DetailItem label="Estado" value={solicitudDetalle.estado || "-"} />
            </Section>

            <Section title="Datos del cliente">
              <DetailItem label="Cliente" value={solicitudDetalle.cliente || "-"} />
              <DetailItem label="Nombre contacto" value={solicitudDetalle.contactoNombre || "-"} />
              <DetailItem label="Teléfono contacto" value={solicitudDetalle.contactoTelefono || "-"} />
            </Section>

            <Section title="Datos del servicio">
              <DetailItem label="Modalidad" value={solicitudDetalle.modalidad || "-"} />
              <DetailItem label="Viaje dirigido a" value={solicitudDetalle.viajeDirigido || "-"} />
              <DetailItem label="Fecha de servicio" value={solicitudDetalle.fechaServicio || "-"} />
              <DetailItem label="Hora inicial" value={solicitudDetalle.horaInicial || "-"} />
              <DetailItem label="Hora llegada" value={solicitudDetalle.horaLlegada || "-"} />
              <DetailItem label="Ruta" value={obtenerRuta(solicitudDetalle)} />
            </Section>

            <Section title="Puntos de recojo">
              {solicitudDetalle.puntosRecojo?.map((punto, index) => (
                <div key={index} style={styles.pointCard}>
                  <h4 style={styles.pointTitle}>Punto #{index + 1}</h4>
                  <DetailItem label="Personal / contacto" value={punto.personal || "-"} />
                  <DetailItem label="Dirección" value={punto.direccion || "-"} />
                  <DetailItem label="Ubicación Google Maps" value={punto.googleMaps || "-"} />
                  <DetailItem label="Teléfono" value={punto.telefono || "-"} />
                </div>
              ))}
            </Section>

            <Section title="Cronograma de viaje">
              {solicitudDetalle.cronogramaViaje?.length ? (
                solicitudDetalle.cronogramaViaje.map((item) => (
                  <div key={item.puntoIndex} style={styles.scheduleCard}>
                    <DetailItem label={`Punto ${item.puntoIndex + 1}`} value={item.direccion} />
                    <DetailItem label="Fecha llegada" value={item.fechaLlegada} />
                    <DetailItem label="Hora llegada" value={item.horaLlegada} />
                  </div>
                ))
              ) : (
                <p style={styles.emptyText}>Aún no se asignó cronograma.</p>
              )}
            </Section>

            <Section title="Observaciones adicionales">
              <div style={styles.observationsBox}>{solicitudDetalle.observaciones || "-"}</div>
            </Section>

            <button style={styles.downloadButton} onClick={() => descargarSolicitud(solicitudDetalle)}>
              Descargar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <strong style={styles.statValue}>{value}</strong>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoBox}>
      <span style={styles.infoLabel}>{label}</span>
      <strong style={styles.infoValue}>{value}</strong>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      {children}
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.detailLabel}>{label}</span>
      <strong style={styles.detailValue}>{value}</strong>
    </div>
  )
}

function obtenerRuta(solicitud: Solicitud) {
  const puntos = solicitud.puntosRecojo || []
  if (puntos.length === 0) return "-"
  if (puntos.length === 1) return puntos[0]?.direccion || "-"
  return `${puntos[0]?.direccion || "-"} → ${puntos[puntos.length - 1]?.direccion || "-"}`
}

function convertirFechaCreacion(creadoEn: any): Date | null {
  if (!creadoEn) return null
  if (creadoEn?.toDate) return creadoEn.toDate()
  if (creadoEn instanceof Date) return creadoEn

  const fecha = new Date(creadoEn)
  return isNaN(fecha.getTime()) ? null : fecha
}

function obtenerTimestamp(creadoEn: any) {
  const fecha = convertirFechaCreacion(creadoEn)
  return fecha ? fecha.getTime() : 0
}

function formatearFechaHora(creadoEn: any) {
  const fecha = convertirFechaCreacion(creadoEn)
  if (!fecha) return "-"

  return fecha.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getStatusStyle(estado?: string) {
  const base = {
    display: "inline-block",
    padding: "7px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "bold",
    textTransform: "capitalize" as const,
  }

  if (estado === "aprobado") return { ...base, background: "#dcfce7", color: "#166534" }
  if (estado === "rechazado") return { ...base, background: "#fee2e2", color: "#991b1b" }

  return { ...base, background: "#fef3c7", color: "#92400e" }
}

const styles: any = {
  layout: { display: "flex", minHeight: "100vh", background: "#f4f6f8" },
  content: { flex: 1, padding: "34px" },
  title: { fontSize: "34px", marginBottom: "8px", color: "#020617" },
  subtitle: { color: "#64748b", marginBottom: "24px", fontSize: "16px" },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "22px",
  },

  statCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    border: "1px solid #e5e7eb",
  },

  statLabel: { display: "block", color: "#64748b", marginBottom: "8px", fontSize: "14px" },
  statValue: { fontSize: "34px", color: "#0b1f3a" },

  filtersCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "22px",
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto",
    gap: "12px",
    border: "1px solid #e5e7eb",
  },

  searchInput: {
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
  },

  filterInput: {
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    background: "#fff",
    fontWeight: "bold",
  },

  cleanButton: {
    background: "#0b1f3a",
    color: "#fff",
    border: "none",
    padding: "0 28px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  emptyCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "36px",
    color: "#64748b",
    textAlign: "center",
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "20px",
  },

  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    border: "1px solid #e5e7eb",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "16px",
  },

  smallLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "bold",
    marginBottom: "4px",
  },

  code: { margin: "0 0 8px 0", color: "#0b1f3a", fontSize: "22px" },
  metaText: { margin: "4px 0", color: "#475569", fontSize: "13px" },
  iconActions: { display: "flex", flexDirection: "column", gap: "14px" },
  iconButton: { background: "transparent", border: "none", cursor: "pointer", fontSize: "20px" },
  statusWrap: { display: "flex", justifyContent: "flex-end", marginBottom: "16px" },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },

  infoBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "13px",
  },

  infoLabel: { display: "block", color: "#64748b", fontSize: "12px", marginBottom: "6px" },
  infoValue: { color: "#0f172a", fontSize: "14px" },

  routeBox: {
    background: "#eef2ff",
    color: "#0b1f3a",
    borderRadius: "12px",
    padding: "13px",
    marginBottom: "12px",
    fontSize: "14px",
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    padding: "20px",
  },

  modalLarge: {
    position: "relative",
    background: "#fff",
    width: "900px",
    maxWidth: "92vw",
    maxHeight: "88vh",
    overflowY: "auto",
    borderRadius: "18px",
    padding: "30px",
  },

  xButton: {
    position: "absolute",
    top: "14px",
    right: "18px",
    background: "transparent",
    border: "none",
    fontSize: "28px",
    fontWeight: "bold",
    cursor: "pointer",
    color: "#374151",
  },

  modalTitle: { color: "#0b1f3a", marginBottom: "18px", fontSize: "26px" },
  section: { marginBottom: "22px" },
  sectionTitle: { color: "#0b1f3a", marginBottom: "10px", fontSize: "18px" },

  detailItem: {
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #e5e7eb",
  },

  detailLabel: { color: "#64748b", fontWeight: "bold" },
  detailValue: { color: "#0f172a" },

  pointCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "12px",
  },

  scheduleCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "12px",
  },

  pointTitle: { color: "#0b1f3a", marginTop: 0, marginBottom: "10px" },
  emptyText: { color: "#64748b" },

  observationsBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    minHeight: "90px",
    whiteSpace: "pre-wrap",
  },

  downloadButton: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "14px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
  },
}