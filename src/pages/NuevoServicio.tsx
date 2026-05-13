import { useState } from "react"
import { db } from "../firebase"
import { collection, addDoc } from "firebase/firestore"
import Sidebar from "../components/Sidebar"
import { useAuth } from "../context/AuthContext"

type SolicitudCreada = {
  codigoSolicitud: string
  cliente: string
  contactoNombre: string
  contactoTelefono: string
  conductor: string
  vehiculo: string
  fechaRecojo: string
  horaRecojo: string
  horaLlegada: string
  contenido: string
  ubicacionRecojo: string
  linkRecojoMaps: string
  ubicacionDestino: string
  linkDestinoMaps: string
  linkRutaMaps: string
  observaciones: string
  estado: string
  solicitanteEmail: string
  solicitanteRol: string
}

export default function NuevoServicio() {
  const { user } = useAuth()

  const [cliente, setCliente] = useState("")
  const [contactoNombre, setContactoNombre] = useState("")
  const [contactoTelefono, setContactoTelefono] = useState("")
  const [conductor, setConductor] = useState("")
  const [vehiculo, setVehiculo] = useState("")
  const [fechaRecojo, setFechaRecojo] = useState("")
  const [horaRecojo, setHoraRecojo] = useState("")
  const [horaLlegada, setHoraLlegada] = useState("")
  const [contenido, setContenido] = useState("")
  const [ubicacionRecojo, setUbicacionRecojo] = useState("")
  const [linkRecojoMaps, setLinkRecojoMaps] = useState("")
  const [ubicacionDestino, setUbicacionDestino] = useState("")
  const [linkDestinoMaps, setLinkDestinoMaps] = useState("")
  const [linkRutaMaps, setLinkRutaMaps] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [solicitudCreada, setSolicitudCreada] = useState<SolicitudCreada | null>(null)

  const handleTelefonoChange = (value: string) => {
    const soloNumeros = value.replace(/\D/g, "")
    if (soloNumeros.length <= 9) {
      setContactoTelefono(soloNumeros)
    }
  }

  const descargarSolicitud = (solicitud: SolicitudCreada) => {
    const contenidoSolicitud = `
M. RIVAS TRANSERVICE
SOLICITUD DE NUEVO SERVICIO

Código de solicitud: ${solicitud.codigoSolicitud}
Estado: ${solicitud.estado}

DATOS DEL CLIENTE
Cliente: ${solicitud.cliente}
Nombre del contacto: ${solicitud.contactoNombre}
Teléfono del contacto: ${solicitud.contactoTelefono}

DATOS DEL SERVICIO
Conductor asignado: ${solicitud.conductor}
Vehículo asignado: ${solicitud.vehiculo}
Fecha de recojo: ${solicitud.fechaRecojo}
Hora de recojo: ${solicitud.horaRecojo}
Hora llegada estimada: ${solicitud.horaLlegada}
Contenido: ${solicitud.contenido}

UBICACIONES
Ubicación de recojo: ${solicitud.ubicacionRecojo}
Link Google Maps recojo: ${solicitud.linkRecojoMaps}

Ubicación destino: ${solicitud.ubicacionDestino}
Link Google Maps destino: ${solicitud.linkDestinoMaps}

Link ruta Google Maps:
${solicitud.linkRutaMaps}

OBSERVACIONES
${solicitud.observaciones}

SOLICITANTE
Correo: ${solicitud.solicitanteEmail}
Rol: ${solicitud.solicitanteRol}
`

    const blob = new Blob([contenidoSolicitud], {
      type: "text/plain;charset=utf-8",
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${solicitud.codigoSolicitud}_solicitud_servicio.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const limpiarFormulario = () => {
    setCliente("")
    setContactoNombre("")
    setContactoTelefono("")
    setConductor("")
    setVehiculo("")
    setFechaRecojo("")
    setHoraRecojo("")
    setHoraLlegada("")
    setContenido("")
    setUbicacionRecojo("")
    setLinkRecojoMaps("")
    setUbicacionDestino("")
    setLinkDestinoMaps("")
    setLinkRutaMaps("")
    setObservaciones("")
  }

  const enviarSolicitud = async () => {
    if (
      !cliente ||
      !contactoNombre ||
      !contactoTelefono ||
      !fechaRecojo ||
      !horaRecojo ||
      !ubicacionRecojo ||
      !ubicacionDestino
    ) {
      alert("Completa los campos obligatorios")
      return
    }

    if (contactoTelefono.length !== 9) {
      alert("El teléfono debe tener exactamente 9 dígitos")
      return
    }

    try {
      const codigoSolicitud = `SOL-${Date.now()}`

      const nuevaSolicitud: SolicitudCreada = {
        codigoSolicitud,
        cliente,
        contactoNombre,
        contactoTelefono,
        conductor,
        vehiculo,
        fechaRecojo,
        horaRecojo,
        horaLlegada,
        contenido,
        ubicacionRecojo,
        linkRecojoMaps,
        ubicacionDestino,
        linkDestinoMaps,
        linkRutaMaps,
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

            <Field label="Nombre del contacto">
              <input style={styles.input} value={contactoNombre} onChange={(e) => setContactoNombre(e.target.value)} />
            </Field>

            <Field label="Teléfono del contacto">
              <input
                style={styles.input}
                value={contactoTelefono}
                onChange={(e) => handleTelefonoChange(e.target.value)}
                placeholder="Ejemplo: 987654321"
                maxLength={9}
              />
            </Field>

            <Field label="Conductor asignado">
              <select style={styles.input} value={conductor} onChange={(e) => setConductor(e.target.value)}>
                <option value="">Seleccionar conductor</option>
                <option>Kevin López</option>
                <option>Juan Pérez</option>
                <option>Carlos Ramos</option>
              </select>
            </Field>

            <Field label="Vehículo asignado">
              <select style={styles.input} value={vehiculo} onChange={(e) => setVehiculo(e.target.value)}>
                <option value="">Seleccionar vehículo</option>
                <option>Toyota Hiace - ABC-123</option>
                <option>Hyundai H1 - BCD-456</option>
                <option>Mercedes Vito - CDE-789</option>
              </select>
            </Field>

            <Field label="Fecha de recojo">
              <input type="date" style={styles.input} value={fechaRecojo} onChange={(e) => setFechaRecojo(e.target.value)} />
            </Field>

            <Field label="Hora de recojo">
              <input type="time" style={styles.input} value={horaRecojo} onChange={(e) => setHoraRecojo(e.target.value)} />
            </Field>

            <Field label="Hora llegada estimada">
              <input type="time" style={styles.input} value={horaLlegada} onChange={(e) => setHoraLlegada(e.target.value)} />
            </Field>

            <Field label="Contenido">
              <select style={styles.input} value={contenido} onChange={(e) => setContenido(e.target.value)}>
                <option value="">Seleccionar contenido</option>
                <option>Personal</option>
                <option>Documentos</option>
                <option>Equipos</option>
                <option>Carga ligera</option>
                <option>Otro</option>
              </select>
            </Field>

            <Field label="Ubicación recojo">
              <input style={styles.input} value={ubicacionRecojo} onChange={(e) => setUbicacionRecojo(e.target.value)} />
            </Field>

            <Field label="Link Google Maps recojo">
              <input style={styles.input} value={linkRecojoMaps} onChange={(e) => setLinkRecojoMaps(e.target.value)} placeholder="Pegar link de Google Maps" />
            </Field>

            <Field label="Ubicación destino">
              <input style={styles.input} value={ubicacionDestino} onChange={(e) => setUbicacionDestino(e.target.value)} />
            </Field>

            <Field label="Link Google Maps destino">
              <input style={styles.input} value={linkDestinoMaps} onChange={(e) => setLinkDestinoMaps(e.target.value)} placeholder="Pegar link de Google Maps" />
            </Field>

            <Field label="Link ruta Google Maps">
              <input style={styles.input} value={linkRutaMaps} onChange={(e) => setLinkRutaMaps(e.target.value)} placeholder="Pegar link de ruta completa" />
            </Field>
          </div>

          <Field label="Observaciones">
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
              <button
                style={styles.downloadButton}
                onClick={() => descargarSolicitud(solicitudCreada)}
              >
                ⬇️ Descargar Solicitud
              </button>

              <button
                style={styles.closeButton}
                onClick={() => setSolicitudCreada(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
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
    marginBottom: "25px",
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
    fontSize: "15px",
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
    fontSize: "15px",
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

  modalTitle: {
    fontSize: "24px",
    marginBottom: "12px",
    color: "#0b1f3a",
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
    fontSize: "15px",
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
    fontSize: "15px",
  },
}