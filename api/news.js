/**
 * api/news.js — Vercel serverless function
 * Proxy RSS feeds từ VnExpress + Tuổi Trẻ thể thao
 */

const RSS_FEEDS = [
  { url: "https://vnexpress.net/rss/the-thao.rss", source: "VnExpress" },
  { url: "https://tuoitre.vn/rss/the-thao.rss", source: "Tuổi Trẻ" },
];

// Ảnh fallback theo từng môn — mỗi photo ID đã kiểm tra tay đúng môn.
const SPORT_IMAGE_FALLBACK = {
  Soccer:        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80", // bóng đá
  Basketball:    "https://images.unsplash.com/photo-1546519638405-a0564eba17c9?w=800&q=80", // bóng rổ
  Tennis:        "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80",   // tennis
  Badminton:     "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80", // cầu lông
  Swimming:      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80", // bơi lội
  Running:       "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",   // chạy bộ
  Volleyball:    "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80", // bóng chuyền
  Cycling:       "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80", // xe đạp
  "Table Tennis":"https://images.unsplash.com/photo-1609743522653-52354461eb27?w=800&q=80", // bóng bàn
  Futsal:        "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80", // futsal
};
// Ảnh thể thao chung — chỉ dùng khi KHÔNG detect được môn nào
const IMAGE_FALLBACK_DEFAULT = "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80";

const SPORT_KEYWORDS = {
  Soccer: [
    // Vị trí / thuật ngữ
    "bóng đá", "cầu thủ", "thủ môn", "tiền đạo", "tiền vệ", "hậu vệ", "trung vệ",
    "huấn luyện viên", "hlv",
    // Giải quốc tế
    "ngoại hạng anh", "ngoại hạng", "premier league", "la liga", "serie a",
    "bundesliga", "ligue 1", "champions league", "europa league", "conference league",
    "world cup", "euro ", "copa america", "afc", "fifa",
    // Giải trẻ / châu lục
    "u17", "u19", "u20", "u21", "u23",
    // Giải Việt Nam
    "v-league", "hà nội fc", "cahn", "slna", "clb",
    // Đội tuyển quốc gia phổ biến
    "bồ đào nha", "tây ban nha", "argentina", "brazil",
    // CLB châu Âu
    "arsenal", "chelsea", "manchester", "liverpool", "tottenham",
    "real madrid", "barcelona", "psg", "juventus", "milan", "inter", "bayern",
    "atletico", "dortmund", "porto", "benfica", "ajax",
    // Người nổi tiếng
    "ronaldo", "messi", "guardiola", "mourinho", "mbappe", "mbappé",
    "vitinha", "salah", "haaland", "kane", "neymar", "vinicius",
  ],
  Basketball: ["bóng rổ", "nba", "basketball", "vba", "wnba"],
  Tennis:     ["tennis", "wimbledon", "us open", "roland garros", "australian open", "atp", "wta", "davis cup"],
  Badminton:  ["cầu lông", "badminton", "bwf"],
  Swimming:   ["bơi lội", "bơi", "swimming"],
  Running:    ["marathon", "chạy bộ", "điền kinh", "athletics", "virtual race", "half marathon"],
  Volleyball: ["bóng chuyền", "volleyball", "avc", "vnl"],
  Cycling:    ["xe đạp", "cycling", "tour de france", "giro d'italia", "vuelta"],
  "Table Tennis": ["bóng bàn", "table tennis", "ittf"],
  Futsal:     ["futsal", "fifa futsal"],
};

function detectSport(title, description) {
  const text = (title + " " + description).toLowerCase();
  for (const [sport, keywords] of Object.entries(SPORT_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return sport;
  }
  return null;
}

function extractImageFromItem(itemXml) {
  // Chỉ lấy ảnh từ media tag chính thức — KHÔNG lấy <img> trong <description>.
  // VnExpress nhúng <img> trong description HTML của bài khác cùng trang,
  // dẫn đến bài bóng đá hiển thị ảnh chạy bộ, v.v.
  const mediaMatch = itemXml.match(/media:content[^>]*url="([^"]+)"/);
  if (mediaMatch) return mediaMatch[1];
  const enclosureMatch = itemXml.match(/enclosure[^>]*url="([^"]+)"/);
  if (enclosureMatch) return enclosureMatch[1];
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

    // Dùng ảnh riêng của bài nếu có (media:content / enclosure).
    // Nếu không có → dùng ảnh đúng môn từ SPORT_IMAGE_FALLBACK.
    // Nếu không detect được môn → dùng ảnh thể thao chung.
    const rawImage = extractImageFromItem(itemXml);
    const imageUrl = (rawImage && rawImage.trim() !== "")
      ? rawImage
      : (sport ? (SPORT_IMAGE_FALLBACK[sport] || IMAGE_FALLBACK_DEFAULT) : IMAGE_FALLBACK_DEFAULT);

    if (title && url) {
      items.push({ id, title, description, imageUrl, url, source, publishedAt, sport });
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
        fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; MatchupBot/1.0)" } })
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
