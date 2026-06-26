import { useEffect, useState } from "react"
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../firebase"

type Contacto = {
  nombre: string
  telefono: string
  cargo: string
}

type Cliente = {
  id: string
  nombreComercial: string
  razonSocial: string
  ruc: string
  logo: string
  contactos: Contacto[]
}

type UsuarioLocal = {
  email: string
  role: string
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)

  const userData = localStorage.getItem("user")
  const currentUser: UsuarioLocal | null = userData ? JSON.parse(userData) : null
  const esSuperAdmin = currentUser?.role === "superadmin"

  const [form, setForm] = useState({
    nombreComercial: "",
    razonSocial: "",
    ruc: "",
    logo: "",
    contactos: [{ nombre: "", telefono: "", cargo: "" }],
  })

  const cargarClientes = async () => {
    const querySnapshot = await getDocs(collection(db, "clientes"))
    const data = querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Cliente[]

    setClientes(data)
  }

  useEffect(() => {
    cargarClientes()
  }, [])

  const limpiarFormulario = () => {
    setForm({
      nombreComercial: "",
      razonSocial: "",
      ruc: "",
      logo: "",
      contactos: [{ nombre: "", telefono: "", cargo: "" }],
    })
    setEditando(null)
  }

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setForm({ ...form, logo: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  const guardarCliente = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.nombreComercial || !form.razonSocial || !form.ruc) {
      alert("Completa nombre comercial, razón social y RUC.")
      return
    }

    if (form.ruc.length !== 11) {
      alert("El RUC debe tener 11 dígitos.")
      return
    }

    setLoading(true)

    try {
      const contactosLimpios = form.contactos.filter(
        (c) => c.nombre || c.telefono || c.cargo
      )

      if (editando) {
        await updateDoc(doc(db, "clientes", editando.id), {
          nombreComercial: form.nombreComercial,
          razonSocial: form.razonSocial,
          ruc: form.ruc,
          logo: form.logo,
          contactos: contactosLimpios,
          actualizadoEn: serverTimestamp(),
        })
      } else {
        await addDoc(collection(db, "clientes"), {
          nombreComercial: form.nombreComercial,
          razonSocial: form.razonSocial,
          ruc: form.ruc,
          logo: form.logo,
          contactos: contactosLimpios,
          creadoEn: serverTimestamp(),
        })
      }

      await cargarClientes()
      limpiarFormulario()
    } catch (error) {
      console.error(error)
      alert("Ocurrió un error al guardar el cliente.")
    } finally {
      setLoading(false)
    }
  }

  const editarCliente = (cliente: Cliente) => {
    setEditando(cliente)
    setForm({
      nombreComercial: cliente.nombreComercial || "",
      razonSocial: cliente.razonSocial || "",
      ruc: cliente.ruc || "",
      logo: cliente.logo || "",
      contactos:
        cliente.contactos?.length > 0
          ? cliente.contactos
          : [{ nombre: "", telefono: "", cargo: "" }],
    })
  }

  const eliminarCliente = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este cliente?")) return

    try {
      await deleteDoc(doc(db, "clientes", id))
      await cargarClientes()
    } catch (error) {
      console.error(error)
      alert("No se pudo eliminar el cliente.")
    }
  }

  const actualizarContacto = (
    index: number,
    campo: keyof Contacto,
    valor: string
  ) => {
    const nuevosContactos = [...form.contactos]
    nuevosContactos[index][campo] = valor
    setForm({ ...form, contactos: nuevosContactos })
  }

  const agregarContacto = () => {
    setForm({
      ...form,
      contactos: [...form.contactos, { nombre: "", telefono: "", cargo: "" }],
    })
  }

  const eliminarContacto = (index: number) => {
    const nuevosContactos = form.contactos.filter((_, i) => i !== index)
    setForm({
      ...form,
      contactos:
        nuevosContactos.length > 0
          ? nuevosContactos
          : [{ nombre: "", telefono: "", cargo: "" }],
    })
  }

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div>
          <h1 style={styles.logo}>MRivas</h1>

          <nav style={styles.nav}>
            <a style={styles.navItem} href="/superadmin">⌂ Inicio</a>
            <a style={styles.navItem} href="/superadmin/nuevo-servicio">＋ Nuevo Servicio</a>
            <a style={styles.navItem} href="/superadmin/aprobaciones">✓ Aprobación Solicitudes</a>
            <a style={styles.navItemActive} href="/superadmin/clientes">▦ Clientes</a>
            <a style={styles.navItem} href="/superadmin/conductores">♙ Conductores</a>
            <a style={styles.navItem} href="/superadmin/vehiculos">▣ Vehículos</a>
            <a style={styles.navItem} href="/superadmin/finanzas">$ Finanzas</a>
            <a style={styles.navItem} href="/superadmin/incidencias">△ Incidencias</a>
            <a style={styles.navItem} href="/superadmin/reportes">▥ Reportes</a>
            <a style={styles.navItem} href="/superadmin/configuracion">⚙ Configuración</a>
          </nav>
        </div>

        <div style={styles.userBox}>
          <div style={styles.avatar}>K</div>
          <div>
            <div style={styles.userName}>Kevin Rivas</div>
            <div style={styles.userRole}>Superadmin</div>
          </div>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>Gestión de Clientes</h1>
          <p style={styles.pageSubtitle}>
            Registra clientes corporativos, razón social, RUC, logo y contactos internos.
          </p>
        </div>

        {esSuperAdmin && (
          <form onSubmit={guardarCliente}>
            <section style={styles.card}>
              <div style={styles.cardTitleRow}>
                <div style={styles.iconCircle}>👥</div>
                <h2 style={styles.cardTitle}>
                  {editando ? "Editar cliente" : "Registrar nuevo cliente"}
                </h2>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Nombre comercial *</label>
                  <input
                    style={styles.input}
                    value={form.nombreComercial}
                    onChange={(e) =>
                      setForm({ ...form, nombreComercial: e.target.value })
                    }
                    placeholder="Ej: UNACEM"
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Razón social *</label>
                  <input
                    style={styles.input}
                    value={form.razonSocial}
                    onChange={(e) =>
                      setForm({ ...form, razonSocial: e.target.value })
                    }
                    placeholder="Ej: Unión Andina de Cementos S.A.A."
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>RUC *</label>
                  <input
                    style={styles.input}
                    maxLength={11}
                    value={form.ruc}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ruc: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="11 dígitos"
                  />
                  <small style={styles.help}>Debe contener 11 dígitos numéricos.</small>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Logo del cliente</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogo}
                    style={styles.fileInput}
                  />
                </div>
              </div>

              {form.logo && (
                <img src={form.logo} alt="Logo cliente" style={styles.previewLogo} />
              )}
            </section>

            <section style={styles.card}>
              <div style={styles.cardHeaderBetween}>
                <div style={styles.cardTitleRow}>
                  <div style={styles.iconCircle}>👥</div>
                  <h2 style={styles.cardTitle}>Contactos internos</h2>
                </div>

                <button type="button" onClick={agregarContacto} style={styles.outlineButton}>
                  + Agregar contacto
                </button>
              </div>

              <div style={styles.contactTable}>
                <div style={styles.contactHeader}>
                  <span>Nombre</span>
                  <span>Teléfono</span>
                  <span>Cargo</span>
                  <span>Acciones</span>
                </div>

                {form.contactos.map((contacto, index) => (
                  <div key={index} style={styles.contactRow}>
                    <input
                      style={styles.tableInput}
                      value={contacto.nombre}
                      onChange={(e) =>
                        actualizarContacto(index, "nombre", e.target.value)
                      }
                      placeholder="Nombre completo"
                    />

                    <input
                      style={styles.tableInput}
                      maxLength={9}
                      value={contacto.telefono}
                      onChange={(e) =>
                        actualizarContacto(
                          index,
                          "telefono",
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                      placeholder="Ej: 999999999"
                    />

                    <input
                      style={styles.tableInput}
                      value={contacto.cargo}
                      onChange={(e) =>
                        actualizarContacto(index, "cargo", e.target.value)
                      }
                      placeholder="Ej: Jefe de Logística"
                    />

                    <button
                      type="button"
                      onClick={() => eliminarContacto(index)}
                      style={styles.iconDangerButton}
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <div style={styles.actions}>
              {editando && (
                <button type="button" onClick={limpiarFormulario} style={styles.cancelButton}>
                  Cancelar
                </button>
              )}

              <button type="submit" disabled={loading} style={styles.saveButton}>
                💾{" "}
                {loading
                  ? "Guardando..."
                  : editando
                  ? "Actualizar cliente"
                  : "Guardar cliente"}
              </button>
            </div>
          </form>
        )}

        <section style={styles.card}>
          <div style={styles.cardHeaderBetween}>
            <div style={styles.cardTitleRow}>
              <div style={styles.iconCircle}>🏢</div>
              <h2 style={styles.cardTitle}>Clientes registrados</h2>
            </div>

            <input style={styles.searchInput} placeholder="Buscar cliente..." />
          </div>

          {clientes.length === 0 ? (
            <p style={styles.empty}>No hay clientes registrados todavía.</p>
          ) : (
            <div style={styles.clientsTable}>
              <div style={styles.clientsHeader}>
                <span>Logo</span>
                <span>Nombre comercial</span>
                <span>Razón social</span>
                <span>RUC</span>
                <span>Contactos</span>
                {esSuperAdmin && <span>Acciones</span>}
              </div>

              {clientes.map((cliente) => (
                <div key={cliente.id} style={styles.clientsRow}>
                  <div>
                    {cliente.logo ? (
                      <img src={cliente.logo} alt={cliente.nombreComercial} style={styles.logoSmall} />
                    ) : (
                      <div style={styles.logoPlaceholder}>Logo</div>
                    )}
                  </div>

                  <span>{cliente.nombreComercial}</span>
                  <span>{cliente.razonSocial}</span>
                  <span>{cliente.ruc}</span>
                  <span style={styles.linkText}>
                    {cliente.contactos?.length || 0} contactos
                  </span>

                  {esSuperAdmin && (
                    <div style={styles.rowActions}>
                      <button onClick={() => editarCliente(cliente)} style={styles.editButton}>
                        ✎
                      </button>
                      <button onClick={() => eliminarCliente(cliente.id)} style={styles.iconDangerButton}>
                        🗑
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#f7f9fc",
    fontFamily: "Inter, Arial, sans-serif",
    color: "#0f172a",
  },
  sidebar: {
    width: "230px",
    background: "linear-gradient(180deg, #071f3d 0%, #061b35 100%)",
    color: "#fff",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    height: "100vh",
    boxSizing: "border-box",
  },
  logo: {
    fontSize: "22px",
    fontWeight: 800,
    margin: "0 0 30px 6px",
    letterSpacing: "0.3px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  navItem: {
    color: "#dbeafe",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 600,
    padding: "11px 12px",
    borderRadius: "10px",
    display: "block",
  },
  navItemActive: {
    color: "#ffffff",
    background: "linear-gradient(90deg, #174ea6 0%, #103b82 100%)",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 800,
    padding: "11px 12px",
    borderRadius: "10px",
    display: "block",
    boxShadow: "0 8px 18px rgba(23, 78, 166, 0.25)",
  },
  userBox: {
    borderTop: "1px solid rgba(255,255,255,0.1)",
    paddingTop: "16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "#1e40af",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
  },
  userName: {
    fontSize: "13px",
    fontWeight: 800,
  },
  userRole: {
    fontSize: "12px",
    color: "#bfdbfe",
  },
  main: {
    flex: 1,
    padding: "36px 56px",
    maxWidth: "calc(100vw - 230px)",
    boxSizing: "border-box",
  },
  header: {
    marginBottom: "24px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "22px",
  },
  pageTitle: {
    fontSize: "31px",
    color: "#08285a",
    margin: 0,
    fontWeight: 850,
  },
  pageSubtitle: {
    color: "#64748b",
    fontSize: "15px",
    marginTop: "8px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "24px",
    marginBottom: "18px",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.05)",
  },
  cardTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "22px",
  },
  iconCircle: {
    color: "#2563eb",
    fontSize: "22px",
  },
  cardTitle: {
    fontSize: "18px",
    color: "#08285a",
    margin: 0,
    fontWeight: 850,
  },
  cardHeaderBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "18px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#0f172a",
  },
  input: {
    height: "46px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "0 14px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  },
  fileInput: {
    height: "46px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "14px",
    background: "#fff",
    boxSizing: "border-box",
  },
  help: {
    color: "#64748b",
    fontSize: "12px",
  },
  previewLogo: {
    marginTop: "18px",
    width: "76px",
    height: "76px",
    objectFit: "contain",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "8px",
  },
  contactTable: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
  },
  contactHeader: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 110px",
    gap: "14px",
    background: "#f8fafc",
    padding: "14px",
    fontSize: "13px",
    fontWeight: 800,
    color: "#334155",
  },
  contactRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 110px",
    gap: "14px",
    padding: "12px",
    borderTop: "1px solid #e2e8f0",
    alignItems: "center",
  },
  tableInput: {
    height: "40px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0 12px",
    fontSize: "14px",
  },
  outlineButton: {
    height: "38px",
    padding: "0 18px",
    borderRadius: "9px",
    border: "1px solid #93c5fd",
    background: "#ffffff",
    color: "#1d4ed8",
    fontWeight: 800,
    cursor: "pointer",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginBottom: "22px",
  },
  cancelButton: {
    height: "44px",
    padding: "0 24px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    fontWeight: 800,
    color: "#334155",
    cursor: "pointer",
  },
  saveButton: {
    height: "44px",
    padding: "0 26px",
    borderRadius: "10px",
    border: "none",
    background: "#08285a",
    color: "#ffffff",
    fontWeight: 850,
    cursor: "pointer",
  },
  iconDangerButton: {
    width: "38px",
    height: "38px",
    borderRadius: "9px",
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#dc2626",
    cursor: "pointer",
    fontWeight: 800,
  },
  editButton: {
    width: "38px",
    height: "38px",
    borderRadius: "9px",
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: 800,
  },
  searchInput: {
    width: "260px",
    height: "40px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "0 14px",
    fontSize: "14px",
  },
  empty: {
    color: "#64748b",
    fontSize: "14px",
  },
  clientsTable: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
  },
  clientsHeader: {
    display: "grid",
    gridTemplateColumns: "90px 1.2fr 1.6fr 1fr 1fr 120px",
    background: "#f8fafc",
    padding: "14px 16px",
    fontSize: "13px",
    fontWeight: 850,
    color: "#334155",
  },
  clientsRow: {
    display: "grid",
    gridTemplateColumns: "90px 1.2fr 1.6fr 1fr 1fr 120px",
    padding: "14px 16px",
    borderTop: "1px solid #e2e8f0",
    alignItems: "center",
    fontSize: "14px",
    color: "#334155",
  },
  logoSmall: {
    width: "48px",
    height: "48px",
    objectFit: "contain",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "5px",
  },
  logoPlaceholder: {
    width: "48px",
    height: "48px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    fontSize: "11px",
  },
  linkText: {
    color: "#2563eb",
    fontWeight: 800,
  },
  rowActions: {
    display: "flex",
    gap: "8px",
  },
}