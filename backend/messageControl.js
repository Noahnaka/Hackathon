const express = require('express');
const Message = require('../Model/Message');

module.exports = class messageControl { 
    constructor(client) {
        this._client = client;
    }

    send_message_control = async (request, response) => {
        const { mensagem, telefone} = request.body;

        const message = new Message(this._client);
        message.mensagem = mensagem;
        message.telefone = telefone;

        const resultado = await message.send_message();
    
        const objResposta = {
            cod: 1,
            status: true,
        };
    
        response.status(200).send(objResposta);
    }

};