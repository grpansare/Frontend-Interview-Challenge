/**
 * DayView Component
 *
 * Displays appointments for a single day in a timeline format.
 *
 * TODO for candidates:
 * 1. Generate time slots (8 AM - 6 PM, 30-minute intervals)
 * 2. Position appointments in their correct time slots
 * 3. Handle appointments that span multiple slots
 * 4. Display appointment details (patient, type, duration)
 * 5. Color-code appointments by type
 * 6. Handle overlapping appointments gracefully
 */

'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, CalendarX } from 'lucide-react';
import type { Appointment, Doctor, TimeSlot, PopulatedAppointment, AppointmentType } from '@/types';
import { APPOINTMENT_TYPE_CONFIG, DEFAULT_CALENDAR_CONFIG } from '@/types';
import { appointmentService } from '@/services/appointmentService';

interface DayViewProps {
  appointments: Appointment[];
  doctor: Doctor | undefined;
  date: Date;
}

/**
 * AppointmentCard Component
 */
interface AppointmentCardProps {
  appointment: PopulatedAppointment;
  duration: number; // in minutes
}

function AppointmentCard({ appointment, duration }: AppointmentCardProps) {
  const typeConfig = APPOINTMENT_TYPE_CONFIG[appointment.type as AppointmentType];
  const startTime = format(new Date(appointment.startTime), 'h:mm a');
  
  return (
    <div
      className="appointment-card"
      style={{
        backgroundColor: `${typeConfig.color}f0`,
        borderLeftColor: typeConfig.color,
        background: `linear-gradient(135deg, ${typeConfig.color}f0 0%, ${typeConfig.color}e0 100%)`,
      }}
    >
      <div className="appointment-header">
        <div className="appointment-patient">
          {appointment.patient.name}
        </div>
        <div className="appointment-duration">
          {duration}m
        </div>
      </div>
      
      <div className="appointment-type">
        <div className="appointment-dot"></div>
        <span>{typeConfig.label}</span>
      </div>
      
      <div className="appointment-time">
        <Clock style={{ width: '0.75rem', height: '0.75rem' }} />
        <span>{startTime}</span>
      </div>
    </div>
  );
}

/**
 * DayView Component
 *
 * Renders a daily timeline view with appointments.
 */
