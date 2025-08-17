# WhatsApp Bot API

A Node.js WhatsApp bot that allows you to send messages programmatically using the WhatsApp Web API.

## Features

- Send WhatsApp messages via REST API
- QR code authentication for WhatsApp Web
- Express.js server with clean architecture
- MySQL database integration ready
- Modular code structure with MVC pattern

## Prerequisites

- Node.js (v14 or higher)
- MySQL database (optional, for future features)
- A WhatsApp account

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd whatsapp
```

2. Install dependencies:
```bash
npm install
```

3. Install required packages:
```bash
npm install whatsapp-web.js qrcode-terminal
npm install express
npm install mysql2
```

## Project Structure

```
whatsapp/
├── Controllers/
│   └── messageControl.js      # Message handling logic
├── Model/
│   ├── Banco.js              # Database connection
│   └── Message.js            # Message model
├── Route/
│   └── roteadorMensagem.js   # API routes
├── Servidor.js               # Main server file
├── Service.js                # Service layer
└── package.json
```

## Usage

### Starting the Server

1. Run the server:
```bash
node Servidor.js
```

2. The server will start on `http://localhost:3000`

3. Scan the QR code that appears in the terminal with your WhatsApp mobile app

4. Once authenticated, you'll see "WhatsApp client is ready!" in the console

### Sending Messages

Send a POST request to `/send/message` with the following JSON body:

```json
{
  "mensagem": "Hello from the bot!",
  "telefone": "5511999999999"
}
```

**Note:** The phone number should include the country code without any special characters (e.g., `5511999999999` for Brazil).

### Example using cURL

```bash
curl -X POST http://localhost:3000/send/message \
  -H "Content-Type: application/json" \
  -d '{
    "mensagem": "Hello World!",
    "telefone": "5511999999999"
  }'
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send/message` | Send a WhatsApp message |

## Response Format

```json
{
  "cod": 1,
  "status": true
}
```

## Architecture

This project follows the MVC (Model-View-Controller) pattern:

- **Model**: Handles data and business logic (`Message.js`, `Banco.js`)
- **Controller**: Manages HTTP requests and responses (`messageControl.js`)
- **Route**: Defines API endpoints (`roteadorMensagem.js`)
- **Service**: Contains the main server logic (`Servidor.js`)

## Dependencies

- **whatsapp-web.js**: WhatsApp Web API client
- **qrcode-terminal**: Terminal QR code generation
- **express**: Web framework
- **mysql2**: MySQL database driver

## Troubleshooting

### Common Issues

1. **QR Code not appearing**: Make sure you're running the latest version of Node.js
2. **Authentication failed**: Try restarting the server and scanning the QR code again
3. **Message not sent**: Verify the phone number format and ensure the client is ready

### Logs

The application provides detailed console logs:
- 📱 QR code generation
- ✅ WhatsApp client ready status
- 📩 Message sent confirmations
- ❌ Error messages with details

## Security Notes

- Keep your WhatsApp session secure
- Don't share authentication tokens
- Use environment variables for sensitive data in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues, please check the troubleshooting section or create an issue in the repository.


