import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Building2,
  Briefcase,
  Mail,
  MapPin,
  Clock,
  Code2,
  FileText,
  Send,
  ArrowRight,
  AlertCircle,
  X,
  Sparkles,
  Loader2,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ExtractedJobDetails } from '../../types';
import {
  fixJobDetailsWithAI,
  getSavedGeminiKey,
  getSavedOpenAIKey,
  saveGeminiKey,
  saveOpenAIKey
} from '../../services/aiService';

interface ExtractedDetailsScreenProps {
  details: ExtractedJobDetails;
  onBack: () => void;
  onUpdateDetails: (updated: ExtractedJobDetails) => void;
  onContinue: () => void;
}

export const ExtractedDetailsScreen: React.FC<ExtractedDetailsScreenProps> = ({
  details,
  onBack,
  onUpdateDetails,
  onContinue
}) => {
  const [editingField, setEditingField] = useState<keyof ExtractedJobDetails | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // AI Fix state
  const [isFixingWithAI, setIsFixingWithAI] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getSavedGeminiKey());
  const [openAiKeyInput, setOpenAiKeyInput] = useState(getSavedOpenAIKey());
  const [aiError, setAiError] = useState<string | null>(null);
  const [showRawOcr, setShowRawOcr] = useState(false);

  // Multi-role picker state
  const [showRolePicker, setShowRolePicker] = useState(false);
  // Multi-location picker state
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // AI loader cycling message
  const [aiStepMsg, setAiStepMsg] = useState('');

  const openEditor = (field: keyof ExtractedJobDetails, currentValue: string | string[]) => {
    setEditingField(field);
    setEditValue(Array.isArray(currentValue) ? currentValue.join(', ') : (currentValue as string) || '');
  };

  const handleSaveEdit = () => {
    if (!editingField) return;

    if (editingField === 'skills') {
      const skillsArray = editValue.split(',').map((s) => s.trim()).filter(Boolean);
      onUpdateDetails({ ...details, skills: skillsArray });
    } else {
      onUpdateDetails({ ...details, [editingField]: editValue });
    }
    setEditingField(null);
  };

  const handleTriggerAIFix = async (providedGeminiKey?: string, providedOpenAiKey?: string) => {
    const geminiKey = providedGeminiKey ?? getSavedGeminiKey();
    const openAiKey = providedOpenAiKey ?? getSavedOpenAIKey();
    if (!geminiKey && !openAiKey) {
      setShowApiKeyModal(true);
      return;
    }

    setIsFixingWithAI(true);
    setAiError(null);
    setAiSuccessMessage(null);

    // Cycle through step messages while AI is working
    const steps = [
      'Reading job details...',
      'Analyzing screenshot text...',
      'Extracting role & company...',
      'Finding recruiter email...',
      'Cross-checking with AI...',
      'Finalizing results...'
    ];
    let stepIdx = 0;
    setAiStepMsg(steps[0]);
    const stepTimer = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      setAiStepMsg(steps[stepIdx]);
    }, 900);

    try {
      const fixed = await fixJobDetailsWithAI(
        details.rawText || details.jobDescription,
        details,
        geminiKey,
        openAiKey
      );
      clearInterval(stepTimer);
      onUpdateDetails(fixed);
      setAiSuccessMessage('Job details fixed with AI!');
      setAiStepMsg('');
      setShowApiKeyModal(false);
      setTimeout(() => setAiSuccessMessage(null), 4000);
    } catch (err: any) {
      clearInterval(stepTimer);
      setAiStepMsg('');
      console.error('AI Fix error:', err);
      if (err instanceof Error && err.message === 'NO_API_KEY') {
        setShowApiKeyModal(true);
      } else {
        const message = err instanceof Error ? err.message : String(err);
        setAiError(message.replace('AI_REQUEST_FAILED: ', '') || 'Failed to connect to AI services. Check your API keys.');
      }
    } finally {
      setIsFixingWithAI(false);
    }
  };

  const handleSaveKeyAndFix = () => {
    if (!apiKeyInput.trim() && !openAiKeyInput.trim()) {
      setAiError('Enter a Gemini key, an OpenAI key, or both to continue.');
      return;
    }
    saveGeminiKey(apiKeyInput);
    saveOpenAIKey(openAiKeyInput);
    handleTriggerAIFix(apiKeyInput.trim(), openAiKeyInput.trim());
  };

  const isEmailMissing = !details.email || details.email.trim() === '';

  return (
    <div className="screen-scroll-container no-nav" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        {/* Top Header */}
        <div className="app-header">
          <button onClick={onBack} className="back-btn" aria-label="Go back" type="button">
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
            Extracted Job Details
          </h2>
          <div style={{ width: '38px' }} />
        </div>

        <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* AI Success Banner if applied */}
          {aiSuccessMessage ? (
            <div
              style={{
                background: 'linear-gradient(135deg, #EEF2FF 0%, #FAF5FF 100%)',
                border: '1.5px solid #C7D2FE',
                borderRadius: '14px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#4F46E5',
                fontSize: '13px',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.1)'
              }}
            >
              <Sparkles size={18} color="#7C3AED" />
              <span>{aiSuccessMessage}</span>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#DCFCE7',
                border: '1px solid #BBF7D0',
                borderRadius: '14px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <CheckCircle2 size={18} color="#16A34A" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#15803D' }}>
                Job details extracted successfully!
              </span>
            </div>
          )}

          {/* AI Error Alert if any */}
          {aiError && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '14px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              <AlertCircle size={18} color="#DC2626" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#991B1B', display: 'block' }}>
                  AI Fix Error
                </span>
                <span style={{ fontSize: '12px', color: '#B91C1C' }}>{aiError}</span>
              </div>
              <button onClick={() => setAiError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B' }}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Missing Email Warning if applicable */}
          {isEmailMissing && (
            <div
              style={{
                backgroundColor: '#FEF3C7',
                border: '1px solid #FDE68A',
                borderRadius: '14px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              <AlertCircle size={18} color="#D97706" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#B45309', display: 'block' }}>
                  Recruiter email missing or not detected
                </span>
                <span style={{ fontSize: '12px', color: '#92400E' }}>
                  Click the round <strong>✨ Fix with AI</strong> button below to automatically extract it, or edit manually.
                </span>
              </div>
            </div>
          )}

          {/* Candidate Emails Selector */}
          {details.candidateEmails && details.candidateEmails.length > 1 && (
            <div className="card" style={{ padding: '12px 16px', backgroundColor: '#F8FAFC' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Candidate emails found:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {details.candidateEmails.map((email) => (
                  <button
                    key={email}
                    onClick={() => onUpdateDetails({ ...details, email })}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: details.email === email ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      backgroundColor: details.email === email ? '#EEF2FF' : '#FFFFFF',
                      color: details.email === email ? 'var(--primary)' : 'var(--text-main)',
                      cursor: 'pointer'
                    }}
                    type="button"
                  >
                    {email}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Details Card List */}
          <div className="card" style={{ padding: '6px 16px', display: 'flex', flexDirection: 'column' }}>
            {/* Field: Company */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Building2 size={18} color="#6366F1" />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Company</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{details.company || 'Not detected'}</div>
                </div>
              </div>
              <button onClick={() => openEditor('company', details.company)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Edit
              </button>
            </div>

            {/* Field: Job Title — with multi-role picker if candidateRoles > 1 */}
            {(() => {
              const hasMultipleRoles = details.candidateRoles && details.candidateRoles.length > 1;
              return (
                <div style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Briefcase size={18} color="#6366F1" />
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Job Title</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                            {details.role || 'Not detected'}
                          </span>
                          {hasMultipleRoles && (
                            <button
                              type="button"
                              onClick={() => setShowRolePicker((v) => !v)}
                              title={`${details.candidateRoles!.length} roles found — tap to pick`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 7px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: 700,
                                border: '1.5px solid #C7D2FE',
                                backgroundColor: showRolePicker ? '#EEF2FF' : '#F5F3FF',
                                color: '#4F46E5',
                                cursor: 'pointer'
                              }}
                            >
                              <span>{details.candidateRoles!.length}</span>
                              {showRolePicker ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => openEditor('role', details.role)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                  </div>

                  {/* Inline Role Picker — shown when arrow tapped */}
                  {hasMultipleRoles && showRolePicker && (
                    <div
                      style={{
                        paddingBottom: '12px',
                        paddingLeft: '30px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                        Select a role:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {details.candidateRoles!.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              onUpdateDetails({ ...details, role: r });
                              setShowRolePicker(false);
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              border: details.role === r ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                              backgroundColor: details.role === r ? '#EEF2FF' : '#FFFFFF',
                              color: details.role === r ? 'var(--primary)' : 'var(--text-main)',
                              cursor: 'pointer'
                            }}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Field: Recruiter Email */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail size={18} color="#6366F1" />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Recruiter Email</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: details.email ? '#2563EB' : '#DC2626' }}>
                    {details.email || 'Email not found'}
                  </div>
                </div>
              </div>
              <button onClick={() => openEditor('email', details.email)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Edit
              </button>
            </div>

            {/* Field: Location — with multi-location picker if candidateLocations > 1 */}
            {(() => {
              const hasMultipleLocs = details.candidateLocations && details.candidateLocations.length > 1;
              return (
                <div style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <MapPin size={18} color="#6366F1" />
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Location</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                            {details.location || 'Remote / Unspecified'}
                          </span>
                          {hasMultipleLocs && (
                            <button
                              type="button"
                              onClick={() => setShowLocationPicker((v) => !v)}
                              title={`${details.candidateLocations!.length} locations found`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 7px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: 700,
                                border: '1.5px solid #BBF7D0',
                                backgroundColor: showLocationPicker ? '#DCFCE7' : '#F0FDF4',
                                color: '#16A34A',
                                cursor: 'pointer'
                              }}
                            >
                              <span>{details.candidateLocations!.length}</span>
                              {showLocationPicker ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => openEditor('location', details.location)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                  </div>

                  {/* Inline Location Picker */}
                  {hasMultipleLocs && showLocationPicker && (
                    <div style={{ paddingBottom: '12px', paddingLeft: '30px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        Select a location:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {details.candidateLocations!.map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => {
                              onUpdateDetails({ ...details, location: loc });
                              setShowLocationPicker(false);
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              border: details.location === loc ? '1.5px solid #16A34A' : '1px solid var(--border-color)',
                              backgroundColor: details.location === loc ? '#DCFCE7' : '#FFFFFF',
                              color: details.location === loc ? '#15803D' : 'var(--text-main)',
                              cursor: 'pointer'
                            }}
                          >
                            {loc}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Field: Experience */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={18} color="#6366F1" />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Experience</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{details.experience || 'Not specified'}</div>
                </div>
              </div>
              <button onClick={() => openEditor('experience', details.experience)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Edit
              </button>
            </div>

            {/* Field: Skills */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Code2 size={18} color="#6366F1" style={{ marginTop: '4px' }} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Skills</div>
                  <div>
                    {details.skills.map((skill) => (
                      <span key={skill} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => openEditor('skills', details.skills)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Edit
              </button>
            </div>

            {/* Field: Job Description */}
            <div style={{ padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="#6366F1" />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Job Description</span>
                </div>
                <button onClick={() => openEditor('jobDescription', details.jobDescription)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Edit
                </button>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.45 }}>
                {details.jobDescription}
              </p>
            </div>

            {/* Field: Application Instructions */}
            <div style={{ padding: '12px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Send size={16} color="#6366F1" />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Application Instruction</span>
                </div>
                <button onClick={() => openEditor('applicationInstructions', details.applicationInstructions)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Edit
                </button>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {details.applicationInstructions || 'Send resume by email'}
              </p>
            </div>
          </div>

          {/* Optional Raw OCR Inspector Drawer */}
          {details.rawText && (
            <div className="card" style={{ padding: '12px 14px', backgroundColor: '#F8FAFC' }}>
              <div
                onClick={() => setShowRawOcr(!showRawOcr)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  View Detected Screenshot Text ({details.rawText.length} chars)
                </span>
                {showRawOcr ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
              </div>

              {showRawOcr && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                  <pre
                    style={{
                      fontSize: '11px',
                      color: '#475569',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '140px',
                      overflowY: 'auto',
                      fontFamily: 'monospace',
                      lineHeight: 1.4
                    }}
                  >
                    {details.rawText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer: Round AI Button + Continue CTA */}
      <div style={{ padding: '16px 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'linear-gradient(180deg, rgba(245, 247, 252, 0) 0%, #F5F7FC 40%)' }}>
        {/* Round Shape Action Button to Fix All Content with AI */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => handleTriggerAIFix()}
            disabled={isFixingWithAI}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '12px 24px',
              borderRadius: '9999px', // round shape button
              background: isFixingWithAI
                ? 'linear-gradient(135deg, #6D28D9 0%, #4338CA 100%)'
                : 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              cursor: isFixingWithAI ? 'not-allowed' : 'pointer',
              boxShadow: isFixingWithAI
                ? '0 8px 20px rgba(124, 58, 237, 0.5)'
                : '0 8px 20px rgba(124, 58, 237, 0.35)',
              transition: 'all 0.2s ease',
              width: 'auto',
              opacity: isFixingWithAI ? 0.92 : 1
            }}
            type="button"
          >
            {isFixingWithAI ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                <span>{aiStepMsg || 'Working...'}</span>
              </>
            ) : (
              <>
                <Sparkles size={18} color="#FDE047" />
                <span>Fix All Content with AI</span>
              </>
            )}
          </button>
          {/* Animated progress dots shown while AI is running */}
          {isFixingWithAI && (
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#7C3AED',
                    animation: `aiDotBounce 1.2s ease-in-out ${i * 0.2}s infinite`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Primary Continue Button */}
        <button
          onClick={onContinue}
          className="btn-primary"
          style={{ height: '52px', borderRadius: '16px' }}
          type="button"
        >
          <span>Continue to Email</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Field Editor Modal */}
      {editingField && (
        <div className="modal-overlay" onClick={() => setEditingField(null)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                Edit {editingField}
              </h3>
              <button
                onClick={() => setEditingField(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {editingField === 'jobDescription' ? (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="textarea-field"
                rows={5}
                autoFocus
              />
            ) : (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="input-field"
                autoFocus
              />
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={() => setEditingField(null)}
                className="btn-secondary"
                style={{ flex: 1 }}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn-primary"
                style={{ flex: 1 }}
                type="button"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI API Key Setup Modal */}
      {showApiKeyModal && (
        <div className="modal-overlay" onClick={() => setShowApiKeyModal(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#7C3AED" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Set Up AI Fix
                </h3>
              </div>
              <button
                onClick={() => setShowApiKeyModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
              Add one or both keys. The Fix with AI button tries Gemini first and uses OpenAI if the Gemini request fails.
            </p>

            <div
              style={{
                backgroundColor: '#EEF2FF',
                border: '1px solid #C7D2FE',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '14px',
                fontSize: '12px',
                color: '#4338CA'
              }}
            >
              <span>Get a Gemini key: </span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ fontWeight: 700, color: '#4F46E5', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
              >
                <span>Google AI Studio</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="input-label">Gemini API Key (primary)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy... (optional if using OpenAI)"
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                  autoComplete="off"
                />
                <Key size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label className="input-label">OpenAI API Key (fallback)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={openAiKeyInput}
                  onChange={(e) => setOpenAiKeyInput(e.target.value)}
                  placeholder="sk-... (optional if using Gemini)"
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                  autoComplete="off"
                />
                <Key size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--primary)' }}
              >
                Get an OpenAI API key <ExternalLink size={11} />
              </a>
            </div>

            {aiError && (
              <div style={{ fontSize: '12px', color: '#DC2626', marginBottom: '12px' }}>
                {aiError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="btn-secondary"
                style={{ flex: 1 }}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKeyAndFix}
                disabled={isFixingWithAI}
                className="btn-primary"
                style={{ flex: 1.2, background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)' }}
                type="button"
              >
                {isFixingWithAI ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>Save Keys & Fix</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
