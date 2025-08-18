# WhatsApp Bot API

Esse API serve para salvar dados do usuario e mandar mensagem

## Requisitos

- Node.js 
- MySQL database 
- Um telefone com whatsapp para escanear o QR CODE

## Instalação

1. Instalar depencencias:
```bash
npm install
```

2. Instalar pacotes necesarios:
```bash
npm install whatsapp-web.js qrcode-terminal
npm install express
npm install mysql2
npm install cors
```

## Como rodar

### Iniciando o servidor

1. Copia e cola no terminal:
```bash
node Servidor.js
```

2. O servidor vai iniciar na URL `http://localhost:3000`

3. Escanea o QR code que vai aparecer no terminal com sua conta do whatsapp

4. Quando conectado, vai aparecer um log no console e após conectar você nao vai precisar conectar de novo

### Requisições para a API

Um POST para `/send/message` manda mensagem pelo whatsap conectado, o body no formato:

```json
{
  "mensagem": "Hello world!",
  "telefone": "5511999999999"
}
```

**Nota:** O número de telefone deve incluir o código do país e o DDD.

Um POST para `/user/data` salva os dados do usuario no banco, o body no formato:

```json
{
    "localizacao": "Sao jose dos campos",
    "telefone":"5512982682348"
}
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send/message` | Manda um WhatsApp message |
| POST | `/user/data` | Salva os dados do usuario |


