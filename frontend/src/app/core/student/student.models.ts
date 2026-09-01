export interface StudentProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  skills: string[] | null;
  created_at: string;
  updated_at: string | null;
  email: string;
}

export interface StudentDocument {
  id: string;
  user_id: string;
  type: string;
  file_name: string;
  storage_key: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface CreateOrUpdateProfilePayload {
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  skills?: string[];
}

export interface UploadCVPayload {
  userId: string;
  fileName: string;
  storageKey: string;
  mimeType?: string;
  sizeBytes?: number;
}
