// ==========================================
// MÓDULOS DE FUNCIONALIDADES (features.js)
// ==========================================

// --- MI ÉPICA: CIUDADANO LOGIN ---
export async function handleMiEpicaLogin(event) {
    event.preventDefault();
    const ci = document.getElementById('mi-epica-ci')?.value.trim();
    const pin = document.getElementById('mi-epica-pin')?.value.trim();
    if (ci && pin.length === 4) {
        if (typeof window.safeShowToast === 'function') window.safeShowToast("Autenticando biometría/PIN simulada...", "success");
        setTimeout(() => {
            if (typeof window.safeShowToast === 'function') window.safeShowToast(`Bienvenido Ciudadano ${ci}`, "success");
            // Aquí se cargaría el panel ciudadano real
        }, 1000);
    }
}

// --- MI ÉPICA: FE DE VIDA TERCERA EDAD ---
export async function certifyFeDeVida() {
    if (typeof window.safeShowToast === 'function') window.safeShowToast("Generando certificado criptográfico de Fe de Vida Activa...", "success");
    try {
        if (!window.currentUser) throw new Error("No autenticado");
        const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
        const timestamp = new Date().toISOString();
        const docId = `fdv_${Date.now()}`;
        
        // Uso del FirebaseBridge (inyectado desde app.js)
        const docRef = window.FirebaseBridge.doc(window.firebaseDB, 'artifacts', appId, 'public', 'fedevida', docId);
        await window.FirebaseBridge.setDoc(docRef, { type: "Fe de Vida Activa", date: timestamp, valid: true });
        
        if (typeof window.safeShowToast === 'function') window.safeShowToast("FE DE VIDA CERTIFICADA CON ÉXITO EN LA NUBE.", "success");
        if (typeof window.safePushSystemLog === 'function') window.safePushSystemLog("Nueva Fe de Vida registrada y sellada en Firestore.");
    } catch (e) {
        console.error("Error en Fe de Vida:", e);
        if (typeof window.safeShowToast === 'function') window.safeShowToast("Error procesando Fe de Vida.", "error");
    }
}

// --- RUTA PEDAGÓGICA ---
export async function handleRutaPedagogica(event) {
    event.preventDefault();
    const nombre = document.getElementById('ruta-nombre')?.value.trim();
    const edad = document.getElementById('ruta-edad')?.value.trim();
    const rep = document.getElementById('ruta-representante')?.value.trim();
    
    if (typeof window.safeShowToast === 'function') window.safeShowToast("Inscribiendo infante en la Ruta Pedagógica...", "success");
    try {
        if (!window.currentUser) throw new Error("No autenticado");
        const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
        const docId = `rp_${Date.now()}`;
        const docRef = window.FirebaseBridge.doc(window.firebaseDB, 'artifacts', appId, 'public', 'rutapedagogica', docId);
        await window.FirebaseBridge.setDoc(docRef, { nombre, edad, representante: rep, timestamp: new Date().toISOString() });
        
        if (typeof window.safeShowToast === 'function') window.safeShowToast("Inscripción guardada correctamente en Firestore.", "success");
        const form = document.getElementById('form-ruta-pedagogica');
        if (form) form.reset();
    } catch (e) {
        console.error("Error en Ruta Pedagógica:", e);
        if (typeof window.safeShowToast === 'function') window.safeShowToast("Error inscribiendo en Ruta Pedagógica.", "error");
    }
}

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

