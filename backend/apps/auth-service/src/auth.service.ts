import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomInt, randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PostgresService } from './postgres.service';

type UserRole = 'STUDENT' | 'COMPANY' | 'ADMIN';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export interface PasswordChangeRequest {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  email?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly db: PostgresService) {}

  async register(input: {
    email?: string;
    password?: string;
    role?: UserRole;
  }) {
    const email = (input.email || '').trim().toLowerCase();
    const password = input.password || '';
    const role = input.role || 'STUDENT';

    if (!email || !password) {
      throw new BadRequestException('email and password are required');
    }

    if (!['STUDENT', 'COMPANY', 'ADMIN'].includes(role)) {
      throw new BadRequestException('invalid role');
    }

    if (password.length < 8) {
      throw new BadRequestException('password must be at least 8 characters');
    }

    const hashed = await bcrypt.hash(password, 10);

    try {
      const result = await this.db.query<{
        id: string;
        email: string;
        role: UserRole;
        created_at: string;
      }>(
        `INSERT INTO users (email, password_hash, role, must_change_password)
         VALUES ($1, $2, $3::user_role, TRUE)
         RETURNING id, email, role, created_at`,
        [email, hashed, role]
      );

      return {
        user: result.rows[0],
        message: 'Account created successfully'
      };
    } catch (error) {
      const message = (error as { message?: string }).message || '';
      if (message.includes('users_email_key')) {
        throw new BadRequestException('email already exists');
      }
      throw error;
    }
  }

  async login(input: { email?: string; password?: string }) {
    const email = (input.email || '').trim().toLowerCase();
    const password = input.password || '';

    if (!email || !password) {
      throw new BadRequestException('email and password are required');
    }

    const userResult = await this.db.query<{
      id: string;
      email: string;
      role: UserRole;
      password_hash: string;
      is_active: boolean;
      must_change_password: boolean;
      security_questions_configured: boolean;
      is_blocked: boolean;
    }>(
      `SELECT id, email, role, password_hash, is_active, must_change_password, security_questions_configured, is_blocked
       FROM users
       WHERE email = $1`,
      [email]
    );

    const user = userResult.rows[0];
    if (!user || !user.is_active || user.is_blocked) {
      throw new UnauthorizedException('invalid credentials or account blocked');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('invalid credentials');
    }

    // Vérifier s'il y a une demande de changement de mdp en attente
    const pendingRequest = await this.db.query(
      `SELECT id FROM password_change_requests WHERE user_id = $1 AND status = 'pending'`,
      [user.id]
    );
    if (pendingRequest.rows.length > 0) {
      throw new UnauthorizedException('Please wait for admin approval of your password change request');
    }

    return {
      ...(await this.issueTokenPair(user.id, user.email, user.role)),
      mustChangePassword: user.must_change_password,
      securityQuestionsConfigured: user.security_questions_configured
    };
  }

  async googleLogin(input: { credential?: string }) {
    const credential = (input.credential || '').trim();
    const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    if (!credential || !clientId) {
      throw new BadRequestException('Google authentication is not configured');
    }

    let googleUser: { aud?: string; email?: string; email_verified?: boolean | string };
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (!response.ok) {
        throw new Error('invalid Google credential');
      }
      googleUser = (await response.json()) as typeof googleUser;
    } catch {
      throw new UnauthorizedException('Google authentication failed');
    }

    const email = (googleUser.email || '').trim().toLowerCase();
    const verified = googleUser.email_verified === true || googleUser.email_verified === 'true';
    if (googleUser.aud !== clientId || !email || !verified) {
      throw new UnauthorizedException('Google account is not verified');
    }

    let result = await this.db.query<{
      id: string; email: string; role: UserRole; is_active: boolean; is_blocked: boolean;
      must_change_password: boolean; security_questions_configured: boolean;
    }>(`SELECT id, email, role, is_active, is_blocked, must_change_password, security_questions_configured FROM users WHERE email = $1`, [email]);
    let user = result.rows[0];

    if (!user) {
      const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
      result = await this.db.query(`INSERT INTO users (email, password_hash, role, must_change_password, security_questions_configured) VALUES ($1, $2, 'STUDENT'::user_role, FALSE, TRUE) RETURNING id, email, role, is_active, is_blocked, must_change_password, security_questions_configured`, [email, passwordHash]);
      user = result.rows[0] as typeof user;
    }

    if (!user.is_active || user.is_blocked) {
      throw new UnauthorizedException('account blocked');
    }

    return {
      ...(await this.issueTokenPair(user.id, user.email, user.role)),
      mustChangePassword: user.must_change_password,
      securityQuestionsConfigured: user.security_questions_configured
    };
  }
  async changePassword(input: {
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    securityQuestions?: Array<{ question?: string; answer?: string }>;
  }) {
    const email = (input.email || '').trim().toLowerCase();
    const currentPassword = input.currentPassword || '';
    const newPassword = input.newPassword || '';
    const securityQuestions = input.securityQuestions || [];

    if (!email || !currentPassword || !newPassword) {
      throw new BadRequestException('email, currentPassword and newPassword are required');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('newPassword must be at least 8 characters');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('new password must be different from current password');
    }

    const userResult = await this.db.query<{
      id: string;
      password_hash: string;
      must_change_password: boolean;
      security_questions_configured: boolean;
    }>(
      `SELECT id, password_hash, must_change_password, security_questions_configured
       FROM users
       WHERE email = $1`,
      [email]
    );

    const user = userResult.rows[0];
    if (!user) {
      throw new UnauthorizedException('invalid credentials');
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('invalid credentials');
    }

    const mustSetupQuestions = user.must_change_password || !user.security_questions_configured;
    if (mustSetupQuestions) {
      this.validateSecurityQuestions(securityQuestions);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.db.query('BEGIN');
    try {
      await this.db.query(
        `UPDATE users
         SET password_hash = $1,
             must_change_password = FALSE,
             updated_at = NOW()
         WHERE id = $2`,
        [passwordHash, user.id]
      );

      if (mustSetupQuestions) {
        await this.saveSecurityQuestions(user.id, securityQuestions);
        await this.db.query(
          `UPDATE users SET security_questions_configured = TRUE WHERE id = $1`,
          [user.id]
        );
      }

      await this.db.query(
        `UPDATE auth_refresh_tokens SET revoked = TRUE WHERE user_id = $1`,
        [user.id]
      );
      await this.db.query('COMMIT');
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw error;
    }

    return { message: 'password updated successfully' };
  }

  async getSecurityQuestions(input: { email?: string }) {
    const email = (input.email || '').trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('email is required');
    }

    const userResult = await this.db.query<{
      id: string;
      security_questions_configured: boolean;
    }>(
      `SELECT id, security_questions_configured FROM users WHERE email = $1`,
      [email]
    );

    const user = userResult.rows[0];
    if (!user || !user.security_questions_configured) {
      return { questions: [] as string[] };
    }

    const questionsResult = await this.db.query<{ question: string }>(
      `SELECT question
       FROM auth_security_questions
       WHERE user_id = $1
       ORDER BY position ASC`,
      [user.id]
    );

    return {
      questions: questionsResult.rows.map((row) => row.question)
    };
  }

  async resetPasswordWithSecurityQuestions(input: {
    email?: string;
    answers?: string[];
    newPassword?: string;
  }) {
    const email = (input.email || '').trim().toLowerCase();
    const answers = (input.answers || []).map((value) => value.trim());
    const newPassword = input.newPassword || '';

    if (!email || answers.length < 2 || !newPassword) {
      throw new BadRequestException('email, two answers and newPassword are required');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('newPassword must be at least 8 characters');
    }

    const userResult = await this.db.query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1 AND security_questions_configured = TRUE`,
      [email]
    );

    const user = userResult.rows[0];
    if (!user) {
      throw new UnauthorizedException('security questions not configured');
    }

    const questionsResult = await this.db.query<{ answer_hash: string }>(
      `SELECT answer_hash
       FROM auth_security_questions
       WHERE user_id = $1
       ORDER BY position ASC`,
      [user.id]
    );

    if (questionsResult.rows.length < 2) {
      throw new UnauthorizedException('security questions not configured');
    }

    const answersValid = await Promise.all(
      questionsResult.rows.map((row, index) =>
        bcrypt.compare(answers[index].toLowerCase(), row.answer_hash)
      )
    );

    if (!answersValid.every(Boolean)) {
      throw new UnauthorizedException('incorrect security answers');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.db.query('BEGIN');
    try {
      // Vérifier s'il y a déjà une demande en attente
      const existingRequest = await this.db.query(
        `SELECT id FROM password_change_requests WHERE user_id = $1 AND status = 'pending'`,
        [user.id]
      );
      if (existingRequest.rows.length > 0) {
        throw new BadRequestException('There is already a pending password change request');
      }

      // Créer la demande de changement de mdp
      await this.db.query(
        `INSERT INTO password_change_requests (user_id, new_password_hash, status) VALUES ($1, $2, 'pending')`,
        [user.id, passwordHash]
      );

      await this.db.query('COMMIT');
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw error;
    }

    return { message: 'Password change request submitted successfully. Please wait for admin approval.' };
  }

  async refresh(input: { refreshToken?: string }) {
    const refreshToken = input.refreshToken || '';
    if (!refreshToken) {
      throw new BadRequestException('refreshToken is required');
    }

    const payload = this.verifyRefreshToken(refreshToken);
    const refreshHash = this.sha256(refreshToken);

    const tokenRow = await this.db.query<{
      id: string;
      user_id: string;
      revoked: boolean;
      expires_at: string;
    }>(
      `SELECT id, user_id, revoked, expires_at
       FROM auth_refresh_tokens
       WHERE token_hash = $1`,
      [refreshHash]
    );

    const stored = tokenRow.rows[0];
    if (!stored || stored.revoked || new Date(stored.expires_at).getTime() <= Date.now()) {
      throw new UnauthorizedException('invalid refresh token');
    }

    const userResult = await this.db.query<{
      id: string;
      email: string;
      role: UserRole;
      is_active: boolean;
    }>(
      `SELECT id, email, role, is_active FROM users WHERE id = $1`,
      [payload.sub]
    );

    const user = userResult.rows[0];
    if (!user || !user.is_active) {
      throw new UnauthorizedException('user not found or inactive');
    }

    await this.db.query(`UPDATE auth_refresh_tokens SET revoked = TRUE WHERE id = $1`, [stored.id]);

    return this.issueTokenPair(user.id, user.email, user.role);
  }

  async requestPasswordOtp(input: { email?: string }) {
    const email = (input.email || '').trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('email is required');
    }

    const userResult = await this.db.query<{ id: string; email: string }>(
      `SELECT id, email FROM users WHERE email = $1`,
      [email]
    );

    const user = userResult.rows[0];
    if (!user) {
      return {
        message: 'If an account exists, an OTP has been generated.'
      };
    }

    const otp = String(randomInt(100000, 1000000));
    const otpHash = this.sha256(otp);
    const ttlMinutes = Number(process.env.OTP_TTL_MINUTES || 10);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.db.query(
      `INSERT INTO auth_otps (user_id, purpose, otp_hash, expires_at)
       VALUES ($1, 'PASSWORD_RESET', $2, $3)`,
      [user.id, otpHash, expiresAt.toISOString()]
    );

    const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';

    return {
      message: 'OTP generated. Email delivery to be plugged in Notification Service.',
      ...(isProd ? {} : { devOtp: otp }),
      expiresAt: expiresAt.toISOString()
    };
  }

  async verifyPasswordOtp(input: { email?: string; otp?: string }) {
    const email = (input.email || '').trim().toLowerCase();
    const otp = (input.otp || '').trim();

    if (!email || !otp) {
      throw new BadRequestException('email and otp are required');
    }

    const userResult = await this.db.query<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [email]);
    const user = userResult.rows[0];

    if (!user) {
      throw new UnauthorizedException('invalid otp');
    }

    const otpRow = await this.db.query<{ id: string; expires_at: string; consumed: boolean }>(
      `SELECT id, expires_at, consumed
       FROM auth_otps
       WHERE user_id = $1
         AND purpose = 'PASSWORD_RESET'
         AND otp_hash = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id, this.sha256(otp)]
    );

    const record = otpRow.rows[0];
    if (!record || record.consumed || new Date(record.expires_at).getTime() <= Date.now()) {
      throw new UnauthorizedException('invalid otp');
    }

    return { valid: true };
  }

  async resetPassword(input: { email?: string; otp?: string; newPassword?: string }) {
    const email = (input.email || '').trim().toLowerCase();
    const otp = (input.otp || '').trim();
    const newPassword = input.newPassword || '';

    if (!email || !otp || !newPassword) {
      throw new BadRequestException('email, otp and newPassword are required');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('newPassword must be at least 8 characters');
    }

    const userResult = await this.db.query<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [email]);
    const user = userResult.rows[0];

    if (!user) {
      throw new NotFoundException('user not found');
    }

    const otpRow = await this.db.query<{ id: string; expires_at: string; consumed: boolean }>(
      `SELECT id, expires_at, consumed
       FROM auth_otps
       WHERE user_id = $1
         AND purpose = 'PASSWORD_RESET'
         AND otp_hash = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id, this.sha256(otp)]
    );

    const record = otpRow.rows[0];
    if (!record || record.consumed || new Date(record.expires_at).getTime() <= Date.now()) {
      throw new UnauthorizedException('invalid otp');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.db.query('BEGIN');
    try {
      // Vérifier s'il y a déjà une demande en attente
      const existingRequest = await this.db.query(
        `SELECT id FROM password_change_requests WHERE user_id = $1 AND status = 'pending'`,
        [user.id]
      );
      if (existingRequest.rows.length > 0) {
        throw new BadRequestException('There is already a pending password change request');
      }

      // Créer la demande de changement de mdp
      await this.db.query(
        `INSERT INTO password_change_requests (user_id, new_password_hash, status) VALUES ($1, $2, 'pending')`,
        [user.id, passwordHash]
      );

      // Marquer l'OTP comme consommé
      await this.db.query(
        `UPDATE auth_otps SET consumed = TRUE WHERE id = $1`,
        [record.id]
      );

      await this.db.query('COMMIT');
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw error;
    }

    return { message: 'Password change request submitted successfully. Please wait for admin approval.' };
  }

  private async issueTokenPair(userId: string, email: string, role: UserRole) {
    const accessSecret = process.env.JWT_SECRET || 'dev-access-secret';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      role,
      type: 'access'
    };

    const refreshPayload: JwtPayload = {
      sub: userId,
      email,
      role,
      type: 'refresh'
    };

    const accessToken = jwt.sign(accessPayload, accessSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign(refreshPayload, refreshSecret, { expiresIn: '7d' });
    const refreshTokenHash = this.sha256(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.db.query(
      `INSERT INTO auth_refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, refreshTokenHash, expiresAt.toISOString()]
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900
    };
  }

  private verifyRefreshToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret') as JwtPayload;
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('invalid token type');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('invalid refresh token');
    }
  }

  private validateSecurityQuestions(securityQuestions: Array<{ question?: string; answer?: string }>) {
    if (securityQuestions.length < 2) {
      throw new BadRequestException('two security questions are required');
    }

    for (const item of securityQuestions.slice(0, 2)) {
      const question = (item.question || '').trim();
      const answer = (item.answer || '').trim();

      if (question.length < 5 || answer.length < 2) {
        throw new BadRequestException('each security question and answer must be filled');
      }
    }
  }

  private async saveSecurityQuestions(
    userId: string,
    securityQuestions: Array<{ question?: string; answer?: string }>
  ) {
    await this.db.query(`DELETE FROM auth_security_questions WHERE user_id = $1`, [userId]);

    for (const [index, item] of securityQuestions.slice(0, 2).entries()) {
      const question = (item.question || '').trim();
      const answerHash = await bcrypt.hash((item.answer || '').trim().toLowerCase(), 10);

      await this.db.query(
        `INSERT INTO auth_security_questions (user_id, question, answer_hash, position)
         VALUES ($1, $2, $3, $4)`,
        [userId, question, answerHash, index + 1]
      );
    }
  }

  // --- Admin endpoints ---
  async getAllUsers() {
    const result = await this.db.query<{
      id: string;
      email: string;
      role: UserRole;
      is_active: boolean;
      is_blocked: boolean;
      created_at: string;
    }>(`SELECT id, email, role, is_active, is_blocked, created_at FROM users ORDER BY created_at DESC`);
    return { users: result.rows };
  }

  async toggleUserBlock(input: { userId?: string; blocked?: boolean }) {
    const userId = input.userId || '';
    const blocked = input.blocked || false;

    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const result = await this.db.query<{
      id: string;
      email: string;
      is_blocked: boolean;
    }>(
      `UPDATE users SET is_blocked = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, is_blocked`,
      [blocked, userId]
    );

    if (!result.rows[0]) {
      throw new NotFoundException('user not found');
    }

    if (blocked) {
      await this.db.query(`UPDATE auth_refresh_tokens SET revoked = TRUE WHERE user_id = $1`, [userId]);
    }

    return {
      user: result.rows[0],
      message: blocked ? 'Account blocked successfully' : 'Account unblocked successfully'
    };
  }

  // --- Password change requests ---
  async requestPasswordChange(input: { userId?: string; newPassword?: string }) {
    const userId = input.userId || '';
    const newPassword = input.newPassword || '';

    if (!userId || !newPassword) {
      throw new BadRequestException('userId and newPassword are required');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('newPassword must be at least 8 characters');
    }

    const userResult = await this.db.query<{ id: string }>(`SELECT id FROM users WHERE id = $1`, [userId]);
    if (!userResult.rows[0]) {
      throw new NotFoundException('user not found');
    }

    // Check if there's already a pending request
    const existingResult = await this.db.query<{ id: string }>(
      `SELECT id FROM password_change_requests WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );
    if (existingResult.rows.length > 0) {
      throw new BadRequestException('There is already a pending password change request');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.db.query(
      `INSERT INTO password_change_requests (user_id, new_password_hash, status) VALUES ($1, $2, 'pending')`,
      [userId, passwordHash]
    );

    return { message: 'Password change request submitted successfully' };
  }

  async getPendingPasswordChangeRequests() {
    const result = await this.db.query<PasswordChangeRequest & { email: string }>(
      `SELECT pcr.id, pcr.user_id, pcr.status, pcr.created_at, pcr.updated_at, u.email
       FROM password_change_requests pcr
       JOIN users u ON pcr.user_id = u.id
       WHERE pcr.status = 'pending'
       ORDER BY pcr.created_at DESC`
    );
    return { requests: result.rows };
  }

  async approvePasswordChange(input: { requestId?: string }) {
    const requestId = input.requestId || '';

    if (!requestId) {
      throw new BadRequestException('requestId is required');
    }

    const requestResult = await this.db.query<{ id: string; user_id: string; new_password_hash: string }>(
      `SELECT id, user_id, new_password_hash FROM password_change_requests WHERE id = $1 AND status = 'pending'`,
      [requestId]
    );

    const request = requestResult.rows[0];
    if (!request) {
      throw new NotFoundException('pending request not found');
    }

    await this.db.query('BEGIN');
    try {
      await this.db.query(
        `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
        [request.new_password_hash, request.user_id]
      );
      await this.db.query(
        `UPDATE password_change_requests SET status = 'approved', updated_at = NOW() WHERE id = $1`,
        [requestId]
      );
      await this.db.query(
        `UPDATE auth_refresh_tokens SET revoked = TRUE WHERE user_id = $1`,
        [request.user_id]
      );
      await this.db.query('COMMIT');
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw error;
    }

    return { message: 'Password change approved successfully' };
  }

  async rejectPasswordChange(input: { requestId?: string }) {
    const requestId = input.requestId || '';

    if (!requestId) {
      throw new BadRequestException('requestId is required');
    }

    const result = await this.db.query(
      `UPDATE password_change_requests SET status = 'rejected', updated_at = NOW() WHERE id = $1 AND status = 'pending'`,
      [requestId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('pending request not found');
    }

    return { message: 'Password change rejected successfully' };
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}

