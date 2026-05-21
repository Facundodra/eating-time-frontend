import { redirect } from "next/navigation";

import { User } from "@/lib/data";

export default function Home() {
  const userRole = User.role;

  if (userRole === "admin") {
    redirect("/admin");
  } else if (userRole === "restaurant") {
    redirect("/restaurant");
  } else {
    redirect("/client");
  }
}
