"use client";

import type { PropsWithChildren } from "react";
import { Breadcrumb } from "../breadcrumb";
import { Menu } from "../menu";

export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full">
      <Menu />
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        <Breadcrumb />
        <div className="flex-1 w-full min-w-0 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};