const express = require('express');
const path = require('path');
const roteadorMensagem = require('./Route/roteadorMensagem');
const roteadorUser = require('./Route/roteadorUser');
const Message = require('./Model/Message');
const cors = require('cors');

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()  
});

const message = new Message(client);

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});
 
const app = express();
const porta = 3000;

app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'View')));

const routeMensagem = new roteadorMensagem(client);
const routeUser = new roteadorUser();

app.use('/send/message',
    routeMensagem.criarRotasMensagem()
);

app.use('/user/data',
    routeUser.criarRotasUser()
);

async function dispararAlertas() {
    await message.disparar_alertas();
}

setTimeout(() => {
    dispararAlertas();
    setInterval(dispararAlertas, 24 * 60 * 60 * 1000);
}, 12 * 1000);


app.listen(porta, () => {
    console.log(`API rodando no endereço: http://localhost:${porta}/`)
    client.initialize();
});