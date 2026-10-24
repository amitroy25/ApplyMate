export type ApplicationStatus =
  | 'Draft'
  | 'Ready'
  | 'Sending'
  | 'Sent'
  | 'Failed'
  | 'Unknown'
  | 'Pending'
  | 'Interview'
  | 'Rejected'
  | 'No Reply';

export interface ExtractedJobDetails {
  company: string;
  role: string;
  candidateRoles?: string[];
  email: string;
  candidateEmails?: string[];
  location: string;
  candidateLocations?: string[];
  experience: string;
  skills: string[];
  jobDescription: string;
  applicationInstructions: string;
  confidence?: number;
  rawText?: string;
}

export interface ApplicationRecord {
  id: string;
  companyName: string;
  jobTitle: string;
  recruiterEmail: string;
  location: string;
  experience: string;
  skills: string[];
  jobDescription: string;
  applicationInstructions?: string;
  emailSubject: string;
  emailBody: string;
  resumeFileName: string;
  resumeFileSize: string;
  resumeStoragePath?: string;
  status: ApplicationStatus;
  createdAt: string;
  sentAt?: string;
  gmailMessageId?: string;
  sendError?: string;
  companyLogoBg?: string;
  companyInitial?: string;
}

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  currentRole: string;
  skills: string[];
  resumeFileName: string;
  resumeFileSize: string;
  resumeStoragePath?: string;
  resumeLastUpdated: string;
  gmailConnected: boolean;
  gmailEmail: string;
}

export interface AppSettings {
  emailSignature: string;
  emailTemplate: string;
  dailyApplicationTarget: number;
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  autoExtractOnUpload: boolean;
}

export type ScreenName =
  | 'welcome'
  | 'home'
  | 'upload'
  | 'extracted-details'
  | 'review-email'
  | 'sending'
  | 'sent-success'
  | 'history'
  | 'profile'
  | 'settings';
