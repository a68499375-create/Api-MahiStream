import { fetchHTML } from "../lib/fetch-html.js";
import { json, error } from "../lib/response.js";
import { parse } from "node-html-parser";

// ─── Kuramanime ────────────────────────────────────────────────────────

const KURA_HOST = "https://v18.kuramanime.ing";

async function kuraLatest(page) {
  const html = await fetchHTML(`${KURA_HOST}/anime?order_by=updated&page=${page}`, { referer: KURA_HOST + "/" });
  const doc = parse(html);
  const items = doc.querySelectorAll("#animeList .product__item");
  return items.map((el) => {
    const url = el.querySelector("a")?.getAttribute("href") || "";
    const id = url.includes("/anime/") ? url.split("/anime/")[1]?.replace(/\/$/, "") : "";
    const title = el.querySelector("h5 a")?.text?.trim() || el.querySelector("h5")?.text?.trim() || "";
    const poster = el.querySelector(".product__item__pic")?.getAttribute("data-setbg") || "";
    const score = el.querySelector(".ep span")?.text?.trim() || "N/A";
    return id && title ? { animeId: id, title, poster, score, status: "Unknown", url } : null;
  }).filter(Boolean);
}

async function kuraSearch(q, page) {
  const encoded = encodeURIComponent(q);
  const html = await fetchHTML(`${KURA_HOST}/anime?search=${encoded}&order_by=latest&page=${page}`, { referer: KURA_HOST + "/" });
  const doc = parse(html);
  const idFromUrl = (u) => u.includes("/anime/") ? u.split("/anime/")[1]?.replace(/\/$/, "") : "";
  const seen = new Set();
  const results = [];
  const push = (id, title, poster, score, url) => {
    if (!id || !title || seen.has(id)) return;
    seen.add(id);
    results.push({ animeId: id, title, poster, score: score || "N/A", status: "Unknown", url });
  };
  const cards = doc.querySelectorAll("#animeList .product__item");
  cards.forEach((el) => {
    const url = el.querySelector("a")?.getAttribute("href") || "";
    const id = idFromUrl(url);
    const title = el.querySelector("h5 a")?.text?.trim() || el.querySelector("h5")?.text?.trim() || "";
    const poster = el.querySelector(".product__item__pic")?.getAttribute("data-setbg") || "";
    const score = el.querySelector(".ep span")?.text?.trim() || "N/A";
    push(id, title, poster, score, url);
  });
  return results;
}

async function kuraGenres() {
  const html = await fetchHTML(`${KURA_HOST}/properties/genre`, { referer: KURA_HOST + "/" });
  const doc = parse(html);
  const links = doc.querySelectorAll('a[href*="/properties/genre/"]');
  const seen = new Set();
  return links.map((a) => {
    const href = a.getAttribute("href") || "";
    const m = href.match(/\/properties\/genre\/([a-z0-9-]+)/i);
    const slug = m?.[1]?.toLowerCase();
    if (!slug || seen.has(slug)) return null;
    seen.add(slug);
    const title = (a.text || "").replace(/\s+/g, " ").trim() || slug.replace(/-/g, " ");
    return { slug, title };
  }).filter(Boolean);
}

