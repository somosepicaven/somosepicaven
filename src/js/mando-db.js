import { collection, getDocs, onSnapshot, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

// ID de la aplicación
const APP_ID = typeof window.__app_id !== 'undefined' ? window.__app_id : "epica-mando-central";

// Helper de Rutas Públicas (Mantiene coherencia con REGLA 1 de epica_deploy)
const getPublicCollectionRef = (collectionName) => {
    return collection(db, 'artifacts', APP_ID, 'public', 'data', collectionName);
};

const getPublicDocRef = (collectionName, docId) => {
    return doc(db, 'artifacts', APP_ID, 'public', 'data', collectionName, docId);
};

// Función para obtener todos los militantes y filtrarlos en memoria
export async function fetchMilitantes(filterFn) {
    try {
        const militantesRef = getPublicCollectionRef('militantes');
        const querySnapshot = await getDocs(militantesRef);
        
        const data = [];
        querySnapshot.forEach((docSnap) => {
            data.push({ id: docSnap.id, docId: docSnap.id, ...docSnap.data() });
        });

        // Filtrar datos en el cliente
        if (filterFn) {
            return data.filter(filterFn);
        }
        
        return data;
    } catch (error) {
        console.error("Error obteniendo militantes:", error);
        throw error;
    }
}

// Escucha en tiempo real para mantener la tabla actualizada
export function listenMilitantes(callback) {
    const militantesRef = getPublicCollectionRef('militantes');
    
    return onSnapshot(militantesRef, (snapshot) => {
        const data = [];
        snapshot.forEach((docSnap) => {
            data.push({ id: docSnap.id, docId: docSnap.id, ...docSnap.data() });
        });
        
        // Ordenar por timestamp localmente, o lo que aplique
        data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        callback(data);
    }, (error) => {
        console.error("Error en Snapshot de Firebase:", error);
        if (typeof window.safeShowToast === 'function') window.safeShowToast("Error de conexión al sincronizar la base de datos de militantes.", "error");
    });
}

// Función para añadir Militante a la nube
export async function registerMilitantToDB(militantData, currentUserId) {
    try {
        const colRef = getPublicCollectionRef('militantes');
        const docRef = await addDoc(colRef, {
            ...militantData,
            status: "Activo",
            timestamp: Date.now(),
            createdBy: currentUserId
        });
        return docRef.id;
    } catch (error) {
        console.error("Error al registrar en Firestore:", error);
        throw error;
    }
}

// Función para eliminar Militante de la nube
export async function deleteMilitantFromDB(docId) {
    try {
        const docRef = getPublicDocRef('militantes', docId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error al remover documento:", error);
        throw error;
    }
}

