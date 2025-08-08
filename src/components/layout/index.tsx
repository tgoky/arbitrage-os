// Layout.tsx
"use client";

import type { PropsWithChildren } from "react";
import { Breadcrumb } from "../breadcrumb";
import { Menu } from "../menu";
import { TutorialButton } from "../tutorials/TutorialButton";
import { WelcomeTutorialModal } from "../tutorials/WelcomeTutorialModal";

export const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full">
      <Menu />
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex-shrink-0">
            <TutorialButton />
          </div>
          <div className="flex-grow ml-4">
            <Breadcrumb />
          </div>
        </div>
        <div className="flex-1 w-full min-w-0 overflow-y-auto">
          {children}
        </div>
      </div>
      <WelcomeTutorialModal />
    </div>
  );
};