import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Assignment Tracker',
  description: 'Your personal assignment dashboard and management system.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}