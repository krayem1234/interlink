import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PostgresService } from './postgres.service';

@Injectable()
export class StudentService {
  constructor(private readonly db: PostgresService) {}

  async createOrUpdateProfile(userId: string, input: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    skills?: string[];
  }) {
    const firstName = (input.firstName || '').trim();
    const lastName = (input.lastName || '').trim();
    const phone = (input.phone || '').trim();
    const linkedinUrl = (input.linkedinUrl || '').trim();
    const githubUrl = (input.githubUrl || '').trim();
    const skills = (input.skills || []).map(skill => skill.trim()).filter(Boolean);

    if (!firstName || !lastName) {
      throw new BadRequestException('firstName and lastName are required');
    }

    await this.db.query('BEGIN');
    try {
      // Check if student exists
      const existingResult = await this.db.query<{ id: string }>(
        `SELECT id FROM students WHERE user_id = $1`,
        [userId]
      );

      let result;
      if (existingResult.rows.length > 0) {
        // Update existing student
        result = await this.db.query<{
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          linkedin_url: string | null;
          github_url: string | null;
          skills: string[];
          created_at: string;
          updated_at: string;
        }>(
          `UPDATE students
           SET first_name = $1,
               last_name = $2,
               phone = $3,
               linkedin_url = $4,
               github_url = $5,
               skills = $6,
               updated_at = NOW()
           WHERE user_id = $7
           RETURNING *`,
          [firstName, lastName, phone || null, linkedinUrl || null, githubUrl || null, skills, userId]
        );
      } else {
        // Create new student
        result = await this.db.query<{
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          linkedin_url: string | null;
          github_url: string | null;
          skills: string[];
          created_at: string;
          updated_at: string;
        }>(
          `INSERT INTO students (user_id, first_name, last_name, phone, linkedin_url, github_url, skills)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [userId, firstName, lastName, phone || null, linkedinUrl || null, githubUrl || null, skills]
        );
      }

      await this.db.query('COMMIT');
      return {
        student: result.rows[0],
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
      first_name: string;
      last_name: string;
      phone: string | null;
      linkedin_url: string | null;
      github_url: string | null;
      skills: string[];
      created_at: string;
      updated_at: string;
    }>(
      `SELECT * FROM students WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Student profile not found');
    }

    return { student: result.rows[0] };
  }

  async getProfileById(studentId: string) {
    const result = await this.db.query<{
      id: string;
      user_id: string;
      first_name: string;
      last_name: string;
      phone: string | null;
      linkedin_url: string | null;
      github_url: string | null;
      skills: string[];
      created_at: string;
      updated_at: string;
    }>(
      `SELECT * FROM students WHERE id = $1`,
      [studentId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Student profile not found');
    }

    return { student: result.rows[0] };
  }

  async deleteProfile(userId: string) {
    const result = await this.db.query(
      `DELETE FROM students WHERE user_id = $1 RETURNING id`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Student profile not found');
    }

    return { message: 'Profile deleted successfully' };
  }

  // Document/CV management
  async uploadCV(userId: string, input: {
    fileName: string;
    storageKey: string;
    mimeType?: string;
    sizeBytes?: number;
  }) {
    const fileName = (input.fileName || '').trim();
    const storageKey = (input.storageKey || '').trim();

    if (!fileName || !storageKey) {
      throw new BadRequestException('fileName and storageKey are required');
    }

    // First, check if student exists
    const studentResult = await this.db.query<{ id: string }>(
      `SELECT id FROM students WHERE user_id = $1`,
      [userId]
    );

    if (studentResult.rows.length === 0) {
      throw new NotFoundException('Student profile not found');
    }

    // Insert document
    const result = await this.db.query<{
      id: string;
      user_id: string;
      type: string;
      file_name: string;
      storage_key: string;
      mime_type: string | null;
      size_bytes: number | null;
      created_at: string;
    }>(
      `INSERT INTO documents (user_id, type, file_name, storage_key, mime_type, size_bytes)
       VALUES ($1, 'CV', $2, $3, $4, $5)
       RETURNING *`,
      [userId, fileName, storageKey, input.mimeType || null, input.sizeBytes || null]
    );

    return {
      document: result.rows[0],
      message: 'CV uploaded successfully'
    };
  }

  async getCVs(userId: string) {
    const result = await this.db.query<{
      id: string;
      user_id: string;
      type: string;
      file_name: string;
      storage_key: string;
      mime_type: string | null;
      size_bytes: number | null;
      created_at: string;
    }>(
      `SELECT * FROM documents WHERE user_id = $1 AND type = 'CV' ORDER BY created_at DESC`,
      [userId]
    );

    return { documents: result.rows };
  }

  async deleteCV(userId: string, documentId: string) {
    const result = await this.db.query(
      `DELETE FROM documents WHERE id = $1 AND user_id = $2 AND type = 'CV' RETURNING id`,
      [documentId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('CV not found');
    }

    return { message: 'CV deleted successfully' };
  }

  // Admin endpoints
  async getAllStudents() {
    const result = await this.db.query<{
      id: string | null;
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
    }>(`
      SELECT 
        s.id,
        u.id as user_id,
        s.first_name,
        s.last_name,
        s.phone,
        s.linkedin_url,
        s.github_url,
        s.skills,
        u.created_at,
        s.updated_at,
        u.email
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.role = 'STUDENT'
      ORDER BY u.created_at DESC
    `);

    return { students: result.rows };
  }
}
