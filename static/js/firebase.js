import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

// Configurações do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBiF0iZxG_H3gPbyPSlWWhwevazBXwS17Q",
    authDomain: "quanttum-app.firebaseapp.com",
    databaseURL: "https://quanttum-app-default-rtdb.firebaseio.com",
    projectId: "quanttum-app",
    storageBucket: "quanttum-app.appspot.com",
    messagingSenderId: "1139475129",
    appId: "1:1139475129:web:d70a880e108c1ffe2f5168",
    measurementId: "G-4HQWEE5XDV"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);
const storage = getStorage(app);

// Exporta as instâncias que você precisa usar em outros arquivos
export { app, analytics, database, storage };
