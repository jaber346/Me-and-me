const fs = require('fs');
const path = require('path');
const config = require('../config');

const dbPath = path.join(__dirname, '../data/autostatus.json');

function ensureDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ enabled: true }, null, 2));
  }
}

function readDb() {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch {
    return { enabled: true };
  }
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function newsletterCtx() {
  return {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363423249667073@newsletter',
      newsletterName: config.BOT_NAME || 'NOVA XMD V1',
      serverMessageId: 1
    }
  };
}

module.exports = {
  name: 'autostatus',
  category: 'Owner',
  description: 'Auto-view status on/off',

  async execute(sock, m, args, { prefix, isOwner } = {}) {
    const from = m.key.remoteJid;
    if (!isOwner) {
      return sock.sendMessage(from, { text: '🚫 Commande réservée au propriétaire.' }, { quoted: m });
    }

    const sub = (args[0] || '').toLowerCase();
    const db = readDb();

    if (sub === 'on') {
      db.enabled = true;
      writeDb(db);
      return sock.sendMessage(from, { text: '✅ AutoStatus activé (lecture des status).', contextInfo: newsletterCtx() }, { quoted: m });
    }

    if (sub === 'off') {
      db.enabled = false;
      writeDb(db);
      return sock.sendMessage(from, { text: '❌ AutoStatus désactivé.', contextInfo: newsletterCtx() }, { quoted: m });
    }

    return sock.sendMessage(
      from,
      { text: `Utilisation :\n${prefix || '.'}autostatus on\n${prefix || '.'}autostatus off`, contextInfo: newsletterCtx() },
      { quoted: m }
    );
  }
};
