import { v5 as uuidv5 } from "uuid";

// Never change this namespace: it maps a Google subject to a stable profile id.
const PROFILE_NAMESPACE = "0f7f4a1e-6b2c-4d3e-8a9b-1c2d3e4f5a6b";

export function profileIdFromGoogleSub(googleSub: string) {
  return uuidv5(googleSub, PROFILE_NAMESPACE);
}
