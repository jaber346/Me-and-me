const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

function getQuotedMessage(m) {
  return m.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
}

async function toBufferFromStream(stream) {
  let buffer = Buffer.from([]);
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
  return buffer;
}

module.exports = {
  name: 'img',
  category: 'Tools',
  description: 'Convertir un sticker en image (répondre au sticker)',

  async execute(sock, m) {
    const from = m.key.remoteJid;
    const q = getQuotedMessage(m);

    const stickerMsg = q?.stickerMessage;
    if (!stickerMsg) {
      return sock.sendMessage(from, { text: '⚠️ Réponds à un *sticker* avec .img' }, { quoted: m });
    }

    try {
      const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
      const webpBuffer = await toBufferFromStream(stream);

      // webp -> png
      const pngBuffer = await sharp(webpBuffer).png().toBuffer();

      await sock.sendMessage(from, { image: pngBuffer, caption: '🖼️ Sticker -> Image' }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Conversion impossible (vérifie les dépendances).' }, { quoted: m });
    }
  }
};
