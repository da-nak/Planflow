import { getUser } from "@/lib/server-data";
import { getTimeBlocks } from "@/lib/data";
import { CalendarClient } from "./CalendarClient";

export default async function CalendarPage() {
  const user = await getUser();
  if (!user) return <div>Loading...</div>;

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const timeBlocks = await getTimeBlocks(user.id, startOfWeek, endOfWeek);

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

  return <CalendarClient userId={user.id} initialTimeBlocks={serializeDates(timeBlocks)} />;
}
