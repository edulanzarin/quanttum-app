import { storage, database } from './firebase.js';
import { ref as storageRef, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js';
import { ref as dbRef, get, push, set, onValue } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';

const userId = localStorage.getItem('userId');
let currentContactId = null;

// Atualiza o ID do contato atual
const setCurrentContactId = (contactId) => {
    currentContactId = contactId;
};

// Função para obter dados da sidebar
const getDataSidebar = async (userData) => {
    try {
        const profPic = document.getElementById('prof-pic');
        const imageUrl = await getProfilePicUrl(userId); // Corrigir chamada aqui

        profPic.src = imageUrl ? imageUrl : '../static/images/logo-ideal.png';

        const nomeSidebar = document.getElementById('nome-sidebar');
        const cargoSidebar = document.getElementById('cargo-sidebar');

        if (userData) {
            nomeSidebar.textContent = (userData.nome || '').split(' ')[0];
            cargoSidebar.textContent = `${userData.cargo || ''} ${userData.setor || ''}`;
        }
    } catch (error) {
        console.error('Erro ao carregar dados da sidebar:', error);
    }
};

// Função para obter a URL da foto de perfil
const getProfilePicUrl = async (contactId) => {
    try {
        const fileName = await getProfilePicFileName(contactId);

        if (!fileName) {
            console.log('Nenhuma foto encontrada para o contato.');
            return null;
        }

        const profilePicRef = storageRef(storage, `profile-pic/${contactId}/${fileName}`);
        return await getDownloadURL(profilePicRef);
    } catch (error) {
        console.error('Erro ao obter a URL da foto do perfil:', error);
        return null;
    }
};

// Função para obter o nome do arquivo da foto do perfil
const getProfilePicFileName = async (contactId) => {
    try {
        if (!contactId) {
            console.error('contactId não definido');
            return null;
        }

        const userProfileRef = dbRef(database, `usuarios/${contactId}`);
        const snapshot = await get(userProfileRef);
        const userData = snapshot.val();

        return userData && userData.foto ? userData.foto : null;
    } catch (error) {
        console.error('Erro ao obter o nome do arquivo da foto do perfil:', error);
        return null;
    }
};

// Função para obter dados do usuário
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

const loadContacts = () => {
    return new Promise((resolve, reject) => {
        try {
            const usersRef = dbRef(database, `usuarios/`);
            onValue(usersRef, (snapshot) => {
                if (snapshot.exists()) {
                    const usersData = snapshot.val();
                    const contactsListContainer = document.getElementById('contacts-list');

                    if (!contactsListContainer) {
                        console.error('Elemento contacts-list não encontrado no DOM.');
                        return reject(new Error('Elemento contacts-list não encontrado no DOM.'));
                    }

                    // Limpa a lista antes de adicionar novos contatos
                    contactsListContainer.innerHTML = '';

                    // Cria o container para a lista de contatos
                    const contactsList = document.createElement('div');
                    contactsList.className = 'contacts-list';

                    // Criação de uma array de Promises para todas as fotos de perfil
                    const profilePicPromises = [];

                    for (const [contactId, contact] of Object.entries(usersData)) {
                        if (contactId !== userId) { // Evita listar o próprio usuário
                            // Criação do bloco de contato
                            const contactItem = document.createElement('div');
                            contactItem.className = 'contact active';
                            contactItem.setAttribute('data-contact-id', contactId); // Adiciona o data-contact-id

                            // Criação da imagem de perfil
                            const profilePic = document.createElement('img');
                            profilePic.alt = 'Foto de perfil';

                            // Adiciona a Promise para o carregamento da foto de perfil
                            const profilePicPromise = getProfilePicUrl(contactId).then(profilePicUrl => {
                                profilePic.src = profilePicUrl || '../static/images/logo-ideal.png'; // Use uma imagem padrão se não encontrar a foto
                            }).catch(error => {
                                console.error('Erro ao definir a foto de perfil:', error);
                                profilePic.src = '../static/images/logo-ideal.png'; // Use uma imagem padrão em caso de erro
                            });

                            profilePicPromises.push(profilePicPromise);

                            // Criação da div de informações do contato
                            const contactInfo = document.createElement('div');
                            contactInfo.className = 'contact-info';

                            // Criação do nome do contato
                            const contactName = document.createElement('div');
                            contactName.className = 'contact-nome';
                            contactName.textContent = contact.nome || 'Nome desconhecido';

                            // Criação da última mensagem
                            const lastMessage = document.createElement('div');
                            lastMessage.className = 'contact-last-message';
                            lastMessage.textContent = 'Oi'; // Você pode atualizar isso com a última mensagem real, se disponível

                            // Criação da div.notify
                            const notifyDiv = document.createElement('div');
                            notifyDiv.className = 'notify';
                            // O notifyDiv estará vazio por padrão, você pode atualizar seu conteúdo depois se necessário
                            // Exemplo: notifyDiv.textContent = '10'; // Para mostrar uma notificação

                            // Montar a estrutura
                            contactInfo.appendChild(contactName);
                            contactInfo.appendChild(lastMessage);
                            contactItem.appendChild(profilePic);
                            contactItem.appendChild(contactInfo);
                            contactItem.appendChild(notifyDiv); // Adiciona a div.notify ao contato

                            // Adiciona o evento de clique
                            contactItem.addEventListener('click', () => updateConversaHeader(contactId));

                            // Adiciona o contato à lista
                            contactsList.appendChild(contactItem);
                        }
                    }

                    // Resolve a Promise quando todas as fotos de perfil estiverem carregadas
                    Promise.all(profilePicPromises).then(() => {
                        contactsListContainer.appendChild(contactsList);
                        resolve();
                    }).catch(error => {
                        reject(error);
                    });
                } else {
                    console.log('Nenhum contato encontrado.');
                    resolve(); // Resolve mesmo sem contatos
                }
            });
        } catch (error) {
            console.error('Erro ao carregar contatos:', error);
            reject(error);
        }
    });
};

const updateConversaHeader = async (contactId) => {
    try {
        const userRef = dbRef(database, `usuarios/${contactId}`);
        onValue(userRef, async (snapshot) => {
            if (snapshot.exists()) {
                const contactData = snapshot.val();

                let conversaHeader = document.getElementById('conversa-header');

                if (!conversaHeader) {
                    conversaHeader = createConversaHeader();
                }

                const imgHeader = conversaHeader.querySelector('img');
                const nomeHeader = conversaHeader.querySelector('#nome-header');
                const descricaoHeader = conversaHeader.querySelector('#descricao-header');

                if (!imgHeader || !nomeHeader || !descricaoHeader) {
                    console.error('Elementos do cabeçalho da conversa não encontrados.');
                    return;
                }

                const profilePicUrl = await getProfilePicUrl(contactId);
                imgHeader.src = profilePicUrl ? profilePicUrl : '../static/images/logo-ideal.png';

                nomeHeader.textContent = contactData.nome || 'Nome desconhecido';
                descricaoHeader.textContent = `${contactData.cargo || ''} ${contactData.setor || ''} ${contactData.segmento || ''}`;
                
                // Atualiza o ID do contato atual
                setCurrentContactId(contactId);

                // Carrega as mensagens para o contato selecionado
                loadMessages(userId, contactId);
            } else {
                console.log('Nenhum dado encontrado para o contato:', contactId);
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar o cabeçalho da conversa:', error);
    }
};

// Função para criar o elemento do cabeçalho da conversa se não existir
const createConversaHeader = () => {
    const headerContainer = document.createElement('div');
    headerContainer.className = 'conversa-header';
    headerContainer.id = 'conversa-header';

    const imgHeader = document.createElement('img');
    imgHeader.width = 50; // Ajuste o tamanho conforme necessário
    imgHeader.alt = 'Foto de perfil';

    const infoHeader = document.createElement('div');
    infoHeader.className = 'info-header';
    infoHeader.id = 'info-header';

    const nomeHeader = document.createElement('h3');
    nomeHeader.id = 'nome-header';

    const descricaoHeader = document.createElement('span');
    descricaoHeader.id = 'descricao-header';

    infoHeader.appendChild(nomeHeader);
    infoHeader.appendChild(descricaoHeader);

    headerContainer.appendChild(imgHeader);
    headerContainer.appendChild(infoHeader);

    // Adiciona o novo cabeçalho ao corpo ou ao contêiner desejado
    document.body.appendChild(headerContainer); // Ajuste o local conforme necessário

    return headerContainer;
};

// Função para gerar a chave de conversa com IDs em ordem crescente
const getConversationKey = (userId, contactId) => {
    return [userId, contactId].sort().join('_');
};

const sendMessage = async () => {
    const messageInput = document.querySelector('.message-input');
    const message = messageInput.value.trim();
    const userId = localStorage.getItem('userId');
    
    if (!currentContactId) {
        console.log('Nenhum contato selecionado.');
        return;
    }

    if (message) {
        try {
            const conversationKey = getConversationKey(userId, currentContactId);
            const messagesRef = dbRef(database, `conversas/${conversationKey}`);
            const newMessageRef = push(messagesRef);

            await set(newMessageRef, {
                sender: userId,
                receiver: currentContactId,
                message: message,
                timestamp: Date.now(),
                status: 'enviada' // Adiciona o status da mensagem
            });

            messageInput.value = ''; // Limpa o campo de mensagem
        } catch (error) {
            console.error('Erro ao enviar a mensagem:', error);
        }
    }
};


const loadMessages = (userId, contactId) => {
    try {
        const conversationKey = getConversationKey(userId, contactId);
        const messagesRef = dbRef(database, `conversas/${conversationKey}`);
        onValue(messagesRef, async (snapshot) => {
            const messagesContainer = document.getElementById('mensagens');
            if (!snapshot.exists()) {
                messagesContainer.innerHTML = '<p>Nenhuma mensagem encontrada.</p>';
                return;
            }
            
            const messagesData = snapshot.val();

            if (!messagesContainer) {
                console.error('Elemento messages-container não encontrado no DOM.');
                return;
            }

            // Limpa o contêiner de mensagens
            messagesContainer.innerHTML = '';

            let lastMessageDate = null;

            for (const messageId in messagesData) {
                const message = messagesData[messageId];

                // Cria o elemento para a mensagem
                const messageElement = document.createElement('div');
                messageElement.className = message.sender === userId ? 'message-sent' : 'message-received';

                // Cria o elemento de conteúdo da mensagem
                const contentElement = document.createElement('div');
                contentElement.className = 'content';
                contentElement.textContent = message.message; // Adiciona o conteúdo da mensagem

                // Converte o timestamp para horas e minutos (formato 15:30)
                const date = new Date(message.timestamp);
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const formattedTime = `${hours}:${minutes}`;

                // Cria o elemento de hora da mensagem
                const timeElement = document.createElement('div');
                timeElement.className = 'time';
                timeElement.textContent = formattedTime; // Adiciona a hora no formato 15:30

                // Verifica se é a primeira mensagem do dia
                const messageDate = date.toLocaleDateString();
                if (lastMessageDate !== messageDate) {
                    const dateElement = document.createElement('div');
                    dateElement.className = 'date-separator';
                    dateElement.textContent = messageDate; // Exibe a data

                    // Adiciona o separador de data ao contêiner
                    messagesContainer.appendChild(dateElement);

                    lastMessageDate = messageDate;
                }

                // Adiciona o conteúdo e o tempo à mensagem
                messageElement.appendChild(contentElement);
                messageElement.appendChild(timeElement);

                // Adiciona a mensagem ao contêiner
                messagesContainer.appendChild(messageElement);
            }

            // Atualiza o status das mensagens como "visualizada"
            await updateMessageStatusToViewed(conversationKey, userId);

            // Contar e mostrar mensagens não lidas
            const unreadCount = await countUnreadMessages(userId, contactId);
            console.log(`Total de mensagens não lidas para o contato ${contactId}: ${unreadCount}`);

            // Faz o scroll para o final das mensagens
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }
};

// Função para atualizar o status das mensagens para "visualizada"
const updateMessageStatusToViewed = async (conversationKey, userId) => {
    try {
        const messagesRef = dbRef(database, `conversas/${conversationKey}`);
        const snapshot = await get(messagesRef);

        if (snapshot.exists()) {
            const messagesData = snapshot.val();

            // Atualiza o status de todas as mensagens enviadas pelo outro usuário
            for (const messageId in messagesData) {
                const message = messagesData[messageId];
                if (message.receiver === userId && message.status === 'enviada') {
                    const messageRef = dbRef(database, `conversas/${conversationKey}/${messageId}`);
                    await set(messageRef, { ...message, status: 'visualizada' });
                }
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar o status das mensagens:', error);
    }
};

const countUnreadMessages = (userId, contactId) => {
    return new Promise((resolve, reject) => {
        const conversationKey = getConversationKey(userId, contactId);
        const messagesRef = dbRef(database, `conversas/${conversationKey}`);

        onValue(messagesRef, (snapshot) => {
            if (!snapshot.exists()) {
                console.log(`Nenhuma mensagem encontrada para o contato ${contactId}.`);
                resolve(0);
                return;
            }

            const messagesData = snapshot.val();
            let unreadCount = 0;

            for (const messageId in messagesData) {
                const message = messagesData[messageId];
                if (message.receiver === userId && message.status === 'enviada') {
                    unreadCount++;
                }
            }

            console.log(`Mensagens não lidas para o contato ${contactId}: ${unreadCount}`);
            resolve(unreadCount);
        }, { onlyOnce: true }); // Opcional: Usa onlyOnce para ouvir a mudança apenas uma vez
    });
};

const updateNotificationForContacts = (userId) => {
    const usersRef = dbRef(database, `usuarios/`);

    onValue(usersRef, (snapshot) => {
        if (!snapshot.exists()) {
            console.log('Nenhum contato encontrado.');
            return;
        }

        const usersData = snapshot.val();
        const contactsListContainer = document.getElementById('contacts-list');

        if (!contactsListContainer) {
            console.error('Elemento contacts-list não encontrado no DOM.');
            return;
        }

        for (const [contactId] of Object.entries(usersData)) {
            if (contactId !== userId) {
                countUnreadMessages(userId, contactId).then(unreadCount => {
                    // Encontra o contato na lista de contatos
                    const contactElement = contactsListContainer.querySelector(`.contact[data-contact-id="${contactId}"]`);

                    if (contactElement) {
                        let notifyDiv = contactElement.querySelector('.notify');

                        if (unreadCount > 0) {
                            // Cria a div.notify se não existir
                            if (!notifyDiv) {
                                notifyDiv = document.createElement('div');
                                notifyDiv.className = 'notify';
                                contactElement.appendChild(notifyDiv);
                            }
                            notifyDiv.textContent = unreadCount; // Atualiza o número de mensagens não visualizadas
                        } else if (notifyDiv) {
                            // Remove a notificação se não houver mensagens não visualizadas
                            notifyDiv.remove();
                        }
                    }
                }).catch(error => {
                    console.error('Erro ao atualizar notificação para contatos:', error);
                });
            }
        }
    });
};

window.onload = () => {
    const userId = localStorage.getItem('userId');

    if (userId) {
        getUserData(userId).then(userData => {
            getDataSidebar(userData);
            loadContacts().then(() => updateNotificationForContacts(userId)).catch(error => {
                console.error('Erro ao atualizar notificações:', error);
            });
        }).catch(error => {
            console.error('Erro ao obter dados do usuário:', error);
        });
    } else {
        console.log('Usuário não encontrado.');
    }

    const sendButton = document.getElementById('send-button');
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    const messageInput = document.querySelector('.message-input');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
};

