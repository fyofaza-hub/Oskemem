import type { CityEvent, Comment, Place, Post, Route, User } from "@/types";
import { tr } from "@/i18n/runtime";

/**
 * Applies exact-match translations to seeded content. Unknown strings are
 * returned untouched, which keeps user-created posts, edited profiles and
 * custom routes in the language their author wrote them in.
 */
export const localizePlace = (place: Place): Place => {
  const { descriptionTemplate, shortDescriptionTemplate, ...localizedPlace } = place;
  const name = tr(place.name);
  const district = tr(place.district);
  const variables = { name, district };

  return {
    ...localizedPlace,
    name,
    district,
    address: tr(place.address),
    addressNote: place.addressNote ? tr(place.addressNote) : undefined,
    description: descriptionTemplate
      ? tr(descriptionTemplate, variables)
      : tr(place.description),
    shortDescription: shortDescriptionTemplate
      ? tr(shortDescriptionTemplate, variables)
      : tr(place.shortDescription),
    tags: place.tags.map((tag) => tr(tag)),
    photoCredit: place.photoCredit ? tr(place.photoCredit) : undefined,
  };
};

export const localizeRoute = (route: Route): Route => ({
  ...route,
  title: tr(route.title),
  description: tr(route.description),
  stops: route.stops.map((stop) => ({
    ...stop,
    note: stop.note ? tr(stop.note) : stop.note,
  })),
});

export const localizeEvent = (event: CityEvent): CityEvent => ({
  ...event,
  title: tr(event.title),
  description: tr(event.description),
  priceLabel: tr(event.priceLabel),
});

const localizeComment = (comment: Comment): Comment => ({
  ...comment,
  text: tr(comment.text),
});

export const localizePost = (post: Post): Post => ({
  ...post,
  title: tr(post.title),
  text: tr(post.text),
  comments: post.comments.map(localizeComment),
});

export const localizeUser = (user: User): User => ({
  ...user,
  name: tr(user.name),
  bio: tr(user.bio),
  city: tr(user.city),
});
