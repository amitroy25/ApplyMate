import {
  AppSettings,
  ApplicationRecord,
  ApplicationStatus,
  UserProfile
} from '../types';
import { initialSettings, initialUserProfile } from '../mock/initialData';
import { requireSupabase } from './supabaseClient';

interface ProfileRow {
  full_name: string;
  email: string;
  phone: string;
  current_position: string;
  skills: string[];
  resume_file_name: string;
  resume_file_size: string;
  resume_last_updated: string;
  resume_storage_path: string | null;
}

interface SettingsRow {
  email_signature: string;
  email_template: string;
  daily_application_target: number;
  theme: AppSettings['theme'];
  notifications_enabled: boolean;
  auto_extract_on_upload: boolean;
}

interface ApplicationRow {
  id: string;
  company_name: string;
  job_title: string;
  recruiter_email: string;
  location: string;
  experience: string;
  skills: string[];
  job_description: string;
  application_instructions: string | null;
  email_subject: string;
  email_body: string;
  resume_file_name: string;
  resume_file_size: string;
  status: ApplicationStatus;
  created_at: string;
  sent_at: string | null;
  gmail_message_id: string | null;
  send_error: string | null;
}

function profileFromRow(row: ProfileRow, email: string): UserProfile {
  return {
    fullName: row.full_name,
    email,
    phone: row.phone,
    currentRole: row.current_position,
    skills: row.skills,
    resumeFileName: row.resume_file_name,
    resumeFileSize: row.resume_file_size,
    resumeLastUpdated: row.resume_last_updated,
    resumeStoragePath: row.resume_storage_path || undefined,
    gmailConnected: true,
    gmailEmail: email
  };
}

function settingsFromRow(row: SettingsRow): AppSettings {
  return {
    emailSignature: row.email_signature,
    emailTemplate: row.email_template,
    dailyApplicationTarget: row.daily_application_target,
    theme: row.theme,
    notificationsEnabled: row.notifications_enabled,
    autoExtractOnUpload: row.auto_extract_on_upload
  };
}

export function applicationFromRow(row: ApplicationRow): ApplicationRecord {
  return {
    id: row.id,
    companyName: row.company_name,
    jobTitle: row.job_title,
    recruiterEmail: row.recruiter_email,
    location: row.location,
    experience: row.experience,
    skills: row.skills,
    jobDescription: row.job_description,
    applicationInstructions: row.application_instructions || undefined,
    emailSubject: row.email_subject,
    emailBody: row.email_body,
    resumeFileName: row.resume_file_name,
    resumeFileSize: row.resume_file_size,
    status: row.status,
    createdAt: row.created_at,
    sentAt: row.sent_at || undefined,
    gmailMessageId: row.gmail_message_id || undefined,
    sendError: row.send_error || undefined
  };
}

function profileToRow(userId: string, profile: UserProfile) {
  return {
    user_id: userId,
    full_name: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    current_position: profile.currentRole,
    skills: profile.skills,
    resume_file_name: profile.resumeFileName,
    resume_file_size: profile.resumeFileSize,
    resume_last_updated: profile.resumeLastUpdated,
    resume_storage_path: profile.resumeStoragePath || null,
    updated_at: new Date().toISOString()
  };
}

function settingsToRow(userId: string, settings: AppSettings) {
  return {
    user_id: userId,
    email_signature: settings.emailSignature,
    email_template: settings.emailTemplate,
    daily_application_target: settings.dailyApplicationTarget,
    theme: settings.theme,
    notifications_enabled: settings.notificationsEnabled,
    auto_extract_on_upload: settings.autoExtractOnUpload,
    updated_at: new Date().toISOString()
  };
}

function applicationToRow(userId: string, app: ApplicationRecord) {
  return {
    id: app.id,
    user_id: userId,
    company_name: app.companyName,
    job_title: app.jobTitle,
    recruiter_email: app.recruiterEmail,
    location: app.location,
    experience: app.experience,
    skills: app.skills,
    job_description: app.jobDescription,
    application_instructions: app.applicationInstructions || null,
    email_subject: app.emailSubject,
    email_body: app.emailBody,
    resume_file_name: app.resumeFileName,
    resume_file_size: app.resumeFileSize,
    status: app.status,
    created_at: app.createdAt,
    sent_at: app.sentAt || null,
    gmail_message_id: app.gmailMessageId || null,
    send_error: app.sendError || null
  };
}

