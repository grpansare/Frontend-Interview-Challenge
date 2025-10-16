/**
 * WeekView Component
 *
 * Displays appointments for a week (Monday - Sunday) in a grid format.
 *
 * TODO for candidates:
 * 1. Generate a 7-day grid (Monday through Sunday)
 * 2. Generate time slots for each day
 * 3. Position appointments in the correct day and time
 * 4. Make it responsive (may need horizontal scroll on mobile)
 * 5. Color-code appointments by type
 * 6. Handle overlapping appointments
 */

'use client';

import { useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { Grid3X3, Clock, CalendarX } from 'lucide-react';
import type { Appointment, Doctor, TimeSlot, PopulatedAppointment, AppointmentType } from '@/types';
import { APPOINTMENT_TYPE_CONFIG, DEFAULT_CALENDAR_CONFIG } from '@/types';
import { appointmentService } from '@/services/appointmentService';

interface WeekViewProps {
  appointments: Appointment[];
  doctor: Doctor | undefined;
  weekStartDate: Date; // Should be a Monday
}

/**
 * Compact AppointmentCard for week view
 */
interface CompactAppointmentCardProps {
  appointment: PopulatedAppointment;
}

function CompactAppointmentCard({ appointment }: CompactAppointmentCardProps) {
  const typeConfig = APPOINTMENT_TYPE_CONFIG[appointment.type as AppointmentType];
  const startTime = format(new Date(appointment.startTime), 'h:mm');
  
  return (
    <div
      className="text-xs p-2 mb-1.5 rounded-lg text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 group backdrop-blur-sm"
      style={{ 
        backgroundColor: `${typeConfig.color}f0`,
        background: `linear-gradient(135deg, ${typeConfig.color}f0 0%, ${typeConfig.color}e0 100%)`,
      }}
      title={`${appointment.patient.name} - ${typeConfig.label} at ${startTime}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="font-semibold truncate flex-1 group-hover:scale-105 transition-transform">
          {appointment.patient.name}
        </div>
        <div className="w-2 h-2 bg-white rounded-full opacity-70 ml-1 flex-shrink-0"></div>
      </div>
      <div className="flex items-center gap-1 opacity-90">
        <Clock className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{startTime}</span>
      </div>
    </div>
  );
}

/**
 * WeekView Component
 *
 * Renders a weekly calendar grid with appointments.
 */
export function WeekView({ appointments, doctor, weekStartDate }: WeekViewProps) {
  /**
   * Generate array of 7 dates (Monday through Sunday)
   */
  const weekDays = useMemo((): Date[] => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStartDate, i));
    }
    return days;
  }, [weekStartDate]);

  /**
   * Generate time slots (same as DayView)
   */
  const timeSlots = useMemo((): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const { startHour, endHour, slotDuration } = DEFAULT_CALENDAR_CONFIG;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const start = new Date();
        start.setHours(hour, minute, 0, 0);
        
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + slotDuration);
        
        const label = format(start, 'h:mm a');
        
        slots.push({ start, end, label });
      }
    }
    
    return slots;
  }, []);

  /**
   * Get populated appointments with patient and doctor data
   */
  const populatedAppointments = useMemo(() => {
    return appointmentService.getPopulatedAppointments(appointments);
  }, [appointments]);

  /**
   * Get appointments for a specific day
   */
  function getAppointmentsForDay(date: Date): PopulatedAppointment[] {
    return populatedAppointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.startTime);
      return isSameDay(appointmentDate, date);
    });
  }

  /**
   * Get appointments for a specific day and time slot
   */
  function getAppointmentsForDayAndSlot(date: Date, slot: TimeSlot): PopulatedAppointment[] {
    const dayAppointments = getAppointmentsForDay(date);
    return dayAppointments.filter((appointment) => {
      const appointmentStart = new Date(appointment.startTime);
      const slotStart = new Date(date);
      slotStart.setHours(slot.start.getHours(), slot.start.getMinutes(), 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(slot.end.getHours(), slot.end.getMinutes(), 0, 0);
      
      return appointmentStart >= slotStart && appointmentStart < slotEnd;
    });
  }

  const weekEndDate = addDays(weekStartDate, 6);

  return (
    <div className="week-view" role="main" aria-label={`Weekly schedule for ${format(weekStartDate, 'MMM d')} - ${format(weekEndDate, 'MMM d, yyyy')}`}>
      {/* Week header */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center" aria-hidden="true">
            <Grid3X3 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {format(weekStartDate, 'MMM d')} - {format(weekEndDate, 'MMM d, yyyy')}
          </h1>
        </div>
        {doctor && (
          <div className="flex items-center gap-2 text-gray-600 ml-11" role="banner" aria-label="Doctor information">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></div>
            <span className="font-medium">Dr. {doctor.name}</span>
            <span className="text-gray-400" aria-hidden="true">•</span>
            <span>{doctor.specialty}</span>
          </div>
        )}
      </header>

      {/* Week grid - horizontal scroll on mobile */}
      <div className="border border-gray-200 rounded-xl overflow-x-auto bg-white shadow-sm" role="table" aria-label="Weekly appointment schedule">
        <table className="min-w-full">
          <thead>
            <tr role="row">
              <th className="w-24 p-4 text-xs bg-gradient-to-r from-gray-50 to-gray-100 border-r border-gray-200 sticky left-0 z-10" scope="col">
                <div className="font-semibold text-gray-700">Time</div>
              </th>
              {weekDays.map((day, index) => {
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                return (
                  <th key={index} className={`p-4 text-xs border-l border-gray-200 min-w-[140px] ${
                    isToday 
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' 
                      : 'bg-gradient-to-br from-gray-50 to-gray-100'
                  }`} scope="col" aria-label={`${format(day, 'EEEE, MMMM d')}${isToday ? ' (Today)' : ''}`}>
                    <div className={`font-bold text-sm mb-1 ${
                      isToday ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {format(day, 'EEE')}
                    </div>
                    <div className={`text-xs ${
                      isToday ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {format(day, 'MMM d')}
                    </div>
                    {isToday && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-1 animate-pulse" aria-hidden="true"></div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot, slotIndex) => {
              const isCurrentHour = new Date().getHours() === slot.start.getHours();
              
              return (
                <tr key={slotIndex} className={`border-t border-gray-100 transition-colors duration-200 ${
                  isCurrentHour ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'
                }`} role="row">
                  <th className={`p-4 text-xs font-medium border-r border-gray-200 sticky left-0 z-10 ${
                    isCurrentHour 
                      ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200' 
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600'
                  }`} scope="row" aria-label={`Time slot ${format(slot.start, 'h:mm a')}`}>
                    <div className="text-center">
                      <div className={`font-semibold ${
                        isCurrentHour ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                        {format(slot.start, 'h:mm')}
                      </div>
                      <div className={`text-xs ${
                        isCurrentHour ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {format(slot.start, 'a')}
                      </div>
                    </div>
                  </th>
                  {weekDays.map((day, dayIndex) => {
                    const slotAppointments = getAppointmentsForDayAndSlot(day, slot);
                    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    
                    return (
                      <td key={dayIndex} className={`p-2 border-l border-gray-200 align-top min-h-[70px] w-36 relative ${
                        isToday ? 'bg-blue-50/20' : ''
                      }`} role="gridcell" aria-label={`${format(day, 'EEEE')}, ${slotAppointments.length} appointment${slotAppointments.length !== 1 ? 's' : ''} at ${format(slot.start, 'h:mm a')}`}>
                        {slotAppointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            role="button"
                            tabIndex={0}
                            aria-label={`Appointment: ${appointment.patient.name}, ${APPOINTMENT_TYPE_CONFIG[appointment.type as AppointmentType].label}, ${format(new Date(appointment.startTime), 'h:mm a')}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                // Handle appointment selection
                              }
                            }}
                          >
                            <CompactAppointmentCard 
                              appointment={appointment}
                            />
                          </div>
                        ))}
                        {/* Current time indicator for today */}
                        {isToday && isCurrentHour && (
                          <div className="absolute left-0 right-0 border-t-2 border-red-500 z-20" 
                               style={{ top: `${(new Date().getMinutes() / 60) * 70}px` }}
                               aria-label="Current time indicator">
                            <div className="w-2 h-2 bg-red-500 rounded-full -mt-1 -ml-1 animate-pulse"></div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {appointments.length === 0 && (
        <div className="mt-8 text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarX className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No appointments this week</h4>
          <p className="text-gray-500 max-w-sm mx-auto">
            There are no appointments scheduled for the week of {format(weekStartDate, 'MMMM d, yyyy')}.
          </p>
        </div>
      )}
    </div>
  );
}
