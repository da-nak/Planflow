import { getUser } from "@/lib/server-data";
import { getHabits } from "@/lib/data";
import { HabitsClient } from "./HabitsClient";

export default async function HabitsPage() {
  const user = await getUser();
  if (!user) return <div>Loading...</div>;

  const habits = await getHabits(user.id);

  const serializeDates = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
    if (Array.isArray(obj)) return obj.map(serializeDates);
    if (obj instanceof Date) return obj.toISOString();
    if (typeof obj === 'object') {
      const result: any = {};
      for (const key of Object.keys(obj)) {
        result[key] = serializeDates(obj[key]);
      }
      return result;
    }
    return obj;
  };

  return <HabitsClient userId={user.id} initialHabits={serializeDates(habits)} />;
}
