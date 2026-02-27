// commands/stop.js
const config = require("../config");
global.kickallJobs = global.kickallJobs || new Map();

function newsletterCtx() {
  return {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363423249667073@newsletter",
      newsletterName: config.BOT_NAME || "NOVA XMD V1",
      serverMessageId: 1
    }
  };
}

module.exports = {
  name: "stop",
  category: "Group",
  description: "Stopper une action en cours (ex: kickall)",

  async execute(sock, m, args, { isGroup, isOwner, prefix } = {}) {
    const from = m.key.remoteJid;

    if (!isGroup) {
      return sock.sendMessage(from, { text: "❌ Commande groupe uniquement." }, { quoted: m });
    }

    // sécurité: owner ou admin (on garde owner pour être safe)
    if (!isOwner) {
      return sock.sendMessage(from, { text: "🚫 Commande réservée au propriétaire.", contextInfo: newsletterCtx() }, { quoted: m });
    }

    const job = global.kickallJobs.get(from);
    if (!job) {
      return sock.sendMessage(from, { text: "ℹ️ Aucune action en cours.", contextInfo: newsletterCtx() }, { quoted: m });
    }

    job.stop = true;
    return sock.sendMessage(from, { text: `🛑 Stop demandé.`, contextInfo: newsletterCtx() }, { quoted: m });
  }
};
