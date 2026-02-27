const fs = require("fs");
const path = require("path");
const config = require("../config");
const { newsletterCtx } = require("../lib/news");

// images random (tu peux ajouter)
const IMAGES = [
  "https://files.catbox.moe/iqejld.jpg",
  "https://files.catbox.moe/0p867k.jpg",
  "https://files.catbox.moe/k35kko.jpg",
  "https://files.catbox.moe/zxyyrr.jpg",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const dbPath = path.join(__dirname, "welcome.json");

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

module.exports = async (sock, update) => {
  try {
    const db = readDb();
    const jid = update?.id;
    if (!jid || !jid.endsWith("@g.us")) return;

    const action = update?.action; // add/remove/promote/demote
    const participants = update?.participants || [];
    if (!participants.length) return;

    if (action === "add" && db.welcome.includes(jid)) {
      const meta = await sock.groupMetadata(jid);
      for (const p of participants) {
        const num = String(p).split("@")[0];
        await sock.sendMessage(jid, {
          image: { url: pickRandom(IMAGES) },
          caption:
`╭━━〔 🎉 WELCOME • ${config.BOT_NAME || "NOVA XMD V1"} 〕━━╮
┃ 👤 Bienvenue : @${num}
┃ 👥 Groupe : ${meta.subject || "Groupe"}
┃ 🔢 Membres : ${(meta.participants || []).length}
╰━━━━━━━━━━━━━━━━━━━━━━╯`,
          mentions: [p],
          contextInfo: newsletterCtx()
        });
      }
    }

    if (action === "remove" && db.goodbye.includes(jid)) {
      const meta = await sock.groupMetadata(jid);
      for (const p of participants) {
        const num = String(p).split("@")[0];
        await sock.sendMessage(jid, {
          image: { url: pickRandom(IMAGES) },
          caption:
`╭━━〔 👋 GOODBYE • ${config.BOT_NAME || "NOVA XMD V1"} 〕━━╮
┃ 👤 Sortie : @${num}
┃ 👥 Groupe : ${meta.subject || "Groupe"}
┃ 🔢 Membres : ${(meta.participants || []).length}
╰━━━━━━━━━━━━━━━━━━━━━━╯`,
          mentions: [p],
          contextInfo: newsletterCtx()
        });
      }
    }
  } catch (e) {
    // silent
  }
};
