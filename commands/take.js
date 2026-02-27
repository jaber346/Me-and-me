const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const config = require('../config');

function getQuotedMessage(m) {
  return m.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
}

async function toBufferFromStream(stream) {
  let buffer = Buffer.from([]);
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
  return buffer;
}

module.exports = {
  name: 'take',
  category: 'Tools',
  description: 'Voler un sticker et changer pack/author (répondre au sticker)\nEx: .take Nova|DevNova',

  async execute(sock, m, args = []) {
    const from = m.key.remoteJid;
    const q = getQuotedMessage(m);
    const stickerMsg = q?.stickerMessage;

    if (!stickerMsg) {
      return sock.sendMessage(from, { text: '⚠️ Réponds à un *sticker* avec .take' }, { quoted: m });
    }

    // args: "pack|author" ou "pack" (author par défaut)
    const raw = args.join(' ').trim();
    const [packArg, authorArg] = raw.includes('|') ? raw.split('|') : [raw, ''];

    const pack = (packArg || '').trim() || (config.BOT_NAME || 'NOVA XMD V1');
    const author = (authorArg || '').trim() || (config.OWNER_NAME || 'DEV NOVA');

    try {
      const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
      const webpBuffer = await toBufferFromStream(stream);

      const sticker = new Sticker(webpBuffer, {
        pack,
        author,
        type: StickerTypes.FULL,
        quality: 60
      });

      const out = await sticker.toBuffer();
      await sock.sendMessage(from, { sticker: out }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Impossible de voler ce sticker.' }, { quoted: m });
    }
  }
};
