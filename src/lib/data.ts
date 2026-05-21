import profileImage from "@/ui/shared/images/profile.png";

export const User = {
  name: "Admin",
  email: "admin@eatingtime.uy",
  role: "restaurant", // restaurant, admin, client
  photo: profileImage.src,
};

export const Restaurant = {
  rating: 4.5,
  status: 1, // 0: closed, 1: open
};
