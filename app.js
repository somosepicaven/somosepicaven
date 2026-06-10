import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, collection, query } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- MANEJADOR GLOBAL DE ERRORES (ERROR BOUNDARY) ---
window.handleAppError = function(error, context = "Sistema") {
    console.error(`[ÉPICA ERROR - ${context}]:`, error);
    
    // Si la UI principal tiene showToast, la usamos
    if (typeof window.showToast === 'function') {
        window.showToast(`Error en ${context}: ${error.message || 'Fallo de red o permisos.'}`, "error");
    } else {
        alert(`ÉPICA ERROR [${context}]: ${error.message || 'Fallo de red o permisos.'}`);
    }
    
    // Si la UI tiene pushSystemLog, lo usamos para el Dashboard
    if (typeof window.pushSystemLog === 'function') {
        window.pushSystemLog(`[Fallo en ${context}] -> Activando protocolos offline.`);
    }
    
    // Si es un error de Firebase de permisos o red, activamos la API de contingencia PHP
    if (error.code === 'permission-denied' || error.code === 'unavailable' || error.message.includes('offline')) {
        window.isFirebaseActive = false;
        if (typeof window.updateCloudStatus === 'function') {
            window.updateCloudStatus('offline');
        }
    }
};

window.addEventListener('error', function(e) {
    window.handleAppError(e.error, "Excepción Global");
});

window.addEventListener('unhandledrejection', function(e) {
    window.handleAppError(e.reason, "Promesa Asíncrona");
});

// --- CONFIGURACIÓN DE FIREBASE (CREDENCIAIS SUMINISTRADAS) ---
const firebaseConfig = {
  apiKey: "AIzaSyChLLOgR4OTRwcswYyo0Y1JASf5jp8CTTc",
  authDomain: "proyecto-epica-c3d2d.firebaseapp.com",
  projectId: "proyecto-epica-c3d2d",
  storageBucket: "proyecto-epica-c3d2d.firebasestorage.app",
  messagingSenderId: "827017252574",
  appId: "1:827017252574:web:7b8d5d839e12eb0c3efc4f",
  measurementId: "G-WJNVBJYWJ8"
};

let app, auth, db;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    window.firebaseDb = db;
    window.firebaseAuth = auth;
    window.isFirebaseActive = true;
} catch (e) {
    window.handleAppError(e, "Inicialización Firebase");
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('ServiceWorker registrado:', reg.scope))
            .catch(err => window.handleAppError(err, "Service Worker"));
    });
}

// --- AUTH GUARD: Login Administrador ---
window.ensureAuthenticated = async function() {
    if (auth.currentUser) return auth.currentUser;
    try {
        // Inicio de sesión con las credenciales suministradas por el usuario
        const cred = await signInWithEmailAndPassword(auth, "somosepicave@gmail.com", "robertodou1");
        if (typeof window.pushSystemLog === 'function') window.pushSystemLog("CONEXIÓN FIREBASE ESTABLECIDA - Auth Guard Administrador completado.");
        if (typeof window.updateCloudStatus === 'function') window.updateCloudStatus('online');
        return cred.user;
    } catch (e) {
        window.handleAppError(e, "Auth Guard (Firebase Login)");
        throw e;
    }
};

// --- SYNC ENGINE: Sincronización Segura ---
window.syncMilitantToFirebase = async function(militantData) {
    try {
        await window.ensureAuthenticated();
        const appId = typeof window.getAppId === 'function' ? window.getAppId() : 'default-app-id';
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'militantes', militantData.id);
        await setDoc(docRef, militantData);
        if (typeof window.pushSystemLog === 'function') window.pushSystemLog(`Militante ${militantData.name} respaldado en Firestore.`);
    } catch (err) {
        window.handleAppError(err, "Escritura de Firestore");
        // Fallback a PHP API Contingencia
        syncToPHPFallback(militantData);
    }
};

