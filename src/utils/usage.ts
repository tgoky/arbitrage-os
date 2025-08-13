// utils/usage.ts
interface UsageLog {
  userId: string;
  feature: string;
  tokens: number;
  timestamp: Date;
}

export async function logUsage(usage: UsageLog) {
  // Implement your usage tracking logic here
  // Could be database, analytics service, etc.
  console.log('Usage logged:', usage);
}