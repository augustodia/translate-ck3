const DB_NAME = "ck3_translations";
const DB_VERSION = 1;
const STORE_NAME = "translations";

// Função para limpar os dados antes de salvar
function sanitizeForStorage(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveTranslations(
  prevTranslation,
  updatedOriginal,
  zipName
) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    // Sanitizar os dados antes de salvar
    const sanitizedPrevTranslation = sanitizeForStorage(prevTranslation);
    const sanitizedUpdatedOriginal = sanitizeForStorage(updatedOriginal);

    store.put(sanitizedPrevTranslation, "prevTranslation");
    store.put(sanitizedUpdatedOriginal, "updatedOriginal");
    store.put(zipName, "zipName");

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function loadTranslations() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const result = {
      prevTranslation: null,
      updatedOriginal: null,
      zipName: null,
    };

    store.get("prevTranslation").onsuccess = (event) => {
      result.prevTranslation = event.target.result;
    };

    store.get("updatedOriginal").onsuccess = (event) => {
      result.updatedOriginal = event.target.result;
    };

    store.get("zipName").onsuccess = (event) => {
      result.zipName = event.target.result;
    };

    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function clearTranslations() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
