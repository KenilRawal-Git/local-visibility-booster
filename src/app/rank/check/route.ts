// src/app/api/rank/check/route.ts
import { NextRequest, NextResponse } from "next/server";

const SERP_ENDPOINT = "https://serpapi.com/search.json";

type OrganicResult = {
  position: number;
  link: string;
  title: string;
  snippet?: string;
};

type LocalResult = {
  position: number;
  title: string;
  website?: string;
  address?: string;
  rating?: number;
  reviews?: number;
};

type SerpApiResponse = {
  error?: string;
  organic_results?: OrganicResult[];
  local_results?: LocalResult[];
  search_parameters?: Record<string, unknown>;
};

type RankRequest = {
  keyword: string;
  domain: string;
  location?: string; // e.g. "San Francisco, California, United States"
  gl?: string; // country code, e.g. "us"
  hl?: string; // language, e.g. "en"
  includeLocalPack?: boolean; // also check 3-pack
};

function normalizeHostname(input: string): string {
  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    return url.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    // Not a full URL; treat as bare domain
    return input.replace(/^www\./i, "").toLowerCase();
  }
}

function sameDomain(a: string, b: string): boolean {
  const A = normalizeHostname(a);
  const B = normalizeHostname(b);
  // match exact or subdomain of the requested domain (e.g., blog.example.com)
  return A === B || A.endsWith(`.${B}`);
}

async function fetchSerp(params: URLSearchParams): Promise<SerpApiResponse> {
  const url = `${SERP_ENDPOINT}?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    return { error: `HTTP ${res.status}: ${text}` };
  }
  const json = (await res.json()) as SerpApiResponse;
  return json;
}

function pickTop<T>(arr: T[] | undefined, n: number): T[] {
  if (!arr) return [];
  return arr.slice(0, n);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "POST a JSON body { keyword, domain, location?, gl?, hl?, includeLocalPack? }",
    example: {
      keyword: "plumber near me",
      domain: "example.com",
      location: "San Francisco, California, United States",
      gl: "us",
      hl: "en",
      includeLocalPack: true,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<RankRequest>;

  const keyword = (body.keyword ?? "").trim();
  const domain = (body.domain ?? "").trim();
  const location = (body.location ?? "").trim();
  const gl = (body.gl ?? "us").trim();
  const hl = (body.hl ?? "en").trim();
  const includeLocalPack = Boolean(body.includeLocalPack);

  if (!keyword || !domain) {
    return NextResponse.json(
      { ok: false, error: "keyword and domain are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing SERP_API_KEY env var on server." },
      { status: 500 }
    );
  }

  // Build SerpAPI params
  const params = new URLSearchParams({
    engine: "google",
    q: keyword,
    api_key: apiKey,
    google_domain: "google.com",
    gl,
    hl,
    num: "20", // fetch top 20 to increase the chance of finding you
  });

  if (location) {
    params.set("location", location);
  }

  const resp = await fetchSerp(params);

  if (resp.error) {
    return NextResponse.json({ ok: false, error: resp.error }, { status: 502 });
  }

  const organic = resp.organic_results ?? [];

  // Find first organic hit for the requested domain
  let position: number | null = null;
  for (const item of organic) {
    if (!item.link) continue;
    if (sameDomain(item.link, domain)) {
      position = item.position;
      break;
    }
  }

  // Optional: check local 3-pack (maps) if requested
  let localPackHit: LocalResult | null = null;
  if (includeLocalPack && resp.local_results && resp.local_results.length) {
    for (const place of resp.local_results) {
      if (place.website && sameDomain(place.website, domain)) {
        localPackHit = place;
        break;
      }
    }
  }

  const top3 = pickTop(organic, 3).map((o) => ({
    position: o.position,
    title: o.title,
    link: o.link,
  }));

  const top10 = pickTop(organic, 10).map((o) => ({
    position: o.position,
    title: o.title,
    link: o.link,
  }));

  return NextResponse.json({
    ok: true,
    query: { keyword, domain, location: location || null, gl, hl },
    position, // null = not found in fetched results
    inTop10: position !== null && position <= 10,
    inTop3: position !== null && position <= 3,
    localPack: includeLocalPack
      ? {
          matched: Boolean(localPackHit),
          hit: localPackHit,
        }
      : undefined,
    top3,
    top10,
    debug: {
      organicCount: organic.length,
      usedLocation: location || null,
    },
  });
}
