const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

function getContextInfo(m) {
  const msg = m.message || {};
  return (
    msg.extendedTextMessage?.contextInfo ||
    msg.imageMessage?.contextInfo ||
    msg.videoMessage?.contextInfo ||
    msg.documentMessage?.contextInfo ||
    msg.buttonsResponseMessage?.contextInfo ||
    msg.listResponseMessage?.contextInfo ||
    msg.templateButtonReplyMessage?.contextInfo ||
    null
  );
}

function unwrapQuotedMessage(quoted) {
  if (!quoted) return null;

  // viewOnce wrappers
  const v2 = quoted.viewOnceMessageV2?.message;
  if (v2) return v2;

  const v1 = quoted.viewOnceMessage?.message;
  if (v1) return v1;

  // ephemeral wrapper inside quoted (rare)
  const eph = quoted.ephemeralMessage?.message;
  if (eph) return eph;

  return quoted;
}

async function streamToBuffer(stream) {
  let buffer = Buffer.from([]);
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
  return buffer;
}

module.exports = {
  name: "vv",
  category: "Tools",
  description: "Voir une image/vidéo view-once (répondre au view-once)",

  async execute(sock, m) {
    const from = m.key.remoteJid;

    const ctx = getContextInfo(m);
    const quotedMessage = ctx?.quotedMessage;
    if (!quotedMessage) {
      return sock.sendMessage(
        from,
        { text: "⚠️ Réponds à une image/vidéo *view-once* avec *.vv*" },
        { quoted: m }
      );
    }

    try {
      const q = unwrapQuotedMessage(quotedMessage);

      // image
      if (q?.imageMessage) {
        const stream = await downloadContentFromMessage(q.imageMessage, "image");
        const buffer = await streamToBuffer(stream);

        return sock.sendMessage(
          from,
          { image: buffer, caption: "👁️ View Once récupérée" },
          { quoted: m }
        );
      }

      // video
      if (q?.videoMessage) {
        const stream = await downloadContentFromMessage(q.videoMessage, "video");
        const buffer = await streamToBuffer(stream);

        return sock.sendMessage(
          from,
          { video: buffer, caption: "👁️ View Once récupérée" },
          { quoted: m }
        );
      }

      return sock.sendMessage(
        from,
        { text: "❌ Ce message n’est pas une image/vidéo view-once." },
        { quoted: m }
      );
    } catch (e) {
      return sock.sendMessage(
        from,
        { text: "❌ Impossible de récupérer le view-once." },
        { quoted: m }
      );
    }
  }
};