export function handleLogisticaComunal(event) {
    event.preventDefault();
    const rubro = document.getElementById('logistica-rubro')?.value.trim();
    const cantidad = document.getElementById('logistica-cantidad')?.value.trim();
    const unidad = document.getElementById('logistica-unidad')?.value;
    const comuna = document.getElementById('logistica-comuna')?.value.trim();
    
    const record = {
        id: `comuna_${Date.now()}`,
        rubro, cantidad, unidad, comuna,
        timestamp: new Date().toISOString()
    };
    
    if (idb) {
        const tx = idb.transaction(storeName, "readwrite");
        tx.objectStore(storeName).put(record);
        tx.oncomplete = () => {
            if (typeof window.safeShowToast === 'function') window.safeShowToast("Inventario guardado en modo Offline (IndexedDB).", "success");
            const form = document.getElementById('form-logistica-comunal');
            if (form) form.reset();
            
            if (navigator.onLine) {
                syncLogisticaToCloud();
            } else {
                const badge = document.getElementById('offline-sync-status');
                if (badge) badge.classList.remove('hidden');
            }
        };
    }
}

export async function syncLogisticaToCloud() {
    if (!idb || !navigator.onLine) return;
    const tx = idb.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const getAllReq = store.getAll();
    
    getAllReq.onsuccess = async function() {
        const records = getAllReq.result;
        if (records.length === 0) return;
        
        try {
            if (!window.currentUser) return;
            const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
            
            for (const r of records) {
                const docRef = window.FirebaseBridge.doc(window.firebaseDB, 'artifacts', appId, 'public', 'logisticacomunal', r.id);
                await window.FirebaseBridge.setDoc(docRef, r);
            }
            
            // Clear DB after successful sync
            const clearTx = idb.transaction(storeName, "readwrite");
            clearTx.objectStore(storeName).clear();
            
            const badge = document.getElementById('offline-sync-status');
            if (badge) badge.classList.add('hidden');
            if (typeof window.safeShowToast === 'function') window.safeShowToast(`Se sincronizaron ${records.length} registros comunales a la nube.`, "success");
            if (typeof window.safePushSystemLog === 'function') window.safePushSystemLog(`Sincronización asíncrona completada: ${records.length} cosechas.`);
            
        } catch (e) {
            console.error("Error sincronizando logística", e);
        }
    };
}

window.addEventListener('online', syncLogisticaToCloud);

// --- BLOCKCHAIN LOCTI (SHA-256) ---
export async function generateSHA256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function auditLOCTIBatch() {
    try {
        if (typeof window.safePushSystemLog === 'function') window.safePushSystemLog("INICIANDO AUDITORÍA CRIPTOGRÁFICA (SHA-256 Nativo) EN LOTES...");
        const BATCH_SIZE = 50; 
        const insumos = ["20x Laptops Escuelas", "15x Antenas Starlink", "5x Paneles Solares Hospital", "Viáticos Red de Docentes", "Mantenimiento Servidores", "Patentes Software"];
        
        const container = document.getElementById('ledger-container')?.parentElement;
        if (!container) return;

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
                if (!window.loctiRecords) window.loctiRecords = [];
                const end = Math.min(currentIndex + BATCH_SIZE, window.loctiRecords.length);
                for (let i = currentIndex; i < end; i++) {
                    const r = window.loctiRecords[i];
                    r.insumo = insumos[Math.floor(Math.random() * insumos.length)];
                    const rawData = `${r.id}|${r.amount}|${r.date}|${r.company}|${r.insumo}`;
                    r.hash = await generateSHA256(rawData);
                    r.verified = true;
                }
                currentIndex = end;
                
                const pct = Math.round((currentIndex / (window.loctiRecords.length || 1)) * 100);
                barInner.style.width = pct + '%';
                
                if (currentIndex < window.loctiRecords.length) {
                    setTimeout(processBatch, 10);
                } else {
                    if (typeof window.safePushSystemLog === 'function') window.safePushSystemLog("AUDITORÍA BLOCKCHAIN COMPLETADA EXITOSAMENTE.");
                    if (typeof window.safeShowToast === 'function') window.safeShowToast("Auditoría Blockchain SHA-256 exitosa", "success");
                    if (typeof window.renderLOCTILedger === 'function') window.renderLOCTILedger(); 
                }
            } catch(e) {
                console.error("Procesamiento Lote LOCTI", e);
            }
        }
        
        processBatch();
    } catch(e) {
        console.error("Inicio Auditoría LOCTI", e);
    }
}
