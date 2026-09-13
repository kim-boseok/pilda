// 바다 지수 카드 — 갯벌체험·해수욕·갯바위낚시 지수 (국립해양조사원 예보)
import { GRADE_INFO } from '../data/khoaIndices';
import type { BeachIndex, FishingIndex, MudflatIndex } from '../data/khoaIndices';

function Grade({ g }: { g: string | null }) {
  if (!g) return <span className="idx-grade none">—</span>;
  const info = GRADE_INFO[g];
  return (
    <span className="idx-grade" style={info ? { color: info.color } : undefined}>
      {info ? `${info.emoji} ` : ''}
      {g}
    </span>
  );
}

interface Props {
  mud: MudflatIndex | null;
  beach: BeachIndex | null;
  fish: FishingIndex | null;
}

export default function SeaIndexCards({ mud, beach, fish }: Props) {
  if (!mud && !beach && !fish) return null;
  return (
    <div className="card index-card">
      <h3 className="index-title">바다 지수</h3>
      {mud && (
        <div className="idx-row">
          <div className="idx-main">
            <span className="idx-name">🦀 갯벌체험</span>
            <Grade g={mud.grade} />
          </div>
          <small>
            {mud.villageName} · 체험 {mud.beginTm}~{mud.endTm} · {mud.weather}
          </small>
        </div>
      )}
      {beach && (
        <div className="idx-row">
          <div className="idx-main">
            <span className="idx-name">🏖️ 해수욕</span>
            <span className="idx-ampm">
              오전 <Grade g={beach.am} /> · 오후 <Grade g={beach.pm} />
            </span>
          </div>
          <small>
            {beach.beachName}
            {beach.waterTemp !== null ? ` · 수온 ${beach.waterTemp.toFixed(1)}℃` : ''}
            {beach.openStat === '폐장' ? ' · 지금은 폐장 기간이에요' : ''}
          </small>
        </div>
      )}
      {fish && (
        <div className="idx-row">
          <div className="idx-main">
            <span className="idx-name">🎣 갯바위 낚시</span>
            <small className="idx-spot">{fish.spotName} 부근</small>
          </div>
          {fish.entries.map((e) => (
            <div key={e.fish} className="idx-fish">
              <span>{e.fish}</span>
              <span className="idx-ampm">
                오전 <Grade g={e.am} /> · 오후 <Grade g={e.pm} />
              </span>
            </div>
          ))}
        </div>
      )}
      <small className="idx-src">국립해양조사원 예보 · 가장 가까운 지점 기준</small>
    </div>
  );
}
