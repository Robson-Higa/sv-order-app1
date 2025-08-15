// pages/OauthSuccess.jsx
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function OauthSuccess() {
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get('token');

    if (token && window.opener) {
      window.opener.postMessage({ token }, window.location.origin);
      window.close();
    }
  }, [params]);

  return <p>Processando login...</p>;
}
