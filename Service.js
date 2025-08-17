const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()  
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp client is ready!');
    sendMessageTo("5512982682348", "Hello without scanning QR again!");
});

async function sendMessageTo(number, text) {
    const chatId = number + "@c.us";
    try {
        await client.sendMessage(chatId, text);
        console.log(`📩 Message sent to ${number}: "${text}"`);
    } catch (err) {
        console.error("❌ Error sending message:", err);
    }
}

client.initialize();
