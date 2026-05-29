import { useState, type ReactNode } from "react"
import { db } from "../firebase"
import { collection, addDoc } from "firebase/firestore"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import Sidebar from "../components/Sidebar"
import { useAuth } from "../context/AuthContext"

type PuntoRecojo = {
  personal: string
  direccion: string
  googleMaps: string
  telefono: string
}

type SolicitudCreada = {
  codigoSolicitud: string
  cliente: string
  contactoNombre: string
  contactoTelefono: string
  modalidad: string
  viajeDirigido: string
  numeroPuntosRecojo: number
  puntosRecojo: PuntoRecojo[]
  horaInicial: string
  horaLlegada: string
  fechaServicio: string
  observaciones: string
  estado: string
  solicitanteEmail: string
  solicitanteRol: string
}

const puntoVacio: PuntoRecojo = {
  personal: "",
  direccion: "",
  googleMaps: "",
  telefono: "",
}

export default function NuevoServicio() {
  const { user } = useAuth()

  const [cliente, setCliente] = useState("")
  const [contactoNombre, setContactoNombre] = useState("")
  const [contactoTelefono, setContactoTelefono] = useState("")
  const [modalidad, setModalidad] = useState("")
  const [viajeDirigido, setViajeDirigido] = useState("")
  const [numeroPuntosRecojo, setNumeroPuntosRecojo] = useState(1)
  const [puntosRecojo, setPuntosRecojo] = useState<PuntoRecojo[]>([{ ...puntoVacio }])
  const [horaInicial, setHoraInicial] = useState("")
  const [horaLlegada, setHoraLlegada] = useState("")
  const [fechaServicio, setFechaServicio] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [mostrarModalPuntos, setMostrarModalPuntos] = useState(false)
  const [solicitudCreada, setSolicitudCreada] = useState<SolicitudCreada | null>(null)

  const handleTelefonoChange = (value: string) => {
    setContactoTelefono(value.replace(/\D/g, "").slice(0, 9))
  }

  const actualizarPunto = (index: number, field: keyof PuntoRecojo, value: string) => {
    const copia = [...puntosRecojo]

    if (field === "telefono") {
      value = value.replace(/\D/g, "").slice(0, 9)
    }

    copia[index][field] = value
    setPuntosRecojo(copia)
  }

  const agregarPuntoRecojo = () => {
    if (puntosRecojo.length >= 20) {
      alert("Solo puedes agregar hasta 20 puntos de recojo")
      return
    }

    const nuevosPuntos = [...puntosRecojo, { ...puntoVacio }]
    setPuntosRecojo(nuevosPuntos)
    setNumeroPuntosRecojo(nuevosPuntos.length)
  }

  const eliminarPuntoRecojo = (index: number) => {
    if (puntosRecojo.length <= 1) {
      alert("Debe existir al menos un punto de recojo")
      return
    }

    const nuevosPuntos = puntosRecojo.filter((_, i) => i !== index)
    setPuntosRecojo(nuevosPuntos)
    setNumeroPuntosRecojo(nuevosPuntos.length)
  }

  const actualizarCantidadPuntos = (cantidad: number) => {
    if (cantidad < 1 || cantidad > 20) return

    setNumeroPuntosRecojo(cantidad)

    const nuevosPuntos = Array.from({ length: cantidad }, (_, index) => {
      return puntosRecojo[index] || { ...puntoVacio }
    })

    setPuntosRecojo(nuevosPuntos)

    if (cantidad >= 2) {
      setMostrarModalPuntos(true)
    }
  }

  const limpiarFormulario = () => {
    setCliente("")
    setContactoNombre("")
    setContactoTelefono("")
    setModalidad("")
    setViajeDirigido("")
    setNumeroPuntosRecojo(1)
    setPuntosRecojo([{ ...puntoVacio }])
    setHoraInicial("")
    setHoraLlegada("")
    setFechaServicio("")
    setObservaciones("")
  }

  const descargarSolicitud = (solicitud: SolicitudCreada) => {
    const pdf = new jsPDF("p", "mm", "a4")
    const codigo = solicitud.codigoSolicitud || "solicitud"
    const fechaDescarga = new Date().toLocaleString("es-PE")

    pdf.setFontSize(18)
    pdf.setFont("helvetica", "bold")
    pdf.text("M. RIVAS TRANSERVICE", 14, 18)

    pdf.setFontSize(14)
    pdf.text("SOLICITUD DE NUEVO SERVICIO", 14, 28)

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text(`Documento generado: ${fechaDescarga}`, 14, 35)

    autoTable(pdf, {
      startY: 42,
      head: [["Campo", "Detalle"]],
      body: [
        ["Código de solicitud", solicitud.codigoSolicitud],
        ["Estado", solicitud.estado],
        ["Cliente", solicitud.cliente],
        ["Contacto cliente", solicitud.contactoNombre],
        ["Teléfono contacto", solicitud.contactoTelefono],
        ["Modalidad", solicitud.modalidad],
        ["Viaje dirigido a", solicitud.viajeDirigido],
        ["Número de puntos de recojo", String(solicitud.numeroPuntosRecojo)],
        ["Fecha de servicio", solicitud.fechaServicio],
        ["Hora inicial estimada", solicitud.horaInicial],
        ["Hora llegada estimada", solicitud.horaLlegada],
        ["Solicitante", solicitud.solicitanteEmail],
        ["Rol solicitante", solicitud.solicitanteRol],
      ],
    })

    autoTable(pdf, {
      startY: (pdf as any).lastAutoTable.finalY + 10,
      head: [["#", "Personal / contacto", "Dirección", "Google Maps", "Teléfono"]],
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

    pdf.save(`${codigo}_solicitud_nuevo_servicio.pdf`)
  }

  const validarPuntosRecojo = () => {
    for (let i = 0; i < puntosRecojo.length; i++) {
      const punto = puntosRecojo[i]

      if (!punto.personal || !punto.direccion) {
        alert(`Completa Personal / contacto y Dirección del punto de recojo ${i + 1}`)
        return false
      }

      if (punto.telefono && punto.telefono.length !== 9) {
        alert(`El teléfono del punto de recojo ${i + 1} debe tener 9 dígitos`)
        return false
      }
    }

    return true
  }

  const enviarSolicitud = async () => {
    if (
      !cliente ||
      !contactoNombre ||
      !contactoTelefono ||
      !modalidad ||
      !viajeDirigido ||
      !horaInicial ||
      !horaLlegada ||
      !fechaServicio
    ) {
      alert("Completa los campos obligatorios")
      return
    }

    if (contactoTelefono.length !== 9) {
      alert("El teléfono contacto cliente debe tener exactamente 9 dígitos")
      return
    }

    if (!validarPuntosRecojo()) return

    try {
      const codigoSolicitud = `SOL-${Date.now()}`

      const nuevaSolicitud: SolicitudCreada = {
        codigoSolicitud,
        cliente,
        contactoNombre,
        contactoTelefono,
        modalidad,
        viajeDirigido,
        numeroPuntosRecojo,
        puntosRecojo,
        horaInicial,
        horaLlegada,
        fechaServicio,
        observaciones,
        estado: "pendiente",
        solicitanteEmail: user?.email || "No identificado",
        solicitanteRol: user?.role || "No identificado",
      }

      await addDoc(collection(db, "solicitudes_servicio"), {
        ...nuevaSolicitud,
        creadoEn: new Date(),
      })

      setSolicitudCreada(nuevaSolicitud)
      limpiarFormulario()
    } catch (error) {
      console.error(error)
      alert("Error al guardar la solicitud")
    }
  }

  return (
    <div style={styles.layout}>
      <Sidebar />

      <main style={styles.content}>
        <h1 style={styles.title}>Solicitud de Nuevo Servicio</h1>

        <p style={styles.subtitle}>
          Registra una solicitud para que sea revisada y aprobada posteriormente.
        </p>

        <div style={styles.userInfo}>
          <strong>Solicitante:</strong> {user?.email || "No identificado"}
        </div>

        <div style={styles.formCard}>
          <div style={styles.grid}>
            <Field label="Cliente">
              <select style={styles.input} value={cliente} onChange={(e) => setCliente(e.target.value)}>
                <option value="">Seleccionar cliente</option>
                <option>CENS</option>
                <option>ARPL</option>
                <option>UNACEM</option>
                <option>Cliente particular</option>
                <option>Otro</option>
              </select>
            </Field>

            <Field label="Nombre contacto cliente">
              <input style={styles.input} value={contactoNombre} onChange={(e) => setContactoNombre(e.target.value)} />
            </Field>

            <Field label="Teléfono contacto cliente">
              <input
                style={styles.input}
                value={contactoTelefono}
                onChange={(e) => handleTelefonoChange(e.target.value)}
                placeholder="Ejemplo: 987654321"
                maxLength={9}
              />
            </Field>

            <Field label="Seleccione modalidad">
              <select style={styles.input} value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
                <option value="">Seleccionar modalidad</option>
                <option>Fijo</option>
                <option>Eventual</option>
              </select>
            </Field>

            <Field label="El viaje es dirigido a">
              <select style={styles.input} value={viajeDirigido} onChange={(e) => setViajeDirigido(e.target.value)}>
                <option value="">Seleccionar opción</option>
                <option>Cajas</option>
                <option>Personal</option>
                <option>Documentos</option>
                <option>Equipos</option>
                <option>Otros</option>
              </select>
            </Field>

            <Field label="Número de puntos de recojo">
              <input
                type="number"
                min={1}
                max={20}
                style={styles.input}
                value={numeroPuntosRecojo}
                onChange={(e) => actualizarCantidadPuntos(Number(e.target.value))}
              />
            </Field>

            <Field label="Hora inicial de viaje estimada">
              <input type="time" style={styles.input} value={horaInicial} onChange={(e) => setHoraInicial(e.target.value)} />
            </Field>

            <Field label="Hora llegada estimada">
              <input type="time" style={styles.input} value={horaLlegada} onChange={(e) => setHoraLlegada(e.target.value)} />
            </Field>

            <Field label="Fecha de servicio">
              <input type="date" style={styles.input} value={fechaServicio} onChange={(e) => setFechaServicio(e.target.value)} />
            </Field>
          </div>

          <button style={styles.secondaryButton} onClick={() => setMostrarModalPuntos(true)}>
            Gestionar puntos de recojo ({puntosRecojo.length})
          </button>

          <Field label="Observaciones adicionales">
            <textarea style={styles.textarea} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </Field>

          <div style={styles.actions}>
            <button style={styles.cancelButton} onClick={limpiarFormulario}>
              Cancelar
            </button>

            <button style={styles.submitButton} onClick={enviarSolicitud}>
              Enviar Solicitud
            </button>
          </div>
        </div>
      </main>

      {mostrarModalPuntos && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalLarge}>
            <button style={styles.xButton} onClick={() => setMostrarModalPuntos(false)}>
              ×
            </button>

            <h2 style={styles.modalTitle}>Puntos de recojo</h2>

            <p style={styles.modalSubtitle}>
              Registra uno o más puntos de recojo. Los campos obligatorios son Personal / contacto y Dirección.
            </p>

            {puntosRecojo.map((punto, index) => (
              <div key={index} style={styles.puntoCard}>
                <div style={styles.puntoHeader}>
                  <h3 style={styles.puntoTitle}>Punto #{index + 1}</h3>

                  {puntosRecojo.length > 1 && (
                    <button style={styles.deletePointButton} onClick={() => eliminarPuntoRecojo(index)}>
                      Eliminar
                    </button>
                  )}
                </div>

                <input
                  style={styles.input}
                  placeholder="Personal / contacto *"
                  value={punto.personal}
                  onChange={(e) => actualizarPunto(index, "personal", e.target.value)}
                />

                <input
                  style={styles.input}
                  placeholder="Dirección *"
                  value={punto.direccion}
                  onChange={(e) => actualizarPunto(index, "direccion", e.target.value)}
                />

                <input
                  style={styles.input}
                  placeholder="Ubicación Google Maps"
                  value={punto.googleMaps}
                  onChange={(e) => actualizarPunto(index, "googleMaps", e.target.value)}
                />

                <input
                  style={styles.input}
                  placeholder="Número teléfono"
                  value={punto.telefono}
                  maxLength={9}
                  onChange={(e) => actualizarPunto(index, "telefono", e.target.value)}
                />
              </div>
            ))}

            <button style={styles.addPointButton} onClick={agregarPuntoRecojo}>
              + Agregar otro punto de recojo
            </button>

            <button style={styles.submitButtonFull} onClick={() => setMostrarModalPuntos(false)}>
              Guardar y cerrar ventana
            </button>
          </div>
        </div>
      )}

      {solicitudCreada && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Solicitud creada correctamente</h2>

            <p style={styles.modalText}>
              Solicitud N° <strong>{solicitudCreada.codigoSolicitud}</strong>
            </p>

            <p style={styles.modalSmall}>
              La solicitud fue registrada con estado <strong>pendiente</strong>.
            </p>

            <div style={styles.modalActions}>
              <button style={styles.downloadButton} onClick={() => descargarSolicitud(solicitudCreada)}>
                Descargar PDF
              </button>

              <button style={styles.closeButton} onClick={() => setSolicitudCreada(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
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
    padding: "30px",
  },

  title: {
    fontSize: "32px",
    marginBottom: "10px",
  },

  subtitle: {
    color: "#6b7280",
    marginBottom: "15px",
  },

  userInfo: {
    marginBottom: "25px",
    background: "#e5eefc",
    padding: "12px",
    borderRadius: "10px",
    color: "#0b1f3a",
    fontWeight: "bold",
  },

  formCard: {
    background: "#fff",
    padding: "30px",
    borderRadius: "18px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "22px",
    marginBottom: "20px",
  },

  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },

  label: {
    fontWeight: "bold",
    fontSize: "15px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    outline: "none",
    marginBottom: "10px",
  },

  textarea: {
    width: "100%",
    minHeight: "120px",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    resize: "vertical" as const,
    fontSize: "15px",
    boxSizing: "border-box" as const,
    marginTop: "10px",
  },

  actions: {
    display: "flex",
    gap: "15px",
    marginTop: "25px",
  },

  cancelButton: {
    flex: 1,
    background: "#374151",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  submitButton: {
    flex: 1,
    background: "#0b1f3a",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  submitButtonFull: {
    width: "100%",
    background: "#0b1f3a",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "15px",
  },

  secondaryButton: {
    background: "#e5eefc",
    color: "#0b1f3a",
    border: "1px solid #bfdbfe",
    padding: "12px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    marginBottom: "22px",
  },

  modalOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },

  modal: {
    background: "#fff",
    padding: "30px",
    borderRadius: "18px",
    width: "420px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
    textAlign: "center" as const,
  },

  modalLarge: {
    position: "relative" as const,
    background: "#fff",
    padding: "30px",
    borderRadius: "18px",
    width: "760px",
    maxWidth: "90vw",
    maxHeight: "85vh",
    overflowY: "auto" as const,
    boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
  },

  xButton: {
    position: "absolute" as const,
    top: "14px",
    right: "18px",
    background: "transparent",
    border: "none",
    fontSize: "26px",
    fontWeight: "bold",
    cursor: "pointer",
    color: "#374151",
  },

  modalTitle: {
    fontSize: "24px",
    marginBottom: "10px",
    color: "#0b1f3a",
  },

  modalSubtitle: {
    color: "#6b7280",
    marginBottom: "20px",
  },

  puntoCard: {
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    padding: "15px",
    marginBottom: "20px",
  },

  puntoHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },

  puntoTitle: {
    margin: 0,
    color: "#0b1f3a",
  },

  deletePointButton: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  addPointButton: {
    width: "100%",
    background: "#f8fafc",
    color: "#0b1f3a",
    border: "1px dashed #94a3b8",
    padding: "14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  modalText: {
    fontSize: "18px",
    marginBottom: "8px",
  },

  modalSmall: {
    color: "#6b7280",
    marginBottom: "24px",
  },

  modalActions: {
    display: "flex",
    gap: "12px",
  },

  downloadButton: {
    flex: 1,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  closeButton: {
    flex: 1,
    background: "#374151",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
}