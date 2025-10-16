/**
 * DoctorSelector Component
 *
 * Dropdown to select which doctor's schedule to view.
 * For front desk staff (can see all doctors).
 *
 * TODO for candidates:
 * 1. Fetch list of all doctors
 * 2. Display in a dropdown/select
 * 3. Show doctor name and specialty
 * 4. Handle selection change
 * 5. Consider using a custom dropdown or native select
 */

'use client';

import { ChevronDown, AlertCircle, User, Mail, Phone } from 'lucide-react';
import { useDoctors } from '@/hooks/useAppointments';
import type { Doctor, Specialty } from '@/types';

interface DoctorSelectorProps {
  selectedDoctorId: string;
  onDoctorChange: (doctorId: string) => void;
}

/**
 * DoctorSelector Component
 *
 * A dropdown to select a doctor from the list of available doctors.
 *
 * TODO: Implement this component
 *
 * Consider:
 * - Should you fetch doctors here or accept them as props?
 * - Native <select> or custom dropdown component?
 * - How to display doctor info (name + specialty)?
 * - Should this be a reusable component?
 */
/**
 * Format specialty for display
 */
function formatSpecialty(specialty: Specialty): string {
  const specialtyMap: Record<Specialty, string> = {
    'cardiology': 'Cardiology',
    'pediatrics': 'Pediatrics',
    'general-practice': 'General Practice',
    'orthopedics': 'Orthopedics',
    'dermatology': 'Dermatology',
  };
  return specialtyMap[specialty] || specialty;
}

export function DoctorSelector({
  selectedDoctorId,
  onDoctorChange,
}: DoctorSelectorProps) {
  const { doctors, loading, error } = useDoctors();

  // Find currently selected doctor for display
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  if (loading) {
    return (
      <div className="doctor-selector">
        <div className="doctor-loading"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doctor-selector">
        <div className="doctor-error">
          <AlertCircle style={{ width: '1rem', height: '1rem' }} />
          Error loading doctors
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-selector">
      <label htmlFor="doctor-select" className="sr-only">
        Select a doctor to view their schedule
      </label>
      <div className="doctor-select-container">
        <select
          id="doctor-select"
          value={selectedDoctorId}
          onChange={(e) => onDoctorChange(e.target.value)}
          className="doctor-select"
          aria-label="Select a doctor to view their schedule"
          aria-describedby={selectedDoctor ? 'selected-doctor-info' : undefined}
        >
          <option value="">Select a doctor...</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              Dr. {doctor.name} - {formatSpecialty(doctor.specialty)}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="doctor-select-arrow">
          <ChevronDown style={{ width: '1.25rem', height: '1.25rem' }} />
        </div>
      </div>

      {/* Display selected doctor details */}
      {selectedDoctor && (
        <div 
          id="selected-doctor-info"
          className="doctor-info"
          role="region"
          aria-label="Selected doctor information"
        >
          <div className="doctor-info-header">
            <div className="doctor-avatar" aria-hidden="true">
              <User style={{ width: '1rem', height: '1rem', color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="doctor-name">
                Dr. {selectedDoctor.name}
              </div>
              <div className="doctor-details">
                <div className="doctor-detail-item">
                  <div className="doctor-specialty-dot" aria-hidden="true"></div>
                  <span>{formatSpecialty(selectedDoctor.specialty)}</span>
                </div>
                <div className="doctor-detail-item">
                  <Mail style={{ width: '0.75rem', height: '0.75rem' }} aria-hidden="true" />
                  <span>{selectedDoctor.email}</span>
                </div>
                <div className="doctor-detail-item">
                  <Phone style={{ width: '0.75rem', height: '0.75rem' }} aria-hidden="true" />
                  <span>{selectedDoctor.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
