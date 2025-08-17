const Banco = require('./Banco');

class Message {
    constructor(client) {
        this._mensagem = ''; 
        this._telefone = ''; 
        this._client = client;
    }


    async send_message() {
        const chatId = this._telefone + "@c.us";
        try {
            await this._client.sendMessage(chatId, this._mensagem);
        } catch (err) {
            console.error("Error sending message:", err);
        }
    }


    get mensagem() {
        return this._mensagem;
    }
    
    set mensagem(mensagem) {
        this._mensagem = mensagem;
    }

    get telefone() {
        return this._telefone;
    }
    
    set telefone(telefone) {
        this._telefone = telefone;
    }
}

module.exports = Message;
