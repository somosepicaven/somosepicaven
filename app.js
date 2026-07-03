import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInWithCustomToken, 
    signInAnonymously, 
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// 1. Resolver variables de entorno globales proporcionadas por el sistema
const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
const firebaseConfig = typeof window.__firebase_config !== 'undefined' 
    ? JSON.parse(window.__firebase_config) 
    : {
        apiKey: "AIzaSyChLLOgR4OTRwcswYyo0Y1JASf5jp8CTTc", // Fallback local
        authDomain: "proyecto-epica-c3d2d.firebaseapp.com",
        projectId: "proyecto-epica-c3d2d",
        storageBucket: "proyecto-epica-c3d2d.firebasestorage.app",
        messagingSenderId: "827017252574",
        appId: "1:827017252574:web:7b8d5d839e12eb0c3efc4f"
      };

// 2. Inicializar Aplicación y Servicios
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentUserId = null;

// Exponer las variables globales necesarias para la UI de index.html (Súmate a la Red de Mando)
window.firebaseAuth = auth;
window.firebaseDB = db;
window.isFirebaseActive = true;
window.FirebaseBridge = {
    GoogleAuthProvider,
    signInWithPopup
};

if (typeof window.updateCloudStatus === 'function') {
    window.updateCloudStatus(true);
}

// Helpers seguros para logs si existen en index.html
const safePushSystemLog = (msg) => {
    if (typeof window.pushSystemLog === 'function') {
        window.pushSystemLog(msg);
    } else {
        console.log("SYS_CORE >> " + msg);
    }
};

const safeShowToast = (msg, type) => {
    if (typeof window.showToast === 'function') {
        window.showToast(msg, type);
    } else {
        console.log(`[${type}] TOAST: ` + msg);
    }
};

// 3. Helper de Rutas Públicas (Garantiza el cumplimiento de la REGLA 1)
const getPublicCollectionRef = (collectionName) => {
    return collection(db, 'artifacts', appId, 'public', 'data', collectionName);
};

const getPublicDocRef = (collectionName, docId) => {
    return doc(db, 'artifacts', appId, 'public', 'data', collectionName, docId);
};

// ==========================================
// MÓDULO: CNE ÉPICA (TELEMETRÍA EN VIVO)
// ==========================================
function syncCNEVotesRealtime() {
    const colRef = getPublicCollectionRef('cne_votos');
    const q = query(colRef);
    
    onSnapshot(q, (snapshot) => {
        let siVotes = 0;
        let noVotes = 0;
        let abstVotes = 0;
        let newLedger = [];
        
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.choice === 'SI') siVotes++;
            else if (data.choice === 'NO') noVotes++;
            else if (data.choice === 'ABSTENCIÓN') abstVotes++;
            
            newLedger.push({
                docId: docSnap.id,
                ...data
            });
        });
        
        // Ordenamiento en cliente (REGLA 2)
        newLedger.sort((a, b) => b.timestamp - a.timestamp);
        
        // Exponer al objeto window de cne_epica.html
        if (typeof window.voteState !== 'undefined') {
            window.voteState.si = siVotes + 184912; // Base de simulación original + votos reales
            window.voteState.no = noVotes + 92450;
            window.voteState.abst = abstVotes + 18912;
            
            // Mantener solo los últimos 50 en el ledger mock, añadir los reales
            window.ledger = newLedger.slice(0, 50); 
            
            if (typeof window.renderCharts === 'function') window.renderCharts();
            if (typeof window.updateLedgerUI === 'function') window.updateLedgerUI();
        }
    }, (error) => {
        console.error("Falla en snapshot de votos CNE:", error);
    });
}

// Reemplazo global de submitPhoneVote para cne_epica.html
window.submitPhoneVote = async function() {
    if (!currentUser) return;
    
    const choiceMap = {
        'SI': 'SI',
        'NO': 'NO',
        'ABSTENCIÓN': 'ABSTENCIÓN'
    };
    
    const choice = choiceMap[window.voterVote] || 'ABSTENCIÓN';
    const ci = window.enteredCI || 'V-00000000';
    const hashStr = 'sha256_' + Math.random().toString(36).substring(2, 15) + Date.now();
    
    if (typeof window.setPhoneStep === 'function') {
        window.setPhoneStep('submitting');
    }
    
    try {
        const colRef = getPublicCollectionRef('cne_votos');
        await addDoc(colRef, {
            ci: ci,
            choice: choice,
            hash: hashStr,
            timestamp: Date.now(),
            createdBy: currentUserId
        });
        // La UI avanzará a 'receipt' vía el listener real-time o local, pero forzaremos localmente para fluidez:
        if (typeof window.setPhoneStep === 'function') {
            setTimeout(() => window.setPhoneStep('receipt'), 1000);
        }
    } catch (error) {
        console.error("Error transmitiendo voto:", error);
        safeShowToast("Error de transmisión cifrada", "error");
    }
};


