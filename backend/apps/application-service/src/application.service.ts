import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PostgresService } from './postgres.service';

export type ApplicationStatus = 'PENDING' | 'INTERVIEW' | 'ACCEPTED' | 'REJECTED' | 'CONTRACT' | 'STARTED';

@Injectable()
export class ApplicationService {
  constructor(private readonly db: PostgresService) {}

  async createApplication(studentId: string, offerId: string, motivation?: string, cvDocumentId?: string) {
    const result = await this.db.query(
      `INSERT INTO applications (student_id, offer_id, motivation, cv_document_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [studentId, offerId, motivation || null, cvDocumentId || null]
    );

    return { application: result.rows[0], message: 'Candidature soumise avec succès' };
  }

  async getApplicationsByStudent(studentId: string) {
    const result = await this.db.query(
      `SELECT a.*, o.title as offer_title, o.company_id
       FROM applications a
       JOIN offers o ON a.offer_id = o.id
       WHERE a.student_id = $1
       ORDER BY a.created_at DESC`,
      [studentId]
    );

    return { applications: result.rows };
  }

  async getApplicationsByOffer(offerId: string, companyId: string) {
    // First verify the offer belongs to the company
    const offerCheck = await this.db.query(
      `SELECT id FROM offers WHERE id = $1 AND company_id = $2`,
      [offerId, companyId]
    );
    if (offerCheck.rows.length === 0) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à voir les candidatures pour cette offre');
    }

    const result = await this.db.query(
      `SELECT a.*, s.first_name, s.last_name, s.phone, s.linkedin_url, s.github_url, s.skills,
              u.email, d.file_name as cv_file_name, d.storage_key as cv_storage_key
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN documents d ON a.cv_document_id = d.id
       WHERE a.offer_id = $1
       ORDER BY a.created_at DESC`,
      [offerId]
    );

    return { applications: result.rows };
  }

  async getApplicationsByCompany(companyId: string) {
    const result = await this.db.query(
      `SELECT a.*, o.title as offer_title, s.first_name, s.last_name, s.phone, s.linkedin_url, s.github_url, s.skills,
              u.email, d.file_name as cv_file_name, d.storage_key as cv_storage_key
       FROM applications a
       JOIN offers o ON a.offer_id = o.id
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN documents d ON a.cv_document_id = d.id
       WHERE o.company_id = $1
       ORDER BY a.created_at DESC`,
      [companyId]
    );

    return { applications: result.rows };
  }

  async updateApplicationStatus(applicationId: string, companyId: string, status: ApplicationStatus, interviewAt?: string) {
    if (status === 'INTERVIEW' && (!interviewAt || Number.isNaN(Date.parse(interviewAt)))) {
      throw new BadRequestException("La date et l'heure de l'entretien sont obligatoires.");
    }

    // Verify the application belongs to the company's offer
    const check = await this.db.query(
      `SELECT a.id, o.company_id, o.id as offer_id FROM applications a
       JOIN offers o ON a.offer_id = o.id
       WHERE a.id = $1`,
      [applicationId]
    );
    if (check.rows.length === 0) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier cette candidature: application not found');
    }
    const row = check.rows[0];
    if (row.company_id !== companyId) {
      throw new ForbiddenException(`Vous n'êtes pas autorisé à modifier cette candidature: company mismatch ${row.company_id} vs ${companyId}`);
    }

    const result = await this.db.query(
      `UPDATE applications
       SET status = $1, interview_at = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, interviewAt || null, applicationId]
    );

    return { application: result.rows[0], message: 'Statut de la candidature mis à jour' };
  }

  async getApplicationById(applicationId: string, studentId?: string, companyId?: string) {
    const query = studentId 
      ? `SELECT a.*, o.title as offer_title, o.company_id FROM applications a JOIN offers o ON a.offer_id = o.id WHERE a.id = $1 AND a.student_id = $2`
      : companyId
      ? `SELECT a.*, o.title as offer_title, s.first_name, s.last_name, s.phone, s.linkedin_url, s.github_url, s.skills, u.email, d.file_name as cv_file_name, d.storage_key as cv_storage_key FROM applications a JOIN offers o ON a.offer_id = o.id JOIN students s ON a.student_id = s.id JOIN users u ON s.user_id = u.id LEFT JOIN documents d ON a.cv_document_id = d.id WHERE a.id = $1 AND o.company_id = $2`
      : `SELECT * FROM applications WHERE id = $1`;

    const params = studentId ? [applicationId, studentId] : companyId ? [applicationId, companyId] : [applicationId];
    const result = await this.db.query(query, params);

    if (result.rows.length === 0) {
      throw new NotFoundException('Candidature non trouvée');
    }

    return { application: result.rows[0] };
  }
}
