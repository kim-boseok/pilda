import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Pilda] 화면 렌더링 오류:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 44 }}>🌊</div>
          <h2 style={{ fontSize: 19, fontWeight: 800 }}>바다에 잠깐 문제가 생겼어요</h2>
          <p style={{ fontSize: 14, color: '#4e5968' }}>
            새로고침하면 대부분 다시 잘 보여요.
          </p>
          <button
            className="btn btn-primary"
            style={{ flex: 'none', minWidth: 160, marginTop: 8 }}
            onClick={() => location.reload()}
          >
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
