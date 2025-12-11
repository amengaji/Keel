import React from "react";
import { FlatList } from "react-native";
import { KeelScreen } from "../components/ui/KeelScreen";
import { TaskListItem } from "../components/tasks/TaskListItem";
import { Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../navigation/types";
import { Status } from "../components/tasks/TaskStatusChip";


type Task = {
  id: number;
  code: string;
  title: string;
  status: Status;
};


type Props = NativeStackScreenProps<AppStackParamList, "TaskList">;

export default function TaskListScreen({ navigation }: Props) {
  const tasks: Task[] = [
    { id: 1, code: "D.1", title: "Identify bridge layout", status: "pending" },
    { id: 2, code: "D.2", title: "Explain radar components", status: "submitted" },
  ];

  return (
    <KeelScreen>
      <Text variant="titleLarge" style={{ fontWeight: "700", marginBottom: 12 }}>
        Tasks
      </Text>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TaskListItem
            code={item.code}
            title={item.title}
            status={item.status}
            onPress={() =>
              navigation.navigate("TaskDetails", { id: item.id })
            }
          />
        )}
      />
    </KeelScreen>
  );
}
