import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";

const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = defineSecret("TELEGRAM_CHAT_ID");

export const nuevaSolicitudTelegram = onDocumentCreated(
  {
    document: "solicitudes_servicio/{solicitudId}",
    secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID],
    region: "us-central1",
  },
  async (event) => {
    const data = event.data?.data();

    if (!data) return;

    const mensaje = `
🚨 NUEVA SOLICITUD DE SERVICIO

📌 Código: ${data.codigo || "Sin código"}
👤 Cliente: ${data.cliente || "No especificado"}
📍 Origen: ${data.origen || "No especificado"}
🏁 Destino: ${data.destino || "No especificado"}
📅 Fecha: ${data.fechaRecojo || "No especificada"}
🕘 Hora: ${data.horaRecojo || "No especificada"}
🚦 Estado: ${data.estado || "Pendiente"}

Revisar en M.Rivas App.
`;

    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN.value()}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
  }
);