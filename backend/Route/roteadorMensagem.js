const express = require('express');
const messageControl = require('../Controllers/messageControl');

module.exports = class roteadorMensagem {
    constructor(client) {
        this._router = express.Router();
        this._messageControl = new messageControl(client);
    }

    criarRotasMensagem() {
        this._router.post('/',
            this._messageControl.send_message_control,
        )

        return this._router;
    }
}