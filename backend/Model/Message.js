const Banco = require('./Banco');

class Message {
    constructor(client) {
        this._mensagem = ''; 
        this._telefone = ''; 
        this._client = client;
    }

    
    async disparar_alertas() {
        console.log("Alertas rodando!");
        const conexao = Banco.getConexao();
        const SQL = 'SELECT nome, localizacao, telefone FROM tbl_dados_usuario;';
        try {
            const [rows] = await conexao.promise().execute(SQL);
    
            // Step 1: unique locations
            const uniqueLocations = [...new Set(rows.map(r => r.localizacao))];
    
        // Step 2: call API once per location
        const locationResponses = {};
        for (const loc of uniqueLocations) {
            try {
                const apiKey = "7a2791ab1c9e89014a098d47a489fb53";

                // 1st call: basic city + coords
                const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(loc)}&appid=${apiKey}&lang=pt_br&units=metric`);
                const basicData = await response.json();

                if (!basicData.coord) {
                    console.error(`No coordinates found for ${loc}`);
                    locationResponses[loc] = null;
                    continue;
                }

                const { lat, lon } = basicData.coord;
                const cityName = basicData.name;

                // 2nd call: onecall data
                const oneCallApiURL = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&appid=${apiKey}&units=metric&lang=pt_br`;
                const oneCallResults = await fetch(oneCallApiURL);
                const data = await oneCallResults.json();

                // Save everything for later
                locationResponses[loc] = {
                    city: cityName,
                    current: data.current,
                    daily: data.daily,
                    alerts: data.alerts || []
                };

            } catch (err) {
                console.error(`Error fetching API for location ${loc}:`, err);
                locationResponses[loc] = null;
            }
        }

        // Step 3: send messages
        for (const user of rows) {
            const weather = locationResponses[user.localizacao];
            if (!weather) continue;

            const weatherId = weather.current.weather[0].id;
            const tempMax = weather.daily[0].temp.max;
            const tempMin = weather.daily[0].temp.min;

            // Texto de alerta climático (com base nas condições)
            let alertaClimatico = "";

            if (weatherId >= 200 && weatherId <= 531) {
                alertaClimatico =
        `🚨 ALERTA DE CHUVAS INTENSAS
        🌎 Contexto Climático: A intensificação de eventos climáticos, como chuvas fortes, é uma das consequências documentadas das mudanças climáticas globais, que alteram os padrões de precipitação.
        ✅ Recomendação Sustentável: Verifique a limpeza de calhas e bueiros para garantir o escoamento adequado da água. Mantenha-se atento a áreas com risco de alagamento e, se possível, evite deslocamentos desnecessários.`;
            } 
            else if (tempMax > 30) {
                alertaClimatico =
        `🔥 ALERTA DE ONDA DE CALOR
        🌎 Contexto Climático: Ondas de calor mais frequentes e intensas são um claro indicativo do aquecimento global. A emissão de gases de efeito estufa potencializa a retenção de calor na atmosfera.
        ✅ Recomendação Sustentável: Hidrate-se constantemente e priorize o uso consciente de energia, especialmente de equipamentos como ar-condicionado. Desconectar aparelhos da tomada contribui para a redução do consumo.`;
            } 
            else if (weatherId === 800) {
                alertaClimatico =
        `☀️ DIA ENSOLARADO
        🌎 Contexto Climático: Dias ensolarados representam uma oportunidade para refletir sobre o potencial de fontes de energia renovável, como a solar, que é fundamental na transição para uma matriz energética mais limpa.
        ✅ Recomendação Sustentável: Aproveite a iluminação natural para reduzir o consumo de eletricidade. Considere utilizar meios de transporte de baixa emissão de carbono, como bicicletas ou caminhadas.`;
            } 
            else if (tempMin < 15) {
                alertaClimatico =
        `❄️ QUEDA ACENTUADA DE TEMPERATURA
        🌎 Contexto Climático: As alterações climáticas podem influenciar a intensidade e a frequência de eventos de temperatura extrema. Ações de mitigação são essenciais para estabilizar esses padrões.
        ✅ Recomendação Sustentável: Para manter o conforto térmico, opte por um bom agasalho e pela vedação de frestas em portas e janelas antes de recorrer a aquecedores elétricos, que possuem alto consumo energético.`;
            } 
            else if (weatherId >= 801 && weatherId <= 804) {
                alertaClimatico =
        `☁️ DIA PREDOMINANTEMENTE NUBLADO
        🌎 Contexto Climático: Nossas atividades diárias contribuem para a pegada de carbono global. O consumo consciente é uma ferramenta poderosa para a mitigação dos impactos climáticos, independentemente do tempo.
        ✅ Recomendação Sustentável: Adote práticas como a separação de resíduos para reciclagem. A gestão adequada do lixo reduz a emissão de gases de efeito estufa, como o metano, gerado em aterros sanitários.`;
            } 
            else {
                alertaClimatico = "✅ Nenhum alerta climático específico para hoje.";
            }

            // Monta a mensagem final
            const mensagem =
                `Olá ${user.nome}!\n` +
                `Localização: ${weather.city}\n\n` +
                alertaClimatico;

            await this.send_message(user.telefone, mensagem);
        }




    
        } catch (error) {
            console.error('Erro ao fazer select: ', error);
            return null;
        }
    }
    


    async send_message(telefone, mensagem) {
        const chatId = telefone + "@c.us";
        try {
            await this._client.sendMessage(chatId, mensagem);
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
