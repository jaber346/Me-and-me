const axios = require("axios");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

function getContextInfo(m) {
  const msg = m.message || {};
  return (
    msg.extendedTextMessage?.contextInfo ||
    msg.imageMessage?.contextInfo ||
    msg.videoMessage?.contextInfo ||
    msg.documentMessage?.contextInfo ||
    null
  );
}

async function streamToBuffer(stream) {
  let buffer = Buffer.from([]);
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
  return buffer;
}

function buildMultipart(buffer, filename) {
  const boundary = "----NovaXmdBoundary" + Math.random().toString(16).slice(2);
  const crlf = "\r\n";

  const parts = [];
  const push = (s) => parts.push(Buffer.from(s, "utf8"));

  // reqtype
  push(`--${boundary}${crlf}`);
  push(`Content-Disposition: form-data; name="reqtype"${crlf}${crlf}`);
  push(`fileupload${crlf}`);

  // file
  push(`--${boundary}${crlf}`);
  push(`Content-Disposition: form-data; name="fileToUpload"; filename="${filename}"${crlf}`);
  push(`Content-Type: application/octet-stream${crlf}${crlf}`);
  parts.push(buffer);
  push(crlf);

  push(`--${boundary}--${crlf}`);

  return {
    body: Buffer.concat(parts),
    boundary
  };
}

module.exports = {
  name: "url",
  category: "Tools",
  description: "Uploader une image/vidéo et donner un lien (Catbox)",

  async execute(sock, m) {
    const from = m.key.remoteJid;

    const ctx = getContextInfo(m);
    const qMsg = ctx?.quotedMessage;

    if (!qMsg) {
      return sock.sendMessage(
        from,
        { text: "⚠️ Réponds à une image/vidéo avec *.url*" },
        { quoted: m }
      );
    }

    let type = null;
    let media = null;

    // viewonce wrapper
    const v2 = qMsg.viewOnceMessageV2?.message;
    const v1 = qMsg.viewOnceMessage?.message;
    const base = v2 || v1 || qMsg;

    if (base.imageMessage) {
      type = "image";
      media = base.imageMessage;
    } else if (base.videoMessage) {
      type = "video";
      media = base.videoMessage;
    } else if (base.documentMessage) {
      type = "document";
      media = base.documentMessage;
    }

    if (!type || !media) {
      return sock.sendMessage(
        from,
        { text: "❌ Média non supporté. Réponds à une image/vidéo/document." },
        { quoted: m }
      );
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Upload en cours..." }, { quoted: m });

      const stream = await downloadContentFromMessage(
        media,
        type === "image" ? "image" : type === "video" ? "video" : "document"
      );
      const buffer = await streamToBuffer(stream);

      const filename =
        type === "video" ? "nova.mp4" : type === "image" ? "nova.jpg" : "nova.bin";

      const { body, boundary } = buildMultipart(buffer, filename);

      const { data } = await axios.post("https://catbox.moe/user/api.php", body, {
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": body.length
        },
        timeout: 120000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });

      const url = String(data || "").trim();
      if (!url.startsWith("http")) throw new Error("Upload failed: " + url);

      return sock.sendMessage(from, { text: `✅ URL :\n${url}` }, { quoted: m });
    } catch (e) {
      return sock.sendMessage(
        from,
        { text: "❌ Erreur upload. Réessaie." },
        { quoted: m }
      );
    }
  }
};