export function DayView({ appointments, doctor, date }: DayViewProps) {
  /**
   * Generate time slots from 8 AM to 6 PM with 30-minute intervals
   */
  const timeSlots = useMemo((): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const { startHour, endHour, slotDuration } = DEFAULT_CALENDAR_CONFIG;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const start = new Date(date);
        start.setHours(hour, minute, 0, 0);
        
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + slotDuration);
        
        const label = format(start, 'h:mm a');
        
        slots.push({ start, end, label });
      }
    }
    
    return slots;
  }, [date]);

  /**
   * Get populated appointments with patient and doctor data
   */
  const populatedAppointments = useMemo(() => {
    return appointmentService.getPopulatedAppointments(appointments);
  }, [appointments]);

  /**
   * Find appointments that start in a specific time slot
   */
  function getAppointmentsForSlot(slot: TimeSlot): PopulatedAppointment[] {
    return populatedAppointments.filter((appointment) => {
      const appointmentStart = new Date(appointment.startTime);
      return appointmentStart >= slot.start && appointmentStart < slot.end;
    });
  }

  /**
   * Calculate appointment duration in minutes
   */
  function getAppointmentDuration(appointment: Appointment): number {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  /**
   * Calculate how many slots an appointment spans
   */
  function getAppointmentSlotSpan(appointment: Appointment): number {
    const duration = getAppointmentDuration(appointment);
    return Math.ceil(duration / DEFAULT_CALENDAR_CONFIG.slotDuration);
  }

  /**
   * Calculate the exact position within a time slot for an appointment
   */
  function getAppointmentPosition(appointment: Appointment, slot: TimeSlot): { top: number; height: number } {
    const appointmentStart = new Date(appointment.startTime);
    const appointmentEnd = new Date(appointment.endTime);
    const slotDurationMs = DEFAULT_CALENDAR_CONFIG.slotDuration * 60 * 1000;
    const slotHeight = 70; // Height of each slot in pixels
    
    // Calculate minutes from slot start
    const minutesFromSlotStart = (appointmentStart.getTime() - slot.start.getTime()) / (1000 * 60);
    const appointmentDurationMinutes = (appointmentEnd.getTime() - appointmentStart.getTime()) / (1000 * 60);
    
    // Calculate position within the slot
    const top = (minutesFromSlotStart / DEFAULT_CALENDAR_CONFIG.slotDuration) * slotHeight;
    const height = Math.min(
      (appointmentDurationMinutes / DEFAULT_CALENDAR_CONFIG.slotDuration) * slotHeight,
      slotHeight - top - 4 // Leave some margin and prevent overflow
    );
    
    return { top: Math.max(0, top), height: Math.max(20, height) }; // Minimum height for readability
  }

  return (
    <div className="day-view" role="main" aria-label={`Daily schedule for ${format(date, 'EEEE, MMMM d, yyyy')}`}>
      {/* Day header */}
      <header className="day-header">
        <div className="day-header-content">
          <div className="day-icon" aria-hidden="true">
            <Calendar style={{ width: '1rem', height: '1rem', color: 'white' }} />
          </div>
          <h1 className="day-title">
            {format(date, 'EEEE, MMMM d, yyyy')}
          </h1>
        </div>
        {doctor && (
          <div className="day-doctor-info" role="banner" aria-label="Doctor information">
            <div className="status-dot" aria-hidden="true"></div>
            <span style={{ fontWeight: '500' }}>Dr. {doctor.name}</span>
            <span aria-hidden="true">•</span>
            <span>{doctor.specialty}</span>
          </div>
        )}
      </header>

      {/* Timeline grid */}
      <div className="timeline-grid" role="grid" aria-label="Daily appointment schedule">
        {timeSlots.map((slot, index) => {
          const slotAppointments = getAppointmentsForSlot(slot);
          const isCurrentHour = new Date().getHours() === slot.start.getHours();
          
          return (
            <div key={index} className={`timeline-row ${isCurrentHour ? 'current-hour' : ''}`} role="row" aria-label={`Time slot ${slot.label}`}>
              <div className={`time-slot ${isCurrentHour ? 'current-hour' : ''}`} role="rowheader" aria-label={`Time ${slot.label}`}>
                <div className="time-content">
                  <div className={`time-hour ${isCurrentHour ? 'current' : ''}`}>
                    {format(slot.start, 'h:mm')}
                  </div>
                  <div className={`time-period ${isCurrentHour ? 'current' : ''}`}>
                    {format(slot.start, 'a')}
                  </div>
                </div>
              </div>
              <div className="appointment-slot" role="gridcell" aria-label={`${slotAppointments.length} appointment${slotAppointments.length !== 1 ? 's' : ''} at ${slot.label}`}>
                {slotAppointments.map((appointment, appointmentIndex) => {
                  const duration = getAppointmentDuration(appointment);
                  
                  return (
                    <div
                      key={appointment.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Appointment: ${appointment.patient.name}, ${APPOINTMENT_TYPE_CONFIG[appointment.type as AppointmentType].label}, ${duration} minutes, ${format(new Date(appointment.startTime), 'h:mm a')}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          // Handle appointment selection
                          e.preventDefault();
                        }
                      }}
                    >
                      <AppointmentCard 
                        appointment={appointment} 
                        duration={duration}
                      />
                    </div>
                  );
                })}
                
                {/* Current time indicator */}
                {isCurrentHour && (
                  <div 
                    className="current-time-line" 
                    style={{ top: `${(new Date().getMinutes() / 60) * 70}px` }}
                  >
                    <div className="current-time-dot"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {appointments.length === 0 && (
        <div className="mt-8 text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarX className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No appointments today</h4>
          <p className="text-gray-500 max-w-sm mx-auto">
            There are no appointments scheduled for {format(date, 'MMMM d, yyyy')}.
          </p>
        </div>
      )}
    </div>
  );
}
