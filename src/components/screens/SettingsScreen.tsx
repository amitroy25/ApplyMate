import React, { useState } from 'react';
import { ArrowLeft, Mail, Bell, Sliders, Check, Save, Sparkles, Key, ExternalLink, Loader2 } from 'lucide-react';
import { AppSettings, UserProfile } from '../../types';
import {
  getSavedGeminiKey,
  getSavedOpenAIKey,
  saveGeminiKey,
  saveOpenAIKey
} from '../../services/aiService';

interface SettingsScreenProps {
  settings: AppSettings;
  userProfile: UserProfile;
  onBack: () => void;
  onSaveSettings: (updated: AppSettings) => Promise<void>;
  isSupabaseConfigured: boolean;
  isGoogleConnected: boolean;
  isAuthenticating: boolean;
  integrationError: string | null;
  onConnectGoogle: () => void;
  onSignOut: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  userProfile,
  onBack,
  onSaveSettings,
  isSupabaseConfigured,
  isGoogleConnected,
  isAuthenticating,
  integrationError,
  onConnectGoogle,
  onSignOut
}) => {
  const [formData, setFormData] = useState(settings);
  const [geminiKey, setGeminiKey] = useState(getSavedGeminiKey());
  const [openAiKey, setOpenAiKey] = useState(getSavedOpenAIKey());
  const [aiKeysSaved, setAiKeysSaved] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      saveGeminiKey(geminiKey);
      saveOpenAIKey(openAiKey);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSaveError(`Could not save your AI API keys: ${message}`);
      setIsSaving(false);
      return;
    }

    try {
      await onSaveSettings(formData);
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSaveError(`Could not save app settings: ${message}. Your AI API keys are saved in this browser.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAiKeys = () => {
    setSaveError(null);
    try {
      saveGeminiKey(geminiKey);
      saveOpenAIKey(openAiKey);
      if (getSavedGeminiKey() !== geminiKey.trim() || getSavedOpenAIKey() !== openAiKey.trim()) {
        throw new Error('The saved API keys could not be verified in this browser.');
      }
      setAiKeysSaved(true);
      setTimeout(() => setAiKeysSaved(false), 2500);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setAiKeysSaved(false);
      setSaveError(`Could not save your AI API keys: ${message}`);
    }
  };

  return (
    <div className="screen-scroll-container no-nav" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        {/* Header */}
        <div className="app-header">
          <button onClick={onBack} className="back-btn" aria-label="Go back" type="button">
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
            Settings
          </h2>
          <div style={{ width: '38px' }} />
        </div>

        <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Notification Alert if saved */}
          {savedNotification && (
            <div
              style={{
                backgroundColor: '#DCFCE7',
                border: '1px solid #BBF7D0',
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#15803D',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <Check size={16} />
              <span>Settings saved successfully!</span>
            </div>
          )}

          {(integrationError || saveError) && (
            <div role="alert" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '10px 14px', color: '#991B1B', fontSize: '12px' }}>
              {saveError || integrationError}
            </div>
          )}

          {/* Email Connection */}
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
              Email Connection
            </span>
            <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={18} color="var(--primary)" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>Gmail API OAuth</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {isGoogleConnected ? userProfile.gmailEmail : isSupabaseConfigured ? 'Google account not connected' : 'Supabase setup required'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={isGoogleConnected ? onSignOut : onConnectGoogle}
                disabled={!isSupabaseConfigured || isAuthenticating}
                className={isGoogleConnected ? 'btn-secondary' : 'btn-primary'}
                style={{ padding: '8px 10px', fontSize: '11px', width: 'auto', flexShrink: 0 }}
              >
                {isAuthenticating ? <Loader2 size={14} className="animate-spin" /> : isGoogleConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
            {!isSupabaseConfigured && (
              <span style={{ display: 'block', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                Configure Supabase and Google OAuth using the setup steps in README.md.
              </span>
            )}
          </div>

          {/* AI Fix Providers */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AI Fix Providers
              </span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
              >
                <span>Free Key</span>
                <ExternalLink size={11} />
              </a>
            </div>
            <div className="card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={16} color="#7C3AED" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Google Gemini API (primary)
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>
                    Free tier
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => {
                      setGeminiKey(e.target.value);
                      setAiKeysSaved(false);
                    }}
                    placeholder="Paste your Gemini API key (AIzaSy...)"
                    className="input-field"
                    style={{ paddingLeft: '34px', fontSize: '13px' }}
                    autoComplete="off"
                  />
                  <Key size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={16} color="#10A37F" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                    OpenAI API (fallback)
                  </span>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Get an OpenAI API key"
                    style={{ marginLeft: 'auto', color: 'var(--primary)', display: 'inline-flex' }}
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    value={openAiKey}
                    onChange={(e) => {
                      setOpenAiKey(e.target.value);
                      setAiKeysSaved(false);
                    }}
                    placeholder="Paste your OpenAI API key (sk-...)"
                    className="input-field"
                    style={{ paddingLeft: '34px', fontSize: '13px' }}
                    autoComplete="off"
                  />
                  <Key size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                Keys are saved only in this browser. Fix with AI tries Gemini first, then OpenAI if Gemini fails. OpenAI usage may be billed by OpenAI.
              </span>
              <button
                type="button"
                onClick={handleSaveAiKeys}
                className="btn-secondary"
                style={{ width: '100%', minHeight: '40px', fontSize: '13px' }}
              >
                <Key size={15} />
                <span>{aiKeysSaved ? 'API Keys Saved' : 'Save AI API Keys'}</span>
                {aiKeysSaved && <Check size={15} />}
              </button>
            </div>
          </div>

          {/* Default Email Signature */}
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
              Default Email Signature
            </span>
            <div className="card" style={{ padding: '12px 14px' }}>
              <textarea
                value={formData.emailSignature}
                onChange={(e) => setFormData({ ...formData, emailSignature: e.target.value })}
                rows={3}
                className="textarea-field"
                style={{ border: 'none', padding: '0', fontSize: '13px', minHeight: '60px' }}
              />
            </div>
          </div>

          {/* Default Application Email Template */}
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
              Default Application Email Template
            </span>
            <div className="card" style={{ padding: '12px 14px' }}>
              <textarea
                value={formData.emailTemplate}
                onChange={(e) => setFormData({ ...formData, emailTemplate: e.target.value })}
                rows={6}
                className="textarea-field"
                style={{ border: 'none', padding: '0', fontSize: '12px' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                Variables: {'{role}'}, {'{company}'}, {'{matched_skills}'}, {'{signature}'}. The sent email highlights these details; use **text** to bold other phrases.
              </span>
            </div>
          </div>

          {/* Daily Application Target */}
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
              Daily Application Goal
            </span>
            <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sliders size={18} color="var(--primary)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Target applications / day
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setFormData({ ...formData, dailyApplicationTarget: Math.max(1, formData.dailyApplicationTarget - 1) })}
                  className="btn-secondary"
                  style={{ width: '28px', height: '28px', padding: '0', borderRadius: '8px' }}
                  type="button"
                >
                  -
                </button>
                <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                  {formData.dailyApplicationTarget}
                </span>
                <button
                  onClick={() => setFormData({ ...formData, dailyApplicationTarget: Math.min(100, formData.dailyApplicationTarget + 1) })}
                  className="btn-secondary"
                  style={{ width: '28px', height: '28px', padding: '0', borderRadius: '8px' }}
                  type="button"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Toggle */}
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
              Notifications
            </span>
            <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bell size={18} color="var(--primary)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Application Reminders
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.notificationsEnabled}
                onChange={(e) => setFormData({ ...formData, notificationsEnabled: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ padding: '20px' }}>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary"
          style={{ height: '52px', borderRadius: '16px' }}
          type="button"
        >
          <Save size={18} />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
};
