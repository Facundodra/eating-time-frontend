import { User } from "@/lib/data";

export default function UserEmail({ className }: { className?: string }) {
  const email = User.email;

  return <span className={`user-email ${className ?? ""}`.trim()}>{email}</span>;
}
