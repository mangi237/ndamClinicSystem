import { Vital } from './Vitals';
import { Medication } from './Medication';
import { Appointment } from './Appointment';

// New interface for a Lab Test
export interface LabTest {
  name: string;
  description: string;
  category: string;
  samples: string[];
  price: number;
}

// Updated Patient interface with a new status and a list of tests
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
  // Statuses for the lab workflow
  status: 'registered' | 'waiting' | 'completed';
  profileImage?: string; // URL for patient image
  createdAt: Date;
  updatedAt: Date;
  vitals?: Vital[];
  medications?: Medication[];
  appointments?: Appointment[];
  // The list of lab tests requested for the patient

  labTests: LabTest[]; 
  paymentDetails?: 
  {
    payerName: string;
    price: number;
    paymentStatus: 'pending' | 'paid' | 'refunded';
    paymentMethod: 'credit card' | 'debit card' | 'paypal' | 'cash' | 'Mobile Money';
    date: Date;
    insuranceName : string;
    insuranceId : string;
  }
    resultUrls?: ResultFile[]; // URL to uploaded results
  accessCode: string;
}
export interface ResultFile {
  url: string;
  fileName: string;
  uploadedAt: Date;
  uploadedBy: string;
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
  labTests: LabTest[]; // The list of lab tests
  profileImage?: string;
    resultUrl: string; // URL to uploaded results
    accessCode: string;
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
export interface LabTest {
    name: string;
    description: string;
    category: string;
    samples: string[];
    price: number;
    // We will add the result information here later
}
 
