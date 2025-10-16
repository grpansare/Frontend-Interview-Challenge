/**
 * ScheduleView Component
 *
 * Main component that orchestrates the schedule display.
 * This component should compose smaller components together.
 *
 * TODO for candidates:
 * 1. Create the component structure (header, controls, calendar)
 * 2. Compose DoctorSelector, DayView, WeekView together
 * 3. Handle view switching (day vs week)
 * 4. Manage state or use the useAppointments hook
 * 5. Think about component composition and reusability
 */

'use client';

import { useMemo, useState } from 'react';
import { format, startOfWeek, addDays, subDays } from 'date-fns';
import { User, ChevronLeft, ChevronRight, Calendar, Grid3X3, Mail, Phone, AlertCircle, Search, X } from 'lucide-react';
import type { CalendarView } from '@/types';
import { useAppointments } from '@/hooks/useAppointments';
import { DoctorSelector } from './DoctorSelector';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import {appointmentService} from '@/services/appointmentService';

interface ScheduleViewProps {
  selectedDoctorId: string;
  selectedDate: Date;
  view: CalendarView;
  onDoctorChange: (doctorId: string) => void;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
}

/**
 * Get the start of the week (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday = 1
}

/**
 * ScheduleView Component
 *
 * This is the main container component for the schedule interface.
 */
export function ScheduleView({
  selectedDoctorId,
  selectedDate,
  view,
  onDoctorChange,
  onDateChange,
  onViewChange,
}: ScheduleViewProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Calculate week start for week view
  const weekStartDate = useMemo(() => getWeekStart(selectedDate), [selectedDate]);
  
  // Use the useAppointments hook to fetch data
  const { appointments: rawAppointments, doctor, loading, error } = useAppointments({
    doctorId: selectedDoctorId,
    date: selectedDate,
    startDate: view === 'week' ? weekStartDate : undefined,
    endDate: view === 'week' ? addDays(weekStartDate, 6) : undefined,
  });
  
  // Get populated appointments with patient and doctor data
  const populatedAppointments = useMemo(() => {
    return appointmentService.getPopulatedAppointments(rawAppointments);
  }, [rawAppointments]);
  
  // Filter appointments based on search query
  const appointments = useMemo(() => {
    if (!searchQuery.trim()) return rawAppointments;
    
    const query = searchQuery.toLowerCase();
    const filteredPopulated = populatedAppointments.filter(appointment => {
      // Search in patient name, appointment type, or notes
      const patientName = appointment.patient?.name?.toLowerCase() || '';
      const appointmentType = appointment.type?.toLowerCase() || '';
      const notes = appointment.notes?.toLowerCase() || '';
      
      return patientName.includes(query) || 
             appointmentType.includes(query) || 
             notes.includes(query);
    });
    
    // Return the original appointment objects (not populated) for consistency
    return rawAppointments.filter(apt => 
      filteredPopulated.some(filtered => filtered.id === apt.id)
    );
  }, [rawAppointments, populatedAppointments, searchQuery]);

  // Navigation handlers
  const handlePreviousDate = () => {
    if (view === 'day') {
      onDateChange(subDays(selectedDate, 1));
    } else {
      onDateChange(subDays(selectedDate, 7));
    }
  };

  const handleNextDate = () => {
    if (view === 'day') {
      onDateChange(addDays(selectedDate, 1));
    } else {
      onDateChange(addDays(selectedDate, 7));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  if (!selectedDoctorId) {
    return (
      <div className="card card-padding">
        <div className="text-center">
          <div className="doctor-icon">
            <User style={{ width: '2rem', height: '2rem', color: 'white' }} />
          </div>
          <h2 className="card-title">Select a Doctor</h2>
          <p className="card-subtitle">Choose a doctor to view their appointment schedule</p>
          <div className="selector-container">
            <DoctorSelector
              selectedDoctorId={selectedDoctorId}
              onDoctorChange={onDoctorChange}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header with doctor info and controls */}
      <div className="header-section">
        <div className="header-flex">
          <div className="doctor-info">
            <div className="doctor-avatar">
              <User style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
            </div>
            <div className="doctor-details">
              <h2>
                {doctor ? `Dr. ${doctor.name}` : 'Doctor Schedule'}
              </h2>
              {doctor && (
                <div className="doctor-meta">
                  <span className="meta-item">
                    <div className="dot"></div>
                    {doctor.specialty}
                  </span>
                  <span className="meta-item">
                    <Mail style={{ width: '0.75rem', height: '0.75rem' }} />
                    {doctor.email}
                  </span>
                  <span className="meta-item">
                    <Phone style={{ width: '0.75rem', height: '0.75rem' }} />
                    {doctor.phone}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Controls Section */}
          <div className="controls-section">
            {/* Top Row: Doctor Selector and Search */}
            <div className="control-group">
              <DoctorSelector
                selectedDoctorId={selectedDoctorId}
                onDoctorChange={onDoctorChange}
              />
            </div>

            <div className="control-group">
              <div className="search-container">
                <Search className="search-icon" style={{ width: '1rem', height: '1rem' }} />
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="clear-button"
                  >
                    <X style={{ width: '1rem', height: '1rem' }} />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="search-results">
                  {appointments.length} result{appointments.length !== 1 ? 's' : ''} found
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation Controls */}
          <div className="nav-controls">
            {/* Date Navigation */}
            <div className="date-nav">
              <button
                onClick={handlePreviousDate}
                className="nav-button"
                title={`Previous ${view}`}
              >
                <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
              </button>
              
              <div className="date-display">
                {view === 'day' 
                  ? format(selectedDate, 'MMM d, yyyy')
                  : `${format(weekStartDate, 'MMM d')} - ${format(addDays(weekStartDate, 6), 'MMM d')}`
                }
              </div>
              
              <button
                onClick={handleNextDate}
                className="nav-button"
                title={`Next ${view}`}
              >
                <ChevronRight style={{ width: '1rem', height: '1rem' }} />
              </button>
              
              <div className="divider"></div>
              
              <button
                onClick={handleToday}
                className="today-button"
              >
                Today
              </button>
            </div>

            {/* View Toggle */}
            <div className="view-toggle">
              <button
                className={`view-button ${view === 'day' ? 'active' : 'inactive'}`}
                onClick={() => onViewChange('day')}
              >
                <Calendar style={{ width: '1rem', height: '1rem' }} />
                Day
              </button>
              <button
                className={`view-button ${view === 'week' ? 'active' : 'inactive'}`}
                onClick={() => onViewChange('week')}
              >
                <Grid3X3 style={{ width: '1rem', height: '1rem' }} />
                Week
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="p-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" style={{animationDuration: '1.5s', animationDirection: 'reverse'}}></div>
            </div>
            <p className="text-gray-600 mt-4 font-medium">Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-red-600 font-semibold mb-2">Error loading appointments</div>
            <p className="text-gray-500 text-sm max-w-md mx-auto">{error.message}</p>
          </div>
        ) : (
          <>
            {view === 'day' ? (
              <DayView
                appointments={appointments}
                doctor={doctor}
                date={selectedDate}
              />
            ) : (
              <WeekView
                appointments={appointments}
                doctor={doctor}
                weekStartDate={weekStartDate}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