// ==========================================
// MÓDULO: MILITANTES (MANDO DB)
// ==========================================
function syncMilitantsRealtime() {
    const colRef = getPublicCollectionRef('militantes');
    
    // Consulta simple (Cumple REGLA 2)
    const q = query(colRef);
    
    // Listener asíncrono con callback de éxito y manejo de errores (Mandatorio)
    onSnapshot(q, (snapshot) => {
        window.militantsDB = []; // Usamos la variable global
        snapshot.forEach((docSnap) => {
            window.militantsDB.push({ id: docSnap.id, docId: docSnap.id, ...docSnap.data() });
        });
        
        // Ordenamiento en memoria del cliente (REGLA 2)
        window.militantsDB.sort((a, b) => b.timestamp - a.timestamp);
        
        // Reflejar cambios en la UI
        if (typeof window.renderMilitantsTable === 'function') window.renderMilitantsTable();
        if (typeof window.updateDashboardMetrics === 'function') window.updateDashboardMetrics();
        safePushSystemLog(`Sincronización Mando DB completada. ${window.militantsDB.length} registros cargados.`);
    }, (error) => {
        console.error("Falla en snapshot militantes:", error);
        safeShowToast("Error de conexión al sincronizar la base de datos de militantes.", "error");
    });
}

// Función para añadir Militante a la nube
window.registerMilitant = async function(event) {
    event.preventDefault();
    if (!currentUser) {
        safeShowToast("Error: No autenticado en el sistema.", "error");
        return;
    }
    
    const name = document.getElementById('militant-name').value;
    const cid = document.getElementById('militant-id').value;
    const node = document.getElementById('militant-node').value;
    const skill = document.getElementById('militant-skill').value;
    const phone = document.getElementById('militant-phone').value;
    
    try {
        const colRef = getPublicCollectionRef('militantes');
        await addDoc(colRef, {
            name,
            cid,
            node,
            skill,
            phone,
            status: "Activo",
            timestamp: Date.now(),
            createdBy: currentUserId
        });
        
        document.getElementById('militant-form').reset();
        safeShowToast("Analista registrado exitosamente en la nube central.", "success");
    } catch (error) {
        console.error("Error al registrar en Firestore:", error);
        safeShowToast("Falla de escritura en la base de datos.", "error");
    }
};

// Función para eliminar Militante de la nube
window.deleteMilitant = async function(docId) {
    if (!currentUser) return;
    try {
        const docRef = getPublicDocRef('militantes', docId);
        await deleteDoc(docRef);
        safeShowToast("Analista removido de la base de datos.", "info");
    } catch (error) {
        console.error("Error al remover documento:", error);
    }
};


// ==========================================
// PUENTE DE CONTROLES DE AUTENTICACIÓN
// ==========================================
// Sincronización de Autenticación de Prioridad Alta
const initAuthBridge = async () => {
    try {
        const token = typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : null;
        if (token) {
            await signInWithCustomToken(auth, token);
            safePushSystemLog("Autenticación con Token Personalizado exitosa.");
        } else {
            await signInAnonymously(auth);
            safePushSystemLog("Autenticación Anónima iniciada.");
        }
    } catch (error) {
        console.error("Falla crítica en inicialización Auth:", error);
        safePushSystemLog("ERROR CRÍTICO: No se pudo establecer conexión de seguridad.");
    }
};

// Escucha del estado de autenticación para activar base de datos
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        currentUserId = user.uid || crypto.randomUUID();
        const inputAppId = document.getElementById('firebase-app-id-input');
        if (inputAppId) inputAppId.value = appId;
        
        safePushSystemLog(`Usuario autenticado de forma segura. ID: ${currentUserId}`);
        
        // Activar las escuchas en tiempo real de las colecciones (REGLA 3 cumplida)
        if (document.getElementById('panel-militantes')) {
            syncMilitantsRealtime();
        }
        
        // Si estamos en la app CNE EPICA
        if (document.getElementById('content-simulador')) {
            syncCNEVotesRealtime();
        }
    } else {
        currentUser = null;
        currentUserId = null;
        safePushSystemLog("Estado de sesión: No autenticado.");
    }
});

// Arrancar flujo en la carga de la página
initAuthBridge();
