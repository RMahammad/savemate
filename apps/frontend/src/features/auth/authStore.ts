type Listener = () => void;

const STORAGE_KEY = "savemate.accessToken";

let accessToken: string | null = null;
const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l();
}

function readFromStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeToStorage(token: string | null) {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// Initialize once on module load
accessToken = readFromStorage();

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  writeToStorage(token);
  notify();
}

export function clearAccessToken() {
  setAccessToken(null);
}

export function subscribeAccessToken(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
