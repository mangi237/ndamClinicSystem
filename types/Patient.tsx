// types/Patient.ts
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  status: string;
  lastVitals?: {
    temperature?: string;
    bloodPressure?: string;
    heartRate?: string;
    respiratoryRate?: string;
    oxygenSaturation?: string;
    height?: string;
    weight?: string;
    bmi?: string;
    date?: string;
  };
  lastUpdated?: Date;
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