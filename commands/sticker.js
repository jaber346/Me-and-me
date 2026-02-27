const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const config = require('../config');

const STICKER_QUALITY = 60;

function getQuotedMessage(m) {
  return (
    m.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
    m.message?.imageMessage?.contextInfo?.quotedMessage ||
    m.message?.videoMessage?.contextInfo?.quotedMessage ||
    null
  );
}

async function toBufferFromStream(stream) {
  let buffer = Buffer.from([]);
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
  return buffer;
}

module.exports = {
  name: 'sticker',
  category: 'Tools',
  description: 'Créer un sticker depuis une image/vidéo (répondre à un média)',

  async execute(sock, m) {
    const from = m.key.remoteJid;
    const q = getQuotedMessage(m);

    const msg = q || m.message;

    const img = msg?.imageMessage;
    const vid = msg?.videoMessage;

    if (!img && !vid) {
      return sock.sendMessage(from, { text: '⚠️ Réponds à une *image* ou *vidéo* avec .sticker' }, { quoted: m });
    }

    try {
      const media = img || vid;
      const type = img ? 'image' : 'video';
      const stream = await downloadContentFromMessage(media, type);
      const buffer = await toBufferFromStream(stream);

      const sticker = new Sticker(buffer, {
        pack: config.BOT_NAME || 'NOVA XMD V1',
        author: config.OWNER_NAME || 'DEV NOVA',
        type: StickerTypes.FULL,
        quality: STICKER_QUALITY
      });

      const out = await sticker.toBuffer();

      await sock.sendMessage(from, { sticker: out }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Impossible de créer le sticker (vérifie les dépendances).', }, { quoted: m });
    }
  }
};
