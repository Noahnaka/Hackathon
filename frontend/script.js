import { criarPreferenciaDePagamento } from './apis/payApi.js';

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
            
            // Fetch NASA climate data after content becomes visible
            setTimeout(() => {
                fetchNASAClimateData();
            }, 1000);
            
        
            updateWeatherCharacter(data);
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
                pontos: 0
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



    function updateWeatherCharacter(weatherData) {
        const characterContainer = document.getElementById('weather-character');
        if (!characterContainer) return;
        
        const characterEmoji = characterContainer.querySelector('.character-emoji');
        const characterMessage = characterContainer.querySelector('.character-message');
        
        if (!characterEmoji || !characterMessage) return;
        
        characterContainer.className = 'weather-character';
        
        const weatherId = weatherData.current.weather[0].id;
        const temp = weatherData.current.temp;
        
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
        
        characterEmoji.textContent = emoji;
        characterMessage.textContent = message;
        
        setTimeout(() => {
            characterContainer.classList.add(characterState);
        }, 100);
        
        characterContainer.addEventListener('click', () => {
            showCharacterTip(characterState, weatherData);
        });
        
        characterContainer.style.cursor = 'pointer';
    }
    
    
    
    function showCharacterTip(characterState, weatherData) {
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
    
    function calculatePersonalImpact() {
        const userData = localStorage.getItem('userData');
        if (!userData) {
            showNoDataMessage();
            return;
        }

        try {
            const user = JSON.parse(userData);
            const pontos = user.pontos || 0;
            
            const impact = calculateImpactFromPoints(pontos);
            updateImpactDisplay(impact);
            updateProgressBar(impact.impactScore);
            
        } catch (error) {
            console.error('Error calculating personal impact:', error);
            showNoDataMessage();
        }
    }

    function calculateImpactFromPoints(pontos) {
        const impact = {
            treesEquivalent: Math.floor(pontos / 10),
            carMonthsCompensated: Math.floor(pontos / 50),
            homesPowered: Math.floor(pontos / 100),
            impactScore: Math.min(100, Math.floor(pontos / 2)),
            co2Offset: pontos * 2.2,
            energyGenerated: pontos * 12
        };

        return impact;
    }

    function updateImpactDisplay(impact) {
        const personalTrees = document.getElementById('personal-trees');
        const carEmissions = document.getElementById('car-emissions');
        const homesPowered = document.getElementById('homes-powered');
        const impactScore = document.getElementById('impact-score');

        if (personalTrees) personalTrees.textContent = impact.treesEquivalent;
        if (carEmissions) carEmissions.textContent = impact.carMonthsCompensated;
        if (homesPowered) homesPowered.textContent = impact.homesPowered;
        if (impactScore) impactScore.textContent = impact.impactScore + '/100';

        const summaryText = generateImpactSummary(impact);
        const summaryElement = document.getElementById('impact-summary-text');
        if (summaryElement) summaryElement.textContent = summaryText;
    }

    function generateImpactSummary(impact) {
        let summary = '';
        
        if (impact.treesEquivalent > 0) {
            summary += `Você já contribuiu para plantar ${impact.treesEquivalent} árvores equivalentes. `;
        }
        
        if (impact.carMonthsCompensated > 0) {
            summary += `Compensou ${impact.carMonthsCompensated} meses de emissões de carro. `;
        }
        
        if (impact.homesPowered > 0) {
            summary += `Gerou energia limpa para ${impact.homesPowered} casas. `;
        }
        
        if (summary === '') {
            summary = 'Comece sua jornada climática fazendo sua primeira doação!';
        }
        
        return summary;
    }

    function updateProgressBar(score) {
        const progressBar = document.getElementById('impact-progress');
        const progressText = document.getElementById('progress-text');
        
        if (!progressBar || !progressText) return;
        
        const percentage = Math.min(100, score);
        progressBar.style.width = percentage + '%';
        progressText.textContent = percentage + '%';
        
        if (percentage >= 100) {
            progressText.textContent = '100% - Herói Climático!';
            progressBar.style.background = 'linear-gradient(45deg, #fbbf24, #f59e0b)';
        }
    }

    function showNoDataMessage() {
        const personalTrees = document.getElementById('personal-trees');
        const carEmissions = document.getElementById('car-emissions');
        const homesPowered = document.getElementById('homes-powered');
        const impactScore = document.getElementById('impact-score');
        const summaryText = document.getElementById('impact-summary-text');
        const progressText = document.getElementById('progress-text');
        const progressBar = document.getElementById('impact-progress');

        if (personalTrees) personalTrees.textContent = '0';
        if (carEmissions) carEmissions.textContent = '0';
        if (homesPowered) homesPowered.textContent = '0';
        if (impactScore) impactScore.textContent = '0/100';
        if (summaryText) summaryText.textContent = 'Faça login ou registre-se para ver seu impacto pessoal!';
        if (progressText) progressText.textContent = '0%';
        if (progressBar) progressBar.style.width = '0%';
    }

    function refreshPersonalImpact() {
        calculatePersonalImpact();
    }

    window.refreshPersonalImpact = refreshPersonalImpact;
    
    setTimeout(() => {
        calculatePersonalImpact();
    }, 1000);
    
    let nasaClimateChart;
    
    function updateChartStatus(status, message) {
        const statusElement = document.getElementById('chart-status');
        if (!statusElement) return;
        

    }

    async function fetchNASAClimateData() {
        try {
            // Check if climate dashboard exists
            const climateDashboard = document.querySelector('.nasa-climate-dashboard');
            if (!climateDashboard) {
                console.log('Climate dashboard not found, skipping NASA data fetch');
                return;
            }
            
            updateChartStatus('loading', 'Conectando com a NASA...');
            
            const userData = localStorage.getItem('userData');
            if (!userData) return;
            
            const user = JSON.parse(userData);
            const cidade = user.cidade;
            
            if (!cidade) return;
            
            const geoApiURL = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${apiKey}&lang=pt_br`;
            const geoResults = await fetch(geoApiURL);
            const geoJson = await geoResults.json();
            
            if (geoJson.cod !== 200) return;
            
            const { lat, lon } = geoJson.coord;
            
            await fetchNASAPOWERData(lat, lon);
            
        } catch (error) {
            console.error('Error fetching NASA climate data:', error);
            updateChartStatus('mock', 'Erro na conexão com NASA - usando dados simulados');
            showMockClimateData();
        }
    }
    
    async function fetchNASAPOWERData(lat, lon) {
        try {
            // Calculate dates more reliably - NASA allows max 366 days
            const today = new Date();
            const endDate = new Date(today);
            endDate.setDate(today.getDate() - 2); // 2 days ago to be safe
            
            const startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 365); // Exactly 365 days back
            
            // Convert dates to NASA's expected format (YYYYMMDD as integers)
            const startStr = startDate.getFullYear() * 10000 + (startDate.getMonth() + 1) * 100 + startDate.getDate();
            const endStr = endDate.getFullYear() * 10000 + (endDate.getMonth() + 1) * 100 + endDate.getDate();
            
            console.log(`Fetching NASA POWER data for coordinates: ${lat}, ${lon}`);
            console.log(`Date range: ${startStr} to ${endStr} (NASA format)`);
            console.log(`Current date: ${today.toISOString().split('T')[0]}`);
            console.log(`End date: ${endDate.toISOString().split('T')[0]} (should be in past)`);
            console.log(`Start date: ${startDate.toISOString().split('T')[0]} (365 days back)`);
            
            // Validate date range - NASA API requires end date to be in the past
            if (endDate >= today) {
                throw new Error(`End date ${endDate.toISOString().split('T')[0]} is not in the past for NASA API`);
            }
            
            if (startDate >= endDate) {
                throw new Error('Start date must be before end date');
            }
            
            // Calculate days difference to ensure it's within 366 day limit
            const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            if (daysDiff > 366) {
                throw new Error(`Date range ${daysDiff} days exceeds NASA's 366 day limit`);
            }
            
            // Use the NASA POWER point endpoint for single location data
            // This is more appropriate for city-specific climate data
            const nasaPowerURL = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M&community=RE&longitude=${lon}&latitude=${lat}&start=${startStr}&end=${endStr}&format=JSON`;
            
            console.log('NASA API URL:', nasaPowerURL);
            console.log(`Point coordinates: lat ${lat}, lon ${lon}`);
            console.log(`Days requested: ${daysDiff}`);
            
            const response = await fetch(nasaPowerURL);
            
            if (!response.ok) {
                // Try to get the raw response text for debugging
                const responseText = await response.text();
                console.log('NASA API Raw Response:', responseText);
                
                throw new Error(`NASA API responded with status: ${response.status} - ${responseText}`);
            }
            
            const data = await response.json();
            console.log('NASA API Response:', data);
            
            if (data.properties && data.properties.parameter) {
                console.log('Successfully fetched real NASA climate data!');
                updateClimateDisplay(data.properties.parameter);
                createClimateChart(data.properties.parameter);
                updateChartStatus('real', 'Dados da NASA carregados com sucesso!');
            } else {
                console.log('NASA API response missing properties, using mock data');
                updateChartStatus('mock', 'Dados da NASA não disponíveis - usando dados simulados');
                showMockClimateData();
            }
            
        } catch (error) {
            console.error('Error fetching NASA POWER data:', error);
            console.log('Falling back to mock data due to API error');
            updateChartStatus('mock', 'Erro na conexão com NASA - usando dados simulados');
            showMockClimateData();
        }
    }
    
    function updateClimateDisplay(climateData) {
        if (climateData.T2M) {
            // NASA data format: dates as keys, temperatures as values
            const tempData = climateData.T2M;
            const dates = Object.keys(tempData).filter(date => tempData[date] !== -999);
            const temperatures = dates.map(date => tempData[date]);
            
            if (temperatures.length > 0) {
                const currentTemp = temperatures[temperatures.length - 1]; // Most recent temperature
                const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
                const trend = currentTemp - avgTemp;
                
                const globalTemp = document.getElementById('global-temp');
                const tempTrend = document.getElementById('temp-trend');
                const climateAnomaly = document.getElementById('climate-anomaly');
                
                if (globalTemp) globalTemp.textContent = `${currentTemp.toFixed(1)}°C`;
                if (tempTrend) tempTrend.textContent = `${trend > 0 ? '+' : ''}${trend.toFixed(1)}°C`;
                if (climateAnomaly) climateAnomaly.textContent = `${Math.abs(trend).toFixed(1)}°C`;
                
                console.log(`Real NASA temperature data: Current ${currentTemp.toFixed(1)}°C, Average ${avgTemp.toFixed(1)}°C, Trend ${trend.toFixed(1)}°C`);
                console.log(`Data covers ${dates.length} days from ${dates[0]} to ${dates[dates.length-1]}`);
            }
        }
        
        // Since we're only getting temperature data, set solar radiation to N/A
        const solarRadiation = document.getElementById('solar-radiation');
        if (solarRadiation) solarRadiation.textContent = 'N/A (T2M only)';
    }
    
    function createClimateChart(climateData) {
        const ctx = document.getElementById('nasaClimateChart');
        if (!ctx) {
            console.log('Climate chart canvas not found, skipping chart creation');
            return;
        }
        
        if (nasaClimateChart) {
            nasaClimateChart.destroy();
        }
        
        if (!climateData.T2M) {
            console.log('No temperature data available for chart');
            return;
        }
        
        // NASA data format: dates as keys, temperatures as values
        const tempData = climateData.T2M;
        const dates = Object.keys(tempData).filter(date => tempData[date] !== -999); // Filter out missing data
        const temperatures = dates.map(date => tempData[date]);
        
        console.log(`Creating chart with ${dates.length} real NASA data points`);
        console.log('Temperature range:', Math.min(...temperatures).toFixed(1), 'to', Math.max(...temperatures).toFixed(1));
        
        // Convert NASA date format (YYYYMMDD) to readable format
        const labels = dates.map(dateStr => {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('pt-BR', { month: 'short', day: '2-digit' });
        });
        
        // Calculate historical average for comparison
        const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
        const historicalAvg = temperatures.map(() => avgTemp);
        
        try {
            nasaClimateChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Temperatura Real (NASA)',
                        data: temperatures,
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        tension: 0.4,
                        fill: false,
                        pointRadius: 2,
                        pointHoverRadius: 4
                    }, {
                        label: 'Média Histórica',
                        data: historicalAvg,
                        borderColor: '#4ecdc4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        tension: 0,
                        fill: false,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        pointHoverRadius: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 2,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#94a3b8',
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: '#60a5fa',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    if (context.datasetIndex === 0) {
                                        return `Temperatura: ${context.parsed.y.toFixed(1)}°C`;
                                    } else {
                                        return `Média: ${context.parsed.y.toFixed(1)}°C`;
                                    }
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#94a3b8',
                                callback: function(value) {
                                    return value.toFixed(1) + '°C';
                                }
                            },
                            title: {
                                display: true,
                                text: 'Temperatura (°C)',
                                color: '#94a3b8'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#94a3b8',
                                maxRotation: 45,
                                autoSkip: true,
                                maxTicksLimit: 20
                            },
                            title: {
                                display: true,
                                text: 'Data',
                                color: '#94a3b8'
                            }
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    }
                }
            });
            
            console.log('Real NASA climate chart created successfully!');
            console.log(`Chart shows ${temperatures.length} days of real temperature data`);
            
        } catch (error) {
            console.error('Error creating climate chart:', error);
        }
    }
    
    function showMockClimateData() {
        const globalTemp = document.getElementById('global-temp');
        const tempTrend = document.getElementById('temp-trend');
        const solarRadiation = document.getElementById('solar-radiation');
        const climateAnomaly = document.getElementById('climate-anomaly');
        
        if (globalTemp) globalTemp.textContent = '15.2°C';
        if (tempTrend) tempTrend.textContent = '+0.8°C';
        if (solarRadiation) solarRadiation.textContent = '4.2 kWh/m²';
        if (climateAnomaly) climateAnomaly.textContent = '0.8°C';
        
        updateChartStatus('mock', 'Dados simulados - NASA API indisponível');
        createMockClimateChart();
    }
    
    function createMockClimateChart() {
        const ctx = document.getElementById('nasaClimateChart');
        if (!ctx) {
            console.log('Climate chart canvas not found, skipping mock chart creation');
            return;
        }
        
        if (nasaClimateChart) {
            nasaClimateChart.destroy();
        }
        
        const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
        const currentTemps = [14.5, 15.1, 15.8, 16.2, 15.9, 15.2];
        const historicalAvg = [14.0, 14.2, 14.5, 14.8, 15.0, 14.8];
        
        try {
            nasaClimateChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Temperatura Atual',
                        data: currentTemps,
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        tension: 0.4,
                        fill: false
                    }, {
                        label: 'Média Histórica',
                        data: historicalAvg,
                        borderColor: '#4ecdc4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        tension: 0,
                        fill: false,
                        borderDash: [5, 5]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 2,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#94a3b8'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#94a3b8'
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating mock climate chart:', error);
        }
    }
    
    setTimeout(() => {
        fetchNASAClimateData();
    }, 2000);
    
    setTimeout(() => {
        const climateDashboard = document.querySelector('.nasa-climate-dashboard');
        if (climateDashboard) {
            showMockClimateData();
        }
    }, 5000);
    
});

// ODS 13 Popup Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    const ods13PopupBtn = document.getElementById('ods13PopupBtn');
    const ods13Modal = document.getElementById('ods13Modal');
    const closeOds13Modal = document.getElementById('closeOds13Modal');
    const closeOds13Modal2 = document.getElementById('closeOds13Modal2');
    
    if (ods13PopupBtn && ods13Modal) {
        console.log('ODS 13 popup elements found, setting up event listeners');
        
        // Open modal
        ods13PopupBtn.addEventListener('click', function() {
            console.log('ODS 13 button clicked, opening modal');
            ods13Modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
        
        // Close modal functions
        function closeModal() {
            console.log('Closing ODS 13 modal');
            ods13Modal.classList.add('hidden');
            document.body.style.overflow = 'auto'; // Restore scrolling
        }
        
        if (closeOds13Modal) {
            closeOds13Modal.addEventListener('click', closeModal);
        }
        
        if (closeOds13Modal2) {
            closeOds13Modal2.addEventListener('click', closeModal);
        }
        
        // Close modal when clicking outside
        ods13Modal.addEventListener('click', function(e) {
            if (e.target === ods13Modal) {
                closeModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !ods13Modal.classList.contains('hidden')) {
                closeModal();
            }
        });
        
        console.log('ODS 13 popup event listeners set up successfully');
    } else {
        console.log('ODS 13 popup elements not found:', {
            button: !!ods13PopupBtn,
            modal: !!ods13Modal
        });
    }
});