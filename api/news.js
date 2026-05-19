/**
 * api/news.js — Vercel serverless function
 * Proxy RSS feeds từ VnExpress + Tuổi Trẻ thể thao
 * Đặt file này tại: api/news.js (ngang hàng với src/)
 */

const RSS_FEEDS = [
  {
    url: "https://vnexpress.net/rss/the-thao.rss",
    source: "VnExpress",
  },
  {
    url: "https://tuoitre.vn/rss/the-thao.rss",
    source: "Tuổi Trẻ",
  },
];

// Sport-specific fallback images — used when RSS item has no image.
// Each photo ID is manually verified to show the correct sport.
const SPORT_IMAGE_FALLBACK = {
  Soccer:       "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80", // football on pitch
  Basketball:   "https://images.unsplash.com/photo-1546519638405-a0564eba17c9?w=800&q=80", // basketball court
  Tennis:       "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80",   // tennis court/racket
  Badminton:    "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80", // badminton shuttle
  Swimming:     "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80", // swimming pool
  Running:      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",   // marathon runners
  Volleyball:   "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80", // volleyball
  Cycling:      "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80", // road cyclists
  "Table Tennis":"https://images.unsplash.com/photo-1609743522653-52354461eb27?w=800&q=80", // table tennis
  Futsal:       "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80", // futsal
};
const IMAGE_FALLBACK_DEFAULT = "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80";

const SPORT_KEYWORDS = {
  Soccer: ["bóng đá", "fifa", "premier league", "v-league", "world cup", "champions league", "la liga"],
  Basketball: ["bóng rổ", "nba", "basketball"],
  Tennis: ["tennis", "wimbledon", "us open", "roland garros"],
  Badminton: ["cầu lông", "badminton"],
  Swimming: ["bơi lội", "swimming"],
  Running: ["marathon", "chạy bộ", "điền kinh", "athletics"],
  Volleyball: ["bóng chuyền", "volleyball"],
  Cycling: ["xe đạp", "cycling", "tour de france"],
};

function detectSport(title, description) {
  const text = (title + " " + description).toLowerCase();
  for (const [sport, keywords] of Object.entries(SPORT_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return sport;
  }
  return null; // Unknown sport — don't assume Soccer
}

function extractImageFromItem(itemXml) {
  const mediaMatch = itemXml.match(/media:content[^>]*url="([^"]+)"/);
  if (mediaMatch) return mediaMatch[1];
  const enclosureMatch = itemXml.match(/enclosure[^>]*url="([^"]+)"/);
  if (enclosureMatch) return enclosureMatch[1];
  const imgMatch = itemXml.match(/<img[^>]*src="([^"]+)"/);
  if (imgMatch) return imgMatch[1];
  return "";
}

function parseRSS(xml, source) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
      itemXml.match(/<title>(.*?)<\/title>/);
    const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
    const descMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
      itemXml.match(/<description>([\s\S]*?)<\/description>/);
    const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
    const guidMatch = itemXml.match(/<guid[^>]*>(.*?)<\/guid>/);

    const title = titleMatch ? titleMatch[1].trim() : "";
    const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim().slice(0, 200) : "";
    const url = linkMatch ? linkMatch[1].trim() : "";
    const publishedAt = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();
    const id = guidMatch ? guidMatch[1] : url;
    const sport = detectSport(title, description);

    // Use article's actual image when available; otherwise use a sport-specific
    // fallback so the image always matches the sport being covered.
    const rawImage = extractImageFromItem(itemXml);
    const imageUrl = (rawImage && rawImage.trim() !== "")
      ? rawImage
      : (sport ? (SPORT_IMAGE_FALLBACK[sport] || IMAGE_FALLBACK_DEFAULT) : IMAGE_FALLBACK_DEFAULT);

    if (title && url) {
      items.push({
        id,
        title,
        description,
        imageUrl,
        url,
        source,
        publishedAt,
        sport,
      });
    }
  }

  return items;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=300");

  try {
    const results = await Promise.allSettled(
      RSS_FEEDS.map(({ url, source }) =>
        fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; MatchupBot/1.0)" },
        })
          .then((r) => r.text())
          .then((xml) => parseRSS(xml, source))
      )
    );

    const allItems = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 20);

    if (allItems.length === 0) {
      return res.status(503).json({ error: "Không lấy được tin tức" });
    }

    res.status(200).json(allItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
