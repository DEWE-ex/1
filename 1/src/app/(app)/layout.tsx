import ShellGate from "@/components/shell/ShellGate";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ShellGate>{children}</ShellGate>;
}