async function kuraDetail(id) {
  const html = await fetchHTML(`${KURA_HOST}/anime/${id}`, { referer: KURA_HOST + "/" });
  const doc = parse(html);
  const title = doc.querySelector(".anime__details__title h3")?.text?.trim()
    || doc.querySelector('meta[property="og:title"]')?.getAttribute("content")?.replace(/\s*-\s*Kuramanime$/i, "").trim()
    || "";
  const poster = doc.querySelector(".anime__details__pic")?.getAttribute("data-setbg") || "";
  const synopsis = doc.querySelector("#anime-synopsis")?.text?.trim() || "";
  const score = doc.querySelector(".anime__details__rating span")?.text?.trim() || "N/A";
  let status = "Unknown";
  doc.querySelectorAll(".anime__details__widget ul li").forEach((li) => {
    if (li.text.includes("Status:")) status = li.text.replace("Status:", "").trim();
  });
  const episodeList = [];
  const popover = doc.querySelector("#episodeLists")?.getAttribute("data-content") || "";
  if (popover) {
    const pd = parse(popover.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&#039;/g, "'"));
    pd.querySelectorAll("a").forEach((a) => {
      const epUrl = a.getAttribute("href") || "";
      const m = epUrl.match(/\/anime\/(.+?\/episode\/\d+)/);
      if (!m?.[1]) return;
      episodeList.push({ episodeId: m[1].split("?")[0], title: a.text?.trim() || "", url: epUrl, date: "Unknown" });
    });
  }
  return { title, poster, synopsis: { paragraphList: [synopsis] }, score, status, episodeList };
}

// ─── Otakudesu ─────────────────────────────────────────────────────────

const OTAKU_HOST = "https://otakudesu.blog";

async function otakuHome() {
  const html = await fetchHTML(OTAKU_HOST);
  const doc = parse(html);
  const ongoing = [];
  doc.querySelectorAll(".venz ul li").forEach((li) => {
    const title = li.querySelector("h2")?.text?.trim() || "";
    const poster = li.querySelector("img")?.getAttribute("src") || "";
    const eps = li.querySelector(".epz")?.text?.trim()?.replace(/\D/g, "") || "";
    const date = li.querySelector(".newnime")?.text?.trim() || "";
    const url = li.querySelector("a")?.getAttribute("href") || "";
    const id = url.includes("/anime/") ? url.split("/anime/")[1]?.replace(/\/$/, "")?.replace(/\/$/, "") : "";
    if (id && title) ongoing.push({ title, poster, episodes: eps, animeId: id, latestReleaseDate: date, otakudesuUrl: url });
  });
  return { ongoing: { otakudesuUrl: OTAKU_HOST + "/ongoing-anime/", animeList: ongoing } };
}

async function otakuSearch(q) {
  const html = await fetchHTML(`${OTAKU_HOST}/?s=${encodeURIComponent(q)}&post_type=anime`);
  const doc = parse(html);
  return doc.querySelectorAll(".chivsrc li").map((li) => {
    const title = li.querySelector("h2")?.text?.trim() || "";
    const url = li.querySelector("a")?.getAttribute("href") || "";
    const id = url.includes("/anime/") ? url.split("/anime/")[1]?.replace(/\/$/, "") : "";
    const poster = li.querySelector("img")?.getAttribute("src") || "";
    const status = li.text.match(/Status:\s*(\w+)/i)?.[1] || "Unknown";
    const rating = li.text.match(/Rating:\s*([\d.]+)/)?.[1] || "N/A";
    return id && title ? { animeId: id, title, poster, status, score: rating, url } : null;
  }).filter(Boolean);
}

async function otakuDetail(id) {
  const html = await fetchHTML(`${OTAKU_HOST}/anime/${id}`);
  const doc = parse(html);
  const title = doc.querySelector(".jdlz")?.text?.trim() || doc.querySelector(".posttl")?.text?.trim() || "";
  const poster = doc.querySelector(".infoimg img")?.getAttribute("src") || "";
  const desc = doc.querySelector(".sinopc")?.text?.trim() || "";
  const info = {};
  doc.querySelectorAll(".infozingle p").forEach((p) => {
    const txt = p.text?.trim() || "";
    const sep = txt.includes(":") ? txt.split(":") : [txt, ""];
    info[sep[0].trim().toLowerCase()] = sep.slice(1).join(":").trim();
  });
  const episodeList = [];
  doc.querySelectorAll(".episodelist li").forEach((li) => {
    const a = li.querySelector("a");
    const url = a?.getAttribute("href") || "";
    const m = url.match(/\/episode\/(\d+)/i);
    const epId = m?.[1] || url.split("/episode/")[1]?.replace(/\/$/, "");
    const epTitle = a?.text?.trim() || "";
    const date = li.querySelector(".date")?.text?.trim() || "";
    if (epId) episodeList.push({ episodeId: epId, title: epTitle, url, date });
  });
  return {
    title, poster, synopsis: desc,
    status: info.status || "Unknown",
    score: info.rating || info.skor || "N/A",
    genre: (info.genre || info.genres || "").split(",").map((g) => g.trim()).filter(Boolean),
    episodeList: episodeList.reverse(),
  };
}

// ─── Nekopoi ──────────────────────────────────────────────────────────

const NEKO_HOST = "https://nekopoi.care";

async function nekoLatest(page) {
  const html = await fetchHTML(`${NEKO_HOST}/page/${page}/`);
  const doc = parse(html);
  return doc.querySelectorAll(".nk-post-card").map((card) => {
    const a = card.querySelector("a");
    const url = a?.getAttribute("href") || "";
    const id = url.split("/").filter(Boolean).pop() || "";
    const title = card.querySelector(".nk-post-card-title")?.text?.trim() || "";
    const image = card.querySelector("img")?.getAttribute("src") || "";
    return { id, title, image, url };
  });
}

// ─── Router ────────────────────────────────────────────────────────────

export const config = { runtime: "nodejs" };

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*" } });

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/?(?:api\/)?/, "").replace(/\/$/, "") || "/";
    const parts = path.split("/").filter(Boolean);
    const source = parts[0];
    const sub = parts.slice(1).join("/");
    const params = Object.fromEntries(url.searchParams);

    if (req.method !== "GET") return error("Method not allowed", 405);

    switch (source) {
      // ── Kuramanime ──
      case "kuramanime": {
        if (!sub || sub === "latest") {
          const data = await kuraLatest(params.page || 1);
          return json({ statusCode: 200, statusMessage: "OK", message: "", data: { animeList: data }, pagination: null });
        }
        if (sub === "search") {
          if (!params.q) return error("Query required", 400);
          const data = await kuraSearch(params.q, params.page || 1);
          return json({ statusCode: 200, statusMessage: "OK", message: "", data: { animeList: data }, pagination: null });
        }
        if (sub === "genres") {
          const data = await kuraGenres();
          return json({ statusCode: 200, statusMessage: "OK", message: "", data });
        }
        if (sub.startsWith("anime/")) {
          const id = sub.replace("anime/", "");
          const data = await kuraDetail(id);
          return json({ statusCode: 200, statusMessage: "OK", message: "", data });
        }
        return error("Not found", 404);
      }

      // ── Otakudesu ──
      case "otakudesu": {
        if (!sub || sub === "home") {
          const data = await otakuHome();
          return json({ statusCode: 200, statusMessage: "OK", message: "", data, pagination: null });
        }
        if (sub === "search") {
          if (!params.q) return error("Query required", 400);
          const data = await otakuSearch(params.q);
          return json({ statusCode: 200, statusMessage: "OK", message: "", data: { animeList: data }, pagination: null });
        }
        if (sub.startsWith("anime/")) {
          const id = sub.replace("anime/", "");
          const data = await otakuDetail(id);
          return json({ statusCode: 200, statusMessage: "OK", message: "", data });
        }
        if (sub === "ongoing") {
          const data = await otakuHome();
          return json({ statusCode: 200, statusMessage: "OK", message: "", data, pagination: null });
        }
        return error("Not found", 404);
      }

      // ── Nekopoi ──
      case "nekopoi": {
        if (!sub || sub === "latest") {
          const data = await nekoLatest(params.page || 1);
          return json({ statusCode: 200, statusMessage: "OK", message: "", data, pagination: null });
        }
        return error("Not found", 404);
      }

      default:
        return error("Not found", 404);
    }
  } catch (e) {
    console.error("[vercel]", e?.message || e);
    return error(e?.message || "Internal server error", 500);
  }
}
