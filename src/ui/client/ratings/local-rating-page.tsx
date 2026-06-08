import LocalRatingList from "@/ui/client/ratings/local-rating-list";

export default function LocalRatingPage({restaurant}: {restaurant: {id: string}}){
    return <LocalRatingList restaurantId={restaurant.id}></LocalRatingList>;
}