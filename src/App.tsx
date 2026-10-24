import React, { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { MobileContainer } from './components/common/MobileContainer';
import { BottomNav } from './components/common/BottomNav';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { UploadScreen } from './components/screens/UploadScreen';
import { ExtractedDetailsScreen } from './components/screens/ExtractedDetailsScreen';
import { ReviewEmailScreen } from './components/screens/ReviewEmailScreen';
import { ConfirmSendModal } from './components/screens/ConfirmSendModal';
import { SuccessScreen } from './components/screens/SuccessScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { ApplicationDetailModal } from './components/modals/ApplicationDetailModal';

import {
  initialUserProfile,
  initialSettings,
  defaultExtractedJob
} from './mock/initialData';

import {
  ScreenName,
  UserProfile,
  AppSettings,
  ApplicationRecord,
  ExtractedJobDetails,
  ApplicationStatus
} from './types';
import {
  createApplication,
  deleteApplication,
  downloadResume,
  loadWorkspace,
  saveProfile,
  saveSettings,
  updateApplication,
  uploadResume
} from './services/dataService';
import { GmailDeliveryUncertainError, googleOAuthScopes, sendGmailMessage } from './services/gmailService';
import { isSupabaseConfigured, supabase } from './services/supabaseClient';
import { deleteSharedImage, loadSharedImage } from './services/sharedImageService';

export const App: React.FC = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const initialScreenParam = searchParams.get('screen') as ScreenName | null;
  const sharedImageId = searchParams.get('sharedImage');
  const sharedImageError = searchParams.get('shareError');
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('welcome');
  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [gmailAccessToken, setGmailAccessToken] = useState<string | null>(null);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(isSupabaseConfigured);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Active Flow State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [startCropOnUpload, setStartCropOnUpload] = useState(false);
  const [sharedFileError, setSharedFileError] = useState<string | null>(null);
  const [extractedJob, setExtractedJob] = useState<ExtractedJobDetails>(defaultExtractedJob);

  // Email Draft State
  const [emailRecipient, setEmailRecipient] = useState(defaultExtractedJob.email);
  const [emailSubject, setEmailSubject] = useState(`Application for ${defaultExtractedJob.role} Role`);
  const [emailBody, setEmailBody] = useState(
    `Hi Hiring Team,\n\nI came across your job posting for the ${defaultExtractedJob.role} role at ${defaultExtractedJob.company} and I'm very interested in this opportunity.\n\nI currently work as an SDET with experience in Java, automation, and backend technologies. I'm excited about the possibility of joining your team and contributing to your products.\n\nI have attached my resume for your consideration.\n\nLooking forward to hearing from you.\n\nBest regards,\n${userProfile.fullName}`
  );

  // Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [resumeAttached, setResumeAttached] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [successWarning, setSuccessWarning] = useState<string | null>(null);
  const [selectedHistoryApp, setSelectedHistoryApp] = useState<ApplicationRecord | null>(null);

  useEffect(() => {
    if (!supabase) {
      setIsCheckingAuth(false);
      return;
    }

    let active = true;
    let receivedAuthChange = false;
    const requestedScreen = initialScreenParam && ['home', 'upload', 'extracted-details', 'review-email', 'sent-success', 'history', 'profile', 'settings'].includes(initialScreenParam)
      ? initialScreenParam
      : sharedImageId || sharedImageError
        ? 'upload'
        : 'home';
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      if (event === 'INITIAL_SESSION' && receivedAuthChange) return;
      if (event !== 'INITIAL_SESSION') receivedAuthChange = true;
      setSession(nextSession);
      setGmailAccessToken(nextSession?.provider_token || null);
      if (nextSession) setIntegrationError(null);
      if (event === 'INITIAL_SESSION') {
        setCurrentScreen(nextSession ? requestedScreen : 'welcome');
        setIsSigningIn(false);
        setIsCheckingAuth(false);
        return;
      }
      if (event === 'SIGNED_IN') setCurrentScreen(sharedImageId || sharedImageError ? 'upload' : 'home');
      if (event === 'SIGNED_OUT') setCurrentScreen('welcome');
      setIsSigningIn(false);
      setIsCheckingAuth(false);
    });

    supabase.auth.initialize().then(({ error }) => {
      if (!active || !error) return;
      setIntegrationError(`Google sign-in callback failed: ${error.message}`);
      setIsCheckingAuth(false);
    }).catch((error: Error) => {
      if (!active) return;
      setIntegrationError(`Google sign-in callback failed: ${error.message}`);
      setIsCheckingAuth(false);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active || receivedAuthChange) return;
      if (error) {
        setIntegrationError(`Could not restore your account session: ${error.message}`);
        setIsCheckingAuth(false);
        return;
      }
      setSession(data.session);
      setGmailAccessToken(data.session?.provider_token || null);
      if (data.session) setCurrentScreen(requestedScreen);
      setIsCheckingAuth(false);
    }).catch((error: Error) => {
      if (!active || receivedAuthChange) return;
      setIntegrationError(`Could not restore your account session: ${error.message}`);
      setIsCheckingAuth(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!sharedImageId || !session?.user) return;

    let active = true;
    loadSharedImage(sharedImageId)
      .then(async (file) => {
        if (!active) return;
        if (!file) throw new Error('The shared screenshot could not be found. Share it again from your photos.');

        const previewUrl = URL.createObjectURL(file);
        setUploadedFile(file);
        setUploadedPreview(previewUrl);
        setExtractedJob(defaultExtractedJob);
        setStartCropOnUpload(true);
        setSharedFileError(null);
        setCurrentScreen('upload');

        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('sharedImage');
        window.history.replaceState(null, '', `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);

        try {
          await deleteSharedImage(sharedImageId);
        } catch (error) {
          setSharedFileError(`Screenshot is ready, but temporary browser storage could not be cleared: ${(error as Error).message}`);
        }
      })
      .catch((error: Error) => {
        if (!active) return;
        setSharedFileError(error.message);
        setCurrentScreen('upload');
      });

    return () => {
      active = false;
    };
  }, [sharedImageId, session?.user.id]);

  useEffect(() => {
    if (!sharedImageError) return;
    const messages: Record<string, string> = {
      'missing-image': 'No screenshot was included. Try sharing the image from your gallery again.',
      'unsupported-image': 'ApplyMate accepts PNG, JPEG, or WebP screenshots.',
      'image-too-large': 'The shared screenshot is empty or larger than the 15 MB limit.',
      'share-unavailable': 'ApplyMate could not receive this screenshot. Try sharing it again or upload it manually.'
    };
    const message = messages[sharedImageError] || 'The shared screenshot could not be received. Upload it manually instead.';
    setSharedFileError(message);
    setIntegrationError(message);
    if (session?.user) {
      setCurrentScreen('upload');
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('shareError');
      window.history.replaceState(null, '', `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    }
  }, [sharedImageError, session?.user.id]);

  useEffect(() => {
    if (!session?.user) return;

    let active = true;
    setWorkspaceLoading(true);
    loadWorkspace(session.user.id, session.user.email || '')
      .then((workspace) => {
        if (!active) return;
        setUserProfile({
          ...workspace.profile,
          gmailConnected: Boolean(gmailAccessToken),
          gmailEmail: gmailAccessToken ? session.user.email || '' : ''
        });
        setSettings(workspace.settings);
        setApplications(workspace.applications);
        setIntegrationError(null);
      })
      .catch((error: Error) => {
        if (active) setIntegrationError(`Could not load your Supabase data: ${error.message}`);
      })
      .finally(() => {
        if (active) setWorkspaceLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.user.id, session?.user.email]);

  useEffect(() => {
    setUserProfile((profile) => ({
      ...profile,
      gmailConnected: Boolean(gmailAccessToken),
      gmailEmail: gmailAccessToken ? session?.user.email || '' : ''
    }));
  }, [gmailAccessToken, session?.user.email]);

  // Helper to generate dynamic application email
  const generateEmail = (job: ExtractedJobDetails) => {
    // Intersect detected job skills with user's skills or fallback
    const matched = userProfile.skills.filter(s =>
      job.skills.some(js => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
    );
    const matchedSkillsStr = matched.length > 0 ? matched.join(', ') : userProfile.skills.slice(0, 3).join(', ');

    const populatedBody = settings.emailTemplate
      .replace(/{role}/g, job.role || 'Software Engineer')
      .replace(/{company}/g, job.company || 'your team')
      .replace(/{matched_skills}/g, matchedSkillsStr)
      .replace(/{signature}/g, settings.emailSignature);

    setEmailRecipient(job.email);
    setEmailSubject(`Application for ${job.role} Role - ${userProfile.fullName}`);
    setEmailBody(populatedBody);
  };

  // Handle Image Selection
  const handleSelectImage = (file: File | null, previewUrl: string) => {
    setUploadedFile(file);
    setUploadedPreview(previewUrl);
    setStartCropOnUpload(false);
    setSharedFileError(null);
    setExtractedJob(defaultExtractedJob);
    generateEmail(defaultExtractedJob);
  };

  // Handle Extraction Completed (OCR or manual)
  const handleOcrExtracted = (details: ExtractedJobDetails) => {
    setExtractedJob(details);
    generateEmail(details);
    setCurrentScreen('extracted-details');
  };

  // Handle Confirmed Sending
  const handleSignInWithGoogle = async () => {
    if (!supabase) {
      setIntegrationError('Supabase is not configured. Copy .env.example to .env.local, add your Supabase URL and anon key, then restart the app.');
      return;
    }

    setIntegrationError(null);
    setIsSigningIn(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: googleOAuthScopes,
        queryParams: { access_type: 'online', prompt: 'consent' },
        redirectTo: `${window.location.origin}${window.location.pathname}${window.location.search}`
      }
    });
    if (error) {
      setIntegrationError(`Google connection failed: ${error.message}`);
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      setIntegrationError(`Could not disconnect Google: ${error.message}`);
      return;
    }
    setSession(null);
    setGmailAccessToken(null);
    setApplications([]);
    setUserProfile(initialUserProfile);
    setSettings(initialSettings);
  };

  const handleUpdateProfile = async (updated: UserProfile, resumeFile?: File): Promise<UserProfile> => {
    if (!session?.user) throw new Error('Connect your Google account in Settings before saving a profile or resume.');
    let profileToSave = { ...updated, gmailConnected: true, gmailEmail: session.user.email || '' };

    if (resumeFile) {
      const stored = await uploadResume(session.user.id, resumeFile);
      profileToSave = {
        ...profileToSave,
        resumeFileName: resumeFile.name,
        resumeFileSize: stored.size,
        resumeLastUpdated: new Date().toLocaleDateString(),
        resumeStoragePath: stored.path
      };
    }

    await saveProfile(session.user.id, profileToSave);
    setUserProfile(profileToSave);
    return profileToSave;
  };

  const handleSaveSettings = async (updated: AppSettings) => {
    if (!session?.user) throw new Error('Connect your Google account in Settings before saving settings to Supabase.');
    await saveSettings(session.user.id, updated);
    setSettings(updated);
  };

  const handleConfirmSend = async () => {
    if (isSending) return;
    if (!session?.user || !gmailAccessToken) {
      setSendError('Connect Google in Settings and grant Gmail send access before sending.');
      return;
    }
    if (!userProfile.resumeStoragePath) {
      setSendError('Upload your PDF resume from the Profile screen before sending.');
      return;
    }
    if (!resumeAttached) {
      setSendError('Attach your PDF resume to this email before sending.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRecipient.trim())) {
      setSendError('Enter a valid recipient email address before sending.');
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSuccessWarning(null);
    let pendingRecord: ApplicationRecord | null = null;

    try {
      const newApp: ApplicationRecord = {
        id: crypto.randomUUID(),
        companyName: extractedJob.company,
        jobTitle: extractedJob.role,
        recruiterEmail: emailRecipient,
        location: extractedJob.location,
        experience: extractedJob.experience,
        skills: extractedJob.skills,
        jobDescription: extractedJob.jobDescription,
        emailSubject: emailSubject,
        emailBody: emailBody,
        resumeFileName: userProfile.resumeFileName,
        resumeFileSize: userProfile.resumeFileSize,
        status: 'Sending',
        createdAt: new Date().toISOString(),
        companyLogoBg: '#4F46E5',
        companyInitial: extractedJob.company.charAt(0)
      };

      const createdRecord = await createApplication(session.user.id, newApp);
      pendingRecord = createdRecord;
      setApplications((current) => [createdRecord, ...current]);

      const resume = await downloadResume(userProfile.resumeStoragePath);
      const gmailMessageId = await sendGmailMessage(
        gmailAccessToken,
        emailRecipient,
        emailSubject,
        emailBody,
        resume,
        userProfile.resumeFileName,
        [extractedJob.role, extractedJob.company, ...extractedJob.skills]
      );
      const sentAt = new Date().toISOString();

      try {
        const sentRecord = await updateApplication(session.user.id, createdRecord.id, {
          status: 'Sent',
          sentAt,
          gmailMessageId,
          sendError: undefined
        });
        setApplications((current) => current.map((app) => app.id === sentRecord.id ? sentRecord : app));
      } catch (error) {
        const sentRecord = { ...createdRecord, status: 'Sent' as const, sentAt, gmailMessageId };
        setApplications((current) => current.map((app) => app.id === sentRecord.id ? sentRecord : app));
        setSuccessWarning(`Gmail sent the message, but Supabase could not update its history record: ${(error as Error).message}`);
      }

      setShowConfirmModal(false);
      setCurrentScreen('sent-success');
    } catch (error) {
      const message = (error as Error).message || 'Unknown error';
      if (pendingRecord) {
        try {
          const failedRecord = await updateApplication(session.user.id, pendingRecord.id, {
            status: error instanceof GmailDeliveryUncertainError ? 'Unknown' : 'Failed',
            sendError: message
          });
          setApplications((current) => current.map((app) => app.id === failedRecord.id ? failedRecord : app));
        } catch (recordError) {
          setSendError(`${message} The failed attempt could not be saved to Supabase: ${(recordError as Error).message}`);
          setIsSending(false);
          return;
        }
      }
      setSendError(message);
    } finally {
      setIsSending(false);
    }
  };

  // Update Status in History
  const handleUpdateApplicationStatus = async (id: string, status: ApplicationStatus) => {
    if (!session?.user) return;
    try {
      const updated = await updateApplication(session.user.id, id, { status });
      setApplications((current) => current.map((app) => app.id === id ? updated : app));
      setSelectedHistoryApp(updated);
    } catch (error) {
      setIntegrationError(`Could not update application status: ${(error as Error).message}`);
    }
  };

  // Delete Application from History
  const handleDeleteApplication = async (id: string) => {
    if (!session?.user) return;
    try {
      await deleteApplication(session.user.id, id);
      setApplications((current) => current.filter((app) => app.id !== id));
      setSelectedHistoryApp(null);
    } catch (error) {
      setIntegrationError(`Could not delete application: ${(error as Error).message}`);
    }
  };

  // Whether to show bottom navigation
  const showBottomNav =
    Boolean(session) && (currentScreen === 'home' || currentScreen === 'history' || currentScreen === 'profile');

  return (
    <MobileContainer showStatusBar={true}>
      {isCheckingAuth && (
        <div className="screen-scroll-container no-nav" role="status" aria-live="polite">
          Restoring your session…
        </div>
      )}

      {/* Screen 1: Welcome Screen */}
      {!isCheckingAuth && (!session || currentScreen === 'welcome') && (
        <WelcomeScreen
          isSupabaseConfigured={isSupabaseConfigured}
          isAuthenticating={isCheckingAuth || isSigningIn}
          authError={integrationError}
          onSignIn={handleSignInWithGoogle}
        />
      )}

      {/* Screen 2: Home Screen */}
      {!isCheckingAuth && session && currentScreen === 'home' && (
        <HomeScreen
          userProfile={userProfile}
          applications={applications}
          dailyTarget={settings.dailyApplicationTarget}
          onNavigate={(screen) => setCurrentScreen(screen)}
          onSelectImage={handleSelectImage}
          onOpenSettings={() => setCurrentScreen('settings')}
          onSelectApplication={(app) => setSelectedHistoryApp(app)}
        />
      )}

      {/* Screen 3: Upload Screenshot Screen */}
      {!isCheckingAuth && session && currentScreen === 'upload' && (
        <UploadScreen
          activeFile={uploadedFile}
          previewUrl={uploadedPreview}
          startInCropper={startCropOnUpload}
          sharedImageError={sharedFileError}
          onBack={() => setCurrentScreen('home')}
          onReplaceImage={(file) => {
            const url = URL.createObjectURL(file);
            handleSelectImage(file, url);
          }}
          onRemoveImage={() => {
            setUploadedFile(null);
            setUploadedPreview(null);
            setCurrentScreen('home');
          }}
          onExtractDetails={handleOcrExtracted}
        />
      )}

      {/* Screen 4: Extracted Job Details Screen */}
      {!isCheckingAuth && session && currentScreen === 'extracted-details' && (
        <ExtractedDetailsScreen
          details={extractedJob}
          onBack={() => setCurrentScreen('upload')}
          onUpdateDetails={(updated) => {
            setExtractedJob(updated);
            generateEmail(updated);
          }}
          onContinue={() => {
            setResumeAttached(Boolean(userProfile.resumeStoragePath));
            setCurrentScreen('review-email');
          }}
        />
      )}

      {/* Screen 5: Review Email Screen */}
      {!isCheckingAuth && session && currentScreen === 'review-email' && (
        <ReviewEmailScreen
          recipient={emailRecipient}
          subject={emailSubject}
          body={emailBody}
          userProfile={userProfile}
          hasResume={Boolean(userProfile.resumeStoragePath)}
          onBack={() => setCurrentScreen('extracted-details')}
          onUpdateEmail={(r, s, b) => {
            setEmailRecipient(r);
            setEmailSubject(s);
            setEmailBody(b);
          }}
          onResumeAttachmentChange={(attached) => setResumeAttached(attached)}
          onGoToProfile={() => setCurrentScreen('profile')}
          onRequestSend={() => {
            setSendError(null);
            setShowConfirmModal(true);
          }}
        />
      )}

      {/* Screen 7: Application Sent Screen */}
      {!isCheckingAuth && session && currentScreen === 'sent-success' && (
        <SuccessScreen
          company={extractedJob.company}
          role={extractedJob.role}
          recipient={emailRecipient}
          sentDate="Just now"
          warning={successWarning || undefined}
          onViewHistory={() => setCurrentScreen('history')}
          onApplyAnother={() => {
            setUploadedPreview(null);
            setCurrentScreen('home');
          }}
        />
      )}

      {/* Screen 8: Application History Screen */}
      {!isCheckingAuth && session && currentScreen === 'history' && (
        <HistoryScreen
          applications={applications}
          onSelectApplication={(app) => setSelectedHistoryApp(app)}
        />
      )}

      {/* Screen 9: Profile Screen */}
      {!isCheckingAuth && session && currentScreen === 'profile' && (
        <ProfileScreen
          userProfile={userProfile}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {/* Screen 10: Settings Screen */}
      {!isCheckingAuth && session && currentScreen === 'settings' && (
        <SettingsScreen
          settings={settings}
          userProfile={userProfile}
          onBack={() => setCurrentScreen('home')}
          onSaveSettings={handleSaveSettings}
          isSupabaseConfigured={isSupabaseConfigured}
          isGoogleConnected={Boolean(gmailAccessToken)}
          isAuthenticating={workspaceLoading || isSigningIn}
          integrationError={integrationError}
          onConnectGoogle={handleSignInWithGoogle}
          onSignOut={handleSignOut}
        />
      )}

      {/* Screen 6: Confirm and Send Modal Dialog */}
      {showConfirmModal && (
        <ConfirmSendModal
          company={extractedJob.company}
          role={extractedJob.role}
          recipient={emailRecipient}
          resumeFileName={userProfile.resumeFileName}
          resumeFileSize={userProfile.resumeFileSize}
          errorMessage={sendError}
          isResumeAttached={resumeAttached}
          isSending={isSending}
          onCancel={() => {
            if (!isSending) setShowConfirmModal(false);
          }}
          onConfirmSend={handleConfirmSend}
        />
      )}

      {/* Application Detail View Modal */}
      {selectedHistoryApp && (
        <ApplicationDetailModal
          application={selectedHistoryApp}
          errorMessage={integrationError}
          onClose={() => setSelectedHistoryApp(null)}
          onUpdateStatus={handleUpdateApplicationStatus}
          onDelete={handleDeleteApplication}
        />
      )}

      {/* Bottom Navigation for Home, History, and Profile tabs */}
      {showBottomNav && (
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={(screen) => setCurrentScreen(screen)}
        />
      )}
    </MobileContainer>
  );
};
