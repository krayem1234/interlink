import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PostgresService } from './postgres.service';

@Injectable()
export class OfferService {
  constructor(private readonly db: PostgresService) {}

  async createOffer(companyId: string, input: {
    title: string;
    description: string;
    technologies?: string[];
    durationWeeks: number;
    internshipType: 'PFE' | 'SUMMER' | 'ALTERNANCE';
    seats?: number;
    deadline: string;
    location?: string;
  }) {
    const title = (input.title || '').trim();
    const description = (input.description || '').trim();
    const technologies = input.technologies || [];
    const durationWeeks = input.durationWeeks;
    const internshipType = input.internshipType;
    const seats = input.seats || 1;
    const deadline = input.deadline;
    const location = (input.location || '').trim();

    if (!title) {
      throw new BadRequestException('title is required');
    }
    if (!description) {
      throw new BadRequestException('description is required');
    }
    if (!durationWeeks || durationWeeks <= 0) {
      throw new BadRequestException('durationWeeks must be positive');
    }
    if (!internshipType) {
      throw new BadRequestException('internshipType is required');
    }
    if (!deadline) {
      throw new BadRequestException('deadline is required');
    }

    const result = await this.db.query<{
      id: string;
      company_id: string;
      title: string;
      description: string;
      technologies: string[];
      duration_weeks: number;
      internship_type: string;
      seats: number;
      deadline: string;
      location: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `INSERT INTO offers (company_id, title, description, technologies, duration_weeks, internship_type, seats, deadline, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [companyId, title, description, technologies, durationWeeks, internshipType, seats, deadline, location || null]
    );

    return { offer: result.rows[0], message: 'Offer created successfully' };
  }

  async updateOffer(offerId: string, companyId: string, input: {
    title?: string;
    description?: string;
    technologies?: string[];
    durationWeeks?: number;
    internshipType?: 'PFE' | 'SUMMER' | 'ALTERNANCE';
    seats?: number;
    deadline?: string;
    location?: string;
  }) {
    const fields: string[] = [];
    const params: unknown[] = [offerId, companyId];
    let paramIndex = 3;

    if (input.title !== undefined) {
      fields.push(`title = $${paramIndex}`);
      params.push((input.title || '').trim());
      paramIndex++;
    }
    if (input.description !== undefined) {
      fields.push(`description = $${paramIndex}`);
      params.push((input.description || '').trim());
      paramIndex++;
    }
    if (input.technologies !== undefined) {
      fields.push(`technologies = $${paramIndex}`);
      params.push(input.technologies || []);
      paramIndex++;
    }
    if (input.durationWeeks !== undefined) {
      if (input.durationWeeks <= 0) {
        throw new BadRequestException('durationWeeks must be positive');
      }
      fields.push(`duration_weeks = $${paramIndex}`);
      params.push(input.durationWeeks);
      paramIndex++;
    }
    if (input.internshipType !== undefined) {
      fields.push(`internship_type = $${paramIndex}`);
      params.push(input.internshipType);
      paramIndex++;
    }
    if (input.seats !== undefined) {
      if (input.seats <= 0) {
        throw new BadRequestException('seats must be positive');
      }
      fields.push(`seats = $${paramIndex}`);
      params.push(input.seats);
      paramIndex++;
    }
    if (input.deadline !== undefined) {
      fields.push(`deadline = $${paramIndex}`);
      params.push(input.deadline);
      paramIndex++;
    }
    if (input.location !== undefined) {
      fields.push(`location = $${paramIndex}`);
      params.push((input.location || '').trim() || null);
      paramIndex++;
    }

    if (fields.length === 0) {
      throw new BadRequestException('No fields to update');
    }

    fields.push('updated_at = NOW()');

    const result = await this.db.query<{
      id: string;
      company_id: string;
      title: string;
      description: string;
      technologies: string[];
      duration_weeks: number;
      internship_type: string;
      seats: number;
      deadline: string;
      location: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `UPDATE offers
       SET ${fields.join(', ')}
       WHERE id = $1 AND company_id = $2
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Offer not found or not authorized');
    }

    return { offer: result.rows[0], message: 'Offer updated successfully' };
  }

  async getOffersByCompany(companyId: string) {
    const result = await this.db.query<{
      id: string;
      company_id: string;
      title: string;
      description: string;
      technologies: string[];
      duration_weeks: number;
      internship_type: string;
      seats: number;
      deadline: string;
      location: string | null;
      created_at: string;
      updated_at: string;
      application_count: number;
    }>(
      `SELECT o.*, COUNT(a.id) as application_count
       FROM offers o
       LEFT JOIN applications a ON o.id = a.offer_id
       WHERE o.company_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [companyId]
    );

    return { offers: result.rows };
  }

  async getOfferById(offerId: string, companyId?: string) {
    const result = await this.db.query<{
      id: string;
      company_id: string;
      title: string;
      description: string;
      technologies: string[];
      duration_weeks: number;
      internship_type: string;
      seats: number;
      deadline: string;
      location: string | null;
      created_at: string;
      updated_at: string;
      application_count: number;
    }>(
      `SELECT o.*, COUNT(a.id) as application_count
       FROM offers o
       LEFT JOIN applications a ON o.id = a.offer_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [offerId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Offer not found');
    }

    return { offer: result.rows[0] };
  }

  async getAllOffers() {
    const result = await this.db.query<{
      id: string;
      company_id: string;
      title: string;
      description: string;
      technologies: string[];
      duration_weeks: number;
      internship_type: string;
      seats: number;
      deadline: string;
      location: string | null;
      created_at: string;
      updated_at: string;
    }>(`SELECT * FROM offers ORDER BY created_at DESC`);

    return { offers: result.rows };
  }

  async deleteOffer(offerId: string, companyId: string) {
    const result = await this.db.query(
      `DELETE FROM offers WHERE id = $1 AND company_id = $2 RETURNING id`,
      [offerId, companyId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Offer not found or not authorized');
    }

    return { message: 'Offer deleted successfully' };
  }
}
