"use client";

import { Suspense } from "react";

import { Authenticated } from "@refinedev/core";
import { NavigateToResource } from "@refinedev/nextjs-router";

export default function IndexPage() {
  return (
    <Suspense>
      <Authenticated
        key="home-page"
        loading={<div style={{ minHeight: '100vh', backgroundColor: '#000' }} />}
        fallback={<div style={{ minHeight: '100vh', backgroundColor: '#000' }} />}
      >
        <NavigateToResource />
      </Authenticated>
    </Suspense>
  );
}
