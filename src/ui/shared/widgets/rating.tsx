import { 
  StarIcon
} from "@heroicons/react/24/solid";

import { Restaurant } from "@/lib/data";

export default function RestaurantRating() {
  const rating = Restaurant.rating;

  return (
    <div className="restaurant-rating flex w-fit items-center rounded-3xl bg-yellow-100 px-4 py-3">
      <StarIcon className="w-3 text-yellow-400" />
      <span className="ml-1 text-xs font-bold leading-1 text-orange-600">
        {rating}
      </span>
    </div>
  );
}
