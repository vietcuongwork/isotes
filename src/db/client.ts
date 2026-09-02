import { drizzle } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { openDatabaseSync } from "expo-sqlite";
import migrations from "../../drizzle/migrations";
import * as schema from "./schema";

export const DATABASE_NAME = "isotes.db";
const expoDB = openDatabaseSync(DATABASE_NAME);
export const db = drizzle(expoDB, { schema });

export function useDatabaseMigrations() {
  return useMigrations(db, migrations);
}

export function useStudio() {
  return useDrizzleStudio(expoDB);
}
