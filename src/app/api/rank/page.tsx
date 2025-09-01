import RankResults from "@/components/RankResults";

export default async function RankPage() {
  // Example: call your API
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/rank/check?keyword=plumber%20london&domain=plumberlondon.co.uk`
  );
  const data = await res.json();

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
