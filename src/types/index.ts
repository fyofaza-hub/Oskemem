export type CategoryId =
  | "food"
  | "nature"
  | "entertainment"
  | "culture"
  | "sport"
  | "landmark"
  | "leisure";

export type PriceLevel = 0 | 1 | 2 | 3;
export type Companion = "solo" | "couple" | "friends" | "family";

export interface Category {
  id: CategoryId;
  label: string;
  shortLabel: string;
  description: string;
  accent: string;
}

export interface Place {
  id: string;
  name: string;
  category: CategoryId;
  district: string;
  address: string;
  addressNote?: string;
  description: string;
  shortDescription: string;
  coords: [number, number];
  image: string;
  tags: string[];
  priceLevel: PriceLevel;
  companions: Companion[];
  featured?: boolean;
  source: "OpenStreetMap" | "community";
  photoCredit?: string;
  illustrativePhoto?: boolean;
  /** Localization templates are used by generated seed places with varied copy. */
  descriptionTemplate?: string;
  shortDescriptionTemplate?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface PlaceInput {
  name: string;
  category: CategoryId;
  district: string;
  address: string;
  description: string;
  shortDescription: string;
  coords: [number, number];
  image: string;
  tags: string[];
  priceLevel: PriceLevel;
  companions: Companion[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  bio: string;
  city: string;
  joinedAt: string;
  avatar?: string;
  avatarColor: string;
  interests: CategoryId[];
  demo?: boolean;
  role?: "user" | "admin";
  banned?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  placeId: string;
  title: string;
  text: string;
  image: string;
  category: CategoryId;
  createdAt: string;
  baseLikes: number;
  likedBy: string[];
  comments: Comment[];
  demo?: boolean;
  approved?: boolean;
}

export interface RouteStop {
  placeId: string;
  time: string;
  note?: string;
}

export interface Route {
  id: string;
  title: string;
  description: string;
  authorId: string;
  cover: string;
  categories: CategoryId[];
  stops: RouteStop[];
  durationMin: number;
  distanceKm: number;
  isPublic: boolean;
  demo?: boolean;
  baseSaves?: number;
  savedBy: string[];
  createdAt: string;
}

export interface CityEvent {
  id: string;
  title: string;
  description: string;
  image: string;
  category: CategoryId;
  dateISO: string;
  endTime: string;
  placeId: string;
  priceLabel: string;
  demo: true;
  savedBy: string[];
}

export interface CommentDraft {
  text: string;
}

export interface RouteDraft {
  title: string;
  description: string;
  categories: CategoryId[];
  stops: RouteStop[];
  cover: string;
  startTime: string;
}

export interface ProfileUpdate {
  name: string;
  username: string;
  bio: string;
  city: string;
  avatar?: string;
  avatarColor?: string;
  interests?: CategoryId[];
}

export interface SiteSettings {
  siteTitle: string;
  maintenanceMode: boolean;
  postingEnabled: boolean;
}

export interface FilterOption<T extends string> {
  id: T;
  label: string;
}
