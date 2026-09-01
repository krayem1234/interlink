import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PostgresService } from './postgres.service';

@Injectable()
export class CompanyService {
  constructor(private readonly db: PostgresService) {}

  async createOrUpdateProfile(userId: string, input: {
    name?: string;
    address?: string;
    website?: string;
    description?: string;
    sector?: string;
  }) {
    const name = (input.name || '').trim();
    const address = (input.address || '').trim();
    const website = (input.website || '').trim();
    const description = (input.description || '').trim();
    const sector = (input.sector || '').trim();

    if (!name) {
      throw new BadRequestException('name is required');
    }

    await this.db.query('BEGIN');
    try {
      const existingResult = await this.db.query<{ id: string }>(
        `SELECT id FROM companies WHERE user_id = $1`,
        [userId]
      );

      let result;
      if (existingResult.rows.length > 0) {
        result = await this.db.query<{
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
        }>(
          `UPDATE companies
           SET name = $1, address = $2, website = $3, description = $4, sector = $5, updated_at = NOW()
           WHERE user_id = $6
           RETURNING *`,
          [name, address || null, website || null, description || null, sector || null, userId]
        );
      } else {
        result = await this.db.query<{
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
        }>(
          `INSERT INTO companies (user_id, name, address, website, description, sector)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [userId, name, address || null, website || null, description || null, sector || null]
        );
      }

      await this.db.query('COMMIT');
      return {
        company: result.rows[0],
        message: existingResult.rows.length > 0 ? 'Profile updated successfully' : 'Profile created successfully'
      };
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw error;
    }
  }

  async getProfile(userId: string) {
    const result = await this.db.query<{
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
    }>(`SELECT * FROM companies WHERE user_id = $1`, [userId]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Company profile not found');
    }

    return { company: result.rows[0] };
  }

  async getProfileById(companyId: string) {
    const result = await this.db.query<{
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
    }>(`SELECT * FROM companies WHERE id = $1`, [companyId]);

    if (result.rows.length === 0) {
      throw new NotFoundException('Company profile not found');
    }

    return { company: result.rows[0] };
  }

  async deleteProfile(userId: string) {
    const result = await this.db.query(
      `DELETE FROM companies WHERE user_id = $1 RETURNING id`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Company profile not found');
    }

    return { message: 'Profile deleted successfully' };
  }

  // Admin endpoints
  async getAllCompanies() {
    const result = await this.db.query<{
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
    }>(`SELECT * FROM companies ORDER BY created_at DESC`);

    return { companies: result.rows };
  }

  async validateCompany(companyId: string, validated: boolean) {
    const result = await this.db.query<{
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
    }>(
      `UPDATE companies SET validated = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [validated, companyId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Company profile not found');
    }

    return { company: result.rows[0], message: `Company ${validated ? 'validated' : 'invalidated'} successfully` };
  }
}
