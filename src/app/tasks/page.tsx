import { getUser } from "@/lib/server-data";
import { getHierarchicalData, type HierarchicalData } from "@/lib/data";
import { TasksClient } from "./TasksClient";

export default async function TasksPage() {
  const user = await getUser();
  if (!user) return <div>Loading...</div>;

  const hierarchy = await getHierarchicalData(user.id);

  const weeklyPlans = hierarchy.flatMap(yg => 
    yg.monthlyGoals.flatMap(mg => mg.weeklyPlans)
  );

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

  return (
    <TasksClient 
      userId={user.id} 
      initialHierarchy={serializeDates(hierarchy)} 
      weeklyPlans={serializeDates(weeklyPlans)} 
    />
  );
}
