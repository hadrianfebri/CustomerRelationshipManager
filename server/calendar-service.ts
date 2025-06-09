import type { Contact } from '@shared/schema';
import { emailService } from './email-service';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  contactId?: number;
  meetingType: 'call' | 'video' | 'in-person' | 'demo' | 'follow-up';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  reminderSent: boolean;
  meetingLink?: string;
  location?: string;
  attendees: {
    email: string;
    name: string;
    status: 'pending' | 'accepted' | 'declined';
  }[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface CalendarSettings {
  workingHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
  workingDays: number[]; // [1,2,3,4,5] for Mon-Fri
  timeZone: string;
  defaultMeetingDuration: number; // minutes
  bufferTime: number; // minutes between meetings
  advanceBookingDays: number; // how many days in advance can be booked
}

class CalendarService {
  private events: CalendarEvent[] = [];
  private settings: CalendarSettings = {
    workingHours: { start: "09:00", end: "17:00" },
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    timeZone: "UTC",
    defaultMeetingDuration: 30,
    bufferTime: 15,
    advanceBookingDays: 30
  };

  async scheduleFollowUpMeeting(params: {
    contactId: number;
    contact: Contact;
    proposedTimes: Date[];
    meetingType: CalendarEvent['meetingType'];
    duration?: number;
    description?: string;
    createdBy: string;
  }): Promise<{ success: boolean; eventId?: string; message: string }> {
    try {
      // Find the first available time slot
      const availableTime = await this.findAvailableTimeSlot(
        params.proposedTimes,
        params.duration || this.settings.defaultMeetingDuration
      );

      if (!availableTime) {
        return {
          success: false,
          message: "No available time slots found in the proposed times"
        };
      }

      const event: CalendarEvent = {
        id: this.generateEventId(),
        title: `${params.meetingType} with ${params.contact.firstName} ${params.contact.lastName}`,
        description: params.description || `${params.meetingType} meeting with ${params.contact.company}`,
        startTime: availableTime.start,
        endTime: availableTime.end,
        contactId: params.contactId,
        meetingType: params.meetingType,
        status: 'scheduled',
        reminderSent: false,
        meetingLink: params.meetingType === 'video' ? this.generateMeetingLink() : undefined,
        attendees: [
          {
            email: params.contact.email,
            name: `${params.contact.firstName} ${params.contact.lastName}`,
            status: 'pending'
          }
        ],
        createdBy: params.createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.events.push(event);

      // Send meeting invitation email
      await this.sendMeetingInvitation(event, params.contact);

      return {
        success: true,
        eventId: event.id,
        message: `Meeting scheduled for ${availableTime.start.toLocaleString()}`
      };
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      return {
        success: false,
        message: "Failed to schedule meeting"
      };
    }
  }

  async getAvailableTimeSlots(
    startDate: Date,
    endDate: Date,
    duration: number = this.settings.defaultMeetingDuration
  ): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      // Check if it's a working day
      if (this.settings.workingDays.includes(current.getDay())) {
        const daySlots = this.generateDayTimeSlots(current, duration);
        slots.push(...daySlots);
      }
      current.setDate(current.getDate() + 1);
    }

    return slots;
  }

  private generateDayTimeSlots(date: Date, duration: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const workStart = this.parseTime(this.settings.workingHours.start);
    const workEnd = this.parseTime(this.settings.workingHours.end);

    const currentSlot = new Date(date);
    currentSlot.setHours(workStart.hours, workStart.minutes, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(workEnd.hours, workEnd.minutes, 0, 0);

    while (currentSlot.getTime() + (duration * 60 * 1000) <= endOfDay.getTime()) {
      const slotEnd = new Date(currentSlot.getTime() + (duration * 60 * 1000));
      
      const isAvailable = !this.isTimeSlotBooked(currentSlot, slotEnd);
      
      slots.push({
        start: new Date(currentSlot),
        end: new Date(slotEnd),
        available: isAvailable
      });

      // Move to next slot (including buffer time)
      currentSlot.setTime(currentSlot.getTime() + ((duration + this.settings.bufferTime) * 60 * 1000));
    }

    return slots;
  }

  private async findAvailableTimeSlot(
    proposedTimes: Date[],
    duration: number
  ): Promise<{ start: Date; end: Date } | null> {
    for (const time of proposedTimes) {
      const endTime = new Date(time.getTime() + (duration * 60 * 1000));
      
      if (!this.isTimeSlotBooked(time, endTime)) {
        return { start: time, end: endTime };
      }
    }
    return null;
  }

  private isTimeSlotBooked(start: Date, end: Date): boolean {
    return this.events.some(event => {
      if (event.status === 'cancelled') return false;
      
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      // Check for overlap
      return (start < eventEnd && end > eventStart);
    });
  }

  private async sendMeetingInvitation(event: CalendarEvent, contact: Contact): Promise<void> {
    const meetingTypeText = event.meetingType.charAt(0).toUpperCase() + event.meetingType.slice(1);
    const formattedDate = event.startTime.toLocaleDateString();
    const formattedTime = event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let meetingDetails = '';
    if (event.meetingLink) {
      meetingDetails = `\n\n📹 <strong>Meeting Link:</strong> <a href="${event.meetingLink}">${event.meetingLink}</a>`;
    } else if (event.location) {
      meetingDetails = `\n\n📍 <strong>Location:</strong> ${event.location}`;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">📅 Meeting Invitation</h1>
        </div>
        
        <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${contact.firstName},</h2>
          
          <p>You have been invited to a ${meetingTypeText.toLowerCase()} meeting.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">📋 Meeting Details</h3>
            <p><strong>Title:</strong> ${event.title}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Duration:</strong> ${Math.round((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60))} minutes</p>
            ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
            ${meetingDetails}
          </div>
          
          <div style="margin: 30px 0;">
            <p>Please confirm your attendance by replying to this email.</p>
            <p>If you need to reschedule, please let us know as soon as possible.</p>
          </div>
          
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;"><strong>💡 Tip:</strong> Add this meeting to your calendar to receive reminders.</p>
          </div>
          
          <p>Looking forward to our conversation!</p>
          
          <p>Best regards,<br>
          <strong>Your CRM Team</strong></p>
        </div>
      </div>
    `;

    await emailService.sendSingleEmail({
      to: contact.email,
      toName: `${contact.firstName} ${contact.lastName}`,
      subject: `Meeting Invitation: ${event.title}`,
      htmlContent
    });
  }

  async sendMeetingReminder(eventId: string): Promise<boolean> {
    const event = this.events.find(e => e.id === eventId);
    if (!event || event.reminderSent) return false;

    const contact = event.attendees[0]; // Assuming single attendee for now
    const meetingTime = event.startTime.toLocaleString();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⏰ Meeting Reminder</h1>
        </div>
        
        <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">Hi there!</h2>
          
          <p>This is a friendly reminder about your upcoming meeting:</p>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #92400e;">📅 ${event.title}</h3>
            <p><strong>When:</strong> ${meetingTime}</p>
            ${event.meetingLink ? `<p><strong>Join Link:</strong> <a href="${event.meetingLink}" style="color: #2563eb;">${event.meetingLink}</a></p>` : ''}
            ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
          </div>
          
          <p>We're looking forward to connecting with you!</p>
          
          <p>Best regards,<br>
          <strong>Your CRM Team</strong></p>
        </div>
      </div>
    `;

    const success = await emailService.sendSingleEmail({
      to: contact.email,
      toName: contact.name,
      subject: `Reminder: ${event.title} coming up soon`,
      htmlContent
    });

    if (success) {
      event.reminderSent = true;
      event.updatedAt = new Date();
    }

    return success;
  }

  async getUpcomingMeetings(days: number = 7): Promise<CalendarEvent[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

    return this.events.filter(event => 
      event.startTime >= now && 
      event.startTime <= futureDate &&
      event.status !== 'cancelled'
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async updateMeetingStatus(eventId: string, status: CalendarEvent['status']): Promise<boolean> {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return false;

    event.status = status;
    event.updatedAt = new Date();
    return true;
  }

  private generateEventId(): string {
    return `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMeetingLink(): string {
    // In a real implementation, this would integrate with Zoom/Teams/Meet APIs
    const roomId = Math.random().toString(36).substr(2, 10);
    return `https://meet.yourcrm.com/room/${roomId}`;
  }

  private parseTime(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }

  // Auto-schedule follow-ups based on AI recommendations
  async autoScheduleFollowUp(contact: Contact, urgency: 'high' | 'medium' | 'low'): Promise<string | null> {
    const now = new Date();
    let proposedTimes: Date[] = [];

    // Generate proposed times based on urgency
    switch (urgency) {
      case 'high':
        // Next 3 business days
        for (let i = 1; i <= 3; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() + i);
          if (this.settings.workingDays.includes(date.getDay())) {
            date.setHours(10, 0, 0, 0); // 10 AM
            proposedTimes.push(new Date(date));
            date.setHours(14, 0, 0, 0); // 2 PM
            proposedTimes.push(new Date(date));
          }
        }
        break;
      case 'medium':
        // Next week
        for (let i = 7; i <= 10; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() + i);
          if (this.settings.workingDays.includes(date.getDay())) {
            date.setHours(11, 0, 0, 0);
            proposedTimes.push(new Date(date));
          }
        }
        break;
      case 'low':
        // Next 2 weeks
        for (let i = 14; i <= 21; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() + i);
          if (this.settings.workingDays.includes(date.getDay())) {
            date.setHours(15, 0, 0, 0);
            proposedTimes.push(new Date(date));
          }
        }
        break;
    }

    const result = await this.scheduleFollowUpMeeting({
      contactId: contact.id,
      contact,
      proposedTimes,
      meetingType: 'follow-up',
      description: `Follow-up meeting with ${contact.firstName} from ${contact.company}`,
      createdBy: 'system'
    });

    return result.success ? result.eventId! : null;
  }
}

export const calendarService = new CalendarService();