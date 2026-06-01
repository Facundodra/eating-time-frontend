import { User } from "@/lib/shared/data";

export default function UserName({ className }: { className?: string }) {
  const name = User.name;

  return <span className={`user-name ${className ?? ""}`.trim()}>{name}</span>;
}
