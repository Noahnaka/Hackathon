const express = require('express');
const userControl = require('../Controllers/userControl');

module.exports = class roteadorMensagem {
    constructor() {
        this._router = express.Router();
        this._userControl = new userControl();
    }

    criarRotasUser() {
        this._router.post('/',
            this._userControl.user_data_control,
        )

        return this._router;
    }
}