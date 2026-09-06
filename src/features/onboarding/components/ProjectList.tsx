import { getAllProjects } from "@/db/projects";
import { Project } from "@/db/schema";
import { EXPO_ROUTER } from "@/navigation/route";
import { colors } from "@/themes/color";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import AvatarStack from "./AvatarStack";

interface ProjectItemProps {
  project: Project;
  touchableOpacityProps?: TouchableOpacityProps;
}

const ProjectItem = (props: ProjectItemProps) => {
  const { project, touchableOpacityProps } = props;

  const createdAt = new Date(project.createdAt * 1000).toLocaleDateString();

  return (
    <TouchableOpacity
      className="gap-1 rounded-card bg-grey-900 p-4"
      {...touchableOpacityProps}
    >
      {/* Header */}
      <View className="flex-row justify-between">
        <Text className="text-title text-grey-50">{project.name}</Text>
        {/* //TODO - Mock data */}
        <Text className="text-title text-green-400">
          +$274.68
        </Text>
      </View>

      {/* Summary */}
      <View className="flex-row justify-between">
        {/* //TODO - Mock data */}
        <Text className="text-meta text-grey-200">5 expenses · $630.90</Text>
        {/* //TODO - Mock data */}
        <Text className="text-meta text-grey-200">you're owed</Text>
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between pt-3">
        <AvatarStack />
        <ChevronRight size={18} color={colors.grey[400]} />
      </View>
    </TouchableOpacity>
  );
};

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isGettingProjects, setIsGettingProjects] = useState<boolean>(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      setIsGettingProjects(true);
      getAllProjects()
        .then(setProjects)
        .finally(() => setIsGettingProjects(false));
    }, []),
  );

  return (
    <View className="gap-3 border-b border-grey-825 pb-8 pt-7">
      {/* Item */}
      {projects.map((project) => (
        <ProjectItem
          key={project.id}
          project={project}
          touchableOpacityProps={{
            onPress: () => {
              router.push(EXPO_ROUTER.EXPENSE(project.id));
            },
          }}
        />
      ))}
    </View>
  );
}
