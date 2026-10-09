import type { ApiUser, AuthUser } from "./authTypes";

export function toAuthUser(apiUser: ApiUser, previous?: AuthUser | null): AuthUser {
  const sameUser = previous?.id === apiUser.id;
  return {
    ...apiUser,
    picture: sameUser ? previous?.picture : undefined,
    city: sameUser ? previous?.city : undefined,
    timeZone: sameUser ? previous?.timeZone : undefined,
    language: sameUser ? previous?.language : undefined,
  };
}