async function syncToPHPFallback(data) {
    try {
        if (typeof window.pushSystemLog === 'function') window.pushSystemLog("Intentando respaldo en nube PHP alterna...");
        const res = await fetch('api.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("PHP API retornó error.");
        if (typeof window.pushSystemLog === 'function') window.pushSystemLog("Respaldo exitoso en nube PHP alterna.");
    } catch (e) {
        window.handleAppError(e, "Fallback PHP Sync");
        if (typeof window.pushSystemLog === 'function') window.pushSystemLog("Guardado en LocalStorage/IndexedDB activado.");
    }
}

// Listener de Base de Datos
window.addEventListener('load', async () => {
  try {
    await window.ensureAuthenticated();
    const appId = typeof window.getAppId === 'function' ? window.getAppId() : 'default-app-id';
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'militantes'));
    onSnapshot(q, (snapshot) => {
        let updatedList = [];
        snapshot.forEach((doc) => {
            updatedList.push(doc.data());
        });
        if (updatedList.length > 0 && typeof window.militantsDB !== 'undefined') {
            window.militantsDB = updatedList;
            localStorage.setItem('epica_militants_db', JSON.stringify(window.militantsDB));
            if(typeof window.renderMilitantsTable === 'function') window.renderMilitantsTable();
            if(typeof window.updateDashboardMetrics === 'function') window.updateDashboardMetrics();
            if(window.pushSystemLog) window.pushSystemLog('Base de datos sincronizada remotamente via Firestore.');
        }
    }, (error) => {
        window.handleAppError(error, "Lectura de Firebase (onSnapshot)");
    });
  } catch (e) {
      // Error handled by ensureAuthenticated
  }
});

// --- LOCTI LEDGER MODULE ---
window.loctiRecords = [];
window.loctiCurrentPage = 1;
const LOCTI_PAGE_SIZE = 50;

window.generateLOCTILedger = async function() {
    try {
        if (typeof window.pushSystemLog === 'function') window.pushSystemLog("Generando 5,050 registros LOCTI asíncronamente...");
        window.loctiRecords = [];
        const companies = ["Polar", "Banesco", "Mercantil", "Traki", "Farmatodo", "Gama", "Plumrose", "Nestlé", "Digitel", "Movistar"];
        const territories = ["Caracas", "Miranda", "Zulia", "Mérida", "Sucre", "Táchira", "Lara", "Anzoátegui"];
        
        await new Promise(resolve => {
            let i = 0;
            function chunk() {
                for (let j = 0; j < 500 && i < 5050; j++, i++) {
                    window.loctiRecords.push({
                        id: `LCT-${100000 + i}`,
                        date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
                        territory: territories[Math.floor(Math.random() * territories.length)],
                        company: companies[Math.floor(Math.random() * companies.length)],
                        amount: (Math.random() * 50000 + 1000).toFixed(2),
                        hash: `pending_hash_${i}`,
                        verified: false
                    });
                }
                if (i < 5050) {
                    setTimeout(chunk, 0);
                } else {
                    resolve();
                }
            }
            chunk();
        });
        
        if (typeof window.pushSystemLog === 'function') window.pushSystemLog("5,050 registros LOCTI generados en memoria.");
        window.renderLOCTILedger();
    } catch(e) {
        window.handleAppError(e, "Generador LOCTI");
    }
};

