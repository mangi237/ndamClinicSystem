// types/Patient.ts
import { Vital } from './Vitals';
import { Medication } from './Medication';
import { Appointment } from './Appointment';

export interface Patient {
  id?: string;
  patientId: string;
  name: string;
  dateOfBirth: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address: string;
  emergencyContact: string;
  guardianName?: string; // Added guardian name
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies?: string[];
  medicalConditions?: string[];
  currentMedications?: string[];
  insuranceProvider?: string;
  insuranceId?: string;
  status: 'active' | 'inactive' | 'discharged';
  profileImage?: string; // URL for patient image
  createdAt: Date;
  updatedAt: Date;
   vitals?: Vital[];
  medications?: Medication[];
  appointments?: Appointment[];
}

export interface PatientCreateData {
  patientId: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address: string;
  emergencyContact: string;
  guardianName?: string;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies?: string[];
  medicalConditions?: string[];
  currentMedications?: string[];
  insuranceProvider?: string;
  insuranceId?: string;
  profileImage?: string;
}
export interface Vitals {
  patientId: string;
  patientName: string;
  temperature: string;
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  height: string;
  weight: string;
  bmi: string;
  notes: string;
  date: string;
  recordedBy: string;
  timestamp: Date;
}