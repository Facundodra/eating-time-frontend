export type RestaurantReferencePhoto = {
  id: number;
  requestId: number;
  url: string;
};

export type RestaurantCoverPhotoInput =
  | { photoId: number; file?: never }
  | { file: File; photoId?: never };
