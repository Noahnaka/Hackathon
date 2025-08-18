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

    const donateButton = document.getElementById("donateButton");
    let rankingData = [{ nome: "Mariana S.", pontos: 1850 }, { nome: "Carlos E.", pontos: 1700 }, { nome: "Juliana P.", pontos: 1680 }, { nome: "Ricardo A.", pontos: 1520 }, { nome: "Ana L.", pontos: 1300 }];

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
                    rankingData.forEach((user, index) => {
                        const tr = document.createElement("tr");
                        tr.className = "border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors";
                        tr.innerHTML = `<td class="p-3 font-bold text-cyan-400">${index + 1}º</td><td class="p-3">${user.nome}</td><td class="p-3 text-right font-bold">${user.pontos}</td>`;
                        rankingBody.appendChild(tr);
                    });
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
        rankingData.forEach((user, index) => {
            const tr = document.createElement("tr");
            tr.className = "border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors";
            tr.innerHTML = `<td class="p-3 font-bold text-cyan-400">${index + 1}º</td><td class="p-3">${user.nome}</td><td class="p-3 text-right font-bold">${user.pontos}</td>`;
            rankingBody.appendChild(tr);
        });
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
            currentUser.pontos = (currentUser.pontos || 0) + (Number(valorCorrigido) * 10);
            localStorage.setItem('userData', JSON.stringify(currentUser));
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
});