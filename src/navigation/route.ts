export const EXPO_ROUTER = {
  WELCOME: "/(screens)/welcome",
  ONBOARDING: "/(screens)/onboarding",
  TRIPS: "/(screens)/trips",
  CREATE_TRIP: "/(screens)/create-trip",
  EXPENSE: (tripId: string) => ({
    pathname: "/(screens)/[tripId]/(tabs)/expense" as const,
    params: { tripId },
  }),
} as const;
