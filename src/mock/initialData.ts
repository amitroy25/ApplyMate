import { ApplicationRecord, ExtractedJobDetails, UserProfile, AppSettings } from '../types';

export const initialUserProfile: UserProfile = {
  fullName: 'Amit Roy',
  email: 'amit.roy@gmail.com',
  phone: '+91 98765 43210',
  currentRole: 'SDET (Automation)',
  skills: ['Java', 'Appium', 'TestNG', 'Spring Boot'],
  resumeFileName: '',
  resumeFileSize: '',
  resumeLastUpdated: 'Oct 20, 2026',
  gmailConnected: false,
  gmailEmail: ''
};

export const initialSettings: AppSettings = {
  emailSignature: `Best regards,\nAmit Roy\n+91 98765 43210 | Bangalore, India`,
  emailTemplate: `Hi Hiring Team,

I came across your job posting for the {role} role at {company} and I'm very interested in this opportunity.

I currently work as an SDET with experience in {matched_skills} and software testing. I'm excited about the possibility of joining your team and contributing to your products.

I have attached my resume for your consideration.

Looking forward to hearing from you.

{signature}`,
  dailyApplicationTarget: 20,
  theme: 'light',
  notificationsEnabled: true,
  autoExtractOnUpload: false
};

export const initialApplications: ApplicationRecord[] = [
  {
    id: 'app-1',
    companyName: 'StartupX',
    jobTitle: 'Software Engineer (Backend)',
    recruiterEmail: 'careers@startupx.com',
    location: 'Remote',
    experience: '2-4 years',
    skills: ['Java', 'Spring Boot', 'Microservices'],
    jobDescription: 'We are looking for a Software Engineer to join our early stage startup. If you are passionate about building scalable products, we would love to hear from you.',
    emailSubject: 'Application for Software Engineer (Backend) Role',
    emailBody: `Hi Hiring Team,

I came across your job posting for the Software Engineer (Backend) role at StartupX and I'm very interested in this opportunity.

I currently work as an SDET with experience in Java, automation, and backend technologies. I'm excited about the possibility of joining your team and contributing to your products.

I have attached my resume for your consideration.

Looking forward to hearing from you.

Best regards,
Amit Roy`,
    resumeFileName: 'Resume.pdf',
    resumeFileSize: '512 KB',
    status: 'Sent',
    createdAt: 'Today, 10:30 AM',
    sentAt: 'Today, 10:32 AM',
    companyLogoBg: '#111827',
    companyInitial: 'X'
  },
  {
    id: 'app-2',
    companyName: 'CloudBuild',
    jobTitle: 'SDET',
    recruiterEmail: 'jobs@cloudbuild.dev',
    location: 'Bangalore / Hybrid',
    experience: '3-5 years',
    skills: ['Java', 'TestNG', 'Appium', 'Selenium'],
    jobDescription: 'Hiring experienced SDET to design end-to-end automated testing pipelines for our cloud deployment engine.',
    emailSubject: 'Application for SDET Position - Amit Roy',
    emailBody: `Hi Recruitment Team,

I am writing to apply for the SDET position at CloudBuild. With 3+ years in test automation with Java, Selenium, and TestNG, I am confident in adding value to your infrastructure.

Resume is attached.

Best regards,
Amit Roy`,
    resumeFileName: 'Resume.pdf',
    resumeFileSize: '512 KB',
    status: 'Pending',
    createdAt: 'Yesterday, 4:15 PM',
    companyLogoBg: '#2563EB',
    companyInitial: 'C'
  },
  {
    id: 'app-3',
    companyName: 'DevTools Inc.',
    jobTitle: 'QA Automation Engineer',
    recruiterEmail: 'talent@devtools.io',
    location: 'Remote (India)',
    experience: '2+ years',
    skills: ['API Testing', 'Java', 'CI/CD'],
    jobDescription: 'Looking for QA Automation Engineers to build regression suites and verify developer productivity tooling.',
    emailSubject: 'Application: QA Automation Engineer - Amit Roy',
    emailBody: `Hi DevTools Team,

Please find my application attached for the QA Automation Engineer opening. Looking forward to discussing how my testing expertise fits your mission.

Regards,
Amit Roy`,
    resumeFileName: 'Resume.pdf',
    resumeFileSize: '512 KB',
    status: 'No Reply',
    createdAt: 'Mar 10, 2026',
    companyLogoBg: '#7C3AED',
    companyInitial: 'K'
  },
  {
    id: 'app-4',
    companyName: 'NovaTech',
    jobTitle: 'Software Development Engineer',
    recruiterEmail: 'hr@novatech.co',
    location: 'Gurgaon, India',
    experience: '1-3 years',
    skills: ['Java', 'Spring', 'PostgreSQL'],
    jobDescription: 'Seeking ambitious developers for backend service optimization and high throughput microservices.',
    emailSubject: 'Application for Software Development Engineer - Amit Roy',
    emailBody: `Dear Hiring Manager,

I am pleased to submit my application for the Software Development Engineer role.

Attached is my updated resume.

Best regards,
Amit Roy`,
    resumeFileName: 'Resume.pdf',
    resumeFileSize: '512 KB',
    status: 'Sent',
    createdAt: 'Mar 8, 2026',
    sentAt: 'Mar 8, 2026, 11:15 AM',
    companyLogoBg: '#0F172A',
    companyInitial: 'M'
  },
  {
    id: 'app-5',
    companyName: 'Fintech Startup',
    jobTitle: 'SDET Lead',
    recruiterEmail: 'founder@fintechpay.ai',
    location: 'Remote',
    experience: '3+ years',
    skills: ['Appium', 'Mobile Automation', 'Java'],
    jobDescription: 'Leading mobile testing for high speed UPI payments and checkout sdk.',
    emailSubject: 'Application for SDET Lead - Amit Roy',
    emailBody: `Hi Founder,

I would love to help streamline mobile QA for your checkout SDK. Please review my resume.

Best,
Amit Roy`,
    resumeFileName: 'Resume.pdf',
    resumeFileSize: '512 KB',
    status: 'Interview',
    createdAt: 'Mar 5, 2026',
    sentAt: 'Mar 5, 2026',
    companyLogoBg: '#059669',
    companyInitial: 'A'
  }
];

export const defaultExtractedJob: ExtractedJobDetails = {
  company: 'StartupX',
  role: 'Software Engineer (Backend)',
  email: 'careers@startupx.com',
  candidateEmails: ['careers@startupx.com', 'founders@startupx.com'],
  location: 'Remote',
  experience: '2-4 years',
  skills: ['Java', 'Spring Boot', 'Microservices'],
  jobDescription: 'We are looking for a Software Engineer to join our early stage startup. If you are passionate about building scalable products, we\'d love to hear from you.',
  applicationInstructions: 'Send your resume to careers@startupx.com',
  confidence: 0.94
};
