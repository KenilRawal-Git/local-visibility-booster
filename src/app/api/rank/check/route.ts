// src/app/api/rank/check/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // avoid caching of route
export const revalidate = 0;

type RankRequest = {
  keyword: string;
  /** Optional domain to rank-check, e.g. "example.com" (no protocol) */
  domain?: string;
  /** UI language (SerpAPI hl), e.g. "en" */
  hl?: string;
  /** Country (SerpAPI gl), e.g. "us" */
  gl?: string;
  /** Google domain, e.g. "google.com" */
  google_domain?: string;
};

type OrganicResult = {
  position: number;
  link: string;
  title?: string;
  displayed_link?: string;
  snippet?: string;
};

type SerpApiResponse = {
  organic_results?: OrganicResult[];
  search_metadata?: {
    status?: string;
  };
  error?: string;
};

function json(
  body: unknown,
  status = 200,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function sanitizeDomain(input: string): string {
  // Removes protocol, path, query — keeps hostname only
  try {
    const url = new URL(input.includes("://") ? input : `https://${input}`);
    return url.hostname.toLowerCase();
  } catch {
    return input.toLowerCase();
  }
}

function hostMatchesDomain(resultUrl: string, domain: string): boolean {
  try {
    const host = new URL(resultUrl).hostname.toLowerCase();
    const d = sanitizeDomain(domain);
    return host === d || host.endsWith(`.${d}`);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let body: RankRequest;
  try {
    body = (await req.json()) as RankRequest;
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const { keyword, domain, hl = "en", gl = "us", google_domain = "google.com" } = body;

  if (!keyword || typeof keyword !== "string") {
    return json({ ok: false, error: "Missing 'keyword' (string)." }, 400);
  }

  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) {
    return json(
      { ok: false, error: "SERP_API_KEY is not set in environment." },
      500,
    );
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("q", keyword);
  url.searchParams.set("hl", hl);
  url.searchParams.set("gl", gl);
  url.searchParams.set("google_domain", google_domain);
  url.searchParams.set("api_key", apiKey);

  let data: SerpApiResponse;
  try {
    const res = await fetch(url.toString(), {
      // Avoid Next’s caching on the server
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      return json(
        {
          ok: false,
          error: `SerpAPI request failed (${res.status})`,
          details: text.slice(0, 500),
        },
        502,
      );
    }

    data = (await res.json()) as SerpApiResponse;
  } catch (e: unknown) {
    const msg =
      e instanceof Error ? e.message : "Unknown error calling SerpAPI.";
    return json({ ok: false, error: msg }, 502);
  }

  if (data.error) {
    return json({ ok: false, error: data.error }, 502);
  }

  const results = (data.organic_results ?? []).map((r) => ({
    position: r.position,
    link: r.link,
    title: r.title ?? "",
    displayed_link: r.displayed_link ?? "",
    snippet: r.snippet ?? "",
  }));

  let rank: number | null = null;
  let matchedUrl: string | null = null;

  if (domain) {
    for (const r of results) {
      if (hostMatchesDomain(r.link, domain)) {
        rank = r.position;
        matchedUrl = r.link;
        break;
      }
    }
  }

  return json({
    ok: true,
    query: {
      keyword,
      domain: domain ?? null,
      hl,
      gl,
      google_domain,
    },
    rank,
    matchedUrl,
    count: results.length,
    results, // you can trim to top N if you want
  });
}

// Optional simple health check
export async function GET() {
  return json({ ok: true, message: "Rank check API is live." });
}
