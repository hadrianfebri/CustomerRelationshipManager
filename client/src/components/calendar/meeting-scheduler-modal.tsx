import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Video, Phone, MapPin, Loader2, CheckCircle } from "lucide-react";
import { z } from "zod";
import type { Contact } from "@shared/schema";
import { format, addDays, startOfDay } from "date-fns";

const meetingSchema = z.object({
  meetingType: z.enum(["call", "video", "in-person", "demo", "follow-up"]),
  duration: z.number().min(15).max(180),
  description: z.string().optional(),
  preferredDates: z.array(z.string()).min(1, "Select at least one preferred date"),
  preferredTimes: z.array(z.string()).min(1, "Select at least one preferred time"),
  urgency: z.enum(["high", "medium", "low"]),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface MeetingSchedulerModalProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MeetingSchedulerModal({ 
  contact, 
  open, 
  onOpenChange 
}: MeetingSchedulerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      meetingType: "follow-up",
      duration: 30,
      description: "",
      preferredDates: [],
      preferredTimes: [],
      urgency: "medium",
    },
  });

  // Generate available time slots
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  // Generate next 14 business days
  const generateBusinessDays = () => {
    const days = [];
    let current = addDays(new Date(), 1); // Start tomorrow
    let added = 0;
    
    while (added < 14) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
        days.push({
          date: format(current, 'yyyy-MM-dd'),
          label: format(current, 'EEE, MMM d')
        });
        added++;
      }
      current = addDays(current, 1);
    }
    return days;
  };

  const businessDays = generateBusinessDays();

  const scheduleMeetingMutation = useMutation({
    mutationFn: async (data: MeetingFormData) => {
      if (!contact) throw new Error("Contact is required");
      
      // Convert selected dates and times to proposed time slots
      const proposedTimes: string[] = [];
      data.preferredDates.forEach(date => {
        data.preferredTimes.forEach(time => {
          proposedTimes.push(`${date}T${time}:00.000Z`);
        });
      });

      return await apiRequest("POST", "/api/calendar/schedule-meeting", {
        contactId: contact.id,
        proposedTimes,
        meetingType: data.meetingType,
        duration: data.duration,
        description: data.description || `${data.meetingType} meeting with ${contact.firstName} ${contact.lastName}`
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/upcoming-meetings"] });
      
      toast({
        title: "Meeting scheduled successfully",
        description: response.message || `Meeting scheduled with ${contact?.firstName} ${contact?.lastName}`,
      });
      onOpenChange(false);
      form.reset();
      setSelectedDates([]);
      setSelectedTimes([]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to schedule meeting",
        description: error.message || "Please try again with different time slots",
        variant: "destructive",
      });
    },
  });

  const autoScheduleMutation = useMutation({
    mutationFn: async (urgency: "high" | "medium" | "low") => {
      if (!contact) throw new Error("Contact is required");
      
      return await apiRequest("POST", "/api/calendar/auto-schedule-follow-up", {
        contactId: contact.id,
        urgency
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/upcoming-meetings"] });
      
      toast({
        title: "Meeting auto-scheduled",
        description: response.message || "Follow-up meeting has been automatically scheduled",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Auto-scheduling failed",
        description: error.message || "No available slots found for auto-scheduling",
        variant: "destructive",
      });
    },
  });

  const handleDateToggle = (date: string) => {
    const newDates = selectedDates.includes(date)
      ? selectedDates.filter(d => d !== date)
      : [...selectedDates, date];
    
    setSelectedDates(newDates);
    form.setValue("preferredDates", newDates);
  };

  const handleTimeToggle = (time: string) => {
    const newTimes = selectedTimes.includes(time)
      ? selectedTimes.filter(t => t !== time)
      : [...selectedTimes, time];
    
    setSelectedTimes(newTimes);
    form.setValue("preferredTimes", newTimes);
  };

  const onSubmit = (data: MeetingFormData) => {
    scheduleMeetingMutation.mutate(data);
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4" />;
      case "call": return <Phone className="w-4 h-4" />;
      case "in-person": return <MapPin className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getMeetingTypeDescription = (type: string) => {
    switch (type) {
      case "video": return "Online video conference";
      case "call": return "Phone call";
      case "in-person": return "Face-to-face meeting";
      case "demo": return "Product demonstration";
      case "follow-up": return "Follow-up conversation";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Meeting with {contact?.firstName} {contact?.lastName}
          </DialogTitle>
          <DialogDescription>
            Schedule a meeting and send an automatic calendar invitation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Auto-Schedule Option */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Quick Schedule</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Let our system automatically find the best available time slot
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => autoScheduleMutation.mutate("high")}
                disabled={autoScheduleMutation.isPending}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                High Priority (1-3 days)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => autoScheduleMutation.mutate("medium")}
                disabled={autoScheduleMutation.isPending}
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                Medium Priority (1 week)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => autoScheduleMutation.mutate("low")}
                disabled={autoScheduleMutation.isPending}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                Low Priority (2 weeks)
              </Button>
            </div>
            {autoScheduleMutation.isPending && (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Finding available slot...</span>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or schedule manually</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="meetingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select meeting type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="follow-up">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Follow-up
                            </div>
                          </SelectItem>
                          <SelectItem value="demo">
                            <div className="flex items-center gap-2">
                              <Video className="w-4 h-4" />
                              Demo
                            </div>
                          </SelectItem>
                          <SelectItem value="video">
                            <div className="flex items-center gap-2">
                              <Video className="w-4 h-4" />
                              Video Call
                            </div>
                          </SelectItem>
                          <SelectItem value="call">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Phone Call
                            </div>
                          </SelectItem>
                          <SelectItem value="in-person">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              In-Person
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {getMeetingTypeDescription(field.value)}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter meeting agenda or additional details..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Selection */}
              <div className="space-y-3">
                <FormLabel>Preferred Dates</FormLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {businessDays.map((day) => (
                    <Button
                      key={day.date}
                      type="button"
                      variant={selectedDates.includes(day.date) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDateToggle(day.date)}
                      className="text-xs"
                    >
                      {selectedDates.includes(day.date) && (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      )}
                      {day.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedDates.length} date(s) selected
                </p>
              </div>

              {/* Time Selection */}
              <div className="space-y-3">
                <FormLabel>Preferred Times</FormLabel>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant={selectedTimes.includes(time) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeToggle(time)}
                      className="text-xs"
                    >
                      {selectedTimes.includes(time) && (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      )}
                      {time}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedTimes.length} time(s) selected
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={scheduleMeetingMutation.isPending || selectedDates.length === 0 || selectedTimes.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {scheduleMeetingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Meeting
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}