const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
const canUsePwa = location.protocol === "https:" || isLocalhost;
const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
let deferredInstallPrompt = null;

async function disableLocalhostServiceWorker() {
  if (!("serviceWorker" in navigator) || !("caches" in window)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
  const cacheKeys = await caches.keys();
  await Promise.all(cacheKeys.map((key) => caches.delete(key)));
}

function buildInstallBanner() {
  if (document.querySelector(".pwa-install-banner") || isStandalone) return null;
  const banner = document.createElement("aside");
  banner.className = "pwa-install-banner";
  banner.innerHTML = `
    <div class="pwa-install-copy">
      <strong>アプリとして追加できます</strong>
      <span class="pwa-install-text"></span>
    </div>
    <div class="pwa-install-actions">
      <button type="button" class="secondary pwa-install-action">追加</button>
      <button type="button" class="ghost-button pwa-dismiss-action" aria-label="閉じる">閉じる</button>
    </div>
  `;
  document.body.append(banner);
  return banner;
}

function setupInstallBanner() {
  if (!canUsePwa || isStandalone) return;
  const dismissed = window.localStorage.getItem("pwa-banner-dismissed") === "1";
  if (dismissed) return;
  const banner = buildInstallBanner();
  if (!banner) return;

  const text = banner.querySelector(".pwa-install-text");
  const installButton = banner.querySelector(".pwa-install-action");
  const dismissButton = banner.querySelector(".pwa-dismiss-action");

  const setIosMode = () => {
    text.textContent = "iPhone / iPad では Safari の共有メニューから「ホーム画面に追加」を選びます。";
    installButton.textContent = "手順を見る";
  };

  const setPromptMode = () => {
    text.textContent = "ホーム画面へ追加して、オフラインでも起動しやすくできます。";
    installButton.textContent = "追加";
  };

  if (isIos) setIosMode();
  else setPromptMode();

  installButton.addEventListener("click", async () => {
    if (isIos) {
      banner.classList.add("is-expanded");
      return;
    }
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    banner.remove();
  });

  dismissButton.addEventListener("click", () => {
    window.localStorage.setItem("pwa-banner-dismissed", "1");
    banner.remove();
  });
}

if (isLocalhost) {
  window.addEventListener("load", () => {
    disableLocalhostServiceWorker().catch((error) => {
      console.warn("Localhost service worker cleanup failed:", error);
    });
  });
} else if ("serviceWorker" in navigator && canUsePwa) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  setupInstallBanner();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  document.querySelector(".pwa-install-banner")?.remove();
});

window.addEventListener("load", setupInstallBanner);
