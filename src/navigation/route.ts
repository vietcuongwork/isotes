export const EXPO_ROUTER = {
  ONBOARDING: "/(screens)/onboarding",
  CREATE_PROJECT: "/(screens)/create-project",
  EXPENSE: (projectId: string) => ({
    pathname: "/(screens)/[projectId]/(tabs)/expense" as const,
    params: { projectId },
  }),
} as const;
