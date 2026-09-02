export const EXPO_ROUTER = {
  ONBOARDING: "/(screens)/onboarding",
  CREATE_PROJECT: "/(screens)/create-project",
  EXPENSE: (projectId: string, projectName: string) => ({
    pathname: "/(screens)/[projectId]/(tabs)/expense" as const,
    params: { projectId, projectName },
  }),
} as const;
