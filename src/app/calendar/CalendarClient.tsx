"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input, Textarea } from "@/components/ui";
import { Select } from "@/components/ui";
import { Modal } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Plus, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { clsx } from "clsx";
import { format, addDays, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { getCategoryColor } from "@/lib/data";

type TimeBlock = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  taskId: string | null;
};

interface CalendarClientProps {
  userId: string;
  initialTimeBlocks: TimeBlock[];
}

const hours = Array.from({ length: 17 }, (_, i) => i + 6);
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarClient({ userId, initialTimeBlocks }: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(initialTimeBlocks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; hour: number } | null>(null);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "OTHER",
    startTime: "",
    endTime: "",
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getBlocksForDay = (day: Date) => {
    return timeBlocks.filter((block) => {
      const blockDate = new Date(block.startTime);
      return blockDate.toDateString() === day.toDateString();
    });
  };

  const getBlockPosition = (block: TimeBlock) => {
    const start = new Date(block.startTime);
    const end = new Date(block.endTime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = (startHour - 6) * 60;
    const height = (endHour - startHour) * 60;
    return { top, height };
  };

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleSlotClick = (day: number, hour: number) => {
    const date = weekDays[day];
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(hour + 1, 0, 0, 0);

    setSelectedSlot({ day, hour });
    setEditingBlock(null);
    setFormData({
      title: "",
      description: "",
      category: "OTHER",
      startTime: format(startTime, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(endTime, "yyyy-MM-dd'T'HH:mm"),
    });
    setIsModalOpen(true);
  };

  const handleBlockClick = (block: TimeBlock, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBlock(block);
    setSelectedSlot(null);
    setFormData({
      title: block.title,
      description: block.description || "",
      category: block.category,
      startTime: format(new Date(block.startTime), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(new Date(block.endTime), "yyyy-MM-dd'T'HH:mm"),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    try {
      const response = editingBlock
        ? await fetch("/api/timeblocks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: editingBlock.id,
              title: formData.title,
              description: formData.description || undefined,
              category: formData.category,
              startTime: new Date(formData.startTime),
              endTime: new Date(formData.endTime),
            }),
          })
        : await fetch("/api/timeblocks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              title: formData.title,
              description: formData.description || undefined,
              category: formData.category,
              startTime: new Date(formData.startTime),
              endTime: new Date(formData.endTime),
            }),
          });

      if (response.ok) {
        const updatedBlock = await response.json();
        if (editingBlock) {
          setTimeBlocks(timeBlocks.map((b) => (b.id === editingBlock.id ? updatedBlock : b)));
        } else {
          setTimeBlocks([...timeBlocks, updatedBlock]);
        }
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to save time block:", error);
    }
  };

  const handleDelete = async () => {
    if (!editingBlock) return;
    if (!confirm("Are you sure you want to delete this time block?")) return;

    try {
      const response = await fetch(`/api/timeblocks?id=${editingBlock.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTimeBlocks(timeBlocks.filter((b) => b.id !== editingBlock.id));
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to delete time block:", error);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <PageContainer
      title="Calendar"
      description="Weekly schedule and time blocking"
      action={
        <Button onClick={() => handleSlotClick(0, 9)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Time Block
        </Button>
      }
    >
      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePrevWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {format(weekStart, "MMMM d")} - {format(addDays(weekStart, 6), "MMMM d, yyyy")}
          </h2>
          <div className="w-32" />
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-8 border-b border-border">
              <div className="p-3 text-center text-sm font-medium text-foreground-muted border-r border-border" />
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className={clsx(
                    "p-3 text-center border-r border-border last:border-r-0",
                    isToday(day) && "bg-primary/5"
                  )}
                >
                  <div className="text-sm font-medium text-foreground">{days[index]}</div>
                  <div
                    className={clsx(
                      "text-2xl font-bold",
                      isToday(day) ? "text-primary" : "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-border/50">
                  <div className="p-2 text-xs text-foreground-muted text-right pr-3 border-r border-border/50">
                    {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                  </div>
                  {weekDays.map((_, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="h-14 border-r border-border/50 last:border-r-0 hover:bg-background-tertiary/50 cursor-pointer transition-colors"
                      onClick={() => handleSlotClick(dayIndex, hour)}
                    />
                  ))}
                </div>
              ))}

              {timeBlocks.map((block) => {
                const dayIndex = weekDays.findIndex(
                  (d) => d.toDateString() === new Date(block.startTime).toDateString()
                );
                if (dayIndex === -1) return null;
                const { top, height } = getBlockPosition(block);
                const hour = new Date(block.startTime).getHours();

                return (
                  <div
                    key={block.id}
                    className="absolute left-[12.5%] right-0 rounded-lg p-2 cursor-pointer overflow-hidden hover:opacity-90 transition-opacity"
                    style={{
                      top: `${top + 48}px`,
                      height: `${height}px`,
                      marginLeft: `${(dayIndex + 1) * 12.5}%`,
                      width: "12.5%",
                      backgroundColor: getCategoryColor(block.category) + "20",
                      borderLeft: `3px solid ${getCategoryColor(block.category)}`,
                    }}
                    onClick={(e) => handleBlockClick(block, e)}
                  >
                    <div className="text-sm font-medium text-foreground truncate">
                      {block.title}
                    </div>
                    {height > 40 && (
                      <div className="text-xs text-foreground-muted">
                        {format(new Date(block.startTime), "h:mm a")} -{" "}
                        {format(new Date(block.endTime), "h:mm a")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBlock ? "Edit Time Block" : "Create Time Block"}
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter title"
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter description"
          />
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: "WORK", label: "Work" },
              { value: "STUDY", label: "Study" },
              { value: "HEALTH", label: "Health" },
              { value: "PERSONAL", label: "Personal" },
              { value: "SOCIAL", label: "Social" },
              { value: "OTHER", label: "Other" },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
            <Input
              label="End Time"
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
          <div className="flex justify-between pt-4">
            {editingBlock && (
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingBlock ? "Save Changes" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
