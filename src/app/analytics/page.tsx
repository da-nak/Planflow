import { getUser, getHabits, getHierarchicalData, getAnalyticsData } from "@/lib/data";
import { AnalyticsClient } from "./AnalyticsClient";
import { startOfWeek, endOfWeek } from "date-fns";

export default async function AnalyticsPage() {
  const user = await getUser();
  if (!user) return <div>Loading...</div>;

  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const end = endOfWeek(today, { weekStartsOn: 1 });

  const [hierarchy, habits] = await Promise.all([
    getHierarchicalData(user.id),
    getHabits(user.id),
  ]);

  const analyticsData = await getAnalyticsData(user.id, start, end);

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
    <AnalyticsClient 
      initialData={serializeDates(analyticsData)} 
      habits={serializeDates(habits)} 
    />
  );
}
