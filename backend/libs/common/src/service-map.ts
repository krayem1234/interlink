export const SERVICE_MAP = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  student: process.env.STUDENT_SERVICE_URL || 'http://student-service:3002',
  company: process.env.COMPANY_SERVICE_URL || 'http://company-service:3003',
  offer: process.env.OFFER_SERVICE_URL || 'http://offer-service:3004',
  application: process.env.APPLICATION_SERVICE_URL || 'http://application-service:3005',
  messaging: process.env.MESSAGING_SERVICE_URL || 'http://messaging-service:3006',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3007'
} as const;
