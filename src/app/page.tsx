"use client";

import { Suspense } from "react";

import { Authenticated } from "@refinedev/core";
import { NavigateToResource } from "@refinedev/nextjs-router";

export default function IndexPage() {
  return (
    <Suspense>
      <Authenticated
        key="home-page"
        fallback={<div />}
        loading={<div />}
      >
        <NavigateToResource />
      </Authenticated>
    </Suspense>
  );
}
