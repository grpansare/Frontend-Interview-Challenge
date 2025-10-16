/**
 * useAppointments Hook
 *
 * This is a custom hook that encapsulates the business logic for fetching
 * and managing appointments. This is the "headless" pattern - separating
 * logic from presentation.
 *
 * TODO for candidates:
 * 1. Implement the hook to fetch appointments based on filters
 * 2. Add loading and error states
 * 3. Consider memoization for performance
 * 4. Think about how to make this reusable for both day and week views
 */

import { useState, useEffect, useMemo } from 'react';
import type { Appointment, Doctor } from '@/types';
import { appointmentService } from '@/services/appointmentService';

/**
 * Hook parameters
 */
interface UseAppointmentsParams {
  doctorId: string;
  date: Date;
  // For week view, you might want to pass a date range instead
  startDate?: Date;
  endDate?: Date;
}

/**
 * Hook return value
 */
interface UseAppointmentsReturn {
  appointments: Appointment[];
  doctor: Doctor | undefined;
  loading: boolean;
  error: Error | null;
  // Add any other useful data or functions
}

/**
 * useAppointments Hook
 *
 * Fetches and manages appointment data for a given doctor and date/date range.
 *
 * TODO: Implement this hook
 *
 * Tips:
 * - Use useState for loading and error states
 * - Use useEffect to fetch data when params change
 * - Use useMemo to memoize expensive computations
 * - Consider how to handle both single date (day view) and date range (week view)
 */
export function useAppointments(params: UseAppointmentsParams): UseAppointmentsReturn {
  const { doctorId, date, startDate, endDate } = params;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch doctor data
  const doctor = useMemo(() => {
    try {
      return appointmentService.getDoctorById(doctorId);
    } catch {
      return undefined;
    }
  }, [doctorId]);

  // Fetch appointments when dependencies change
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        let fetchedAppointments: Appointment[];

        // If date range is provided, use it (for week view)
        if (startDate && endDate) {
          fetchedAppointments = appointmentService.getAppointmentsByDoctorAndDateRange(
            doctorId,
            startDate,
            endDate
          );
        } else {
          // Otherwise use single date (for day view)
          fetchedAppointments = appointmentService.getAppointmentsByDoctorAndDate(
            doctorId,
            date
          );
        }

        // Sort appointments by time
        const sortedAppointments = appointmentService.sortAppointmentsByTime(fetchedAppointments);
        setAppointments(sortedAppointments);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch appointments'));
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [doctorId, date, startDate, endDate]);

  return {
    appointments,
    doctor,
    loading,
    error,
  };
}

/**
 * Hook specifically for day view appointments
 */
export function useDayViewAppointments(doctorId: string, date: Date) {
  return useAppointments({ doctorId, date });
}

/**
 * Hook specifically for week view appointments
 */
export function useWeekViewAppointments(doctorId: string, weekStartDate: Date) {
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);
  weekEndDate.setHours(23, 59, 59, 999);

  return useAppointments({
    doctorId,
    date: weekStartDate,
    startDate: weekStartDate,
    endDate: weekEndDate,
  });
}

/**
 * Hook to get all doctors
 */
export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      setLoading(true);
      setError(null);
      const allDoctors = appointmentService.getAllDoctors();
      setDoctors(allDoctors);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch doctors'));
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { doctors, loading, error };
}
