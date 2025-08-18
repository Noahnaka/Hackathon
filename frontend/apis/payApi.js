async function criarPreferenciaDePagamento(nome, valor) {
    const accessToken = 'TEST-2456748988229588-081715-7aea15cc7e6ff7bd0f1cefb6710cf3f8-207454068'; 

    const url = 'https://api.mercadopago.com/checkout/preferences';
    const url2 = 'http://localhost:3000/user/data'

    try {
        const body2 = {
            nome: nome,
            pontos: Number(valor)
        };

        const response = await fetch(url2, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body2)
        });

        if (!response.ok) {
            console.error("Erro ao criar preferência de pagamento:", await response.json());
            return null;
        }

        const preference = await response.json();

    } catch (error) {
        console.error("Erro de conexão ao criar preferência:", error);
        return null;
    }

    const body = {
        items: [
            {
                title: `Doação para Ações ODS 13 - Apoiador: ${nome}`,
                quantity: 1,
                unit_price: Number(valor),
                currency_id: 'BRL'
            }
        ],
        back_urls: {
          
                    success: "https://www.google.com.br",
        failure: "https://www.google.com.br",
        pending: "https://www.google.com.br"
        },
        auto_return: 'approved'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            console.error("Erro ao criar preferência de pagamento:", await response.json());
            return null;
        }

        const preference = await response.json();
        return preference.sandbox_init_point;

    } catch (error) {
        console.error("Erro de conexão ao criar preferência:", error);
        return null;
    }
}

export { criarPreferenciaDePagamento };