document.addEventListener('DOMContentLoaded', () => {
    // Elementos da página
    const loginScreen = document.getElementById('login-screen');
    const adminContent = document.getElementById('admin-content');
    const passwordInput = document.getElementById('password-input');
    const loginButton = document.getElementById('login-button');
    const loginError = document.getElementById('login-error');
    const listaCompradores = document.getElementById('lista-compradores');
    const exportCsvButton = document.getElementById('export-csv-button');
    const logoutButton = document.getElementById('logout-button');
    
    let adminPassword = '';
    let todosOsNumeros = [];
    let pollingInterval = null;

    function checkSession() {
        const storedPassword = sessionStorage.getItem('adminRifaPassword');
        if (storedPassword) {
            adminPassword = storedPassword;
            showAdminPanel();
        }
    }

    function showAdminPanel() {
        loginScreen.style.display = 'none';
        adminContent.style.display = 'block';
        carregarCompradores();
        iniciarPollingAdmin();
    }

    loginButton.addEventListener('click', handleLogin);
    exportCsvButton.addEventListener('click', exportarParaCSV);
    logoutButton.addEventListener('click', handleLogout);
    // Permite logar apertando "Enter" no campo de senha
    passwordInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            handleLogin();
        }
    });

    async function handleLogin() {
        const inputPassword = passwordInput.value;
        if (!inputPassword) {
            alert('Por favor, digite uma senha.');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senha: inputPassword })
            });

            if (!response.ok) {
                throw new Error('Senha incorreta.');
            }

            adminPassword = inputPassword;
            sessionStorage.setItem('adminRifaPassword', inputPassword);

            showAdminPanel();

        } catch (error) {
            console.error('Falha no login:', error);
            loginError.style.display = 'block'; 
        }
    }

    function handleLogout() {
        sessionStorage.removeItem('adminRifaPassword');
        if (pollingInterval) clearInterval(pollingInterval);
        location.reload();
    }

    async function carregarCompradores() {
        try {
            const response = await fetch('/api/numeros');
            todosOsNumeros = await response.json();
            const vendidos = todosOsNumeros.filter(n => n.status === 'vendido');

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
            if (pollingInterval) clearInterval(pollingInterval);
        }
    }

    function iniciarPollingAdmin() {
        if (pollingInterval) clearInterval(pollingInterval);
        pollingInterval = setInterval(carregarCompradores, 5000);
    }

    function exportarParaCSV() {
        const vendidos = todosOsNumeros.filter(n => n.status === 'vendido');

        if (vendidos.length === 0) {
            alert('Nenhum número vendido para exportar.');
            return;
        }

        const csvRows = vendidos.map(v => {
            const numero = v.id;
            const nome = `"${v.comprador_nome || ''}"`;
            const telefone = `"${v.comprador_telefone || ''}"`;
            return [numero, nome, telefone].join(',');
        });

        const csvString = csvRows.join('\n');

        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'relatorio_rifa.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                throw new Error(errorData.error || 'Erro no servidor.');
            }
            
            alert(`Número ${numeroId} liberado com sucesso!`);
            carregarCompradores(); // Recarrega a lista

        } catch (error) {
            console.error('Erro ao liberar número:', error);
            alert(`Erro: ${error.message}`);
        }
    }

    checkSession();
});