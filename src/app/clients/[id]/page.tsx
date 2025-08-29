'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Client, getClients, saveClients } from '@/app/lib/store';
import QRCode from 'qrcode';

// --- Helpers ---
async function toDataUrl(text: string) {
  return await QRCode.toDataURL(text, { width: 480, margin: 1 });
}
function thisMonthLabel() {
  return new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' });
}

export default function ClientDetail() {
  const params = useParams();
  const id = (params?.id as string) || '';

  // --- State ---
  const [client, setClient] = useState<Client | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  const [postTopic, setPostTopic] = useState('');
  const [postResult, setPostResult] = useState('');
  const [loadingPost, setLoadingPost] = useState(false);

  const [reviewText, setReviewText] = useState('');
  const [replyResult, setReplyResult] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);

  const [sendingReport, setSendingReport] = useState(false);
  const [reportMsg, setReportMsg] = useState('');

  // --- Load client from local storage ---
  useEffect(() => {
    if (!id) return;
    const c = getClients().find((c) => c.id === id) || null;
    setClient(c);
  }, [id]);

  const canMakeQR = useMemo(() => !!client?.reviewLink, [client]);

  // --- Mutate & persist a single field on the client ---
  function saveField<K extends keyof Client>(key: K, value: Client[K]) {
    if (!client) return;
    const list = getClients();
    const idx = list.findIndex((c) => c.id === client.id);
    if (idx !== -1) {
      const updated = { ...list[idx], [key]: value };
      list[idx] = updated as Client;
      saveClients(list);
      setClient(updated as Client);
    }
  }

  // --- QR code generation ---
  async function makeQR() {
    if (!client?.reviewLink) {
      alert('Add a Google review link on the Clients page or here first.');
      return;
    }
    const data = await toDataUrl(client.reviewLink);
    setQr(data);
  }

  // --- AI: Draft Google Post ---
  async function draftPost() {
    if (!client || loadingPost) return;
    setLoadingPost(true);
    setPostResult('');
    try {
      const res = await fetch('/api/ai/draft-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business: client.name,
          topic: postTopic || 'Monthly update',
        }),
      });

      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        const msg = ct.includes('application/json') ? (await res.json())?.error : await res.text();
        setPostResult(`Error ${res.status}: ${msg || res.statusText}`);
        return;
        }
      if (!ct.includes('application/json')) {
        const txt = await res.text();
        setPostResult(`Unexpected response (not JSON):\n${txt}`);
        return;
      }
      const j = await res.json();
      setPostResult(j?.text || '(no text returned)');
    } catch (e: any) {
      setPostResult(`Network/parse error: ${e?.message || String(e)}`);
    } finally {
      setLoadingPost(false);
    }
  }

  // --- AI: Draft Review Reply ---
  async function draftReply() {
    if (!client || loadingReply) return;
    setLoadingReply(true);
    setReplyResult('');
    try {
      const res = await fetch('/api/ai/draft-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business: client.name,
          reviewText,
        }),
      });

      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        const msg = ct.includes('application/json') ? (await res.json())?.error : await res.text();
        setReplyResult(`Error ${res.status}: ${msg || res.statusText}`);
        return;
      }
      if (!ct.includes('application/json')) {
        const txt = await res.text();
        setReplyResult(`Unexpected response (not JSON):\n${txt}`);
        return;
      }
      const j = await res.json();
      setReplyResult(j?.text || '(no text returned)');
    } catch (e: any) {
      setReplyResult(`Network/parse error: ${e?.message || String(e)}`);
    } finally {
      setLoadingReply(false);
    }
  }

  // --- Report: send monthly report via Resend ---
  async function sendReportFromUI() {
    if (!client) return;
    setReportMsg('');
    setSendingReport(true);
    try {
      const toEmail =
        (document.getElementById('repEmail') as HTMLInputElement)?.value ||
        client.ownerEmail ||
        '';
      const monthLabel =
        (document.getElementById('repMonth') as HTMLInputElement)?.value || thisMonthLabel();

      const highlights = (
        (document.getElementById('repHighlights') as HTMLTextAreaElement)?.value || ''
      )
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const kwRaw = (
        (document.getElementById('repKeywords') as HTMLTextAreaElement)?.value || ''
      )
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const keywords = kwRaw.map((line) => {
        const [phrase, rank] = line.split('|');
        return { phrase: (phrase || '').trim(), rank: rank ? Number(rank) : undefined };
      });

      if (!toEmail) {
        setReportMsg('Please enter an owner email.');
        return;
      }

      const res = await fetch('/api/report/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail,
          businessName: client.name,
          monthLabel,
          highlights,
          keywords,
        }),
      });

      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        const msg = ct.includes('application/json') ? (await res.json())?.error : await res.text();
        setReportMsg(`Error ${res.status}: ${msg || res.statusText}`);
        return;
      }
      const j = ct.includes('application/json') ? await res.json() : { ok: true };
      setReportMsg(j?.ok ? 'Report sent ✅' : 'Sent (no confirmation payload).');
    } catch (e: any) {
      setReportMsg(`Network error: ${e?.message || String(e)}`);
    } finally {
      setSendingReport(false);
    }
  }

  // --- Quick Rank Checker (SerpAPI backend) ---
  async function checkRank() {
    if (!client) return;
    const kw = (document.getElementById('kw') as HTMLInputElement)?.value || '';
    const loc = (document.getElementById('loc') as HTMLInputElement)?.value || '';
    const res = await fetch('/api/rank/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: kw, businessName: client.name, location: loc }),
    });
    const j = await res.json();
    alert(
      j.error
        ? `Error: ${j.error}`
        : `Local Pack Position: ${j.position ?? 'Not in top 10'}\nTop 3:\n${(j.topLocal || [])
            .map((x: any) => `${x.pos}. ${x.title} (${x.rating ?? '-'}⭐)`)
            .join('\n')}`
    );
  }

  if (!client) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-xl font-semibold">Client not found</h1>
        <p className="text-sm text-gray-600">Go back to the Clients page and add/select a client.</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{client.name}</h1>
        {client.address && <p className="text-gray-600">{client.address}</p>}
      </header>

      {/* Editable fields */}
      <section className="rounded-2xl border p-4 space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm">Owner Email</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={client.ownerEmail || ''}
              onChange={(e) => saveField('ownerEmail', e.target.value)}
              placeholder="owner@business.com"
            />
          </div>
          <div>
            <label className="text-sm">Google Review Link</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={client.reviewLink || ''}
              onChange={(e) => saveField('reviewLink', e.target.value)}
              placeholder="https://search.google.com/local/writereview?placeid=..."
            />
          </div>
        </div>
      </section>

      {/* QR Code Generator */}
      <section className="rounded-2xl border p-4 space-y-3">
        <h2 className="font-medium">Review QR Code</h2>
        <button
          onClick={makeQR}
          disabled={!canMakeQR}
          className="px-3 py-2 rounded-lg border disabled:opacity-50"
        >
          Generate QR
        </button>
        {!canMakeQR && (
          <p className="text-sm text-gray-600">Add a Google review link to enable QR generation.</p>
        )}
        {qr && (
          <div className="mt-3">
            <img src={qr} alt="Review QR" className="w-56 h-56 border rounded-lg" />
            <p className="text-xs text-gray-500 mt-1">Right click → Save Image As…</p>
          </div>
        )}
      </section>

      {/* AI: Draft Google Post */}
      <section className="rounded-2xl border p-4 space-y-3">
        <h2 className="font-medium">AI Draft: Google Post</h2>
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Topic (e.g., Autumn offers)"
          value={postTopic}
          onChange={(e) => setPostTopic(e.target.value)}
        />
        <button
          className="px-3 py-2 rounded-lg border disabled:opacity-50"
          disabled={loadingPost}
          onClick={draftPost}
        >
          {loadingPost ? 'Drafting…' : 'Draft Post'}
        </button>
        {postResult && (
          <pre className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">{postResult}</pre>
        )}
      </section>

      {/* AI: Draft Review Reply */}
      <section className="rounded-2xl border p-4 space-y-3">
        <h2 className="font-medium">AI Draft: Review Reply</h2>
        <textarea
          className="border rounded px-3 py-2 w-full"
          placeholder="Paste a customer review here…"
          rows={4}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
        />
        <button
          className="px-3 py-2 rounded-lg border disabled:opacity-50"
          disabled={loadingReply}
          onClick={draftReply}
        >
          {loadingReply ? 'Drafting…' : 'Draft Reply'}
        </button>
        {replyResult && (
          <pre className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">{replyResult}</pre>
        )}
      </section>

      {/* Rank checker */}
      <section className="rounded-2xl border p-4 space-y-2">
        <h2 className="font-medium">Local Rank Check</h2>
        <div className="grid gap-2 md:grid-cols-2">
          <input id="kw" className="border rounded px-3 py-2" placeholder="Keyword (e.g., dentist near me)" />
          <input id="loc" className="border rounded px-3 py-2" placeholder="Location (e.g., Leicester, UK)" />
        </div>
        <button onClick={checkRank} className="px-3 py-2 rounded-lg border">
          Check Rank
        </button>
      </section>

      {/* Monthly report sender */}
      <section className="rounded-2xl border p-4 space-y-2">
        <h2 className="font-medium">Send Monthly Report</h2>

        <label className="text-sm">Owner Email</label>
        <input
          id="repEmail"
          className="border rounded px-3 py-2 w-full"
          placeholder="owner@business.com"
          defaultValue={client?.ownerEmail || ''}
        />

        <label className="text-sm mt-2">Month label</label>
        <input
          id="repMonth"
          className="border rounded px-3 py-2 w-full"
          placeholder="August 2025"
          defaultValue={thisMonthLabel()}
        />

        <label className="text-sm mt-2">Highlights (one per line)</label>
        <textarea
          id="repHighlights"
          className="border rounded px-3 py-2 w-full"
          placeholder={'+7 reviews\nAvg rating 4.8\nRank up for “teeth whitening”'}
          rows={4}
        />

        <label className="text-sm mt-2">Keywords (format: keyword|rank, one per line)</label>
        <textarea
          id="repKeywords"
          className="border rounded px-3 py-2 w-full"
          placeholder={'dentist near me|3\nteeth whitening|5'}
          rows={3}
        />

        <div className="flex items-center gap-3">
          <button
            disabled={sendingReport}
            onClick={sendReportFromUI}
            className="px-4 py-2 rounded-lg border disabled:opacity-50"
          >
            {sendingReport ? 'Sending…' : 'Send Report'}
          </button>
          {reportMsg && <span className="text-sm">{reportMsg}</span>}
        </div>
      </section>
    </main>
  );
}
