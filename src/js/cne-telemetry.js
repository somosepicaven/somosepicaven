import { query, onSnapshot, addDoc, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

const APP_ID = typeof window.__app_id !== 'undefined' ? window.__app_id : "epica-mando-central";

const getPublicCollectionRef = (collectionName) => {
    return collection(db, 'artifacts', APP_ID, 'public', 'data', collectionName);
};

// ==========================================
// MÓDULO: CNE ÉPICA (TELEMETRÍA EN VIVO)
// ==========================================
export function syncCNEVotesRealtime() {
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
        
        // Ordenamiento en cliente
        newLedger.sort((a, b) => b.timestamp - a.timestamp);
        
        // Exponer al objeto window para la UI
        if (typeof window.voteState !== 'undefined') {
            window.voteState.si = siVotes + 184912; // Base de simulación original + votos reales
            window.voteState.no = noVotes + 92450;
            window.voteState.abst = abstVotes + 18912;
            
            // Mantener solo los últimos 50 en el ledger
            window.ledger = newLedger.slice(0, 50); 
            
            if (typeof window.renderCharts === 'function') window.renderCharts();
            if (typeof window.updateLedgerUI === 'function') window.updateLedgerUI();
        }
    }, (error) => {
        console.error("Falla en snapshot de votos CNE:", error);
    });
}

// Reemplazo global de submitPhoneVote para cne_epica.html
export async function submitPhoneVoteToCloud() {
    if (!window.currentUser) return;
    
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
            createdBy: window.currentUser.uid
        });
        
        // La UI avanzará a 'receipt' vía el listener real-time o local, pero forzaremos localmente para fluidez:
        if (typeof window.setPhoneStep === 'function') {
            setTimeout(() => window.setPhoneStep('receipt'), 1000);
        }
    } catch (error) {
        console.error("Error transmitiendo voto:", error);
        if (typeof window.safeShowToast === 'function') window.safeShowToast("Error de transmisión cifrada", "error");
    }
}
