"use client";

import { Suspense } from "react";

import { Authenticated } from "@refinedev/core";
import { NavigateToResource } from "@refinedev/nextjs-router";

const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    backgroundColor: '#000',
    position: 'relative',
  }}>
    <div style={{
      position: 'absolute',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#5CC49D',
        animation: 'pulse 1s ease-in-out infinite',
      }} />
      <span style={{
        color: '#666',
        fontSize: '12px',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        Loading
      </span>
    </div>
    
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
    `}</style>
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