(async () => {
  
  const lat = "-23.1791";
  const lon = "-45.8872";

  const apiKey = "49b232b0509cc66eded6ee0411f64892";
  

  
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;

  console.log("Preparando o disparo para:", url);

  try {
    
    const resposta = await fetch(url);

    
    const dados = await resposta.json();

    
    if (dados.cod) {
      console.error("ERRO RECEBIDO DA API:", dados.message);
      alert(`Deu ruim, cz! A API respondeu com erro: ${dados.message}`);
      return;
    }

    
    console.log("✅ SUCESSO! Previsão recebida:", dados);
    console.log("-------------------------------------------");
    console.log(`Temperatura atual: ${dados.current.temp}°C`);
    console.log(
      `Previsão pra próxima hora: ${dados.hourly[1].weather[0].description}`
    );
    console.log(
      `Chance de chuva na próxima hora: ${dados.hourly[1].pop * 100}%`
    );

    alert("É GOL! A API respondeu. Checa o console (F12) pra ver os dados!");
  } catch (erro) {
    
    console.error("Ixi, erro na rede ou no código:", erro);
    alert(
      "DEU B.O. NA CONEXÃO! Checa sua internet ou o console (F12) pra ver o erro."
    );
  }
})();
