document.addEventListener('DOMContentLoaded', () => {
    // Elementos da página
    const loginScreen = document.getElementById('login-screen');
    const adminContent = document.getElementById('admin-content');
    const passwordInput = document.getElementById('password-input');
    const loginButton = document.getElementById('login-button');
    const loginError = document.getElementById('login-error');
    const listaCompradores = document.getElementById('lista-compradores');
    
    let adminPassword = '';

    loginButton.addEventListener('click', handleLogin);
    // Permite logar apertando "Enter" no campo de senha
    passwordInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            handleLogin();
        }
    });

    function handleLogin() {
        const inputPassword = passwordInput.value;
        if (!inputPassword) {
            alert('Por favor, digite uma senha.');
            return;
        }
        
        // Guarda a senha e tenta carregar o painel
        adminPassword = inputPassword;
        loginScreen.style.display = 'none';
        adminContent.style.display = 'block';
        
        carregarCompradores();
    }

    async function carregarCompradores() {
        try {
            const response = await fetch('/api/numeros');
            const numeros = await response.json();
            const vendidos = numeros.filter(n => n.status === 'vendido');

            listaCompradores.innerHTML = ''; // Limpa a lista

            if (vendidos.length === 0) {
                listaCompradores.innerHTML = '<li>Nenhum número vendido ainda.</li>';
                return;
            }

            vendidos.sort((a, b) => a.id - b.id).forEach(numero => {
                const item = document.createElement('li');
                item.innerHTML = `
                    <span><strong>Número:</strong> ${numero.id}</span>
                    <span><strong>Nome:</strong> ${numero.comprador_nome}</span>
                    <span><strong>Tel:</strong> ${numero.comprador_telefone}</span>
                `;
                
                const btnLiberar = document.createElement('button');
                btnLiberar.textContent = 'Liberar';
                btnLiberar.onclick = () => liberarNumero(numero.id);
                
                item.appendChild(btnLiberar);
                listaCompradores.appendChild(item);
            });

        } catch (error) {
            console.error('Erro ao carregar compradores:', error);
            alert('Não foi possível carregar os dados.');
        }
    }

    async function liberarNumero(numeroId) {
        if (!confirm(`Tem certeza que deseja liberar o número ${numeroId}?`)) {
            return;
        }

        try {
            const response = await fetch('/api/liberar-numero', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numeroId, senha: adminPassword })
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Se a senha estiver errada, volta para a tela de login
                if (response.status === 401) {
                    loginError.style.display = 'block';
                    adminContent.style.display = 'none';
                    loginScreen.style.display = 'block';
                    passwordInput.value = ''; // Limpa o campo de senha
                }
                throw new Error(errorData.error || 'Erro no servidor.');
            }
            
            alert(`Número ${numeroId} liberado com sucesso!`);
            carregarCompradores(); // Recarrega a lista

        } catch (error) {
            console.error('Erro ao liberar número:', error);
            if(response.status !== 401) {
                alert(`Erro: ${error.message}`);
            }
        }
    }
});