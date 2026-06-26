import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import Sidebar from "../components/Sidebar";

type PuntoRecojo = {
  numero: number;
  persona: string;
  direccion: string;
  ubicacionGoogleMaps: string;
  telefono: string;
};

export default function NuevoServicio() {
  const [codigoSolicitud, setCodigoSolicitud] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [nombreContacto, setNombreContacto] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [modalidad, setModalidad] = useState("");
  const [dirigidoA, setDirigidoA] = useState("");
  const [fechaServicio, setFechaServicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaLlegada, setHoraLlegada] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [destinoFinalDireccion, setDestinoFinalDireccion] = useState("");
  const [destinoFinalUbicacion, setDestinoFinalUbicacion] = useState("");
  const [destinoFinalReferencia, setDestinoFinalReferencia] = useState("");

  const [cantidadPuntos, setCantidadPuntos] = useState(1);
  const [puntosRecojo, setPuntosRecojo] = useState<PuntoRecojo[]>([
    { numero: 1, persona: "", direccion: "", ubicacionGoogleMaps: "", telefono: "" },
  ]);

  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const fecha = new Date();
    setCodigoSolicitud(`SOL-${fecha.getFullYear()}-${String(fecha.getTime()).slice(-6)}`);
  }, []);

  const actualizarCantidadPuntos = (cantidad: number) => {
    setCantidadPuntos(cantidad);

    const nuevosPuntos = Array.from({ length: cantidad }, (_, index) => {
      return (
        puntosRecojo[index] || {
          numero: index + 1,
          persona: "",
          direccion: "",
          ubicacionGoogleMaps: "",
          telefono: "",
        }
      );
    });

    setPuntosRecojo(nuevosPuntos);
  };

  const actualizarPunto = (
    index: number,
    campo: keyof PuntoRecojo,
    valor: string
  ) => {
    const copia = [...puntosRecojo];
    copia[index] = { ...copia[index], [campo]: valor };
    setPuntosRecojo(copia);
  };

  const validarFormulario = () => {
    if (!clienteNombre.trim()) return "Ingresa el nombre del cliente.";
    if (!nombreContacto.trim()) return "Ingresa el nombre del contacto.";
    if (!telefonoContacto.trim()) return "Ingresa el teléfono del contacto.";
    if (!modalidad) return "Selecciona la modalidad.";
    if (!dirigidoA) return "Selecciona a qué está dirigido el servicio.";
    if (!fechaServicio) return "Selecciona la fecha del servicio.";
    if (!horaInicio) return "Ingresa la hora inicial estimada.";
    if (!horaLlegada) return "Ingresa la hora de llegada estimada.";
    if (!destinoFinalDireccion.trim()) return "Ingresa la dirección del punto final.";
    if (!destinoFinalUbicacion.trim()) return "Ingresa el link de Google Maps del punto final.";

    for (const punto of puntosRecojo) {
      if (!punto.persona.trim()) return `Ingresa la persona del punto ${punto.numero}.`;
      if (!punto.direccion.trim()) return `Ingresa la dirección del punto ${punto.numero}.`;
      if (!punto.ubicacionGoogleMaps.trim()) return `Ingresa el link de Google Maps del punto ${punto.numero}.`;
      if (!punto.telefono.trim()) return `Ingresa el teléfono del punto ${punto.numero}.`;
    }

    return null;
  };

  const crearSolicitud = async () => {
    const error = validarFormulario();
    if (error) {
      alert(error);
      return;
    }

    try {
      setGuardando(true);
      const user = auth.currentUser;

      await addDoc(collection(db, "solicitudes_servicio"), {
        codigoSolicitud,

        cliente: clienteNombre,
        clienteNombre,

        contactoNombre: nombreContacto,
        nombreContacto,

        contactoTelefono: telefonoContacto,
        telefonoContacto,

        modalidad,
        contenido: dirigidoA,
        dirigidoA,

        fechaRecojo: fechaServicio,
        fechaServicio,

        horaRecojo: horaInicio,
        horaInicio,

        horaLlegada,
        observaciones,

        destinoFinal: {
          direccion: destinoFinalDireccion,
          ubicacionGoogleMaps: destinoFinalUbicacion,
          referencia: destinoFinalReferencia,
        },

        linkDestinoMaps: destinoFinalUbicacion,

        puntosRecojo,
        cantidadPuntos,

        estado: "pendiente_ofertas",
        conductor: "",
        vehiculo: "",

        creadoPorUid: user?.uid || null,
        creadoPorEmail: user?.email || null,
        creadoEn: serverTimestamp(),
      });

      alert("Solicitud creada correctamente.");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al crear la solicitud.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <style>{`
        .nuevo-servicio-layout {
          display: flex;
          min-height: 100vh;
          background: #f3f6fb;
        }

        .nuevo-servicio-main {
          flex: 1;
          width: 100%;
          min-width: 0;
        }

        .nuevo-servicio-page {
          min-height: 100vh;
          background: #f3f6fb;
          padding: 24px;
        }

        .nuevo-servicio-container {
          max-width: 1100px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 22px;
          padding: 28px;
          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.08);
        }

        .nuevo-servicio-header {
          margin-bottom: 24px;
        }

        .nuevo-servicio-title {
          font-size: 28px;
          font-weight: 800;
          color: #0f2f5f;
          margin: 0 0 8px;
        }

        .nuevo-servicio-subtitle {
          color: #64748b;
          margin: 0;
          font-size: 15px;
        }

        .section-card {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 20px;
          margin-bottom: 22px;
          background: #ffffff;
        }

        .section-card.highlight {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .section-title {
          font-size: 18px;
          font-weight: 800;
          color: #0f2f5f;
          margin: 0 0 16px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group.full {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 15px;
          outline: none;
          background: #ffffff;
          color: #0f172a;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .readonly {
          background: #f8fafc;
          font-weight: 700;
          color: #334155;
        }

        .puntos-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .punto-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px;
          margin-bottom: 16px;
        }

        .punto-title {
          font-size: 16px;
          font-weight: 800;
          color: #0f2f5f;
          margin: 0 0 14px;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .btn-primary {
          border: none;
          border-radius: 14px;
          background: #0f2f5f;
          color: white;
          padding: 14px 24px;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          min-width: 180px;
        }

        .btn-primary:hover {
          background: #123f80;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .nuevo-servicio-page {
            padding: 76px 14px 14px;
          }

          .nuevo-servicio-container {
            padding: 18px;
            border-radius: 18px;
          }

          .nuevo-servicio-title {
            font-size: 23px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .puntos-header {
            flex-direction: column;
            align-items: stretch;
          }

          .actions {
            justify-content: stretch;
          }

          .btn-primary {
            width: 100%;
          }
        }
      `}</style>

      <div className="nuevo-servicio-layout">
        <Sidebar />

        <main className="nuevo-servicio-main">
          <div className="nuevo-servicio-page">
            <div className="nuevo-servicio-container">
              <div className="nuevo-servicio-header">
                <h1 className="nuevo-servicio-title">Nueva Solicitud de Servicio</h1>
                <p className="nuevo-servicio-subtitle">
                  Registra la solicitud con puntos de recojo, punto final común y datos operativos.
                </p>
              </div>

              <div className="section-card">
                <div className="form-group">
                  <label className="form-label">Código de solicitud</label>
                  <input className="form-input readonly" value={codigoSolicitud} readOnly />
                </div>
              </div>

              <div className="section-card">
                <h2 className="section-title">Datos generales</h2>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Cliente</label>
                    <select
    className="form-select"
    value={clienteNombre}
    onChange={(e) => setClienteNombre(e.target.value)}
  >
    <option value="">Seleccionar cliente</option>
    <option value="ARPL">ARPL</option>
    <option value="UNACEM">UNACEM</option>
    <option value="UNICOM">UNICOM</option>
    <option value="CONCREMAX">CONCREMAX</option>
  </select>
</div>

                  <div className="form-group">
                    <label className="form-label">Nombre de contacto</label>
                    <input className="form-input" value={nombreContacto} onChange={(e) => setNombreContacto(e.target.value)} placeholder="Ej: Juan Pérez" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Teléfono de contacto</label>
                    <input className="form-input" value={telefonoContacto} onChange={(e) => setTelefonoContacto(e.target.value)} placeholder="Ej: 999999999" maxLength={9} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Modalidad</label>
                    <select className="form-select" value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
                      <option value="">Seleccionar</option>
                      <option value="Fijo">Fijo</option>
                      <option value="Eventual">Eventual</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dirigido a</label>
                    <select className="form-select" value={dirigidoA} onChange={(e) => setDirigidoA(e.target.value)}>
                      <option value="">Seleccionar</option>
                      <option value="Personal">Personal</option>
                      <option value="Cajas">Cajas</option>
                      <option value="Documentos">Documentos</option>
                      <option value="Equipos">Equipos</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fecha del servicio</label>
                    <input className="form-input" type="date" value={fechaServicio} onChange={(e) => setFechaServicio(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hora inicial estimada</label>
                    <input className="form-input" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hora llegada estimada</label>
                    <input className="form-input" type="time" value={horaLlegada} onChange={(e) => setHoraLlegada(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="section-card highlight">
                <h2 className="section-title">Punto final común</h2>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Dirección final</label>
                    <input className="form-input" value={destinoFinalDireccion} onChange={(e) => setDestinoFinalDireccion(e.target.value)} placeholder="Ej: Av. Javier Prado 123, San Isidro" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ubicación Google Maps final</label>
                    <input className="form-input" value={destinoFinalUbicacion} onChange={(e) => setDestinoFinalUbicacion(e.target.value)} placeholder="Pegar link de Google Maps" />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">Referencia final</label>
                    <input className="form-input" value={destinoFinalReferencia} onChange={(e) => setDestinoFinalReferencia(e.target.value)} placeholder="Ej: puerta principal, garita, recepción, almacén" />
                  </div>
                </div>
              </div>

              <div className="section-card">
                <div className="puntos-header">
                  <div>
                    <h2 className="section-title">Puntos de recojo</h2>
                    <p className="nuevo-servicio-subtitle">
                      Los conductores podrán ofertar por todos o por puntos específicos.
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cantidad de puntos</label>
                    <select className="form-select" value={cantidadPuntos} onChange={(e) => actualizarCantidadPuntos(Number(e.target.value))}>
                      {Array.from({ length: 20 }, (_, index) => (
                        <option key={index + 1} value={index + 1}>{index + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {puntosRecojo.map((punto, index) => (
                  <div className="punto-card" key={punto.numero}>
                    <h3 className="punto-title">Punto {punto.numero}</h3>

                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Persona / responsable</label>
                        <input className="form-input" value={punto.persona} onChange={(e) => actualizarPunto(index, "persona", e.target.value)} placeholder="Ej: Juan Pérez" />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Teléfono</label>
                        <input className="form-input" value={punto.telefono} onChange={(e) => actualizarPunto(index, "telefono", e.target.value)} placeholder="Ej: 999999999" maxLength={9} />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Dirección de recojo</label>
                        <input className="form-input" value={punto.direccion} onChange={(e) => actualizarPunto(index, "direccion", e.target.value)} placeholder="Ej: Av. Primavera 500, Surco" />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Ubicación Google Maps</label>
                        <input className="form-input" value={punto.ubicacionGoogleMaps} onChange={(e) => actualizarPunto(index, "ubicacionGoogleMaps", e.target.value)} placeholder="Pegar link de Google Maps" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="section-card">
                <div className="form-group">
                  <label className="form-label">Observaciones generales</label>
                  <textarea className="form-textarea" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={4} placeholder="Agregar indicaciones especiales del servicio..." />
                </div>
              </div>

              <div className="actions">
                <button className="btn-primary" onClick={crearSolicitud} disabled={guardando}>
                  {guardando ? "Guardando..." : "Crear solicitud"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}