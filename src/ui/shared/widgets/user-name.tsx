export default function UserName({
  className,
  name = "Usuario",
}: {
  className?: string;
  name?: string;
}) {
  return <span className={`user-name ${className ?? ""}`.trim()}>{name}</span>;
}
