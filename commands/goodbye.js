const fs = require("fs");
const path = require("path");
const { newsletterCtx, normJid, getGroupAdmins } = require("../lib/news");

const dbPath = path.join(__dirname, "../data/welcome.json");

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ welcome: [], goodbye: [] }, null, 2));
  }
}
function readDb() {
  ensureDb();
  try { return JSON.parse(fs.readFileSync(dbPath, "utf8")); }
  catch { return { welcome: [], goodbye: [] }; }
}
function writeDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

module.exports = {
  name: "goodbye",
  category: "Group",
  description: "Goodbye on/off (groupe)",

  async execute(sock, m, args, { isGroup, prefix } = {}) {
    const from = m.key.remoteJid;
    if (!isGroup) return sock.sendMessage(from, { text: "❌ Commande groupe uniquement." }, { quoted: m });

    const sender = normJid(m.key.participant || m.sender);
    const { admins } = await getGroupAdmins(sock, from);

    if (!admins.includes(sender)) {
      return sock.sendMessage(from, { text: "🚫 Seuls les admins peuvent utiliser cette commande.", contextInfo: newsletterCtx() }, { quoted: m });
    }

    const sub = (args[0] || "").toLowerCase();
    const db = readDb();

    if (sub === "on") {
      if (!db.goodbye.includes(from)) db.goodbye.push(from);
      writeDb(db);
      return sock.sendMessage(from, { text: "✅ Goodbye activé.", contextInfo: newsletterCtx() }, { quoted: m });
    }

    if (sub === "off") {
      db.goodbye = db.goodbye.filter(j => j !== from);
      writeDb(db);
      return sock.sendMessage(from, { text: "❌ Goodbye désactivé.", contextInfo: newsletterCtx() }, { quoted: m });
    }

    return sock.sendMessage(from, { text: `Utilisation :\n${prefix || "."}goodbye on\n${prefix || "."}goodbye off`, contextInfo: newsletterCtx() }, { quoted: m });
  }
};
