const config = require("../config");

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

function normJid(jid = "") {
  jid = String(jid || "");
  if (jid.includes(":") && jid.includes("@")) {
    const [l, r] = jid.split("@");
    return l.split(":")[0] + "@" + r;
  }
  return jid;
}

async function getGroupAdmins(sock, jid) {
  const meta = await sock.groupMetadata(jid);
  const admins = (meta.participants || []).filter(p => p.admin).map(p => normJid(p.id));
  return { meta, admins };
}

module.exports = { newsletterCtx, normJid, getGroupAdmins };
