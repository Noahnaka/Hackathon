

async function fetchAirQualityData(lat, lon) {
    try {
        console.log("🌬️ Buscando dados de qualidade do ar para:", lat, lon);
        
        
        

        await new Promise(resolve => setTimeout(resolve, 1000));
        

        const mockData = generateMockAirQualityData(lat, lon);
        
        if (mockData) {
            console.log("✅ Dados simulados de qualidade do ar gerados:", mockData);
            return mockData;
        } else {
            console.log("⚠️ Nenhum dado de qualidade do ar disponível para esta localização");
            return null;
        }
        
    } catch (error) {
        console.error("❌ Erro ao buscar dados de qualidade do ar:", error);
        return null;
    }
}

function generateMockAirQualityData(lat, lon) {

    
    const baseTime = new Date();
    const measurements = [];
    
    
    measurements.push({
        parameter: 'pm25',
        value: Math.random() * 30 + 5,
        unit: 'µg/m³',
        location: 'Estação Central',
        datetime: baseTime.toISOString()
    });
    
    
    measurements.push({
        parameter: 'pm10',
        value: Math.random() * 60 + 20,
        unit: 'µg/m³',
        location: 'Estação Central',
        datetime: baseTime.toISOString()
    });
    
    
    measurements.push({
        parameter: 'o3',
        value: Math.random() * 40 + 30,
        unit: 'ppb',
        location: 'Estação Central',
        datetime: baseTime.toISOString()
    });
    
    
    measurements.push({
        parameter: 'no2',
        value: Math.random() * 80 + 20,
        unit: 'ppb',
        location: 'Estação Central',
        datetime: baseTime.toISOString()
    });
    
    
    measurements.push({
        parameter: 'so2',
        value: Math.random() * 50 + 10,
        unit: 'ppb',
        location: 'Estação Central',
        datetime: baseTime.toISOString()
    });
    
    
    measurements.push({
        parameter: 'co',
        value: Math.random() * 5000 + 2000,
        unit: 'ppb',
        location: 'Estação Central',
        datetime: baseTime.toISOString()
    });
    
    
    return processAirQualityData(measurements);
}

function processAirQualityData(measurements) {
    
    const groupedData = {};
    
    measurements.forEach(measurement => {
        const parameter = measurement.parameter;
        const value = measurement.value;
        const unit = measurement.unit;
        const location = measurement.location;
        const datetime = measurement.datetime;
        
        if (!groupedData[parameter]) {
            groupedData[parameter] = {
                parameter: parameter,
                latestValue: value,
                unit: unit,
                locations: [],
                measurements: []
            };
        }
        
        
        if (!groupedData[parameter].locations.includes(location)) {
            groupedData[parameter].locations.push(location);
        }
        
        
        groupedData[parameter].measurements.push({
            value: value,
            datetime: datetime,
            location: location
        });
        
        
        if (new Date(datetime) > new Date(groupedData[parameter].latestDateTime || 0)) {
            groupedData[parameter].latestValue = value;
            groupedData[parameter].latestDateTime = datetime;
        }
    });
    
    
    Object.keys(groupedData).forEach(parameter => {
        const data = groupedData[parameter];
        const values = data.measurements.map(m => m.value);
        data.averageValue = values.reduce((a, b) => a + b, 0) / values.length;
        data.status = getAirQualityStatus(parameter, data.latestValue);
        data.description = getAirQualityDescription(parameter, data.latestValue);
    });
    
    return groupedData;
}

function getAirQualityStatus(parameter, value) {
    
    const standards = {
        'pm25': { good: 12, moderate: 35.4, unhealthy: 55.4, veryUnhealthy: 150.4, hazardous: 250.4 },
        'pm10': { good: 54, moderate: 154, unhealthy: 254, veryUnhealthy: 354, hazardous: 424 },
        'o3': { good: 54, moderate: 70, unhealthy: 85, veryUnhealthy: 105, hazardous: 200 },
        'no2': { good: 53, moderate: 100, unhealthy: 360, veryUnhealthy: 649, hazardous: 1249 },
        'so2': { good: 35, moderate: 75, unhealthy: 185, veryUnhealthy: 304, hazardous: 604 },
        'co': { good: 4400, moderate: 9400, unhealthy: 12400, veryUnhealthy: 15400, hazardous: 30400 }
    };
    
    const standard = standards[parameter.toLowerCase()];
    if (!standard) return 'unknown';
    
    if (value <= standard.good) return 'good';
    if (value <= standard.moderate) return 'moderate';
    if (value <= standard.unhealthy) return 'unhealthy';
    if (value <= standard.veryUnhealthy) return 'veryUnhealthy';
    if (value <= standard.hazardous) return 'hazardous';
    return 'hazardous';
}

function getAirQualityDescription(parameter, value) {
    const status = getAirQualityStatus(parameter, value);
    const descriptions = {
        'good': 'Boa qualidade do ar',
        'moderate': 'Qualidade moderada',
        'unhealthy': 'Qualidade insalubre para grupos sensíveis',
        'veryUnhealthy': 'Qualidade muito insalubre',
        'hazardous': 'Qualidade perigosa'
    };
    
    return descriptions[status] || 'Qualidade desconhecida';
}

function getAirQualityColor(status) {
    const colors = {
        'good': '#00E400',
        'moderate': '#FFFF00',
        'unhealthy': '#FF7E00',
        'veryUnhealthy': '#FF0000',
        'hazardous': '#8F3F97',
        'unknown': '#7E0023'
    };
    
    return colors[status] || '#7E0023';
}

export { fetchAirQualityData, getAirQualityStatus, getAirQualityDescription, getAirQualityColor };
