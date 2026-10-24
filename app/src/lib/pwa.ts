export type InstallPlatform = 'ios' | 'android' | 'mac-safari' | 'desktop';
export type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function installPlatform(userAgent: string, platform = '', touchPoints = 0): InstallPlatform {
  if (/iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && touchPoints > 1)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  if (/Macintosh/i.test(userAgent) && /Safari/i.test(userAgent) && !/Chrome|Chromium|Edg|OPR/i.test(userAgent)) return 'mac-safari';
  return 'desktop';
}

export function installSteps(platform: InstallPlatform): string[] {
  if (platform === 'ios') return [
    'Open Aura Crypto X in Safari.',
    'Tap Share (or the page menu, then Share).',
    'Choose Add to Home Screen. If shown, keep Open as Web App enabled.',
    'Tap Add. Open Aura Crypto X from its new Home Screen icon.',
  ];
  if (platform === 'android') return [
    'Open this page in Chrome or another browser that supports installation.',
    'Tap Install when the browser offers it, or open the browser menu.',
    'Choose Install app or Add to Home screen, then confirm.',
  ];
  if (platform === 'mac-safari') return ['In Safari, open the File menu.', 'Choose Add to Dock, then confirm Add.'];
  return ['Open this page in Chrome or Microsoft Edge.', 'Use the install icon in the address bar, or open the browser menu.', 'Choose Install Aura Crypto X or Install this site as an app, then confirm.'];
}

let snapshot: { prompt: InstallPrompt | null; installed: boolean } = { prompt: null, installed: false };
const listeners = new Set<() => void>();
let initialized = false;
export const getInstallSnapshot = () => snapshot;
export const subscribeInstall = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const update = (next: typeof snapshot) => { snapshot = next; listeners.forEach(listener => listener()); };

export function consumeInstallPrompt() {
  const prompt = snapshot.prompt;
  update({ ...snapshot, prompt: null });
  return prompt;
}

export function initializePwa() {
  if (initialized) return;
  initialized = true;
  const media = window.matchMedia('(display-mode: standalone)');
  const standalone = () => media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  update({ prompt: null, installed: standalone() });
  window.addEventListener('beforeinstallprompt', (event: Event) => {
    event.preventDefault();
    update({ prompt: event as InstallPrompt, installed: standalone() });
  });
  window.addEventListener('appinstalled', () => update({ prompt: null, installed: true }));
  media.addEventListener('change', () => update({ ...snapshot, installed: standalone() }));
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch(error => console.warn('Offline support unavailable:', error));
    }, { once: true });
  }
}
