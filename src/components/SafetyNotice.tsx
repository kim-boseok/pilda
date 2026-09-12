import { useState } from 'react';

const NOTICE_KEY = 'pilda_notice_v1';

export default function SafetyNotice() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(NOTICE_KEY) === null;
    } catch {
      return false;
    }
  });

  if (!open) return null;

  const confirm = () => {
    try {
      localStorage.setItem(NOTICE_KEY, new Date().toISOString());
    } catch {
      // 저장이 안 되어도 이번 세션에서는 닫아준다
    }
    setOpen(false);
  };

  return (
    <div className="sheet-backdrop">
      <div className="sheet" role="dialog" aria-label="바다 안전 안내">
        <h3>🏖️ 바다에 가기 전, 딱 4가지만요</h3>
        <ul style={{ marginTop: 12, paddingLeft: 4, listStyle: 'none' }}>
          {[
            '물때 정보는 참고용이에요. 현장 안내판과 안전요원 안내가 항상 우선이에요.',
            '갯벌에서는 물이 들어오기 시작하면 바로 나와야 해요.',
            '밤이나 안개 낀 날, 혼자서는 갯벌에 들어가지 마세요.',
            '내 위치 정보는 가까운 바다를 찾을 때만 쓰고, 기기 밖으로 보내지 않아요.',
          ].map((line) => (
            <li
              key={line}
              style={{
                display: 'flex',
                gap: 8,
                fontSize: 14,
                color: '#4e5968',
                marginTop: 8,
                lineHeight: 1.5,
              }}
            >
              <span aria-hidden="true">·</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <div className="sheet-actions">
          <button className="btn btn-primary" onClick={confirm}>
            확인했어요
          </button>
        </div>
      </div>
    </div>
  );
}
