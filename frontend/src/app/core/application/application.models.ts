export type ApplicationStatus = 'PENDING' | 'INTERVIEW' | 'ACCEPTED' | 'REJECTED' | 'CONTRACT' | 'STARTED';

export interface Application {
  id: string;
  student_id: string;
  offer_id: string;
  status: ApplicationStatus;
  motivation?: string;
  cv_document_id?: string;
  interview_at?: string;
  created_at: string;
  updated_at: string;
  offer_title?: string;
  company_id?: string;
  // For company view:
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  cv_file_name?: string;
  cv_storage_key?: string;
}

export interface CreateApplicationPayload {
  studentId: string;
  offerId: string;
  motivation?: string;
  cvDocumentId?: string;
}

export interface UpdateApplicationStatusPayload {
  companyId: string;
  status: ApplicationStatus;
  interviewAt?: string;
}
