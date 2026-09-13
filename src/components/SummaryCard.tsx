import { useEffect, useState } from 'react';
import type { SeaSummary } from '../types';
import { copyText } from '../lib/clipboard';

export default function SummaryCard({ summary, address }: { summary: SeaSummary; address: string }) {
  const [copied, setCopied] = useState(false);

  // 다른 바다로 바뀌면 복사 표시 초기화
  useEffect(() => {
    setCopied(false);
  }, [address]);

  const copyAddr = async () => {
    await copyText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card">
      <div className="summary-headline">{summary.headline}</div>
      <div className="summary-detail">{summary.detail}</div>
      {summary.tags.length > 0 && (
        <div className="tag-row">
          {summary.tags.map((t) => (
            <span key={t} className="tag">
              #{t}
            </span>
          ))}
        </div>
      )}
      <div className="sea-addr">
        <span className="sea-addr-text">📍 {address}</span>
        <button className="sea-addr-copy" onClick={() => void copyAddr()}>
          {copied ? '복사됨 ✓' : '복사'}
        </button>
      </div>
    </div>
  );
}
