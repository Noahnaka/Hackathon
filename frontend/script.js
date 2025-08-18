import { criarPreferenciaDePagamento } from './apis/payApi.js';
import { fetchAirQualityData, getAirQualityColor } from './apis/openAQ.js';

document.addEventListener("DOMContentLoaded", () => {
    const submitButton = document.getElementById("submitButton");
    const cidadeInput = document.getElementById("cidadeInput");
    const nomeInput = document.getElementById("nomeInput");
    const phoneInput = document.getElementById("phoneInput");
    const alertModal = document.getElementById("alertModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const modalMessage = document.getElementById("modalMessage");
    const resilienceCenter = document.getElementById("resilience-center");
    const radarSection = document.getElementById("radar");
    const apiKey = "7a2791ab1c9e89014a098d47a489fb53";
    
    
    const DONATION_GOAL = 10000;
    let totalDonations = 0;
    let donationCount = 0;
    let rankingData = [{ nome: "Mariana S.", pontos: 1850 }, { nome: "Carlos E.", pontos: 1700 }, { nome: "Juliana P.", pontos: 1680 }, { nome: "Ricardo A.", pontos: 1520 }, { nome: "Ana L.", pontos: 1300 }];

    const welcomeMessageContainer = document.createElement('div');
    welcomeMessageContainer.id = 'welcome-message';
    resilienceCenter.insertBefore(welcomeMessageContainer, resilienceCenter.firstChild);

    async function fetchAndDisplayWeather(cidade, nome) {
        try {
            const geoApiURL = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${apiKey}&lang=pt_br`;
            const geoResults = await fetch(geoApiURL);
            const geoJson = await geoResults.json();
            if (geoJson.cod != 200) {
                showModal(`Cidade não encontrada: "${cidade}". Por favor, verifique e tente novamente.`);
                return false;
            }
            const { lat, lon } = geoJson.coord;
            const cityName = geoJson.name;
            const oneCallApiURL = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&appid=${apiKey}&units=metric&lang=pt_br`;
            const oneCallResults = await fetch(oneCallApiURL);
            const data = await oneCallResults.json();
            radarSection.style.display = 'none';
            resilienceCenter.style.display = "block";
            welcomeMessageContainer.innerHTML = `<h2 class="text-3xl font-bold mb-4 text-cyan-300 text-center">Olá, ${nome}!</h2>`;
            mostrarInfos(data, cityName);
            mostrarAlertas(data.alerts);
            mostrarPrevisao(data.daily);
            gerarAlertaClimatico(data);
            
        
            const airQualityData = await fetchAirQualityData(lat, lon);
            mostrarQualidadeDoAr(airQualityData, cityName);
            
        
            updateWeatherCharacter(data, airQualityData);
            return true;
        } catch (error) {
            console.error("ERRO NA CHAMADA DA API:", error);
            showModal("Ocorreu um erro de conexão. Por favor, verifique sua internet.");
            return false;
        }
    }

    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
        const userData = JSON.parse(savedUserData);
        fetchAndDisplayWeather(userData.cidade, userData.nome);
    }

    function showModal(message) {
        modalMessage.textContent = message;
        alertModal.classList.add("visible");
    }

    function hideModal() {
        alertModal.classList.remove("visible");
    }

    submitButton.addEventListener("click", async (event) => {
        event.preventDefault();
        const cidadeValue = cidadeInput.value;
        const nomeValue = nomeInput.value;
        const phoneValue = phoneInput.value;
        if (!cidadeValue || !nomeValue || !phoneValue) {
            showModal("Por favor, preencha todos os campos.");
            return;
        }
        const isCityValid = await fetchAndDisplayWeather(cidadeValue, nomeValue);
        if (isCityValid) {
            const userData = {
                nome: nomeValue,
                cidade: cidadeValue,
                telefone: phoneValue,
                pontos: 100
            };
            localStorage.setItem('userData', JSON.stringify(userData));
            
            try {
                const response = await fetch('http://localhost:3000/user/data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                });
                
                if (response.ok) {
                    console.log('User data sent successfully to server');
                } else {
                    console.error('Failed to send user data to server:', response.status);
                }
            } catch (error) {
                console.error('Error sending user data to server:', error);
            }
            
            atualizarRanking();
            showModal("Dados salvos com sucesso no seu dispositivo.");
        }
    });

    function mostrarInfos(data, cityName) {
        const container = document.getElementById("weather-info");
        container.innerHTML = `<h2 class="text-3xl font-bold mb-4 text-cyan-300">Tempo agora em ${cityName}</h2><div class="flex flex-col md:flex-row items-center justify-center gap-4 mb-4"><img src="https://openweathermap.org/img/wn/${data.current.weather[0].icon}@4x.png" alt="Ícone do Tempo" class="w-32 h-32 -my-4"><div class="text-left"><p class="text-7xl font-black">${data.current.temp.toFixed(0)}°C</p><p class="text-xl capitalize -mt-2">${data.current.weather[0].description}</p></div></div><div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-8"><div class="history-item"><p class="history-value">${data.current.feels_like.toFixed(0)}°</p><p class="history-label">Sensação</p></div><div class="history-item"><p class="history-value">${data.current.humidity}%</p><p class="history-label">Umidade</p></div><div class="history-item"><p class="history-value">${(data.current.wind_speed*3.6).toFixed(1)} km/h</p><p class="history-label">Vento</p></div><div class="history-item"><p class="history-value">${data.daily[0].temp.max.toFixed(0)}°</p><p class="history-label">Temp. Máx</p></div></div>`;
    }

    function mostrarAlertas(alerts) {
        const container = document.getElementById("alerts-container");
        container.innerHTML = "";
        if (!alerts || alerts.length === 0) {
            container.innerHTML = `<div class="alert-box alert-yellow"><p class="font-bold">Tudo certo!</p><p>Nenhum alerta meteorológico para sua região no momento.</p></div>`;
            return;
        }
        alerts.forEach((alert) => {
            const alertEl = document.createElement("div");
            alertEl.className = "alert-box alert-red mt-4";
            alertEl.innerHTML = `<p class="font-bold uppercase">🚨 ${alert.event}</p><p class="text-sm mb-2">Fonte: ${alert.sender_name}</p><p>${alert.description}</p>`;
            container.appendChild(alertEl);
        });
    }

    function mostrarPrevisao(dailyData) {
        const container = document.getElementById("forecast-container");
        container.innerHTML = "";
        dailyData.slice(1, 5).forEach((day) => {
            const weekDay = new Date(day.dt * 1000).toLocaleDateString("pt-BR", { weekday: "short" });
            const dayEl = document.createElement("div");
            dayEl.className = "history-item flex flex-col justify-between items-center";
            dayEl.innerHTML = `<p class="font-bold text-lg capitalize">${weekDay}</p><img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}" class="w-16 h-16 -my-2"><div><span class="font-bold text-cyan-300">${day.temp.max.toFixed(0)}°</span><span class="text-gray-400">${day.temp.min.toFixed(0)}°</span></div>`;
            container.appendChild(dayEl);
        });
    }

    function gerarAlertaClimatico(data) {
        const container = document.getElementById('alerts-container');
        let message = '';
        const weatherId = data.current.weather[0].id;
        const tempMax = data.daily[0].temp.max;
        const tempMin = data.daily[0].temp.min;
        if (weatherId >= 200 && weatherId <= 531) {
            message = `<div class="alert-box alert-red mt-4"><p class="font-bold">🚨 ALERTA DE CHUVAS INTENSAS</p><p class="mb-2"><strong>Contexto Climático:</strong> A intensificação de eventos climáticos, como chuvas fortes, é uma das consequências documentadas das mudanças climáticas globais, que alteram os padrões de precipitação.</p><p><strong>Recomendação Sustentável:</strong> Verifique a limpeza de calhas e bueiros para garantir o escoamento adequado da água. Mantenha-se atento a áreas com risco de alagamento e, se possível, evite deslocamentos desnecessários.</p></div>`;
        } else if (tempMax > 30) {
            message = `<div class="alert-box alert-yellow mt-4"><p class="font-bold">🔥 ALERTA DE ONDA DE CALOR</p><p class="mb-2"><strong>Contexto Climático:</strong> Ondas de calor mais frequentes e intensas são um claro indicativo do aquecimento global. A emissão de gases de efeito estufa potencializa a retenção de calor na atmosfera.</p><p><strong>Recomendação Sustentável:</strong> Hidrate-se constantemente e priorize o uso consciente de energia, especialmente de equipamentos como ar-condicionado. Desconectar aparelhos da tomada contribui para a redução do consumo.</p></div>`;
        } else if (weatherId === 800) {
            message = `<div class="alert-box alert-green mt-4"><p class="font-bold">☀️ DIA ENSOLARADO</p><p class="mb-2"><strong>Contexto Climático:</strong> Dias ensolarados representam uma oportunidade para refletir sobre o potencial de fontes de energia renovável, como a solar, que é fundamental na transição para uma matriz energética mais limpa.</p><p><strong>Recomendação Sustentável:</strong> Aproveite a iluminação natural para reduzir o consumo de eletricidade. Considere utilizar meios de transporte de baixa emissão de carbono, como bicicletas ou caminhadas.</p></div>`;
        } else if (tempMin < 15) {
            message = `<div class="alert-box alert-blue mt-4"><p class="font-bold">❄️ QUEDA ACENTUADA DE TEMPERATURA</p><p class="mb-2"><strong>Contexto Climático:</strong> As alterações climáticas podem influenciar a intensidade e a frequência de eventos de temperatura extrema. Ações de mitigação são essenciais para estabilizar esses padrões.</p><p><strong>Recomendação Sustentável:</strong> Para manter o conforto térmico, opte por um bom agasalho e pela vedação de frestas em portas e janelas antes de recorrer a aquecedores elétricos, que possuem alto consumo energético.</p></div>`;
        } else if (weatherId >= 801 && weatherId <= 804) {
            message = `<div class="alert-box alert-gray mt-4"><p class="font-bold">☁️ DIA PREDOMINANTEMENTE NUBLADO</p><p class="mb-2"><strong>Contexto Climático:</strong> Nossas atividades diárias contribuem para a pegada de carbono global. O consumo consciente é uma ferramenta poderosa para a mitigação dos impactos climáticos, independentemente do tempo.</p><p><strong>Recomendação Sustentável:</strong> Adote práticas como a separação de resíduos para reciclagem. A gestão adequada do lixo reduz a emissão de gases de efeito estufa, como o metano, gerado em aterros sanitários.</p></div>`;
        }
        if (message) {
            container.innerHTML += message;
        }
    }

    function mostrarQualidadeDoAr(airQualityData, cityName) {
        const container = document.getElementById('air-quality-container');
        
        if (!airQualityData) {
            container.innerHTML = `
                <div class="text-center">
                    <div class="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-6 mb-4">
                        <h3 class="text-xl font-bold text-yellow-300 mb-2">⚠️ Dados de Qualidade do Ar Indisponíveis</h3>
                        <p class="text-gray-300">Não foi possível obter dados de qualidade do ar para ${cityName} no momento.</p>
                        <p class="text-sm text-gray-400 mt-2">Isso pode acontecer quando não há estações de monitoramento próximas à sua localização.</p>
                    </div>
                </div>
            `;
            return;
        }

        let html = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
                    <h3 class="text-lg font-bold text-cyan-300 mb-3">📊 Resumo da Qualidade do Ar</h3>
                    <p class="text-sm text-gray-300 mb-2">Última atualização: ${new Date().toLocaleString('pt-BR')}</p>
                    <p class="text-sm text-gray-400">Dados fornecidos por estações de monitoramento próximas a ${cityName}</p>
                </div>
                <div class="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
                    <h3 class="text-lg font-bold text-cyan-300 mb-3">🌱 Impacto na Saúde</h3>
                    <p class="text-sm text-gray-300">A qualidade do ar está diretamente relacionada às mudanças climáticas e à saúde pública.</p>
                    <p class="text-sm text-gray-400 mt-2">Poluentes como PM2.5 e O₃ podem agravar problemas respiratórios.</p>
                </div>
            </div>
        `;


        Object.keys(airQualityData).forEach(parameter => {
            const data = airQualityData[parameter];
            const statusColor = getAirQualityColor(data.status);
            const parameterNames = {
                'pm25': 'PM₂.₅ (Material Particulado Fino)',
                'pm10': 'PM₁₀ (Material Particulado)',
                'o3': 'O₃ (Ozônio)',
                'no2': 'NO₂ (Dióxido de Nitrogênio)',
                'so2': 'SO₂ (Dióxido de Enxofre)',
                'co': 'CO (Monóxido de Carbono)'
            };
            
            const parameterName = parameterNames[parameter.toLowerCase()] || parameter;
            
            html += `
                <div class="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg p-4 mb-4 air-quality-parameter">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="text-lg font-bold text-white">${parameterName}</h4>
                        <div class="flex items-center gap-2">
                            <div class="w-4 h-4 rounded-full air-quality-status" style="background-color: ${statusColor}"></div>
                            <span class="text-sm font-semibold" style="color: ${statusColor}">${data.description}</span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div class="text-center">
                            <p class="text-2xl font-bold text-cyan-300 air-quality-value">${data.latestValue.toFixed(1)}</p>
                            <p class="text-xs text-gray-400">Valor Atual</p>
                        </div>
                        <div class="text-center">
                            <p class="text-lg font-semibold text-gray-300">${data.averageValue.toFixed(1)}</p>
                            <p class="text-xs text-gray-400">Média</p>
                        </div>
                        <div class="text-center">
                            <p class="text-sm font-semibold text-gray-300">${data.unit}</p>
                            <p class="text-xs text-gray-400">Unidade</p>
                        </div>
                        <div class="text-center">
                            <p class="text-sm font-semibold text-gray-300">${data.locations.length}</p>
                            <p class="text-xs text-gray-400">Estações</p>
                        </div>
                    </div>
                    
                    <div class="bg-gray-700/50 rounded-lg p-3">
                        <p class="text-sm text-gray-300">
                            <strong>Contexto Climático:</strong> ${getClimateContext(parameter, data.latestValue)}
                        </p>
                        <p class="text-sm text-gray-300 mt-2">
                            <strong>Recomendação Sustentável:</strong> ${getSustainableRecommendation(parameter, data.status)}
                        </p>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    function getClimateContext(parameter, value) {
        const contexts = {
            'pm25': 'Material particulado fino (PM₂.₅) é um dos principais poluentes atmosféricos que contribuem para o aquecimento global e problemas de saúde. Sua concentração está diretamente relacionada às emissões de combustíveis fósseis.',
            'pm10': 'Material particulado (PM₁₀) inclui poeira, fuligem e outras partículas que podem transportar poluentes químicos. Sua presença na atmosfera afeta tanto a qualidade do ar quanto o clima global.',
            'o3': 'O ozônio troposférico é um gás de efeito estufa potente que se forma pela reação entre poluentes emitidos por veículos e indústrias. Altas concentrações indicam poluição atmosférica significativa.',
            'no2': 'Dióxido de nitrogênio é um gás tóxico que contribui para a formação de chuva ácida e smog. É principalmente emitido por veículos motorizados e processos industriais.',
            'so2': 'Dióxido de enxofre é um poluente que pode causar chuva ácida e problemas respiratórios. Suas emissões estão relacionadas à queima de combustíveis fósseis.',
            'co': 'Monóxido de carbono é um gás tóxico que contribui para o aquecimento global. É emitido principalmente por veículos e processos de combustão incompleta.'
        };
        
        return contexts[parameter.toLowerCase()] || 'Este poluente afeta tanto a qualidade do ar quanto contribui para as mudanças climáticas globais.';
    }

    function getSustainableRecommendation(parameter, status) {
        const recommendations = {
            'good': 'Continue suas práticas sustentáveis! A qualidade do ar está boa, mas sempre há espaço para melhorar. Considere usar transporte público ou bicicleta para manter os níveis baixos.',
            'moderate': 'A qualidade do ar está moderada. Reduza o uso de veículos individuais e considere alternativas de transporte sustentável. Desligue motores em paradas prolongadas.',
            'unhealthy': 'A qualidade do ar está insalubre. Evite atividades ao ar livre intensas e use transporte público ou bicicleta. Considere trabalhar de casa se possível.',
            'veryUnhealthy': 'A qualidade do ar está muito insalubre. Evite atividades ao ar livre e use máscaras se precisar sair. Reduza drasticamente o uso de veículos.',
            'hazardous': 'A qualidade do ar está perigosa. Evite sair de casa e use máscaras se necessário. Esta situação destaca a urgência de ações climáticas imediatas.'
        };
        
        return recommendations[status] || 'Mantenha-se informado sobre a qualidade do ar e adote práticas sustentáveis para contribuir com a melhoria ambiental.';
    }

    function updateWeatherCharacter(weatherData, airQualityData) {
        const characterContainer = document.getElementById('weather-character');
        const characterEmoji = characterContainer.querySelector('.character-emoji');
        const characterMessage = characterContainer.querySelector('.character-message');
        

        characterContainer.className = 'weather-character';
        

        const weatherId = weatherData.current.weather[0].id;
        const temp = weatherData.current.temp;
        const airQualityStatus = airQualityData ? getOverallAirQualityStatus(airQualityData) : 'unknown';
        
        let characterState = 'neutral';
        let emoji = '🌤️';
        let message = 'Vamos verificar as condições climáticas juntas!';
        

        if (weatherId >= 200 && weatherId <= 531) {
    
            if (weatherId >= 200 && weatherId <= 232) {
                emoji = '⛈️';
                message = 'Trovões! Vamos ficar seguros e aproveitar para refletir sobre o clima!';
                characterState = 'worried';
            } else if (weatherId >= 300 && weatherId <= 531) {
                emoji = '🌧️';
                message = 'Chuva chegando! Perfeito para economizar água e energia!';
                characterState = 'excited';
            }
        } else if (weatherId === 800) {
    
            if (temp > 30) {
                emoji = '🔥';
                message = 'Calor intenso! Vamos usar energia solar e economizar água!';
                characterState = 'worried';
            } else if (temp < 15) {
                emoji = '❄️';
                message = 'Frio chegando! Vamos nos agasalhar e economizar energia!';
                characterState = 'excited';
            } else {
                emoji = '☀️';
                message = 'Dia perfeito para atividades sustentáveis ao ar livre!';
                characterState = 'happy';
            }
        } else if (weatherId >= 801 && weatherId <= 804) {
    
            emoji = '☁️';
            message = 'Dia nublado! Ótimo para refletir sobre nossas ações climáticas!';
            characterState = 'neutral';
        }
        

        if (airQualityStatus === 'good') {
            emoji = '😊';
            message = 'Excelente! A qualidade do ar está boa hoje!';
            characterState = 'happy';
        } else if (airQualityStatus === 'moderate') {
            emoji = '😐';
            message = 'Qualidade do ar moderada. Vamos fazer nossa parte!';
            characterState = 'neutral';
        } else if (airQualityStatus === 'unhealthy') {
            emoji = '😷';
            message = 'Atenção! Qualidade do ar insalubre. Vamos usar transporte sustentável!';
            characterState = 'worried';
        } else if (airQualityStatus === 'veryUnhealthy' || airQualityStatus === 'hazardous') {
            emoji = '🤢';
            message = 'Cuidado! Qualidade do ar muito ruim. Evite atividades ao ar livre!';
            characterState = 'sad';
        }
        

        characterEmoji.textContent = emoji;
        characterMessage.textContent = message;
        

        setTimeout(() => {
            characterContainer.classList.add(characterState);
        }, 100);
        

        characterContainer.addEventListener('click', () => {
            showCharacterTip(characterState, weatherData, airQualityData);
        });
        

        characterContainer.style.cursor = 'pointer';
    }
    
    function getOverallAirQualityStatus(airQualityData) {

        const parameters = Object.keys(airQualityData);
        let worstStatus = 'good';
        
        parameters.forEach(parameter => {
            const status = airQualityData[parameter].status;
            const statusPriority = {
                'good': 1,
                'moderate': 2,
                'unhealthy': 3,
                'veryUnhealthy': 4,
                'hazardous': 5
            };
            
            if (statusPriority[status] > statusPriority[worstStatus]) {
                worstStatus = status;
            }
        });
        
        return worstStatus;
    }
    
    function showCharacterTip(characterState, weatherData, airQualityData) {
        const tips = {
            'happy': [
                '🌱 Dica: Aproveite o bom tempo para plantar uma árvore!',
                '🚴 Dica: Use bicicleta para aproveitar o ar limpo!',
                '☀️ Dica: Aproveite a luz solar natural!'
            ],
            'excited': [
                '🌧️ Dica: Colete água da chuva para suas plantas!',
                '❄️ Dica: Aproveite o frio para economizar energia!',
                '🌪️ Dica: Tempo instável é perfeito para refletir sobre o clima!'
            ],
            'worried': [
                '🔥 Dica: Use ventilador em vez de ar-condicionado!',
                '⛈️ Dica: Fique seguro e aproveite para economizar energia!',
                '😷 Dica: Use máscara e evite atividades ao ar livre!'
            ],
            'sad': [
                '🤢 Dica: Qualidade do ar ruim - use transporte público!',
                '🌫️ Dica: Evite queimar combustíveis fósseis hoje!',
                '🏠 Dica: Fique em casa e plante uma árvore virtual!'
            ],
            'neutral': [
                '🌤️ Dica: Dia perfeito para começar uma nova prática sustentável!',
                '☁️ Dica: Tempo nublado é ideal para refletir sobre o clima!',
                '🌍 Dica: Cada pequena ação conta para o planeta!'
            ]
        };
        
        const randomTip = tips[characterState][Math.floor(Math.random() * tips[characterState].length)];
        

        const tooltip = document.createElement('div');
        tooltip.className = 'character-tooltip';
        tooltip.textContent = randomTip;
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(103, 232, 249, 0.9);
            color: #000;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            z-index: 1000;
            animation: tooltipFadeIn 0.3s ease-in;
            max-width: 250px;
            text-center;
        `;
        
        document.body.appendChild(tooltip);
        

        const characterRect = document.getElementById('weather-character').getBoundingClientRect();
        tooltip.style.left = (characterRect.left + characterRect.width / 2 - tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = (characterRect.top - tooltip.offsetHeight - 10) + 'px';
        

        setTimeout(() => {
            tooltip.style.animation = 'tooltipFadeOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(tooltip);
            }, 300);
        }, 3000);
    }
    
    function updateDonationProgress() {


        const totalFromRanking = rankingData.reduce((sum, user) => sum + user.pontos, 0);
        

        totalDonations = totalFromRanking;
        donationCount = rankingData.length;
        

        const treesPlanted = Math.floor(totalDonations / 5);
        

        const carbonOffset = Math.floor(treesPlanted * 22);
        

        document.getElementById('total-donations').textContent = `R$ ${totalDonations.toLocaleString('pt-BR')}`;
        document.getElementById('donation-count').textContent = donationCount;
        document.getElementById('trees-planted').textContent = treesPlanted;
        document.getElementById('carbon-offset').textContent = carbonOffset.toLocaleString('pt-BR');
        

        const progressPercentage = Math.min((totalDonations / DONATION_GOAL) * 100, 100);
        const progressBar = document.getElementById('donation-progress-bar');
        progressBar.style.width = `${progressPercentage}%`;
        

        updateMotivationalMessage(progressPercentage);
        

        if (progressPercentage >= 100) {
            showGoalAchievedCelebration();
        }
    }
    
    function updateMotivationalMessage(progressPercentage) {
        const messageElement = document.getElementById('motivational-message');
        let message = '';
        
        if (progressPercentage < 25) {
            message = 'Vamos começar! Cada pequena doação faz a diferença! 🌱';
        } else if (progressPercentage < 50) {
            message = 'Ótimo progresso! Continuem assim! 🌟';
        } else if (progressPercentage < 75) {
            message = 'Mais da metade! Vocês são incríveis! 🚀';
        } else if (progressPercentage < 100) {
            message = 'Quase lá! Último esforço para a meta! 💪';
        } else {
            message = 'Meta alcançada! Vocês são heróis climáticos! 🏆🎉';
        }
        
        messageElement.textContent = message;
    }
    
    function showGoalAchievedCelebration() {

        const confetti = document.createElement('div');
        confetti.innerHTML = '🎉🎊🎈';
        confetti.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 4rem;
            z-index: 10000;
            animation: confettiFall 3s ease-in forwards;
        `;
        
        document.body.appendChild(confetti);
        

        setTimeout(() => {
            document.body.removeChild(confetti);
        }, 3000);
    }

    const donateButton = document.getElementById("donateButton");
    const previewButton = document.getElementById("previewButton");
    const previewModal = document.getElementById("previewModal");
    const closePreviewBtn = document.getElementById("closePreviewBtn");

    function atualizarRanking() {
        const rankingBody = document.getElementById("ranking-body");
        
        fetch('http://localhost:3000/user/data')
            .then(response => response.json())
            .then(data => {
                if (data.status && data.eventos) {
                    rankingData = data.eventos;
                    
                    const savedUserData = localStorage.getItem('userData');
                    if (savedUserData) {
                        const currentUser = JSON.parse(savedUserData);
                        const userIndex = rankingData.findIndex(user => user.nome === currentUser.nome);
                        if (userIndex !== -1) {
                            rankingData[userIndex].pontos = currentUser.pontos || 0;
                        } else {
                            rankingData.push({ nome: currentUser.nome, pontos: currentUser.pontos || 0 });
                        }
                    }
                    
                    rankingData.sort((a, b) => b.pontos - a.pontos);
                    rankingBody.innerHTML = "";
                    
                    rankingData.slice(0, 10).forEach((user, index) => {
                        const tr = document.createElement("tr");
                        tr.className = "border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors";
                        tr.innerHTML = `<td class="p-3 font-bold text-cyan-400">${index + 1}º</td><td class="p-3">${user.nome}</td><td class="p-3 text-right font-bold">${user.pontos}</td>`;
                        rankingBody.appendChild(tr);
                    });
                    
            
                    updateDonationProgress();
                } else {
                    console.error('Invalid response format from server');
                    displayLocalRanking();
                }
            })
            .catch(error => {
                console.error('Error fetching ranking data:', error);
                displayLocalRanking();
            });
    }
    
    function displayLocalRanking() {
        const rankingBody = document.getElementById("ranking-body");
        const savedUserData = localStorage.getItem('userData');
        if (savedUserData) {
            const currentUser = JSON.parse(savedUserData);
            const userIndex = rankingData.findIndex(user => user.nome === currentUser.nome);
            if (userIndex !== -1) {
                rankingData[userIndex].pontos = currentUser.pontos || 0;
            } else {
                rankingData.push({ nome: currentUser.nome, pontos: currentUser.pontos || 0 });
            }
        }
        rankingData.sort((a, b) => b.pontos - a.pontos);
        rankingBody.innerHTML = "";
        
        rankingData.slice(0, 10).forEach((user, index) => {
            const tr = document.createElement("tr");
            tr.className = "border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors";
            tr.innerHTML = `<td class="p-3 font-bold text-cyan-400">${index + 1}º</td><td class="p-3">${user.nome}</td><td class="p-3 text-right font-bold">${user.pontos}</td>`;
            rankingBody.appendChild(tr);
        });
        

        updateDonationProgress();
    }

    donateButton.addEventListener("click", async (event) => {
        event.preventDefault(); 
        const savedUserData = localStorage.getItem('userData');
        if (!savedUserData) {
            showModal("Você precisa se cadastrar na plataforma para doar. Preencha seus dados no topo da página!");
            return;
        }
        const currentUser = JSON.parse(savedUserData);
        const valorDoacao = prompt("Para fins de gamificação, digite o valor que você deseja doar (ex: 10,50):");
        
        if (valorDoacao === null) {
            return; 
        }

        const valorCorrigido = valorDoacao.replace(",", ".");

        if (!valorCorrigido || isNaN(Number(valorCorrigido)) || Number(valorCorrigido) <= 0) {
            showModal("Valor inválido. Por favor, insira um número maior que zero.");
            return;
        }

        showModal("Aguarde, estamos gerando seu link de pagamento seguro...");
        
        const linkDePagamento = await criarPreferenciaDePagamento(currentUser.nome, valorCorrigido);
        
        if (linkDePagamento) {
            currentUser.pontos = (currentUser.pontos || 0) + Number(valorCorrigido);
            localStorage.setItem('userData', JSON.stringify(currentUser));
            
    
            totalDonations += Number(valorCorrigido);
            donationCount++;
            updateDonationProgress();
            
            atualizarRanking();
            showModal("Link gerado! Você será redirecionado.");
            window.open(linkDePagamento, '_blank');
            setTimeout(() => {
                hideModal();
            }, 1500);
        } else {
            showModal("Não foi possível criar o link de pagamento. Verifique o console (F12) para mais detalhes do erro.");
        }
    });

    closeModalBtn.addEventListener("click", hideModal);
    alertModal.addEventListener("click", (event) => {
        if (event.target === alertModal) {
            hideModal();
        }
    });

    atualizarRanking();
    
    
    console.log("Preview button found:", previewButton);
    
    
    window.openMeteoGame = function() {
        console.log("Opening MeteoGame in new tab...");
        window.open('jogo.html', '_blank');
    };
    
});