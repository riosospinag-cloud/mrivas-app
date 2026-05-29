import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { arrayUnion, collection, doc, onSnapshot, updateDoc } from "firebase/firestore"
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

type Incidencia = {
  tipo: string
  descripcion: string
  ubicacion: string
  fechaRegistro: string
  conductor: string
}

type UbicacionActual = {
  lat: number
  lng: number
  actualizadoEn: string
  conductor: string
}

type HistorialUbicacion = {
  lat: number
  lng: number
  fechaHora: string
  conductor: string
}

type Solicitud = {
  id: string
  codigoSolicitud?: string
  cliente?: string
  modalidad?: string
  viajeDirigido?: string
  puntosRecojo?: PuntoRecojo[]
  horaInicial?: string
  horaLlegada?: string
  fechaServicio?: string
  observaciones?: string
  estado?: string
  solicitanteEmail?: string
  creadoEn?: any
  conductoresAsignados?: AsignacionConductor[]
  cronogramaViaje?: CronogramaPunto[]
  estadoOperativo?: string
  incidencias?: Incidencia[]
  fechaHoraInicioRuta?: string
  iniciadoPor?: string
  fechaHoraFinalizacion?: string
  finalizadoPor?: string
  ubicacionActual?: UbicacionActual
  historialUbicaciones?: HistorialUbicacion[]
}

