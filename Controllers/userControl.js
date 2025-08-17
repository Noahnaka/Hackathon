const express = require('express');
const UserData = require('../Model/UserData');

module.exports = class userControl { 

    user_data_control = async (request, response) => {
        const { localizacao, telefone} = request.body;

        const userData = new UserData();
        userData.localizacao = localizacao;
        userData.telefone = telefone;

        const resultado = await userData.save_data();
    
        const objResposta = {
            cod: 1,
            status: true,
        };
    
        response.status(200).send(objResposta);
    }

};