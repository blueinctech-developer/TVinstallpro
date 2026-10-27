// Re-mounts on every route change, so each page settles in with the same short entrance.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
