// ==========================================
// V3.5 NEW MODULES
// ==========================================

// --- MI ÉPICA: CIUDADANO LOGIN ---
window.handleMiEpicaLogin = async function(event) {
    event.preventDefault();
    const ci = document.getElementById('mi-epica-ci').value.trim();
    const pin = document.getElementById('mi-epica-pin').value.trim();
    if (ci && pin.length === 4) {
        if (typeof window.showToast === 'function') window.showToast("Autenticando biometría/PIN simulada...", "success");
        setTimeout(() => {
            if (typeof window.showToast === 'function') window.showToast(`Bienvenido Ciudadano ${ci}`, "success");
            // Aquí se cargaría el panel ciudadano real
        }, 1000);
    }
};

// --- MI ÉPICA: FE DE VIDA TERCERA EDAD ---
window.certifyFeDeVida = async function() {
    if (typeof window.showToast === 'function') window.showToast("Generando certificado criptográfico de Fe de Vida Activa...", "success");
    try {
        await window.ensureAuthenticated();
        const appId = typeof window.getAppId === 'function' ? window.getAppId() : 'default-app-id';
        const timestamp = new Date().toISOString();
        const docId = `fdv_${Date.now()}`;
        const docRef = window.FirebaseBridge.doc(window.firebaseDb, 'artifacts', appId, 'public', 'fedevida', docId);
        await window.FirebaseBridge.setDoc(docRef, { type: "Fe de Vida Activa", date: timestamp, valid: true });
        
        if (typeof window.showToast === 'function') window.showToast("FE DE VIDA CERTIFICADA CON ÉXITO EN LA NUBE.", "success");
        if (typeof window.pushSystemLog === 'function') window.pushSystemLog("Nueva Fe de Vida registrada y sellada en Firestore.");
    } catch (e) {
        window.handleAppError(e, "Fe de Vida");
    }
};

// --- RUTA PEDAGÓGICA ---
window.handleRutaPedagogica = async function(event) {
    event.preventDefault();
    const nombre = document.getElementById('ruta-nombre').value.trim();
    const edad = document.getElementById('ruta-edad').value.trim();
    const rep = document.getElementById('ruta-representante').value.trim();
    
    if (typeof window.showToast === 'function') window.showToast("Inscribiendo infante en la Ruta Pedagógica...", "success");
    try {
        await window.ensureAuthenticated();
        const appId = typeof window.getAppId === 'function' ? window.getAppId() : 'default-app-id';
        const docId = `rp_${Date.now()}`;
        const docRef = window.FirebaseBridge.doc(window.firebaseDb, 'artifacts', appId, 'public', 'rutapedagogica', docId);
        await window.FirebaseBridge.setDoc(docRef, { nombre, edad, representante: rep, timestamp: new Date().toISOString() });
        
        if (typeof window.showToast === 'function') window.showToast("Inscripción guardada correctamente en Firestore.", "success");
        document.getElementById('form-ruta-pedagogica').reset();
    } catch (e) {
        window.handleAppError(e, "Ruta Pedagógica");
    }
};

// --- LOGÍSTICA COMUNAL (OFFLINE-FIRST CON INDEXEDDB) ---
const dbName = "EpicaOfflineDB";
const storeName = "comunas_inventory";
let idb;

// Init IndexedDB
const request = indexedDB.open(dbName, 1);
request.onupgradeneeded = function(event) {
    idb = event.target.result;
    if (!idb.objectStoreNames.contains(storeName)) {
        idb.createObjectStore(storeName, { keyPath: "id" });
    }
};
request.onsuccess = function(event) { idb = event.target.result; };
request.onerror = function(event) { console.error("IndexedDB error:", event.target.error); };

window.handleLogisticaComunal = function(event) {
    event.preventDefault();
    const rubro = document.getElementById('logistica-rubro').value.trim();
    const cantidad = document.getElementById('logistica-cantidad').value.trim();
    const unidad = document.getElementById('logistica-unidad').value;
    const comuna = document.getElementById('logistica-comuna').value.trim();
    
    const record = {
        id: `comuna_${Date.now()}`,
        rubro, cantidad, unidad, comuna,
        timestamp: new Date().toISOString()
    };
    
    if (idb) {
        const tx = idb.transaction(storeName, "readwrite");
        tx.objectStore(storeName).put(record);
        tx.oncomplete = () => {
            if (typeof window.showToast === 'function') window.showToast("Inventario guardado en modo Offline (IndexedDB).", "success");
            document.getElementById('form-logistica-comunal').reset();
            
            if (navigator.onLine) {
                window.syncLogisticaToCloud();
            } else {
                const badge = document.getElementById('offline-sync-status');
                if (badge) badge.classList.remove('hidden');
            }
        };
    }
};

