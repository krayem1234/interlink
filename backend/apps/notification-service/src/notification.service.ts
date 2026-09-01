import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostgresService } from './postgres.service';
@Injectable()
export class NotificationService {
  constructor(private readonly db: PostgresService) {}
  async list(userId: string) { const result = await this.db.query(`SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`, [userId]); return { notifications: result.rows }; }
  async markRead(id: string, userId: string) {
    const result = await this.db.query(`UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`, [id, userId]);
    if (!result.rows[0]) throw new NotFoundException('Notification not found');
    return { notification: result.rows[0] };
  }
  async markAllRead(userId: string) { await this.db.query(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1`, [userId]); return { message: 'Notifications marked as read' }; }
}
