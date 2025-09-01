"use client";

import React from "react";

interface RankResult {
  position: number;
  title: string;
  link: string;
}

interface RankResultsProps {
  keyword: string;
  domain: string;
  position: number | null;
  inTop10: boolean;
  inTop3: boolean;
  top10: RankResult[];
}

const RankResults: React.FC<RankResultsProps> = ({
  keyword,
  domain,
  position,
  inTop10,
  inTop3,
  top10,
}) => {
  return (
    <div className="p-6 rounded-2xl shadow-lg bg-white">
      <h2 className="text-xl font-bold mb-2">Rank Check Results</h2>
      <p className="mb-4 text-gray-700">
        <b>Keyword:</b> {keyword} <br />
        <b>Domain:</b> {domain} <br />
        <b>Position:</b>{" "}
        {position ? `#${position}` : "Not in top 10"} <br />
        <b>Top 3?</b> {inTop3 ? "✅ Yes" : "❌ No"} <br />
        <b>Top 10?</b> {inTop10 ? "✅ Yes" : "❌ No"}
      </p>

      <h3 className="text-lg font-semibold mb-2">Top 10 Results</h3>
      <table className="w-full border border-gray-200 text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">Position</th>
            <th className="p-2 border">Title</th>
            <th className="p-2 border">Link</th>
          </tr>
        </thead>
        <tbody>
          {top10.map((r) => (
            <tr key={r.position} className="hover:bg-gray-50">
              <td className="p-2 border">{r.position}</td>
              <td className="p-2 border">{r.title}</td>
              <td className="p-2 border text-blue-600 underline">
                <a href={r.link} target="_blank" rel="noopener noreferrer">
                  {r.link}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RankResults;
