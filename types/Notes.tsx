// types/Note.ts
export interface Note {
  id?: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  title: string;
  content: string;
  category: 'examination' | 'diagnosis' | 'treatment' | 'progress' | 'lab' | 'other';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteCreateData {
  patientId: string;
  doctorId: string;
  doctorName: string;
  title: string;
  content: string;
  category: 'examination' | 'diagnosis' | 'treatment' | 'progress' | 'lab' | 'other';
  priority: 'low' | 'medium' | 'high';
}