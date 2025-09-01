import RankResults from "@/components/RankResults";

export default async function RankPage() {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      : "";

  const res = await fetch(
    `${baseUrl}/api/rank/check?keyword=plumber london&domain=plumberlondon.co.uk`,
    { cache: "no-store" }
  );

  const data = await res.json();

  // ✅ return must be inside the function body
  return (
    <main className="max-w-3xl mx-auto mt-10">
      <RankResults
        keyword={data.query.keyword}
        domain={data.query.domain}
        position={data.position}
        inTop10={data.inTop10}
        inTop3={data.inTop3}
        top10={data.top10}
      />
    </main>
  );
}