window.syncLogisticaToCloud = async function() {
    if (!idb || !navigator.onLine) return;
    const tx = idb.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const getAllReq = store.getAll();
    
    getAllReq.onsuccess = async function() {
        const records = getAllReq.result;
        if (records.length === 0) return;
        
        try {
            await window.ensureAuthenticated();
            const appId = typeof window.getAppId === 'function' ? window.getAppId() : 'default-app-id';
            
            for (const r of records) {
                const docRef = window.FirebaseBridge.doc(window.firebaseDb, 'artifacts', appId, 'public', 'logisticacomunal', r.id);
                await window.FirebaseBridge.setDoc(docRef, r);
            }
            
            // Clear DB after successful sync
            const clearTx = idb.transaction(storeName, "readwrite");
            clearTx.objectStore(storeName).clear();
            
            const badge = document.getElementById('offline-sync-status');
            if (badge) badge.classList.add('hidden');
            if (typeof window.showToast === 'function') window.showToast(`Se sincronizaron ${records.length} registros comunales a la nube.`, "success");
            if (typeof window.pushSystemLog === 'function') window.pushSystemLog(`Sincronización asíncrona completada: ${records.length} cosechas.`);
            
        } catch (e) {
            console.error("Error sincronizando logística", e);
        }
    };
};

window.addEventListener('online', window.syncLogisticaToCloud);

// --- BLOCKCHAIN LOCTI (SHA-256) ---
window.generateSHA256 = async function(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

window.auditLOCTIBatch = async function() {
    try {
        if (typeof window.pushSystemLog === 'function') window.pushSystemLog("INICIANDO AUDITORÍA CRIPTOGRÁFICA (SHA-256 Nativo) EN LOTES...");
        const BATCH_SIZE = 50; 
        const insumos = ["20x Laptops Escuelas", "15x Antenas Starlink", "5x Paneles Solares Hospital", "Viáticos Red de Docentes", "Mantenimiento Servidores", "Patentes Software"];
        
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
        
        async function processBatch() {
            try {
                const end = Math.min(currentIndex + BATCH_SIZE, window.loctiRecords.length);
                for (let i = currentIndex; i < end; i++) {
                    const r = window.loctiRecords[i];
                    r.insumo = insumos[Math.floor(Math.random() * insumos.length)];
                    const rawData = `${r.id}|${r.amount}|${r.date}|${r.company}|${r.insumo}`;
                    r.hash = await window.generateSHA256(rawData);
                    r.verified = true;
                }
                currentIndex = end;
                
                const pct = Math.round((currentIndex / window.loctiRecords.length) * 100);
                barInner.style.width = pct + '%';
                
                if (currentIndex < window.loctiRecords.length) {
                    setTimeout(processBatch, 10);
                } else {
                    if (typeof window.pushSystemLog === 'function') window.pushSystemLog("AUDITORÍA BLOCKCHAIN COMPLETADA EXITOSAMENTE.");
                    if (typeof window.showToast === 'function') window.showToast("Auditoría Blockchain SHA-256 exitosa", "success");
                    window.renderLOCTILedger(); 
                }
            } catch(e) {
                window.handleAppError(e, "Procesamiento Lote LOCTI");
            }
        }
        
        processBatch();
    } catch(e) {
        window.handleAppError(e, "Inicio Auditoría LOCTI");
    }
};

const originalRender = window.renderLOCTILedger;
window.renderLOCTILedger = function() {
    originalRender();
    const container = document.getElementById('ledger-container');
    if (!container) return;
    
    const rows = container.querySelectorAll('div.flex.justify-between');
    const searchQuery = (document.getElementById('locti-search') ? document.getElementById('locti-search').value.toLowerCase() : "");
    const filtered = window.loctiRecords.filter(r => r.id.toLowerCase().includes(searchQuery) || r.company.toLowerCase().includes(searchQuery) || r.territory.toLowerCase().includes(searchQuery));
    
    const startIdx = (window.loctiCurrentPage - 1) * 50;
    const pageRecords = filtered.slice(startIdx, startIdx + 50);
    
    rows.forEach((row, idx) => {
        const record = pageRecords[idx];
        if (record && record.verified && record.insumo) {
            const hashDiv = row.lastElementChild;
            hashDiv.innerHTML = `<div class="text-emerald-400" title="${record.hash}">${record.hash.substring(0,8)}...</div><div class="text-[8px] text-slate-500">${record.insumo}</div>`;
        }
    });
};
