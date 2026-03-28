import { MINISTRY_SLUGS } from '@/lib/ministries';
import AttendanceClient from './AttendanceClient';

export const metadata = {
  title: "Log Attendance | Ministry Dashboard",
  description: "Real-time attendance tracking for ministry services and special events."
};

/**
 * Next.js Static Export requirement for dynamic segments.
 */
export async function generateStaticParams() {
  return MINISTRY_SLUGS.map(slug => ({ slug }));
}

export default function AttendancePage() {
  return <AttendanceClient />;
}
