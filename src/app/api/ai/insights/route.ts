import { NextResponse } from "next/server";
import { getUser } from "@/lib/server-data";
import { prisma } from "@/lib/prisma";

export type AISuggestions = {
  personality: "morning_person" | "night_owl" | "flexible";
  deepWorkSlots: string[];
  shallowSlots: string[];
  insight: string;
  stats: {
    totalCompleted: number;
    successRate: number;
    avgDelayMinutes: number;
    morningCompletions: number;
    eveningCompletions: number;
  };
};

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const completionLogs = await prisma.taskCompletionLog.findMany({
    where: {
      userId: user.id,
      actualCompletionTime: { gte: weekAgo },
    },
    orderBy: { actualCompletionTime: "desc" },
  });

  const totalCompleted = completionLogs.length;
  const onTime = completionLogs.filter(
    (log) => !log.completionDelayMinutes || log.completionDelayMinutes <= 15
  ).length;
  const successRate = totalCompleted > 0 ? Math.round((onTime / totalCompleted) * 100) : 100;

  const avgDelayMinutes =
    completionLogs.length > 0
      ? Math.round(
          completionLogs.reduce((sum, log) => sum + (log.completionDelayMinutes || 0), 0) /
            completionLogs.length
        )
      : 0;

  const morningCompletions = completionLogs.filter(
    (log) => log.completionHour && log.completionHour >= 6 && log.completionHour < 12
  ).length;
  const eveningCompletions = completionLogs.filter(
    (log) => log.completionHour && log.completionHour >= 18 && log.completionHour < 24
  ).length;

  let personality: "morning_person" | "night_owl" | "flexible" = "flexible";
  if (morningCompletions > eveningCompletions * 1.5) {
    personality = "morning_person";
  } else if (eveningCompletions > morningCompletions * 1.5) {
    personality = "night_owl";
  }

  const stats = {
    totalCompleted,
    successRate,
    avgDelayMinutes,
    morningCompletions,
    eveningCompletions,
  };

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    const fallback = generateFallbackSuggestions(personality, completionLogs, stats);
    return NextResponse.json({ ...fallback, stats });
  }

  try {
    const completionHours = completionLogs.map((log) => log.completionHour || 10);
    const suggestions = await getAISuggestionsFromGemini(personality, completionHours, stats, apiKey);
    return NextResponse.json({ ...suggestions, stats });
  } catch (error) {
    console.error("Gemini API error:", error);
    const fallback = generateFallbackSuggestions(personality, completionLogs, stats);
    return NextResponse.json({ ...fallback, stats });
  }
}

async function getAISuggestionsFromGemini(
  personality: "morning_person" | "night_owl" | "flexible",
  completionHours: number[],
  stats: AISuggestions["stats"],
  apiKey: string
): Promise<Omit<AISuggestions, "stats">> {
  const hourCounts: Record<number, number> = {};
  completionHours.forEach((h) => {
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const peakHour = Number(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 10);

  const prompt = `You are a Productivity Specialist AI analyzing a user's work patterns.

USER DATA (Last 7 Days):
- Productivity Type: ${personality.replace("_", " ")}
- Peak Hour: ${peakHour}:00
- Total Tasks Completed: ${stats.totalCompleted}
- Success Rate (on time): ${stats.successRate}%
- Average Delay: ${stats.avgDelayMinutes} minutes
- Morning Completions (6am-12pm): ${stats.morningCompletions}
- Evening Completions (6pm-12am): ${stats.eveningCompletions}

Analyze this data and provide:
1. Optimal "deep work" time slots for creative/complex tasks
2. Optimal "shallow work" time slots for admin/simple tasks
3. One brief, personalized motivational insight (no clichés)

Return ONLY valid JSON in this exact format:
{
  "personality": "morning_person" or "night_owl" or "flexible",
  "deepWorkSlots": ["HH:MM-HH:MM", "HH:MM-HH:MM"],
  "shallowSlots": ["HH:MM-HH:MM", "HH:MM-HH:MM"],
  "insight": "Your personalized insight here (max 100 chars, no generic motivation quotes)"
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("No response from Gemini");
  }

  const cleaned = content.replace(/```json\n?|```\n?/g, "").trim();
  const parsed = JSON.parse(cleaned);

  return {
    personality: parsed.personality || personality,
    deepWorkSlots: parsed.deepWorkSlots || ["09:00-11:30", "14:00-16:00"],
    shallowSlots: parsed.shallowSlots || ["11:30-12:30", "16:00-17:00"],
    insight: parsed.insight || "Keep up the great work!",
  };
}

function generateFallbackSuggestions(
  personality: "morning_person" | "night_owl" | "flexible",
  completionLogs: { completionHour: number | null }[],
  stats: AISuggestions["stats"]
): Omit<AISuggestions, "stats"> {
  const deepWorkSlots: Record<string, string[]> = {
    morning_person: ["09:00-11:30", "14:00-16:00"],
    night_owl: ["10:00-13:00", "16:00-20:00"],
    flexible: ["09:00-12:00", "14:00-17:00"],
  };

  const shallowSlots: Record<string, string[]> = {
    morning_person: ["11:30-12:30", "16:00-17:00"],
    night_owl: ["13:00-14:00", "20:00-21:00"],
    flexible: ["12:00-13:00", "17:00-18:00"],
  };

  const insights: Record<string, string[]> = {
    morning_person: [
      "Your morning energy is your superpower. Tackle your hardest tasks before noon.",
      "You're most focused early. Use that window for deep work, then handle admin later.",
    ],
    night_owl: [
      "Your evening hours pack the most punch. Schedule demanding work when others sleep.",
      "You thrive when it's quiet. Use late hours for your best creative output.",
    ],
    flexible: [
      "You adapt well. Mix up your schedule to keep things fresh.",
      "Your versatility is a strength. Vary your task types throughout the day.",
    ],
  };

  const hourCounts: Record<number, number> = {};
  completionLogs.forEach((log) => {
    if (log.completionHour !== null) {
      hourCounts[log.completionHour] = (hourCounts[log.completionHour] || 0) + 1;
    }
  });
  const peakHour = Number(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 10);

  const insight = insights[personality][Math.floor(Math.random() * insights[personality].length)];

  return {
    personality,
    deepWorkSlots: deepWorkSlots[personality],
    shallowSlots: shallowSlots[personality],
    insight: `Peak at ${peakHour}:00 - ${insight}`,
  };
}
