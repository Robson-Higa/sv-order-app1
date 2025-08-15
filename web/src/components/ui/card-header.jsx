export default function CardHeader({ children, className }) {
  return <div className={`px-6 py-4 border-b ${className}`}>{children}</div>;
}
