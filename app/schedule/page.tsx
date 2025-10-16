/**
 * Schedule Page
 *
 * Main page for the appointment scheduler.
 * Displays the hospital appointment scheduling interface.
 */

'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { MOCK_DOCTORS } from '@/data/mockData';
import type { CalendarView } from '@/types';
import { ScheduleView } from '@/components/ScheduleView';

export default function SchedulePage() {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarView>('day');

  return (
    <main className="main-container">
      <div className="max-width-container">
        <header className="header">
          <div className="header-content">
            <div className="icon-container">
              <Calendar className="icon-white" />
            </div>
            <div>
              <h1 className="title">
                Appointment Schedule
              </h1>
              <p className="subtitle">
                View and manage doctor appointments with ease
              </p>
            </div>
          </div>
        </header>

        <ScheduleView
          selectedDoctorId={selectedDoctorId}
          selectedDate={selectedDate}
          view={view}
          onDoctorChange={setSelectedDoctorId}
          onDateChange={setSelectedDate}
          onViewChange={setView}
        />
      </div>
    </main>
  );
}
