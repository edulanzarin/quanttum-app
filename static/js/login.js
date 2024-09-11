import { ref, child, get } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
import { database } from './firebase.js';

// Obtém a referência ao formulário de login do HTML
document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    // Obtém os valores dos campos username e password
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Requisição no Firebase para buscar o nó 'usuarios'
    try {
        const dbRef = ref(database, 'usuarios');
        const snapshot = await get(dbRef);

        if (snapshot.exists()) {
            const users = snapshot.val();
            let authenticated = false;
            let userId = null;

            // Verifica o usuário e senha no nó 'usuarios'
            for (const id in users) {
                if (users[id].usuario === username && users[id].senha === password) {
                    authenticated = true;
                    userId = id;
                    break;
                }
            }

            if (authenticated) {
                // Armazena o userId no localStorage
                localStorage.setItem('userId', userId);

                // Redireciona para a página principal
                window.location.href = `index.html`;
            } else {
                alert('Usuário ou senha inválidos!');
            }
        } else {
            alert('Nenhum usuário encontrado!');
        }
    } catch (error) {
        console.error('Erro ao buscar os dados:', error);
        alert('Erro ao buscar os dados!');
    }
});
