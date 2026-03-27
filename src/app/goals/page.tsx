import { getUser, getHierarchicalData, calculateStreak, type HierarchicalData } from "@/lib/data";
import { GoalsClient } from "./GoalsClient";

export default async function GoalsPage() {
  const user = await getUser();
  if (!user) return <div>Loading...</div>;

  const hierarchy = await getHierarchicalData(user.id);

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

  return <GoalsClient userId={user.id} initialHierarchy={serializeDates(hierarchy)} />;
}
