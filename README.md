# WhatsApp Bot API

Esse API serve para salvar dados do usuario e mandar mensagem

## Requisitos

- Node.js 
- MySQL database 
- Um telefone com whatsapp para escanear o QR CODE

## Instalação

1. Instalar depencencias:
```bash
npm install
```

2. Instalar pacotes necesarios:
```bash
npm install whatsapp-web.js qrcode-terminal
npm install express
npm install mysql2
npm install cors
```

## Como rodar

### Iniciando o servidor

1. Copia e cola no terminal:
```bash
node Servidor.js
Rodar Index.html usando live server
```

2. O servidor vai iniciar na URL `http://localhost:3000`

3. Escanea o QR code que vai aparecer no terminal com sua conta do whatsapp

4. Quando conectado, vai aparecer um log no console e após conectar você nao vai precisar conectar de novo

### Requisições para a API

Um POST para `/send/message` manda mensagem pelo whatsap conectado, o body no formato:

```json
{
  "mensagem": "Hello world!",
  "telefone": "5511999999999"
}
```

**Nota:** O número de telefone deve incluir o código do país e o DDD.

Um POST para `/user/data` salva os dados do usuario no banco, o body no formato:

```json
{
    "localizacao": "Sao jose dos campos",
    "telefone":"5512982682348"
}
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send/message` | Manda um WhatsApp message |
| POST | `/user/data` | Salva os dados do usuario |



## APIs do Frontend

Estas APIs são usadas pelo `frontend/index.html` via `frontend/script.js` para exibir clima, qualidade do ar e processar doações.

### Previsão do Tempo (OpenWeather)

- **Arquivo**: `frontend/apis/openWeather.js` (exemplo isolado de teste). A implementação em produção está em `frontend/script.js`.
- **Propósito**: Buscar lat/lon da cidade e carregar a previsão com a One Call 3.0.
- **Configuração**: Defina sua chave da OpenWeather em `frontend/script.js` na constante `apiKey`.
- **Endpoints usados**:
  - `GET https://api.openweathermap.org/data/2.5/weather?q={cidade}&appid={API_KEY}&lang=pt_br`
  - `GET https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude=minutely,hourly&appid={API_KEY}&units=metric&lang=pt_br`

Exemplo (trecho usado em `frontend/script.js`):
```js
const geoApiURL = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${apiKey}&lang=pt_br`;
const oneCallApiURL = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&appid=${apiKey}&units=metric&lang=pt_br`;
```

### Qualidade do Ar (OpenAQ)

- **Arquivo**: `frontend/apis/openAQ.js`
- **Propósito**: Exibir indicadores de qualidade do ar (PM2.5, PM10, O3, NO2, SO2, CO) com status e cores.
- **Status**: Usa dados simulados no frontend para demonstração. Em produção, usar um backend proxy para a OpenAQ (CORS).
- **Exporta**:
  - `fetchAirQualityData(lat, lon)` → retorna dados agrupados por parâmetro com `latestValue`, `averageValue`, `unit`, `status`, `description`.
  - `getAirQualityStatus(param, value)`, `getAirQualityDescription(param, value)`, `getAirQualityColor(status)`.

Exemplo de uso:
```js
import { fetchAirQualityData } from './frontend/apis/openAQ.js';
const aqi = await fetchAirQualityData(-23.17, -45.88);
```

### Pagamentos (MercadoPago)

- **Arquivo**: `frontend/apis/payApi.js`
- **Propósito**: Criar preferência de pagamento (doações) e retornar o link de checkout.
- **Função principal**: `criarPreferenciaDePagamento(nome, valor)` → `Promise<string|null>` (link do checkout sandbox).
- **Fluxo**:
  1. Atualiza os pontos do usuário no backend: `PUT http://localhost:3000/user/data`.
  2. Cria preferência no MercadoPago: `POST https://api.mercadopago.com/checkout/preferences` (usa token de teste).
- **Observações**: Rode o backend em `http://localhost:3000`. Substitua o token de teste por um seguro antes de produção e ajuste `back_urls`.
sa
Exemplo de uso:
```js
import { criarPreferenciaDePagamento } from './frontend/apis/payApi.js';
const link = await criarPreferenciaDePagamento('Maria', 20);
if (link) window.open(link, '_blank');
```