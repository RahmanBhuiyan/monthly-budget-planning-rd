import React, { useEffect, useRef } from 'react';
import { googleLogin } from '../services/api';

const GOOGLE_CLIENT_ID = '994253777683-6c7ep03lu74hct9hhcvh1ld30bo21vfu.apps.googleusercontent.com';

function GoogleLoginButton({ onSuccess, onError, text = 'signin_with' }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const res = await googleLogin(response.credential);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            if (onSuccess) onSuccess(res.data);
          } catch (err) {
            const msg = err.response?.data?.error || 'Google login failed';
            if (onError) onError(msg);
          }
        }
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: text,
        shape: 'rectangular',
        width: '100%'
      });
    };

    // Wait for Google script to load
    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [onSuccess, onError, text]);

  return (
    <div className="google-btn-wrapper">
      <div ref={buttonRef}></div>
    </div>
  );
}

export default GoogleLoginButton;
