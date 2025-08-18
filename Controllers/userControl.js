const express = require('express');
const UserData = require('../Model/UserData');

module.exports = class userControl { 

    update_data_control = async (request, response) => {
        console.log(request.body);

        const { pontos, nome} = request.body;

        const userData = new UserData();
        userData.pontos = pontos;
        userData.nome = nome

        const resultado = await userData.update_data();
    
        const objResposta = {
            cod: 1,
            status: true,
            resultado: resultado
        };
    
        response.status(200).send(objResposta);
    }

    get_data_control = async (request, response) => {
        const userData = new UserData();

        const resultado = await userData.retrive_data();

        const objResposta = {
            cod: 1,
            status: true,
            eventos: resultado
        };
    
        response.status(200).send(objResposta);
    }

    user_data_control = async (request, response) => {
        console.log(request.body);

        const { cidade, telefone, nome, pontos} = request.body;

        const userData = new UserData();
        userData.localizacao = cidade;
        userData.telefone = telefone;
        userData.pontos = pontos;
        userData.nome = nome;

        const resultado = await userData.save_data();
    
        const objResposta = {
            cod: 1,
            status: true,
        };
    
        response.status(200).send(objResposta);
    }

};