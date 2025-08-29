// server-only list for cron runs (replace with DB later)
export type BatchClient = {
  name: string;
  email: string;          // owner inbox
  highlights?: string[];
  keywords?: { phrase: string; rank?: number | null }[];
};

export const batchClients: BatchClient[] = [
  {
    name: 'Test Cafe',
    email: 'kenilrawal47@gmail.com',
    highlights: ['+5 reviews', 'Avg rating 4.7', 'Rank up for “flat white”'],
    keywords: [{ phrase: 'coffee shop near me', rank: 3 }, { phrase: 'best latte', rank: 5 }]
  },
  // add more clients here
];
