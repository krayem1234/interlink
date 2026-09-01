export interface Offer {
  id: string;
  company_id: string;
  title: string;
  description: string;
  technologies: string[];
  duration_weeks: number;
  internship_type: 'PFE' | 'SUMMER' | 'ALTERNANCE';
  seats: number;
  deadline: string;
  location: string | null;
  created_at: string;
  updated_at: string;
  application_count?: number;
}

export interface CreateOfferPayload {
  companyId: string;
  title: string;
  description: string;
  technologies?: string[];
  durationWeeks: number;
  internshipType: 'PFE' | 'SUMMER' | 'ALTERNANCE';
  seats?: number;
  deadline: string;
  location?: string;
}

export interface UpdateOfferPayload {
  companyId: string;
  title?: string;
  description?: string;
  technologies?: string[];
  durationWeeks?: number;
  internshipType?: 'PFE' | 'SUMMER' | 'ALTERNANCE';
  seats?: number;
  deadline?: string;
  location?: string;
}
