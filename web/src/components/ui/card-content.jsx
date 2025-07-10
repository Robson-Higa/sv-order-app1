export default function CardContent({ children, className }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}
