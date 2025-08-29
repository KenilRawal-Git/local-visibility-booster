'use client';

export type Client = {
  id: string;
  name: string;
  address?: string;
  reviewLink?: string;
};

const KEY = 'lvb_clients';

export function getClients(): Client[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function saveClients(list: Client[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(list));
}