export default function DriverServicios() {
  const { user } = useAuth()

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState("todos")
  const [detalle, setDetalle] = useState<Solicitud | null>(null)

  const [incidenciaModal, setIncidenciaModal] = useState<Solicitud | null>(null)
  const [tipoIncidencia, setTipoIncidencia] = useState("")
  const [descripcionIncidencia, setDescripcionIncidencia] = useState("")
  const [ubicacionIncidencia, setUbicacionIncidencia] = useState("")

  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "solicitudes_servicio"), (snapshot) => {
      const lista: Solicitud[] = snapshot.docs.map((documento) => ({
        id: documento.id,
        ...(documento.data() as Omit<Solicitud, "id">),
      }))

      const email = user?.email?.toLowerCase() || ""

      const asignadas = lista.filter((solicitud) =>
        solicitud.conductoresAsignados?.some((a) => {
          const conductor = a.conductor?.toLowerCase() || ""
          return conductor.includes(email)
        })
      )

      asignadas.sort((a, b) => obtenerTimestamp(b.creadoEn) - obtenerTimestamp(a.creadoEn))
      setSolicitudes(asignadas)
    })

    return () => unsubscribe()
  }, [user?.email])

  useEffect(() => {
    return () => {
      detenerSeguimientoGPS()
    }
  }, [])

  const filtradas = useMemo(() => {
    return solicitudes.filter((s) => {
      const q = busqueda.toLowerCase()

      const coincideBusqueda =
        !q ||
        s.codigoSolicitud?.toLowerCase().includes(q) ||
        s.cliente?.toLowerCase().includes(q)

      const coincideEstado =
        estadoFiltro === "todos" ||
        s.estadoOperativo === estadoFiltro ||
        s.estado === estadoFiltro

      return coincideBusqueda && coincideEstado
    })
  }, [solicitudes, busqueda, estadoFiltro])

  const detenerSeguimientoGPS = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }

  const iniciarSeguimientoGPS = (solicitud: Solicitud) => {
    if (!navigator.geolocation) {
      alert("Este dispositivo o navegador no permite obtener ubicación GPS")
      return
    }

    detenerSeguimientoGPS()

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const fechaHora = new Date().toISOString()
        const conductor = user?.email || "No identificado"

        try {
          await updateDoc(doc(db, "solicitudes_servicio", solicitud.id), {
            ubicacionActual: {
              lat,
              lng,
              actualizadoEn: fechaHora,
              conductor,
            },
            historialUbicaciones: arrayUnion({
              lat,
              lng,
              fechaHora,
              conductor,
            }),
          })
        } catch (error) {
          console.error("Error guardando ubicación GPS:", error)
        }
      },
      (error) => {
        console.error("Error GPS:", error)

        if (error.code === error.PERMISSION_DENIED) {
          alert("Permiso de ubicación denegado. Activa la ubicación para continuar.")
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          alert("No se pudo obtener la ubicación actual.")
        } else if (error.code === error.TIMEOUT) {
          alert("La ubicación tardó demasiado en responder.")
        } else {
          alert("No se pudo activar el seguimiento GPS.")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    )
  }

  const iniciarRuta = async (solicitud: Solicitud) => {
    if (solicitud.estadoOperativo === "finalizado") {
      alert("Este servicio ya fue finalizado")
      return
    }

    if (solicitud.estadoOperativo === "en_ruta") {
      iniciarSeguimientoGPS(solicitud)
      alert("Seguimiento GPS reactivado")
      return
    }

    try {
      await updateDoc(doc(db, "solicitudes_servicio", solicitud.id), {
        estadoOperativo: "en_ruta",
        fechaHoraInicioRuta: new Date().toISOString(),
        iniciadoPor: user?.email || "No identificado",
      })

      iniciarSeguimientoGPS(solicitud)

      alert("Ruta iniciada correctamente. Seguimiento GPS activado.")
    } catch (error) {
      console.error(error)
      alert("No se pudo iniciar la ruta")
    }
  }

  const finalizarRuta = async (solicitud: Solicitud) => {
    if (solicitud.estadoOperativo === "finalizado") {
      alert("Este servicio ya fue finalizado")
      return
    }

    if (solicitud.estadoOperativo !== "en_ruta") {
      alert("Primero debes iniciar la ruta antes de finalizar")
      return
    }

    try {
      detenerSeguimientoGPS()

      await updateDoc(doc(db, "solicitudes_servicio", solicitud.id), {
        estadoOperativo: "finalizado",
        fechaHoraFinalizacion: new Date().toISOString(),
        finalizadoPor: user?.email || "No identificado",
      })

      alert("Servicio finalizado correctamente. Seguimiento GPS detenido.")
    } catch (error) {
      console.error(error)
      alert("No se pudo finalizar el servicio")
    }
  }

  const abrirIncidencia = (solicitud: Solicitud) => {
    setIncidenciaModal(solicitud)
    setTipoIncidencia("")
    setDescripcionIncidencia("")
    setUbicacionIncidencia("")
  }

  const guardarIncidencia = async () => {
    if (!incidenciaModal) return

    if (!tipoIncidencia || !descripcionIncidencia) {
      alert("Completa el tipo y la descripción de la incidencia")
      return
    }

    try {
      const nuevaIncidencia: Incidencia = {
        tipo: tipoIncidencia,
        descripcion: descripcionIncidencia,
        ubicacion: ubicacionIncidencia || "No especificada",
        fechaRegistro: new Date().toISOString(),
        conductor: user?.email || "No identificado",
      }

      const incidenciasActuales = incidenciaModal.incidencias || []

      await updateDoc(doc(db, "solicitudes_servicio", incidenciaModal.id), {
        estadoOperativo: "incidencia",
        incidencias: [...incidenciasActuales, nuevaIncidencia],
      })

      alert("Incidencia registrada correctamente")

      setIncidenciaModal(null)
      setTipoIncidencia("")
      setDescripcionIncidencia("")
      setUbicacionIncidencia("")
    } catch (error) {
      console.error(error)
      alert("No se pudo registrar la incidencia")
    }
  }

  const abrirGoogleMaps = (ubicacion?: UbicacionActual) => {
    if (!ubicacion) {
      alert("Aún no hay ubicación registrada")
      return
    }

    window.open(`https://www.google.com/maps?q=${ubicacion.lat},${ubicacion.lng}`, "_blank")
  }

  return (
    <div style={styles.layout}>
      <Sidebar />

      <main style={styles.content}>
        <h1 style={styles.title}>Mis Servicios Asignados</h1>
        <p style={styles.subtitle}>Consulta tus rutas, puntos, cronograma y seguimiento GPS.</p>

        <div style={styles.filtersCard}>
          <input
            style={styles.searchInput}
            placeholder="Buscar servicio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select
            style={styles.filterInput}
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="aprobado">Aprobado</option>
            <option value="en_ruta">En ruta</option>
            <option value="finalizado">Finalizado</option>
            <option value="incidencia">Incidencia</option>
          </select>
        </div>

        {filtradas.length === 0 ? (
          <div style={styles.emptyCard}>No tienes servicios asignados.</div>
        ) : (
          <div style={styles.cardsGrid}>
            {filtradas.map((solicitud) => {
              const miAsignacion = obtenerMiAsignacion(solicitud, user?.email)

              return (
                <div key={solicitud.id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <div>
                      <span style={styles.smallLabel}>Código</span>
                      <h2 style={styles.code}>{solicitud.codigoSolicitud || "-"}</h2>

                      <p style={styles.metaText}>
                        <strong>Cliente:</strong> {solicitud.cliente || "-"}
                      </p>

                      <p style={styles.metaText}>
                        <strong>Fecha:</strong> {solicitud.fechaServicio || "-"}
                      </p>

                      {solicitud.fechaHoraInicioRuta && (
                        <p style={styles.successText}>
                          Inicio: {formatearFechaIso(solicitud.fechaHoraInicioRuta)}
                        </p>
                      )}

                      {solicitud.fechaHoraFinalizacion && (
                        <p style={styles.successText}>
                          Finalización: {formatearFechaIso(solicitud.fechaHoraFinalizacion)}
                        </p>
                      )}

                      {solicitud.ubicacionActual && (
                        <p style={styles.gpsText}>
                          GPS actualizado: {formatearFechaIso(solicitud.ubicacionActual.actualizadoEn)}
                        </p>
                      )}

                      {solicitud.historialUbicaciones?.length ? (
                        <p style={styles.gpsText}>
                          Puntos GPS registrados: {solicitud.historialUbicaciones.length}
                        </p>
                      ) : null}

                      {solicitud.incidencias?.length ? (
                        <p style={styles.warningText}>
                          Incidencias registradas: {solicitud.incidencias.length}
                        </p>
                      ) : null}
                    </div>

                    <button style={styles.iconButton} onClick={() => setDetalle(solicitud)}>
                      👁️
                    </button>
                  </div>

                  <div style={styles.statusWrap}>
                    <span style={getStatusStyle(solicitud.estadoOperativo || solicitud.estado)}>
                      {solicitud.estadoOperativo || solicitud.estado || "asignado"}
                    </span>
                  </div>

                  <InfoBox label="Vehículo asignado" value={miAsignacion?.vehiculo || "-"} />
                  <InfoBox label="Hora inicial" value={solicitud.horaInicial || "-"} />
                  <InfoBox label="Hora llegada" value={solicitud.horaLlegada || "-"} />

                  <div style={styles.routeBox}>
                    <strong>Ruta:</strong> {obtenerRuta(solicitud)}
                  </div>

                  <div style={styles.actions}>
                    <button
                      style={
                        solicitud.estadoOperativo === "finalizado"
                          ? styles.disabledButton
                          : styles.primaryButton
                      }
                      onClick={() => iniciarRuta(solicitud)}
                    >
                      {solicitud.estadoOperativo === "en_ruta" ? "Reactivar GPS" : "Iniciar ruta"}
                    </button>

                    <button
                      style={
                        solicitud.estadoOperativo === "finalizado"
                          ? styles.disabledButton
                          : styles.successButton
                      }
                      onClick={() => finalizarRuta(solicitud)}
                    >
                      Finalizar
                    </button>

                    <button style={styles.dangerButton} onClick={() => abrirIncidencia(solicitud)}>
                      Reportar incidencia
                    </button>
                  </div>

                  <button
                    style={styles.mapButton}
                    onClick={() => abrirGoogleMaps(solicitud.ubicacionActual)}
                  >
                    Ver ubicación actual
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {detalle && (
        <div style={styles.modalOverlay} onClick={() => setDetalle(null)}>
          <div style={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <button style={styles.xButton} onClick={() => setDetalle(null)}>
              ×
            </button>

            <h2 style={styles.modalTitle}>Detalle del servicio</h2>

            <Section title="Servicio">
              <DetailItem label="Código" value={detalle.codigoSolicitud || "-"} />
              <DetailItem label="Cliente" value={detalle.cliente || "-"} />
              <DetailItem label="Fecha servicio" value={detalle.fechaServicio || "-"} />
              <DetailItem label="Hora inicial" value={detalle.horaInicial || "-"} />
              <DetailItem label="Hora llegada" value={detalle.horaLlegada || "-"} />
              <DetailItem
                label="Estado operativo"
                value={detalle.estadoOperativo || detalle.estado || "-"}
              />
            </Section>

            <Section title="Trazabilidad operativa">
              <DetailItem
                label="Inicio de ruta"
                value={formatearFechaIso(detalle.fechaHoraInicioRuta || "")}
              />
              <DetailItem label="Iniciado por" value={detalle.iniciadoPor || "-"} />
              <DetailItem
                label="Finalización"
                value={formatearFechaIso(detalle.fechaHoraFinalizacion || "")}
              />
              <DetailItem label="Finalizado por" value={detalle.finalizadoPor || "-"} />
            </Section>

            <Section title="Seguimiento GPS">
              <DetailItem
                label="Latitud"
                value={detalle.ubicacionActual?.lat ? String(detalle.ubicacionActual.lat) : "-"}
              />
              <DetailItem
                label="Longitud"
                value={detalle.ubicacionActual?.lng ? String(detalle.ubicacionActual.lng) : "-"}
              />
              <DetailItem
                label="Actualizado"
                value={formatearFechaIso(detalle.ubicacionActual?.actualizadoEn || "")}
              />
              <DetailItem
                label="Conductor"
                value={detalle.ubicacionActual?.conductor || "-"}
              />
              <DetailItem
                label="Puntos GPS registrados"
                value={detalle.historialUbicaciones?.length ? String(detalle.historialUbicaciones.length) : "0"}
              />

              <button
                style={styles.mapButton}
                onClick={() => abrirGoogleMaps(detalle.ubicacionActual)}
              >
                Abrir ubicación en Google Maps
              </button>
            </Section>

            <Section title="Puntos de recojo">
              {detalle.puntosRecojo?.map((punto, index) => (
                <div key={index} style={styles.pointCard}>
                  <h4 style={styles.pointTitle}>Punto #{index + 1}</h4>
                  <DetailItem label="Personal" value={punto.personal || "-"} />
                  <DetailItem label="Dirección" value={punto.direccion || "-"} />
                  <DetailItem label="Google Maps" value={punto.googleMaps || "-"} />
                  <DetailItem label="Teléfono" value={punto.telefono || "-"} />
                </div>
              ))}
            </Section>

            <Section title="Cronograma">
              {detalle.cronogramaViaje?.length ? (
                detalle.cronogramaViaje.map((item) => (
                  <div key={item.puntoIndex} style={styles.scheduleCard}>
                    <DetailItem label={`Punto ${item.puntoIndex + 1}`} value={item.direccion} />
                    <DetailItem label="Fecha llegada" value={item.fechaLlegada} />
                    <DetailItem label="Hora llegada" value={item.horaLlegada} />
                  </div>
                ))
              ) : (
                <p style={styles.emptyText}>No existe cronograma asignado.</p>
              )}
            </Section>

            <Section title="Incidencias reportadas">
              {detalle.incidencias?.length ? (
                detalle.incidencias.map((incidencia, index) => (
                  <div key={index} style={styles.incidentCard}>
                    <h4 style={styles.pointTitle}>Incidencia #{index + 1}</h4>
                    <DetailItem label="Tipo" value={incidencia.tipo} />
                    <DetailItem label="Descripción" value={incidencia.descripcion} />
                    <DetailItem label="Ubicación" value={incidencia.ubicacion} />
                    <DetailItem label="Conductor" value={incidencia.conductor} />
                    <DetailItem
                      label="Fecha registro"
                      value={formatearFechaIso(incidencia.fechaRegistro)}
                    />
                  </div>
                ))
              ) : (
                <p style={styles.emptyText}>No hay incidencias reportadas.</p>
              )}
            </Section>

            <Section title="Observaciones">
              <div style={styles.observationsBox}>{detalle.observaciones || "-"}</div>
            </Section>
          </div>
        </div>
      )}

      {incidenciaModal && (
        <div style={styles.modalOverlay} onClick={() => setIncidenciaModal(null)}>
          <div style={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
            <button style={styles.xButton} onClick={() => setIncidenciaModal(null)}>
              ×
            </button>

            <h2 style={styles.modalTitle}>Reportar incidencia</h2>

            <p style={styles.metaText}>
              Solicitud: <strong>{incidenciaModal.codigoSolicitud}</strong>
            </p>

            <label style={styles.formLabel}>Tipo de incidencia *</label>
            <select
              style={styles.input}
              value={tipoIncidencia}
              onChange={(e) => setTipoIncidencia(e.target.value)}
            >
              <option value="">Seleccionar tipo</option>
              <option value="Retraso">Retraso</option>
              <option value="Avería mecánica">Avería mecánica</option>
              <option value="Accidente">Accidente</option>
              <option value="Tráfico">Tráfico</option>
              <option value="Cliente ausente">Cliente ausente</option>
              <option value="Problema de ruta">Problema de ruta</option>
              <option value="Otro">Otro</option>
            </select>

            <label style={styles.formLabel}>Descripción *</label>
            <textarea
              style={styles.textarea}
              value={descripcionIncidencia}
              onChange={(e) => setDescripcionIncidencia(e.target.value)}
              placeholder="Describe brevemente lo ocurrido"
            />

            <label style={styles.formLabel}>Ubicación o referencia</label>
            <input
              style={styles.input}
              value={ubicacionIncidencia}
              onChange={(e) => setUbicacionIncidencia(e.target.value)}
              placeholder="Ejemplo: Av. Javier Prado con Arequipa"
            />

            <button style={styles.dangerButtonFull} onClick={guardarIncidencia}>
              Guardar incidencia
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function obtenerMiAsignacion(solicitud: Solicitud, email?: string | null) {
  const emailLower = email?.toLowerCase() || ""

  return solicitud.conductoresAsignados?.find((a) => {
    const conductor = a.conductor?.toLowerCase() || ""
    return conductor.includes(emailLower)
  })
}

function obtenerRuta(solicitud: Solicitud) {
  const puntos = solicitud.puntosRecojo || []

  if (puntos.length === 0) return "-"
  if (puntos.length === 1) return puntos[0]?.direccion || "-"

  return `${puntos[0]?.direccion || "-"} → ${puntos[puntos.length - 1]?.direccion || "-"}`
}

function obtenerTimestamp(creadoEn: any) {
  if (!creadoEn) return 0

  if (creadoEn?.toDate) {
    return creadoEn.toDate().getTime()
  }

  return 0
}

function formatearFechaIso(fechaIso: string) {
  if (!fechaIso) return "-"

  const fecha = new Date(fechaIso)

  if (isNaN(fecha.getTime())) return "-"

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

  if (estado === "finalizado") return { ...base, background: "#dcfce7", color: "#166534" }
  if (estado === "incidencia") return { ...base, background: "#fee2e2", color: "#991b1b" }
  if (estado === "en_ruta") return { ...base, background: "#dbeafe", color: "#1e40af" }

  return { ...base, background: "#fef3c7", color: "#92400e" }
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

const styles: any = {
  layout: { display: "flex", minHeight: "100vh", background: "#f4f6f8" },
  content: { flex: 1, padding: "34px" },
  title: { fontSize: "34px", marginBottom: "8px", color: "#020617" },
  subtitle: { color: "#64748b", marginBottom: "24px", fontSize: "16px" },

  filtersCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "22px",
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
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

  cardTop: { display: "flex", justifyContent: "space-between", marginBottom: "16px" },
  smallLabel: { display: "block", color: "#64748b", fontSize: "12px" },
  code: { margin: "0 0 8px 0", color: "#0b1f3a", fontSize: "22px" },
  metaText: { margin: "4px 0", color: "#475569", fontSize: "13px" },

  successText: {
    marginTop: "8px",
    color: "#166534",
    background: "#dcfce7",
    padding: "8px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "bold",
  },

  warningText: {
    marginTop: "8px",
    color: "#991b1b",
    background: "#fee2e2",
    padding: "8px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "bold",
  },

  gpsText: {
    marginTop: "8px",
    color: "#1e40af",
    background: "#dbeafe",
    padding: "8px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "bold",
  },

  iconButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "20px",
  },

  statusWrap: { display: "flex", justifyContent: "flex-end", marginBottom: "16px" },

  infoBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "13px",
    marginBottom: "10px",
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

  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
    marginTop: "15px",
  },

  primaryButton: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  successButton: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  dangerButton: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  disabledButton: {
    background: "#9ca3af",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    cursor: "not-allowed",
    fontWeight: "bold",
  },

  mapButton: {
    width: "100%",
    background: "#0f172a",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "12px",
  },

  dangerButtonFull: {
    width: "100%",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "16px",
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
    background: "#fff",
    width: "900px",
    maxWidth: "92vw",
    maxHeight: "88vh",
    overflowY: "auto",
    borderRadius: "18px",
    padding: "30px",
    position: "relative",
  },

  modalSmall: {
    background: "#fff",
    width: "520px",
    maxWidth: "92vw",
    borderRadius: "18px",
    padding: "30px",
    position: "relative",
  },

  xButton: {
    position: "absolute",
    top: "14px",
    right: "18px",
    background: "transparent",
    border: "none",
    fontSize: "28px",
    cursor: "pointer",
    color: "#374151",
  },

  modalTitle: { marginBottom: "18px", color: "#0b1f3a" },
  section: { marginBottom: "22px" },
  sectionTitle: { color: "#0b1f3a", marginBottom: "10px" },

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

  incidentCard: {
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "12px",
  },

  pointTitle: { color: "#0b1f3a", marginTop: 0 },
  emptyText: { color: "#64748b" },

  observationsBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px",
    minHeight: "90px",
    whiteSpace: "pre-wrap",
  },

  formLabel: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#0b1f3a",
  },

  input: {
    width: "100%",
    padding: "13px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    marginBottom: "14px",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    minHeight: "120px",
    padding: "13px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    marginBottom: "14px",
    boxSizing: "border-box",
    resize: "vertical",
  },
}