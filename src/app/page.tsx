import Link from 'next/link';

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-10">
      <h1 className="text-2xl font-semibold mb-4">Local Visibility Booster</h1>
      <Link href="/clients" className="px-4 py-2 rounded-lg bg-black text-white">
        Go to Clients
      </Link>
    </main>
  );
}
