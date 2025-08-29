'use client';
import { useEffect, useState } from 'react';
import { Client, getClients, saveClients } from '../lib/store';
import Link from 'next/link';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({ name: '', address: '', reviewLink: '' });

  useEffect(() => setClients(getClients()), []);

  function addClient() {
    if (!form.name.trim()) return alert('Enter a business name');
    const c: Client = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      address: form.address.trim() || undefined,
      reviewLink: form.reviewLink.trim() || undefined,
    };
    const list = [c, ...clients];
    setClients(list);
    saveClients(list);
    setForm({ name: '', address: '', reviewLink: '' });
  }

  function removeClient(id: string) {
    const list = clients.filter(c => c.id !== id);
    setClients(list); saveClients(list);
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Clients</h1>

      <div className="rounded-2xl border p-4 space-y-3">
        <div className="grid gap-2">
          <input className="border rounded px-3 py-2" placeholder="Business name"
                 value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
          <input className="border rounded px-3 py-2" placeholder="Address (optional)"
                 value={form.address} onChange={e=>setForm({...form, address:e.target.value})}/>
          <input className="border rounded px-3 py-2" placeholder="Google review link (optional)"
                 value={form.reviewLink} onChange={e=>setForm({...form, reviewLink:e.target.value})}/>
        </div>
        <button onClick={addClient} className="px-4 py-2 rounded-lg bg-black text-white">+ Add client</button>
      </div>

      <ul className="space-y-3">
        {clients.map(c => (
          <li key={c.id} className="border rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-500">{c.address}</div>
              </div>
              <div className="flex gap-2">
                <Link href={`/clients/${c.id}`} className="px-3 py-1.5 rounded-lg border">Open</Link>
                <button onClick={()=>removeClient(c.id)} className="px-3 py-1.5 rounded-lg border">Delete</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
