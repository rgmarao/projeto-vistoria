/**
 * db.js — Camada de persistência offline via IndexedDB
 *
 * Stores:
 *  - checklists : { unidade_id, unidade_nome, empresa_nome, areas, cached_at }
 *  - vistorias  : { local_id, unidade_id, status, areas (c/ situacao/obs/fotos), ... }
 */

const DB_NAME    = 'vistoria-offline';
const DB_VERSION = 1;

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = ({ target: { result: db } }) => {
      if (!db.objectStoreNames.contains('checklists')) {
        db.createObjectStore('checklists', { keyPath: 'unidade_id' });
      }
      if (!db.objectStoreNames.contains('vistorias')) {
        db.createObjectStore('vistorias', { keyPath: 'local_id' });
      }
    };

    req.onsuccess = ({ target: { result } }) => resolve(result);
    req.onerror   = ({ target: { error  } }) => reject(error);
  });
}

function idbOp(store, mode, fn) {
  return abrirDB().then(db => new Promise((resolve, reject) => {
    const t   = db.transaction(store, mode);
    const s   = t.objectStore(store);
    const req = fn(s);
    req.onsuccess = ({ target: { result } }) => resolve(result);
    req.onerror   = ({ target: { error  } }) => reject(error);
  }));
}

function idbGetAll(store) {
  return abrirDB().then(db => new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll();
    req.onsuccess = ({ target: { result } }) => resolve(result);
    req.onerror   = ({ target: { error  } }) => reject(error);
  }));
}

// ── API pública ────────────────────────────────────────────────
export const db = {
  // Checklists (estrutura da unidade — cache offline)
  salvarChecklist:  data => idbOp('checklists', 'readwrite', s => s.put(data)),
  getChecklist:     id   => idbOp('checklists', 'readonly',  s => s.get(id)),
  listarChecklists: ()   => idbGetAll('checklists'),

  // Vistorias locais (rascunhos e prontos para sync)
  salvarVistoria:  data => idbOp('vistorias', 'readwrite', s => s.put(data)),
  getVistoria:     id   => idbOp('vistorias', 'readonly',  s => s.get(id)),
  deletarVistoria: id   => idbOp('vistorias', 'readwrite', s => s.delete(id)),
  listarVistorias: ()   => idbGetAll('vistorias'),
};

// ── Utilitários ────────────────────────────────────────────────

/** Gera UUID v4 */
export function uuid() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

/** Converte data URL (base64) em Blob para upload via FormData */
export function dataURLtoBlob(dataURL) {
  const [header, data] = dataURL.split(',');
  const mime   = header.match(/:(.*?);/)[1];
  const binary = atob(data);
  const arr    = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
