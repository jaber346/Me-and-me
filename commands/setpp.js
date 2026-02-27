const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { newsletterCtx, normJid, getGroupAdmins } = require("../lib/news");

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

module.exports = {
  name: "setpp",
  category: "Group",
  description: "Changer la photo du groupe (reply image)",

  async execute(sock, m, args, { isGroup, prefix } = {}) {
    const from = m.key.remoteJid;
    if (!isGroup) return sock.sendMessage(from, { text: "❌ Commande groupe uniquement." }, { quoted: m });

    const sender = normJid(m.key.participant || m.sender);
    const { admins } = await getGroupAdmins(sock, from);

    const botJid = normJid(sock.user?.id);
    if (!admins.includes(botJid)) {
      return sock.sendMessage(from, { text: "❌ Je dois être *admin* pour setpp.", contextInfo: newsletterCtx() }, { quoted: m });
    }
    if (!admins.includes(sender)) {
      return sock.sendMessage(from, { text: "🚫 Seuls les admins peuvent utiliser cette commande.", contextInfo: newsletterCtx() }, { quoted: m });
    }

    const ctx = getContextInfo(m);
    const qMsg = ctx?.quotedMessage;
    const base = qMsg?.viewOnceMessageV2?.message || qMsg?.viewOnceMessage?.message || qMsg;

    if (!base?.imageMessage) {
      return sock.sendMessage(from, { text: `Utilisation : réponds à une *image* puis ${prefix || "."}setpp`, contextInfo: newsletterCtx() }, { quoted: m });
    }

    try {
      const stream = await downloadContentFromMessage(base.imageMessage, "image");
      const buffer = await streamToBuffer(stream);

      await sock.updateProfilePicture(from, buffer);
      return sock.sendMessage(from, { text: "✅ Photo de groupe mise à jour.", contextInfo: newsletterCtx() }, { quoted: m });
    } catch (e) {
      return sock.sendMessage(from, { text: "❌ Impossible de changer la photo (droits/format).", contextInfo: newsletterCtx() }, { quoted: m });
    }
  }
};
