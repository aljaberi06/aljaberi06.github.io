// আপডেট দিলে নিচের ভার্সন নম্বর বাড়াতে হবে (v1 -> v2 -> v3 ...)
const VERSION = "v1";
const CORE = "aljaberi-core-" + VERSION;
const FONTS = "aljaberi-fonts"; // ফন্ট ক্যাশ আলাদা, ভার্সনে মোছা হয় না

const CORE_FILES = [
  "./",
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CORE).then((c) => c.addAll(CORE_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("aljaberi-core-") && k !== CORE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Google Fonts: প্রথমবার অনলাইনে লোড হলে ক্যাশ হয়, পরে অফলাইনেও চলে
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(FONTS).then((cache) =>
        cache.match(req).then((hit) => {
          const net = fetch(req)
            .then((res) => { cache.put(req, res.clone()); return res; })
            .catch(() => hit);
          return hit || net;
        })
      )
    );
    return;
  }

  // নিজের সাইটের ফাইল: নেট থাকলে নতুনটা আনে, না থাকলে ক্যাশ থেকে দেখায়
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CORE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("index.html")))
    );
  }
  // হোয়াটসঅ্যাপ/ফেসবুক/রকমারি লিংক সরাসরি ব্রাউজারে খুলবে
});
