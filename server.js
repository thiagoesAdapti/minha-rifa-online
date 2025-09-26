const express = require('express');
const { kv } = require('@vercel/kv');
const { QrCodePix } = require('qrcode-pix');

const app = express();

const PRECO_POR_NUMERO = 2.00;
const CHAVE_PIX = "thiagospeufes@gmail.com"; 
const NOME_RECEBEDOR = "Thiago Figueiredo"; 
const CIDADE_RECEBEDOR = "Sao Mateus";

app.use(express.json());
app.use(express.static('public'));

// Endpoint para o front-end buscar os números
app.get('/api/numeros', async (req, res) => {
    let numeros = await kv.get('rifa_numeros_completa');
    if (!numeros) {
        return res.json([]); 
    }
    res.json(numeros);
});

// Endpoint para processar a compra
app.post('/api/comprar', async (req, res) => {
    const { numerosSelecionados, nome, telefone } = req.body;

    // Validações
    if (!numerosSelecionados || numerosSelecionados.length === 0) return res.status(400).json({ error: 'Nenhum número selecionado.' });
    if (!nome || !telefone) return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });

    let numeros = await kv.get('rifa_numeros_completa');
    if (!numeros) return res.status(500).send('A rifa ainda não foi carregada no sistema.');

    // Verifica se todos os números ainda estão disponíveis
    for (const numeroId of numerosSelecionados) {
        const numero = numeros.find(n => n.id === numeroId);
        if (!numero || numero.status !== 'disponivel') {
            return res.status(400).json({ error: `O número ${numeroId} não está mais disponível.` });
        }
    }

    // Atualiza os dados dos números comprados
    numerosSelecionados.forEach(numeroId => {
        const numero = numeros.find(n => n.id === numeroId);
        if (numero) {
            numero.status = 'vendido';
            numero.comprador_nome = nome;
            numero.comprador_telefone = telefone;
        }
    });
    
    // Salva a lista inteira de volta no banco de dados KV
    await kv.set('rifa_numeros_completa', numeros);

    // Gera o pix
    const valorTotal = numerosSelecionados.length * PRECO_POR_NUMERO;
    const qrCodePix = QrCodePix({
        version: '01', key: CHAVE_PIX, name: NOME_RECEBEDOR,
        city: CIDADE_RECEBEDOR, value: valorTotal,
    });
    const pixCode = qrCodePix.payload();

    res.json({ success: true, pixCode: pixCode });
});
    
module.exports = app;