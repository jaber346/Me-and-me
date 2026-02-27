const { newsletterCtx, normJid, getGroupAdmins } = require("../lib/news");

function getMentionedJids(m) {
  const ctx =
    m.message?.extendedTextMessage?.contextInfo ||
    m.message?.imageMessage?.contextInfo ||
    m.message?.videoMessage?.contextInfo ||
    null;
  return ctx?.mentionedJid || [];
}

module.exports = {
  name: "promote",
  category: "Group",
  description: "Promouvoir admin (reply/mention)",

  async execute(sock, m, args, { isGroup, prefix } = {}) {
    const from = m.key.remoteJid;
    if (!isGroup) return sock.sendMessage(from, { text: "❌ Commande groupe uniquement." }, { quoted: m });

    const sender = normJid(m.key.participant || m.sender);
    const { admins } = await getGroupAdmins(sock, from);

    const botJid = normJid(sock.user?.id);
    if (!admins.includes(botJid)) {
      return sock.sendMessage(from, { text: "❌ Je dois être *admin* pour promouvoir.", contextInfo: newsletterCtx() }, { quoted: m });
    }
    if (!admins.includes(sender)) {
      return sock.sendMessage(from, { text: "🚫 Seuls les admins peuvent utiliser cette commande.", contextInfo: newsletterCtx() }, { quoted: m });
    }

    const mentioned = getMentionedJids(m);
    let target = mentioned[0];

    // ou reply
    const q = m.message?.extendedTextMessage?.contextInfo?.participant;
    if (!target && q) target = q;

    if (!target) {
      return sock.sendMessage(from, { text: `Utilisation : ${prefix || "."}promote @membre (ou reply)`, contextInfo: newsletterCtx() }, { quoted: m });
    }
    target = normJid(target);

    try {
      await sock.groupParticipantsUpdate(from, [target], "promote");
      return sock.sendMessage(from, { text: `✅ Promu admin : @${target.split("@")[0]}`, mentions: [target], contextInfo: newsletterCtx() }, { quoted: m });
    } catch (e) {
      return sock.sendMessage(from, { text: "❌ Impossible de promouvoir (droits/limites).", contextInfo: newsletterCtx() }, { quoted: m });
    }
  }
};
