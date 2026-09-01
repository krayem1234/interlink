export interface CompanyProfile {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  website: string | null;
  description: string | null;
  sector: string | null;
  validated: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateOrUpdateCompanyProfilePayload {
  userId: string;
  name?: string;
  address?: string;
  website?: string;
  description?: string;
  sector?: string;
}
