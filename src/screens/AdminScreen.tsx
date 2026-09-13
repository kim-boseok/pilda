import { useEffect, useState } from 'react';
import { KHOA_KEY_STORAGE, getKhoaKey, khoaProvider } from '../data/khoaProvider';
import { fetchKmaWeather } from '../data/kmaWeather';

// 관리자 비밀번호의 SHA-256 해시 — 원문은 코드에 남기지 않는다
const ADMIN_HASH = '280a1172fce2579580ffbe7e01b96a9ccadaec8760c27d7ad30d99d4a3f3dad8';
const ADMIN_SESSION = 'pilda_admin_ok';

/** 이 계정(공공데이터포털 통합 인증키)으로 승인받은 API 목록 */
const SERVICES: {
  id: string;
  name: string;
  org: string;
  use: string;
  status: 'live' | 'ready';
}[] = [
  { id: 'tide', name: '조석예보 (고·저조)', org: '국립해양조사원', use: '물때·조위·애니메이션', status: 'live' },
  { id: 'kma', name: '기상청 단기예보', org: '기상청', use: '하늘·비·눈 씬 연출', status: 'live' },
  { id: 'buoy', name: '해양관측부이 최신 관측데이터', org: '국립해양조사원', use: '실측 파고·수온·바람 (연동 예정)', status: 'ready' },
  { id: 'mudflat', name: '갯벌체험지수', org: '국립해양조사원', use: '갯벌체험 5단계 지수 (연동 예정)', status: 'ready' },
  { id: 'swim', name: '해수욕지수', org: '국립해양조사원', use: '물놀이 적합도 (연동 예정)', status: 'ready' },
  { id: 'fishing', name: '바다낚시지수', org: '국립해양조사원', use: '낚시 적합도 (연동 예정)', status: 'ready' },
];

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function mask(key: string): string {
  if (key.length <= 12) return '****';
  return `${key.slice(0, 6)}…${key.slice(-6)}`;
}

export default function AdminScreen({ onBack }: { onBack: () => void }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(ADMIN_SESSION) === '1');
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);
  const [checking, setChecking] = useState(false);

  const [value, setValue] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null);

  // 뒤로가기로 나가면 세션은 유지 (같은 탭 안에서만)
  useEffect(() => {
    if (authed) sessionStorage.setItem(ADMIN_SESSION, '1');
  }, [authed]);

  const login = async () => {
    if (!pw.trim() || checking) return;
    setChecking(true);
    try {
      const hex = await sha256Hex(pw.trim());
      if (hex === ADMIN_HASH) {
        setAuthed(true);
        setPwError(false);
      } else {
        setPwError(true);
      }
    } finally {
      setPw('');
      setChecking(false);
    }
  };

  if (!authed) {
    return (
      <div className="screen admin-screen">
        <div className="admin-topbar">
          <button className="icon-btn admin-back" onClick={onBack} aria-label="뒤로">
            ←
          </button>
          <h2>관리자</h2>
        </div>
        <div className="admin-body">
          <div className="card admin-card">
            <h3>🔒 관리자 전용 페이지</h3>
            <p className="admin-hint">이 페이지는 운영자만 사용할 수 있어요. 비밀번호를 입력해주세요.</p>
            <input
              className="admin-input"
              type="password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setPwError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void login();
              }}
              placeholder="관리자 비밀번호"
              autoFocus
            />
            {pwError && <div className="admin-test fail">비밀번호가 맞지 않아요.</div>}
            <div className="sheet-actions">
              <button className="btn btn-primary" onClick={() => void login()} disabled={!pw.trim() || checking}>
                {checking ? '확인 중…' : '들어가기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  const runTest = async (id: string) => {
    setTesting(id);
    setTestResult(null);
    try {
      if (id === 'tide') {
        const days = await khoaProvider.getTides('DT_0001', new Date());
        const today = days[1] ?? days[0];
        const parts = today.extremes
          .map((e) => `${e.type === 'high' ? '만조' : '간조'} ${String(e.time.getHours()).padStart(2, '0')}:${String(e.time.getMinutes()).padStart(2, '0')} ${e.level}cm`)
          .join(' · ');
        setTestResult({ id, ok: true, msg: `정상 연결 — 인천 오늘 조석: ${parts}` });
      } else if (id === 'kma') {
        const key = getKhoaKey();
        if (!key) throw new Error('API 키가 없습니다');
        const wx = await fetchKmaWeather(37.4517, 126.5922, key);
        const now = wx.hours[0];
        const skyTxt = now.pty > 0 ? '비/눈' : now.sky >= 4 ? '흐림' : now.sky >= 3 ? '구름많음' : '맑음';
        setTestResult({ id, ok: true, msg: `정상 연결 — 인천 예보 ${wx.hours.length}시간분 수신 (지금 ${skyTxt}, 강수확률 ${now.pop}%)` });
      }
    } catch (e) {
      setTestResult({ id, ok: false, msg: e instanceof Error ? e.message : String(e) });
    } finally {
      setTesting(null);
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
            {active ? '● 실시간 데이터 (통합 인증키 사용 중)' : '○ 시뮬레이션 데이터'}
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
          <h3>승인된 API 목록</h3>
          <p className="admin-hint">
            공공데이터포털 통합 인증키 하나로 아래 API를 모두 사용해요.
          </p>
          <ul className="admin-svcs">
            {SERVICES.map((s) => (
              <li key={s.id}>
                <div className="admin-svc-main">
                  <span className={`admin-svc-dot ${s.status}`} aria-hidden="true" />
                  <div>
                    <b>{s.name}</b>
                    <small>
                      {s.org} · {s.use}
                    </small>
                  </div>
                </div>
                {(s.id === 'tide' || s.id === 'kma') && (
                  <button
                    className="btn btn-ghost admin-svc-test"
                    onClick={() => void runTest(s.id)}
                    disabled={testing !== null || !active}
                  >
                    {testing === s.id ? '호출 중…' : '테스트'}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {testResult && (
            <div className={`admin-test ${testResult.ok ? 'ok' : 'fail'}`}>{testResult.msg}</div>
          )}
        </div>

        <div className="card admin-card">
          <h3>API 키 등록</h3>
          <p className="admin-hint">
            공공데이터포털(data.go.kr) 일반 인증키를 붙여넣으세요. 인코딩된 키(%2F, %3D 포함)
            그대로 저장하면 돼요. 하나의 키가 위 API 전부에 적용돼요.
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
      </div>
    </div>
  );
}
