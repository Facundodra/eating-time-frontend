export default function UserEmail({
  className,
  email = "",
}: {
  className?: string;
  email?: string;
}) {
  return <span className={`user-email ${className ?? ""}`.trim()}>{email}</span>;
}
