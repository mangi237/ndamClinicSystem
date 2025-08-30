export interface Medication {
  id?: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string; // e.g. oral, IV, IM
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}