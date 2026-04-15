'use client';

import { InquiryCard } from './InquiryCard';
import type { Inquiry } from '../inquiries/page';

interface InquiryListProps {
  inquiries: Inquiry[];
  orgId: string;
  onStatusChange: (id: string, status: string) => void;
}

export function InquiryList({ inquiries, orgId, onStatusChange }: InquiryListProps) {
  return (
    <div className="space-y-2">
      {inquiries.map(inquiry => (
        <InquiryCard
          key={inquiry.id}
          inquiry={inquiry}
          orgId={orgId}
          onStatusChange={onStatusChange}
        />
      ))}
      <p className="text-[10px] text-muted-foreground font-semibold text-right pt-2">
        Showing {inquiries.length} record{inquiries.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
