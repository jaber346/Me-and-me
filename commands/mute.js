const { newsletterCtx, normJid, getGroupAdmins } = require("../lib/news");

module.exports = {
  name: "mute",
  category: "Group",
  description: "Fermer le groupe (seuls admins peuvent écrire)",

  async execute(sock, m, args, { isGroup } = {}) {
    const from = m.key.remoteJid;
    if (!isGroup) return sock.sendMessage(from, { text: "❌ Commande groupe uniquement." }, { quoted: m });

    const sender = normJid(m.key.participant || m.sender);
    const { meta, admins } = await getGroupAdmins(sock, from);

    // bot admin ?
    const botJid = normJid(sock.user?.id);
    if (!admins.includes(botJid)) {
      return sock.sendMessage(from, { text: "❌ Je dois être *admin* pour fermer le groupe.", contextInfo: newsletterCtx() }, { quoted: m });
    }

    if (!admins.includes(sender)) {
      return sock.sendMessage(from, { text: "🚫 Seuls les admins peuvent utiliser cette commande.", contextInfo: newsletterCtx() }, { quoted: m });
    }

    try {
      await sock.groupSettingUpdate(from, "announcement"); // ferme
      return sock.sendMessage(from, { text: `🔒 Groupe *fermé* : seuls les admins peuvent écrire.\n👥 ${meta.subject || ""}`, contextInfo: newsletterCtx() }, { quoted: m });
    } catch (e) {
      return sock.sendMessage(from, { text: "❌ Impossible de fermer le groupe (droits insuffisants).", contextInfo: newsletterCtx() }, { quoted: m });
    }
  }
};
