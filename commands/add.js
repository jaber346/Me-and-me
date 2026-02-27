const { newsletterCtx, normJid, getGroupAdmins } = require("../lib/news");

function onlyDigits(s){ return String(s||"").replace(/[^0-9]/g, ""); }

module.exports = {
  name: "add",
  category: "Group",
  description: "Ajouter un membre au groupe (admin)",

  async execute(sock, m, args, { isGroup, prefix } = {}) {
    const from = m.key.remoteJid;
    if (!isGroup) return sock.sendMessage(from, { text: "❌ Commande groupe uniquement." }, { quoted: m });

    const sender = normJid(m.key.participant || m.sender);
    const { admins } = await getGroupAdmins(sock, from);

    const botJid = normJid(sock.user?.id);
    if (!admins.includes(botJid)) {
      return sock.sendMessage(from, { text: "❌ Je dois être *admin* pour ajouter.", contextInfo: newsletterCtx() }, { quoted: m });
    }
    if (!admins.includes(sender)) {
      return sock.sendMessage(from, { text: "🚫 Seuls les admins peuvent utiliser cette commande.", contextInfo: newsletterCtx() }, { quoted: m });
    }

    const num = onlyDigits(args[0]);
    if (!num) {
      return sock.sendMessage(from, { text: `Utilisation : ${prefix || "."}add 226XXXXXXXX`, contextInfo: newsletterCtx() }, { quoted: m });
    }

    const jid = `${num}@s.whatsapp.net`;
    try {
      await sock.groupParticipantsUpdate(from, [jid], "add");
      return sock.sendMessage(from, { text: `✅ Ajout demandé : @${num}`, mentions: [jid], contextInfo: newsletterCtx() }, { quoted: m });
    } catch (e) {
      return sock.sendMessage(from, { text: "❌ Impossible d’ajouter ce numéro (il doit accepter, ou paramètres du groupe).", contextInfo: newsletterCtx() }, { quoted: m });
    }
  }
};
