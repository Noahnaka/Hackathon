const express = require('express');
const path = require('path');
const roteadorMensagem = require('./Route/roteadorMensagem');
const roteadorUser = require('./Route/roteadorUser');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()  
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});
 
const app = express();
const porta = 3000;

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

app.listen(porta, () => {
    console.log(`API rodando no endereço: http://localhost:${porta}/`)
    client.initialize();
});