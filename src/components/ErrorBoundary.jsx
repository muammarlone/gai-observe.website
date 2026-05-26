import React from 'react';
import { logAuditEvent } from '../lib/auditLog.js';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    logAuditEvent('error_boundary', {
      message: error?.message?.slice(0, 500),
      componentStack: errorInfo?.componentStack?.slice(0, 1000)
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: 600,
          margin: '80px auto',
          padding: 32,
          background: '#1E293B',
          borderRadius: 12,
          textAlign: 'center',
          color: '#F8FAFC'
        }}>
          <h2 style={{ color: '#EF4444', marginBottom: 12 }}>Something went wrong</h2>
          <p style={{ color: '#94A3B8', marginBottom: 24 }}>
            An unexpected error occurred. Your saved data is safe in local storage.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
