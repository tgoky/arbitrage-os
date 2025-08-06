// types/tools.ts
import { ReactNode } from 'react';

export type ToolInput = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
};

export type Tool = {
  id: string;
  name: string;
  description: string;
  inputs: ToolInput[];
};

export type ToolCategory = {
  id: string;
  name: string;
  icon: ReactNode;
  color: string;
  tools: Tool[];
};