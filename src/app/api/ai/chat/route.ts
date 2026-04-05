import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/server-data";
import { prisma } from "@/lib/prisma";

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    if (response.status !== 429) {
      return response;
    }
    
    if (attempt < maxRetries - 1) {
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return fetch(url, options);
}

const SYSTEM_PROMPT = `You are PlanFlow AI, a helpful and friendly productivity assistant integrated into the PlanFlow app. You help users manage their tasks, habits, and improve their productivity.

You have access to the user's:
- Tasks (with priorities, deadlines, categories, status)
- Habits (with tracking logs)
- Productivity patterns (completion times, success rates)

Guidelines:
- Be conversational but professional
- Give specific, actionable advice
- Reference their actual data when relevant
- Keep responses concise (2-4 sentences max unless asked for details)
- Suggest task breakdowns when they seem overwhelmed
- Encourage good habits without being preachy
- If you don't have specific data, give general helpful advice
- Never make up specific task names or data - only reference what you can see
- If they ask about their stats, mention you can see their patterns from completed tasks

User context will be provided in the request. Be warm, encouraging, and genuinely helpful.`;

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await request.json();

  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      message: "AI features require an API key. Please configure GEMINI_API_KEY in Vercel environment variables."
    });
  }

  let userContext: string;
  try {
    userContext = await buildUserContext(user.id);
  } catch (dbError) {
    console.error("Database error:", dbError);
    userContext = "User context unavailable (database error).";
  }

  try {
    const fullPrompt = `${SYSTEM_PROMPT}\n\nCurrent user context:\n${userContext}`;
    
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }, { text: message }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return NextResponse.json({
        message: `Gemini error (${response.status}). Please try again in a moment.`
      });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({ message: reply || "I'm not sure how to respond to that." });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({
      message: `Error: ${error?.message || "Unknown error"}. Please try again.`
    });
  }
}

async function buildUserContext(userId: string): Promise<string> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [tasks, habits, completionLogs] = await Promise.all([
    prisma.task.findMany({
      where: {
        weeklyPlan: {
          monthlyGoal: {
            yearlyGoal: {
              userId,
            },
          },
        },
      },
      select: {
        title: true,
        status: true,
        priority: true,
        category: true,
        deadline: true,
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    }),

    prisma.habit.findMany({
      where: { userId },
      include: {
        logs: {
          where: { date: { gte: weekAgo } },
          orderBy: { date: "desc" },
          take: 14,
        },
      },
    }),

    prisma.taskCompletionLog.findMany({
      where: {
        userId,
        actualCompletionTime: { gte: weekAgo },
      },
      orderBy: { actualCompletionTime: "desc" },
    }),
  ]);

  const pendingTasks = tasks.filter((t) => t.status === "PENDING");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");
  const highPriorityTasks = pendingTasks.filter((t) => t.priority === "HIGH");

  const totalCompleted = completionLogs.length;
  const onTime = completionLogs.filter(
    (l) => !l.completionDelayMinutes || l.completionDelayMinutes <= 15
  ).length;
  const successRate = totalCompleted > 0 ? Math.round((onTime / totalCompleted) * 100) : 100;

  const morningCompletions = completionLogs.filter(
    (l) => l.completionHour && l.completionHour >= 6 && l.completionHour < 12
  ).length;
  const eveningCompletions = completionLogs.filter(
    (l) => l.completionHour && l.completionHour >= 18 && l.completionHour < 24
  ).length;

  const personality =
    morningCompletions > eveningCompletions * 1.5
      ? "Morning Person"
      : eveningCompletions > morningCompletions * 1.5
      ? "Night Owl"
      : "Flexible";

  const habitStats = habits.map((h) => {
    const completedDays = h.logs.filter((l) => l.status === "COMPLETED").length;
    const targetDays = JSON.parse(h.targetDays).length;
    const expectedDays = Math.min(targetDays, 7);
    return {
      name: h.name,
      category: h.category,
      completedDays,
      expectedDays,
      rate: expectedDays > 0 ? Math.round((completedDays / expectedDays) * 100) : 0,
    };
  });

  let context = `PRODUCTIVITY OVERVIEW:
- Total tasks: ${tasks.length} (${completedTasks.length} completed, ${pendingTasks.length} pending)
- High priority pending: ${highPriorityTasks.length}
- Weekly completion rate: ${successRate}%
- Productivity type: ${personality}
- Morning completions: ${morningCompletions}, Evening: ${eveningCompletions}
`;

  if (pendingTasks.length > 0) {
    const topTasks = pendingTasks.slice(0, 5);
    context += `\nPENDING TASKS (${pendingTasks.length} total):
${topTasks.map((t) => `- ${t.title} [${t.priority}]`).join("\n")}`;
  }

  if (highPriorityTasks.length > 0) {
    context += `\nURGENT TASKS:
${highPriorityTasks.map((t) => `- ${t.title}`).join("\n")}`;
  }

  if (habitStats.length > 0) {
    context += `\nHABITS (last 7 days):
${habitStats.map((h) => `- ${h.name} (${h.category}): ${h.completedDays}/${h.expectedDays} days (${h.rate}%)`).join("\n")}`;
  }

  return context;
}
