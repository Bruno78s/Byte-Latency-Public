// pushNotifications.ts
// Funções utilitárias para registrar SW, pedir permissão e enviar subscription para backend

const BACKEND_URL = 'http://localhost:4000'; // ajuste se necessário

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/push-sw.js');
      return reg;
    } catch (err) {
      throw new Error('Erro ao registrar Service Worker: ' + err);
    }
  } else {
    throw new Error('Service Worker não suportado');
  }
}

export async function askNotificationPermission() {
  if (!('Notification' in window)) throw new Error('Notificações não suportadas');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permissão negada');
  return permission;
}

export async function getVapidPublicKey() {
  const res = await fetch(`${BACKEND_URL}/vapidPublicKey`);
  const data = await res.json();
  return data.publicKey;
}

export async function subscribeUserToPush(reg: ServiceWorkerRegistration) {
  const publicKey = await getVapidPublicKey();
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  });
  // Envia subscription para backend
  await fetch(`${BACKEND_URL}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub)
  });
  return sub;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