export async function loadWorkspace(userId: string, email: string): Promise<{
  profile: UserProfile;
  settings: AppSettings;
  applications: ApplicationRecord[];
}> {
  const client = requireSupabase();
  const [profileResult, settingsResult, applicationsResult] = await Promise.all([
    client.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    client.from('app_settings').select('*').eq('user_id', userId).maybeSingle(),
    client.from('applications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  ]);

  if (profileResult.error) throw profileResult.error;
  if (settingsResult.error) throw settingsResult.error;
  if (applicationsResult.error) throw applicationsResult.error;

  const defaultProfile: UserProfile = {
    ...initialUserProfile,
    fullName: email.split('@')[0],
    email,
    gmailConnected: true,
    gmailEmail: email,
    resumeFileName: '',
    resumeFileSize: '',
    resumeStoragePath: undefined
  };
  const profile = profileResult.data
    ? profileFromRow(profileResult.data as ProfileRow, email)
    : defaultProfile;
  const settings = settingsResult.data
    ? settingsFromRow(settingsResult.data as SettingsRow)
    : { ...initialSettings, dailyApplicationTarget: 20 };

  if (!profileResult.data) await saveProfile(userId, profile);
  if (!settingsResult.data) await saveSettings(userId, settings);

  return {
    profile,
    settings,
    applications: (applicationsResult.data || []).map((row) => applicationFromRow(row as ApplicationRow))
  };
}

export async function saveProfile(userId: string, profile: UserProfile): Promise<void> {
  const { error } = await requireSupabase()
    .from('profiles')
    .upsert(profileToRow(userId, profile), { onConflict: 'user_id' });
  if (error) throw error;
}

export async function saveSettings(userId: string, settings: AppSettings): Promise<void> {
  const { error } = await requireSupabase()
    .from('app_settings')
    .upsert(settingsToRow(userId, settings), { onConflict: 'user_id' });
  if (error) throw error;
}

export async function uploadResume(userId: string, file: File): Promise<{
  path: string;
  size: string;
}> {
  const allowedPdfTypes = new Set(['', 'application/pdf', 'application/x-pdf', 'application/octet-stream']);
  if (!file.name.toLowerCase().endsWith('.pdf') || !allowedPdfTypes.has(file.type.toLowerCase())) {
    throw new Error('Choose a PDF file for your resume.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Resume must be 10 MB or smaller.');
  }

  const client = requireSupabase();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await client.storage.from('resumes').upload(path, file, {
    contentType: 'application/pdf',
    upsert: false
  });
  if (error) throw new Error(`Could not upload resume for this account: ${error.message}`);

  return { path, size: `${Math.max(1, Math.round(file.size / 1024))} KB` };
}

export async function downloadResume(path: string): Promise<Blob> {
  const { data, error } = await requireSupabase().storage.from('resumes').download(path);
  if (error) throw error;
  return data;
}

export async function createApplication(userId: string, app: ApplicationRecord): Promise<ApplicationRecord> {
  const { data, error } = await requireSupabase()
    .from('applications')
    .insert(applicationToRow(userId, app))
    .select('*')
    .single();
  if (error) throw error;
  return applicationFromRow(data as ApplicationRow);
}

export async function updateApplication(
  userId: string,
  id: string,
  changes: Partial<ApplicationRecord>
): Promise<ApplicationRecord> {
  const row: Partial<ApplicationRow> = {};
  if (changes.status !== undefined) row.status = changes.status;
  if (changes.sentAt !== undefined) row.sent_at = changes.sentAt;
  if (changes.gmailMessageId !== undefined) row.gmail_message_id = changes.gmailMessageId;
  if (changes.sendError !== undefined) row.send_error = changes.sendError;
  const { data, error } = await requireSupabase()
    .from('applications')
    .update(row)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return applicationFromRow(data as ApplicationRow);
}

export async function deleteApplication(userId: string, id: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('applications')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}
