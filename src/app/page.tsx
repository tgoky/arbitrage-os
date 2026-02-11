"use client";

import { Suspense } from "react";

import { Authenticated } from "@refinedev/core";
import { NavigateToResource } from "@refinedev/nextjs-router";

const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    fontFamily: 'Manrope, system-ui, sans-serif',
  }}>
    <img
      src="/aoswhite.png"
      alt="ArbitrageOS"
      style={{
        height: '120px',
        objectFit: 'contain',
        marginBottom: '32px',
        opacity: 0.9,
      }}
    />
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div style={{
        width: '16px',
        height: '16px',
        border: '2px solid #333',
        borderTopColor: '#5CC49D',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{
        color: '#666',
        fontSize: '12px',
        fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '1px',
      }}>
        Initializing...
      </span>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function IndexPage() {
  return (
    <Suspense>
      <Authenticated
        key="home-page"
        loading={<LoadingScreen />}
        fallback={<LoadingScreen />}
      >
        <NavigateToResource />
      </Authenticated>
    </Suspense>
  );
}