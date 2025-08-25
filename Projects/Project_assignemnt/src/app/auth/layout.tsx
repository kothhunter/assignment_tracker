import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Assignment Tracker',
  description: 'Sign in to your account or create a new account to access your personal assignment dashboard.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}