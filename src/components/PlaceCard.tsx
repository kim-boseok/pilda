import { useEffect, useState } from 'react';
import type { TourInfo } from '../data/stations/tourInfo';

/**
 * 지점 소개 카드 — 한국관광공사 TourAPI에서 미리 수집한 사진·소개글·편의정보
 * (정보가 없는 지점에서는 아무것도 그리지 않는다)
 */
export default function PlaceCard({ info, name }: { info: TourInfo | undefined; name: string }) {
  const [open, setOpen] = useState(false);
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => {
    setOpen(false);
    setImgOk(true);
  }, [info]);

  if (!info) return null;

  const facts: { icon: string; label: string; value: string; href?: string }[] = [];
  if (info.tel) {
    // 전화 항목엔 '○○과 담당팀 052-204-1751~6'처럼 설명이 섞여 있다
    // → 제대로 된 번호 하나를 정확히 뽑아냈을 때만 통화 링크로 만든다
    const num = info.tel.match(/0\d{1,2}-\d{3,4}-\d{4}/)?.[0];
    facts.push({ icon: '☎️', label: '문의', value: info.tel, href: num ? `tel:${num}` : undefined });
  }
  if (info.parking) facts.push({ icon: '🅿️', label: '주차', value: info.parking });
  if (info.usetime) facts.push({ icon: '🕒', label: '이용시간', value: info.usetime });
  if (info.restdate) facts.push({ icon: '📅', label: '쉬는날', value: info.restdate });

  const hasBody = Boolean(info.overview) || facts.length > 0 || Boolean(info.homepage);
  if (!info.image && !hasBody) return null;

  const long = (info.overview?.length ?? 0) > 90;

  return (
    <div className="card place-card">
      {info.image && imgOk && (
        <img
          className="place-photo"
          src={info.image}
          alt={`${name} 사진`}
          loading="lazy"
          onError={() => setImgOk(false)}
        />
      )}

      {info.overview && (
        <p className={`place-overview${open || !long ? ' open' : ''}`}>{info.overview}</p>
      )}
      {long && (
        <button className="place-more" onClick={() => setOpen((v) => !v)}>
          {open ? '접기' : '더보기'}
        </button>
      )}

      {facts.length > 0 && (
        <div className="place-facts">
          {facts.map((f) => (
            <div key={f.label} className="place-fact">
              <span className="place-fact-label">
                {f.icon} {f.label}
              </span>
              {f.href ? (
                <a className="place-fact-value link" href={f.href}>
                  {f.value}
                </a>
              ) : (
                <span className="place-fact-value">{f.value}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {info.homepage && (
        <a className="place-home" href={info.homepage} target="_blank" rel="noreferrer">
          공식 홈페이지 열기 →
        </a>
      )}

      <div className="place-source">한국관광공사 관광정보</div>
    </div>
  );
}
