import { storage, database } from './firebase.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js';
import { ref as dbRef, get, update } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';

const userId = localStorage.getItem('userId');

// Função para obter o nome do arquivo da foto do perfil
const getProfilePicFileName = async () => {
    try {
        if (!userId) {
            console.error('userId não definido');
            return null;
        }

        const userProfileRef = dbRef(database, `usuarios/${userId}`);
        const snapshot = await get(userProfileRef);
        const userData = snapshot.val();

        return userData && userData.foto ? userData.foto : null;
    } catch (error) {
        console.error('Erro ao obter o nome do arquivo da foto do perfil:', error);
        return null;
    }
};

// Função para obter a URL da foto de perfil
const getProfilePicUrl = async () => {
    try {
        const fileName = await getProfilePicFileName();

        if (!fileName) {
            console.log('Nenhuma foto encontrada para o usuário.');
            return null;
        }

        const profilePicRef = storageRef(storage, `profile-pic/${userId}/${fileName}`);
        return await getDownloadURL(profilePicRef);
    } catch (error) {
        console.error('Erro ao obter a URL da foto do perfil:', error);
        return null;
    }
};

// Carregar foto de perfil e nome na sidebar
const getDataSidebar = async (userData) => {
    const profPic = document.getElementById('prof-pic');
    const imageUrl = await getProfilePicUrl();

    profPic.src = imageUrl ? imageUrl : '../static/images/logo-ideal.png';

    const nomeSidebar = document.getElementById('nome-sidebar');
    const cargoSidebar = document.getElementById('cargo-sidebar');

    if (userData) {
        nomeSidebar.textContent = (userData.nome || '').split(' ')[0];
        cargoSidebar.textContent = `${userData.cargo || ''} ${userData.setor || ''}`;
    }
};

// Função para inicializar a página com base no nome
const initProfilePic = async () => {
    try {
        const profilePicElement = document.getElementById('profile-pic');
        const imageUrl = await getProfilePicUrl();
        profilePicElement.src = imageUrl ? imageUrl : '../static/images/logo-ideal.png';
    } catch (error) {
        console.error('Erro ao inicializar a foto de perfil:', error);
    }
};

// Função para obter os dados do usuário
const getUserData = async (userId) => {
    try {
        const userRef = dbRef(database, `usuarios/${userId}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.log('Nenhum dado encontrado para o usuário:', userId);
            return null;
        }
    } catch (error) {
        console.error('Erro ao obter dados do usuário:', error);
        return null;
    }
};

// Função para preencher os inputs do perfil
const fillPerfil = (userData) => {
    if (userData) {
        document.getElementById('nome').value = userData.nome || '';
        document.getElementById('email').value = userData.email || '';
        document.getElementById('cargo').value = userData.cargo || '';
        document.getElementById('setor').value = userData.setor || '';
        document.getElementById('segmento').value = userData.segmento || '';
        document.getElementById('usuario').value = userData.usuario || '';
        document.getElementById('senha').value = userData.senha || '';
    }
};

// Mostrar senha
const mostrarSenha = () => {
    const senhaInput = document.getElementById('senha');
    senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password';
};

document.getElementById('mostrar-senha').onclick = mostrarSenha;

// Atualizar dados do usuário
const updateUserData = () => {
    const newData = {
        nome: document.getElementById('nome').value,
        cargo: document.getElementById('cargo').value,
        setor: document.getElementById('setor').value,
        segmento: document.getElementById('segmento').value,
        senha: document.getElementById('senha').value
    };

    updateUserDataInFirebase(newData);
};

const updateUserDataInFirebase = async (newData) => {
    const userRef = dbRef(database, `usuarios/${userId}`);

    try {
        await update(userRef, newData);
        console.log("Dados atualizados com sucesso!");
    } catch (error) {
        console.error("Erro ao atualizar dados:", error);
    }
};

document.getElementById('send-profile-info').onclick = updateUserData;

// Função para o modal da foto de perfil
const setupModal = () => {
    const modalOverlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');
    const btnModal = document.getElementById('perfil-foto');
    const btnClose = document.querySelector('.btn-close');
    const btnSecondary = document.querySelector('.btn-secondary');
    const btnPrimary = document.getElementById('send-prof-pic');
    const uploadArea = document.querySelector('.upload-area');
    const profilePicMessage = document.querySelector('.profile-pic-message');

    if (!modalOverlay || !modal || !btnModal || !btnClose || !btnSecondary || !btnPrimary || !uploadArea || !profilePicMessage) {
        console.error('Um ou mais elementos necessários não foram encontrados.');
        return;
    }

    let selectedFile = null; // Variável para armazenar o arquivo selecionado

    const openModal = () => {
        modalOverlay.style.display = 'block';
        modal.style.display = 'flex';
    };

    const closeModal = () => {
        modalOverlay.style.display = 'none';
        modal.style.display = 'none';
    };

    const handleFileSelection = (file) => {
        selectedFile = file;
        console.log('Arquivo selecionado:', file.name);
        profilePicMessage.innerHTML = "Foto carregada";
    };

    const handleFileUpload = async () => {
        try {
            if (!selectedFile) {
                console.error('Nenhum arquivo selecionado');
                return;
            }

            const fileRef = storageRef(storage, `profile-pic/${userId}/profile.jpg`);
            await uploadBytes(fileRef, selectedFile);
            const downloadURL = await getDownloadURL(fileRef);
            console.log('Arquivo enviado:', downloadURL);

            const userRef = dbRef(database, `usuarios/${userId}`);
            await update(userRef, { foto: 'profile.jpg' });

            closeModal();
            await initProfilePic();
        } catch (error) {
            console.error('Erro ao fazer upload do arquivo:', error);
        }
    };

    btnModal.onclick = openModal;
    btnClose.addEventListener('click', closeModal);
    btnSecondary.addEventListener('click', closeModal);

    uploadArea.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) handleFileSelection(file);
        });
        fileInput.click();
    });

    btnPrimary.addEventListener('click', handleFileUpload);

    uploadArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (event) => {
        event.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = event.dataTransfer.files[0];
        if (file) handleFileSelection(file);
    });
};

// Função para verificar se está na página 'conversas.html'
const isOnConversasPage = () => {
    return window.location.pathname.endsWith('conversas.html');
};

// Função principal para inicializar
const init = async () => {
    try {
        const userData = await getUserData(userId);

        if (isOnConversasPage()) {
            // Aqui você pode adicionar qualquer outra inicialização específica para 'conversas.html', se necessário
        }
        
        await getDataSidebar(userData);
        fillPerfil(userData);
        await initProfilePic();
        setupModal();
    } catch (error) {
        console.error('Erro durante a inicialização:', error);
    }
};

document.addEventListener('DOMContentLoaded', init);
