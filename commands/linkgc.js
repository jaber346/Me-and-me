const { newsletterCtx, normJid, getGroupAdmins } = require("../lib/news");

module.exports = {
  name: "linkgc",
  category: "Group",
  description: "Afficher le lien d’invitation du groupe",

  async execute(sock, m, args, { isGroup } = {}) {
    const from = m.key.remoteJid;
    if (!isGroup) return sock.sendMessage(from, { text: "❌ Commande groupe uniquement." }, { quoted: m });

    const sender = normJid(m.key.participant || m.sender);
    const { meta, admins } = await getGroupAdmins(sock, from);

    const botJid = normJid(sock.user?.id);
    if (!admins.includes(botJid)) {
      return sock.sendMessage(from, { text: "❌ Je dois être *admin* pour récupérer le lien.", contextInfo: newsletterCtx() }, { quoted: m });
    }

    if (!admins.includes(sender)) {
      return sock.sendMessage(from, { text: "🚫 Seuls les admins peuvent utiliser cette commande.", contextInfo: newsletterCtx() }, { quoted: m });
    }

    try {
      const code = await sock.groupInviteCode(from);
      const link = `https://chat.whatsapp.com/${code}`;
      return sock.sendMessage(from, { text: `🔗 *Lien du groupe*\n👥 ${meta.subject || ""}\n\n${link}`, contextInfo: newsletterCtx() }, { quoted: m });
    } catch (e) {
      return sock.sendMessage(from, { text: "❌ Impossible de récupérer le lien.", contextInfo: newsletterCtx() }, { quoted: m });
    }
  }
};
