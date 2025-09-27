require('dotenv').config();
const { kv } = require('@vercel/kv');

const NUMERO_INICIAL = 151;
const NUMERO_FINAL = 300;

const MEUS_NUMEROS = [];
for (let i = NUMERO_INICIAL; i <= NUMERO_FINAL; i++) {
  MEUS_NUMEROS.push(i);
}

async function carregarRifa() {
  console.log(`Preparando para carregar os números...`);

  const novosNumeros = MEUS_NUMEROS.map(numero => ({
    id: numero,
    status: 'disponivel',
    comprador_nome: null,
    comprador_telefone: null
  }));

  try {
    await kv.set('rifa_numeros_completa', novosNumeros);
    console.log(`Sucesso! ${novosNumeros.length} números foram carregados/resetados no banco de dados.`);
    console.log('Sua rifa personalizada está pronta para começar.');
  } catch (error) {
    console.error('Ocorreu um erro ao tentar se comunicar com o Vercel KV:', error);
    console.log('Verifique se as variáveis de ambiente no arquivo .env estão corretas.');
  }
}

carregarRifa();