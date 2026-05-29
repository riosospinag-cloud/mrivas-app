import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";

const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = defineSecret("TELEGRAM_CHAT_ID");

const enviarTelegram = async (mensaje: string) => {
  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN.value()}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID.value(),
        text: mensaje,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔎 Revisar en M.Rivas App",
                url: "https://mrivas-app.vercel.app/superadmin/aprobaciones",
              },
            ],
          ],
        },
      }),
    }
  );
};

const obtenerRuta = (data: any) => {
  const puntos = data.puntosRecojo || [];

  if (puntos.length === 0) return "No especificado";
  if (puntos.length === 1) return puntos[0]?.direccion || "No especificado";

  return `${puntos[0]?.direccion || "No especificado"} → ${
    puntos[puntos.length - 1]?.direccion || "No especificado"
  }`;
};

const obtenerDestino = (data: any) => {
  const puntos = data.puntosRecojo || [];

  if (puntos.length === 0) return "No especificado";

  return puntos[puntos.length - 1]?.direccion || "No especificado";
};

const obtenerNumeroPuntos = (data: any) => {
  return data.numeroPuntosRecojo || data.puntosRecojo?.length || 0;
};

const obtenerAsignacion = (data: any) => {
  const asignaciones = data.conductoresAsignados || [];

  if (asignaciones.length === 0) return "No asignado";

  return asignaciones
    .map(
      (item: any, index: number) =>
        `\n${index + 1}. Conductor: ${item.conductor || "-"}\n   Vehículo: ${
          item.vehiculo || "-"
        }\n   Puntos: ${
          item.puntosAsignados?.map((p: number) => `Punto ${p + 1}`).join(", ") ||
          "-"
        }`
    )
    .join("\n");
};

const obtenerCronograma = (data: any) => {
  const cronograma = data.cronogramaViaje || [];

  if (cronograma.length === 0) return "No asignado";

  return cronograma
    .map(
      (item: any) =>
        `\nPunto ${item.puntoIndex + 1}: ${item.direccion || "-"}\nFecha: ${
          item.fechaLlegada || "-"
        }\nHora: ${item.horaLlegada || "-"}`
    )
    .join("\n");
};

export const nuevaSolicitudTelegram = onDocumentCreated(
  {
    document: "solicitudes_servicio/{solicitudId}",
    secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID],
    region: "us-central1",
  },
  async (event) => {
    const data = event.data?.data();

    if (!data) return;

    const puntosRecojo = data.puntosRecojo || [];

    const origen =
      puntosRecojo.length > 0
        ? puntosRecojo[0]?.direccion || "No especificado"
        : "No especificado";

    const mensaje = `
🚨 NUEVA SOLICITUD DE SERVICIO

📌 Código de Solicitud: ${data.codigoSolicitud || "Sin código"}
👤 Cliente: ${data.cliente || "No especificado"}
📍 Origen: ${origen}
🔢 Número de puntos: ${obtenerNumeroPuntos(data)}
🏁 Destino: ${obtenerDestino(data)}
📅 Fecha de Servicio: ${data.fechaServicio || "No especificada"}
🕘 Hora de Inicio estimada: ${data.horaInicial || "No especificada"}
🕓 Hora de Llegada estimada: ${data.horaLlegada || "No especificada"}
🚦 Estado de Solicitud: ${data.estado || "pendiente"}

Revisar en M.Rivas App.
`;

    await enviarTelegram(mensaje);
  }
);

export const solicitudAprobadaTelegram = onDocumentUpdated(
  {
    document: "solicitudes_servicio/{solicitudId}",
    secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID],
    region: "us-central1",
  },
  async (event) => {
    const antes = event.data?.before.data();
    const despues = event.data?.after.data();

    if (!antes || !despues) return;

    if (antes.estado === despues.estado) return;

    if (despues.estado !== "aprobado") return;

    const mensaje = `
✅ SOLICITUD APROBADA

📌 Código de Solicitud: ${despues.codigoSolicitud || "Sin código"}
👤 Cliente: ${despues.cliente || "No especificado"}
🚦 Estado de Solicitud: ${despues.estado || "aprobado"}

📍 Ruta:
${obtenerRuta(despues)}

🔢 Número de puntos: ${obtenerNumeroPuntos(despues)}

📅 Fecha de Servicio: ${despues.fechaServicio || "No especificada"}
🕘 Hora de Inicio estimada: ${despues.horaInicial || "No especificada"}
🕓 Hora de Llegada estimada: ${despues.horaLlegada || "No especificada"}

🚐 ASIGNACIÓN OPERATIVA:
${obtenerAsignacion(despues)}

🗓️ CRONOGRAMA DE VIAJE:
${obtenerCronograma(despues)}

Revisar en M.Rivas App.
`;

    await enviarTelegram(mensaje);
  }
);