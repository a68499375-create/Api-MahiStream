const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export async function fetchHTML(url, opts = {}) {
  const headers = {
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "id,en;q=0.9",
    "Cookie": "dewasa=1; konfirmasi_umur=1",
    ...(opts.headers || {}),
  };
  if (opts.referer) headers["Referer"] = opts.referer;
  if (opts.cookie) headers["Cookie"] = opts.cookie;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout || 25000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (text.length < 200) throw new Error("Response too short");
    return text;
  } finally {
    clearTimeout(timer);
  }
}
