import { getUser } from "@/lib/server-data";
import { ChallengesClient } from "./ChallengesClient";

export default async function ChallengesPage() {
  const user = await getUser();
  if (!user) return <div>Loading...</div>;

  return <ChallengesClient userId={user.id} />;
}
