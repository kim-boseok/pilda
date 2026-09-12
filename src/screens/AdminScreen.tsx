import { useState } from 'react';
import { KHOA_KEY_STORAGE, getKhoaKey, khoaProvider } from '../data/khoaProvider';

function mask(key: string): string {
  if (key.length <= 12) return '****';
  return `${key.slice(0, 6)}…${key.slice(-6)}`;
}

export default function AdminScreen({ onBack }: { onBack: () => void }) {
  const [value, setValue] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  void refresh;
  const stored = localStorage.getItem(KHOA_KEY_STORAGE)?.trim() || null;
  const envKey = ((import.meta.env.VITE_KHOA_KEY as string | undefined) ?? '').trim() || null;
  const active = getKhoaKey();

  const save = () => {
    const v = value.trim();
    if (!v) return;
    localStorage.setItem(KHOA_KEY_STORAGE, v);
    setValue('');
    setTestResult(null);
    setRefresh((n) => n + 1);
  };

  const remove = () => {
    localStorage.removeItem(KHOA_KEY_STORAGE);
    setTestResult(null);
    setRefresh((n) => n + 1);
  };

  const test = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const days = await khoaProvider.getTides('DT_0001', new Date());
      const today = days[1] ?? days[0];
      const parts = today.extremes
        .map((e) => `${e.type === 'high' ? '만조' : '간조'} ${String(e.time.getHours()).padStart(2, '0')}:${String(e.time.getMinutes()).padStart(2, '0')} ${e.level}cm`)
        .join(' · ');
      setTestResult({ ok: true, msg: `정상 연결 — 인천 오늘 조석: ${parts}` });
    } catch (e) {
      setTestResult({ ok: false, msg: e instanceof Error ? e.message : String(e) });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="screen admin-screen">
      <div className="admin-topbar">
        <button className="icon-btn admin-back" onClick={onBack} aria-label="뒤로">
          ←
        </button>
        <h2>관리자 · 데이터 연결</h2>
      </div>

      <div className="admin-body">
        <div className="card admin-card">
          <h3>현재 상태</h3>
          <div className={`admin-status ${active ? 'on' : 'off'}`}>
            {active ? '● 실시간 데이터 (국립해양조사원)' : '○ 시뮬레이션 데이터'}
          </div>
          <ul className="admin-keys">
            <li>
              <span>등록된 키</span>
              <b>{stored ? mask(stored) : '없음'}</b>
            </li>
            <li>
              <span>환경변수 키</span>
              <b>{envKey ? mask(envKey) : '없음'}</b>
            </li>
          </ul>
          <p className="admin-hint">
            등록된 키가 있으면 우선 사용하고, 없으면 환경변수(VITE_KHOA_KEY) 키를 사용해요.
            둘 다 없으면 시뮬레이션으로 동작해요.
          </p>
        </div>

        <div className="card admin-card">
          <h3>API 키 등록</h3>
          <p className="admin-hint">
            공공데이터포털(data.go.kr) 조석예보 일반 인증키를 붙여넣으세요. 인코딩된 키(%2F,
            %3D 포함) 그대로 저장하면 돼요.
          </p>
          <input
            className="admin-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="API 키 붙여넣기"
            spellCheck={false}
          />
          <div className="sheet-actions">
            {stored && (
              <button className="btn btn-ghost" onClick={remove}>
                키 삭제
              </button>
            )}
            <button className="btn btn-primary" onClick={save} disabled={!value.trim()}>
              저장
            </button>
          </div>
        </div>

        <div className="card admin-card">
          <h3>연결 테스트</h3>
          <p className="admin-hint">인천(DT_0001) 관측소의 오늘 조석예보를 실제로 호출해요.</p>
          <div className="sheet-actions">
            <button className="btn btn-primary" onClick={test} disabled={testing || !active}>
              {testing ? '호출 중…' : '지금 테스트'}
            </button>
          </div>
          {testResult && (
            <div className={`admin-test ${testResult.ok ? 'ok' : 'fail'}`}>{testResult.msg}</div>
          )}
        </div>
      </div>
    </div>
  );
}
