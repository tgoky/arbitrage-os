// app/dashboard/[workspace]/ad-writer/[id]/page.tsx
"use client";

import AdWriterDetailView from '@/components/ad-writer/AdWriterDetailView';

const AdWriterDetailPage = () => {
  return <AdWriterDetailView backPath="/submissions" />;
};

export default AdWriterDetailPage;
