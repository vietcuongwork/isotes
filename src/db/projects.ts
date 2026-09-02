import { desc } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db } from "./client";
import { NewProject, projects } from "./schema";

export async function insertProject(data: Omit<NewProject, "id">) {
  const id = randomUUID();
  await db.insert(projects).values({ ...data, id });
  return id;
}

export async function getAllProjects() {
  return db.select().from(projects).orderBy(desc(projects.createdAt));
}
