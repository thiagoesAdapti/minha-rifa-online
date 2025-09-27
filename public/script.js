document.addEventListener('DOMContentLoaded', () => {
    // Elementos da página
    const gradeNumeros = document.getElementById('grade-numeros');
    const numerosSelecionadosSpan = document.getElementById('numeros-selecionados');
    const valorTotalSpan = document.getElementById('valor-total');
    const btnComprar = document.getElementById('btn-comprar');
    const inputNome = document.getElementById('nome');
    const inputTelefone = document.getElementById('telefone');
    
    // Modal pix
    const modalPix = document.getElementById('modal-pix');
    const pixCodeTextarea = document.getElementById('pix-code');
    const closeModalButton = document.querySelector('.close-button');
    const btnCopiar = document.getElementById('btn-copiar');
    
    // Máscara para o número de telefone
    const mascaraTelefoneOpcoes = {
        mask: '(00) 00000-0000'
    };
    const mascaraTelefone = IMask(inputTelefone, mascaraTelefoneOpcoes);

    const PRECO_POR_NUMERO = 2.00;
    let numerosSelecionados = [];
    let todosOsNumeros = [];

    // Função para carregar e exibir os números da rifa
    async function carregarNumeros() {
        try {
            const response = await fetch('/api/numeros');
            todosOsNumeros = await response.json();
            
            gradeNumeros.innerHTML = '';
            todosOsNumeros.forEach(numero => {
                const numeroDiv = document.createElement('div');
                numeroDiv.classList.add('numero', numero.status);
                numeroDiv.textContent = String(numero.id).padStart(3, '0');
                numeroDiv.dataset.id = numero.id;

                if (numero.status === 'disponivel') {
                    numeroDiv.addEventListener('click', () => selecionarNumero(numeroDiv));
                } else {
                    numeroDiv.title = 'Comprado';
                }
                
                gradeNumeros.appendChild(numeroDiv);
            });
        } catch (error) {
            console.error('Erro ao carregar números:', error);
            gradeNumeros.innerHTML = '<p>Erro ao carregar a rifa. Tente recarregar a página.</p>';
        }
    }

    // Função para quando um número é clicado
    function selecionarNumero(numeroDiv) {
        const numeroId = parseInt(numeroDiv.dataset.id);
        numeroDiv.classList.toggle('selecionado');
        
        if (numeroDiv.classList.contains('selecionado')) {
            numerosSelecionados.push(numeroId);
            numeroDiv.classList.remove('disponivel');
        } else {
            numerosSelecionados = numerosSelecionados.filter(n => n !== numeroId);
            numeroDiv.classList.add('disponivel');
        }
        
        atualizarResumoEBotao();
    }

    // Atualiza o resumo e o estado do botão de comprar
    function atualizarResumoEBotao() {
        // Atualiza texto dos números
        if (numerosSelecionados.length === 0) {
            numerosSelecionadosSpan.textContent = 'Nenhum';
        } else {
            numerosSelecionados.sort((a, b) => a - b);
            numerosSelecionadosSpan.textContent = numerosSelecionados.join(', ');
        }
        
        // Atualiza valor total
        const valorTotal = numerosSelecionados.length * PRECO_POR_NUMERO;
        valorTotalSpan.textContent = `R$ ${valorTotal.toFixed(2)}`;

        // Ignora a máscara para contar os dígitos
        const telefoneSemMascara = mascaraTelefone.unmaskedValue;
        
        // Habilita ou desabilita o botão de comprar
        if (numerosSelecionados.length > 0 && inputNome.value.trim() !== '' && telefoneSemMascara.length === 11) {
            btnComprar.disabled = false;
        } else {
            btnComprar.disabled = true;
        }
    }

    inputNome.addEventListener('input', atualizarResumoEBotao);
    inputTelefone.addEventListener('input', atualizarResumoEBotao);

    // Comprar
    btnComprar.addEventListener('click', async () => {
        btnComprar.disabled = true;
        btnComprar.textContent = 'Processando...';

        const nome = inputNome.value.trim();
        const telefone = mascaraTelefone.value;

        try {
            const response = await fetch('/api/comprar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numerosSelecionados, nome, telefone })
            });

            const result = await response.json();

            if (response.ok) {
                pixCodeTextarea.value = result.pixCode;
                modalPix.style.display = 'block';
            } else {
                alert(`Erro: ${result.error}`);
            }

        } catch (error) {
            alert('Ocorreu um erro na comunicação com o servidor.');
        } finally {
            // Limpa a seleção e recarrega tudo
            numerosSelecionados = [];
            atualizarResumoEBotao();
            carregarNumeros();
            btnComprar.textContent = 'Comprar Agora';
        }
    });

    // Lógica do modal
    closeModalButton.onclick = () => { modalPix.style.display = 'none'; };
    window.onclick = (event) => { if (event.target == modalPix) { modalPix.style.display = 'none'; } };
    btnCopiar.addEventListener('click', () => {
        pixCodeTextarea.select();
        document.execCommand('copy');
        btnCopiar.textContent = 'Copiado!';
        setTimeout(() => { btnCopiar.textContent = 'Copiar Código'; }, 2000);
    });

    carregarNumeros();
});