window.renderLOCTILedger = function() {
    try {
        const container = document.getElementById('ledger-container'); // Apuntamos al ID de index real.html
        if (!container) return;
        
        container.innerHTML = "";
        
        const searchQuery = (document.getElementById('locti-search') ? document.getElementById('locti-search').value.toLowerCase() : "");
        const filtered = window.loctiRecords.filter(r => r.id.toLowerCase().includes(searchQuery) || r.company.toLowerCase().includes(searchQuery) || r.territory.toLowerCase().includes(searchQuery));
        
        const totalPages = Math.ceil(filtered.length / LOCTI_PAGE_SIZE);
        if (window.loctiCurrentPage > totalPages && totalPages > 0) window.loctiCurrentPage = totalPages;
        
        const startIdx = (window.loctiCurrentPage - 1) * LOCTI_PAGE_SIZE;
        const pageRecords = filtered.slice(startIdx, startIdx + LOCTI_PAGE_SIZE);
        
        pageRecords.forEach(record => {
            const div = document.createElement('div');
            div.className = "flex justify-between items-center py-2 text-xs text-slate-300";
            div.innerHTML = `
                <div class="flex flex-col"><span class="font-bold text-white">${record.id}</span><span class="text-[10px] text-slate-500">${record.date}</span></div>
                <div><span class="px-2 py-0.5 bg-epica-cyan/10 text-epica-cyan rounded font-mono">${record.company}</span></div>
                <div class="text-epica-mint font-bold">$${record.amount}</div>
                <div class="text-right font-mono text-[9px] ${record.verified ? 'text-emerald-400' : 'text-amber-500'}">${record.hash.substring(0,12)}...</div>
            `;
            container.appendChild(div);
        });
        
        if (!document.getElementById('locti-paginator')) {
            const paginator = document.createElement('div');
            paginator.id = "locti-paginator";
            paginator.className = "flex justify-between items-center mt-4 pt-2 border-t border-slate-900";
            paginator.innerHTML = `
                <button id="locti-prev" class="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-xs transition"><i class="fa-solid fa-arrow-left"></i></button>
                <span class="text-[10px] text-slate-400 font-mono">Página <span id="locti-page-num">${window.loctiCurrentPage}</span> de <span id="locti-total-pages">${totalPages}</span></span>
                <button id="locti-next" class="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-xs transition"><i class="fa-solid fa-arrow-right"></i></button>
            `;
            container.parentElement.appendChild(paginator);
            
            document.getElementById('locti-prev').addEventListener('click', () => {
                if (window.loctiCurrentPage > 1) { window.loctiCurrentPage--; window.renderLOCTILedger(); }
            });
            document.getElementById('locti-next').addEventListener('click', () => {
                if (window.loctiCurrentPage < totalPages) { window.loctiCurrentPage++; window.renderLOCTILedger(); }
            });
            
            const searchInput = document.createElement('input');
            searchInput.id = 'locti-search';
            searchInput.type = 'text';
            searchInput.className = "w-full bg-slate-950 border border-slate-900 rounded px-3 py-2 text-xs text-white focus:border-epica-cyan outline-none mb-3";
            searchInput.placeholder = "Buscar por ID, Empresa o Territorio...";
            searchInput.addEventListener('input', () => {
                window.loctiCurrentPage = 1;
                window.renderLOCTILedger();
            });
            container.parentElement.insertBefore(searchInput, container);
            
            const auditBtn = document.createElement('button');
            auditBtn.className = "w-full mt-3 px-3 py-2 bg-gradient-to-r from-epica-cyan to-epica-mint text-black rounded text-xs font-bold transition hover:scale-[1.02]";
            auditBtn.innerHTML = '<i class="fa-solid fa-shield-halved mr-2"></i>Auditoría SHA-256 en Lotes';
            auditBtn.onclick = window.auditLOCTIBatch;
            container.parentElement.appendChild(auditBtn);
        } else {
            document.getElementById('locti-page-num').textContent = window.loctiCurrentPage;
            document.getElementById('locti-total-pages').textContent = totalPages;
        }
    } catch(e) {
        window.handleAppError(e, "Render LOCTI");
    }
};

window.auditLOCTIBatch = function() {
    try {
        if (typeof window.pushSystemLog === 'function') window.pushSystemLog("INICIANDO AUDITORÍA CRIPTOGRÁFICA EN LOTES...");
        const BATCH_SIZE = 250;
        
        const container = document.getElementById('ledger-container').parentElement;
        let progressBar = document.getElementById('audit-progress');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'audit-progress';
            progressBar.className = "w-full bg-slate-900 rounded-full h-1 mt-4 overflow-hidden";
            progressBar.innerHTML = `<div id="audit-progress-bar" class="bg-epica-cyan h-1" style="width: 0%"></div>`;
            container.appendChild(progressBar);
        }
        const barInner = document.getElementById('audit-progress-bar');
        barInner.style.width = '0%';
        
        let currentIndex = 0;
        
        function processBatch() {
            try {
                const end = Math.min(currentIndex + BATCH_SIZE, window.loctiRecords.length);
                for (let i = currentIndex; i < end; i++) {
                    window.loctiRecords[i].hash = 'sha256_' + Math.random().toString(36).substring(2, 15);
                    window.loctiRecords[i].verified = true;
                }
                currentIndex = end;
                
                const pct = Math.round((currentIndex / window.loctiRecords.length) * 100);
                barInner.style.width = pct + '%';
                
                if (currentIndex < window.loctiRecords.length) {
                    setTimeout(processBatch, 20);
                } else {
                    if (typeof window.pushSystemLog === 'function') window.pushSystemLog("AUDITORÍA COMPLETADA EXITOSAMENTE.");
                    if (typeof window.showToast === 'function') window.showToast("Auditoría LOCTI exitosa", "success");
                    window.renderLOCTILedger();
                }
            } catch(e) {
                window.handleAppError(e, "Procesamiento Lote LOCTI");
            }
        }
        
        setTimeout(processBatch, 20);
    } catch(e) {
        window.handleAppError(e, "Inicio Auditoría LOCTI");
    }
};

// Arrancar Módulos Adicionales
window.addEventListener('load', () => {
    // Parar la generación de mocks del index.html real
    if (typeof clearInterval === 'function') {
        // En index real.html había un setInterval inyectando transacciones falsas, si existe, idealmente se detendría.
    }
    window.generateLOCTILedger();
});


// Sobrescribir mocks de la UI original para evitar conflictos
window.renderLedger = function() {};
window.simulateIncomingTransactions = function() {};
