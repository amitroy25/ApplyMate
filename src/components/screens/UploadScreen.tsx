import React, { useRef, useState } from 'react';
import { ArrowLeft, RefreshCw, Trash2, ArrowRight, Loader2, MoreHorizontal, ThumbsUp, Heart, MessageSquare, AlertCircle, Crop } from 'lucide-react';
import { runOcrOnImage, parseJobText } from '../../services/ocrService';
import { preprocessImageForOcr } from '../../services/imagePreprocessor';
import { ExtractedJobDetails } from '../../types';
import { defaultExtractedJob } from '../../mock/initialData';
import { ImageCropper } from '../common/ImageCropper';

interface UploadScreenProps {
  activeFile: File | null;
  previewUrl: string | null;
  onBack: () => void;
  onReplaceImage: (file: File) => void;
  onRemoveImage: () => void;
  onExtractDetails: (details: ExtractedJobDetails) => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({
  activeFile,
  previewUrl,
  onBack,
  onReplaceImage,
  onRemoveImage,
  onExtractDetails
}) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<string>('');
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [showCropper, setShowCropper] = useState(false);
  // croppedUrl overrides previewUrl when set (used as OCR source)
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setErrorMessage(null);
      setCroppedUrl(null); // reset crop when new image is picked
      onReplaceImage(e.target.files[0]);
    }
  };

  const handleExtract = async () => {
    setIsExtracting(true);
    setErrorMessage(null);
    setOcrProgress(10);
    setOcrStatus('Enhancing image contrast...');

    try {
      if (activeFile || croppedUrl) {
        let imageSource: string;

        if (croppedUrl) {
          // Use the cropped data URL directly (already a data URL, no preprocessing needed)
          imageSource = croppedUrl;
          setOcrStatus('Using cropped region...');
          setOcrProgress(20);
        } else {
          // Step 1: Preprocess original file for maximum OCR accuracy
          imageSource = await preprocessImageForOcr(activeFile!);
        }

        setOcrStatus('Scanning text with OCR...');
        setOcrProgress(30);

        // Step 2: Run Tesseract on the image
        const ocrResult = await runOcrOnImage(imageSource, (p) => {
          setOcrStatus(p.status || 'Scanning image...');
          setOcrProgress(Math.round((p.progress || 0.4) * 100));
        });

        setOcrStatus('Extracting recruiter email & role...');
        setOcrProgress(95);

        const parsed = parseJobText(ocrResult.text, ocrResult.confidence);
        onExtractDetails(parsed);
      } else {
        // Sample post preset
        setOcrStatus('Scanning sample LinkedIn post...');
        setOcrProgress(60);

        setTimeout(() => {
          setOcrProgress(100);
          onExtractDetails(defaultExtractedJob);
        }, 600);
      }
    } catch (err: any) {
      console.error('OCR Error:', err);
      setErrorMessage('OCR engine encountered an issue. Falling back to manual entry.');
      setTimeout(() => {
        onExtractDetails(defaultExtractedJob);
      }, 1000);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCropDone = (dataUrl: string) => {
    setCroppedUrl(dataUrl);
    setShowCropper(false);
  };

  const isSamplePost = !previewUrl || previewUrl === 'sample-linkedin-post';
  // What we actually show in preview — cropped overrides original
  const displayUrl = croppedUrl || previewUrl;

  return (
    <div className="screen-scroll-container no-nav" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* Crop Modal — full-screen overlay */}
      {showCropper && previewUrl && (
        <ImageCropper
          imageUrl={previewUrl}
          onCrop={handleCropDone}
          onCancel={() => setShowCropper(false)}
        />
      )}
      <div>
        {/* Header */}
        <div className="app-header">
          <button onClick={onBack} className="back-btn" aria-label="Go back" type="button">
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
            Upload Screenshot
          </h2>
          <div style={{ width: '38px' }} />
        </div>

        {/* Hidden replacement file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/jpg"
          style={{ display: 'none' }}
        />

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Error Banner if any */}
          {errorMessage && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#991B1B'
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Screenshot Display Card */}
          <div
            className="card"
            style={{
              padding: '0',
              overflow: 'hidden',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              boxShadow: 'var(--shadow-md)',
              position: 'relative'
            }}
          >
            {isSamplePost ? (
              /* High-fidelity LinkedIn Post Mockup */
              <div style={{ padding: '16px', backgroundColor: '#FFFFFF', fontSize: '13px', color: '#1E293B' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: '#2563EB',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      S
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>StartupX</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>3d • 🌐</div>
                    </div>
                  </div>
                  <MoreHorizontal size={18} color="#64748B" />
                </div>

                <div style={{ lineHeight: 1.5, color: '#334155' }}>
                  <p style={{ fontWeight: 600, marginBottom: '6px' }}>We're hiring! 🚀</p>
                  <p style={{ marginBottom: '8px' }}>
                    We are looking for a <strong>Software Engineer (Backend)</strong> to join our early stage startup. If you are passionate about building scalable products, we'd love to hear from you.
                  </p>
                  <ul style={{ paddingLeft: '18px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li>2-4 years of experience</li>
                    <li>Strong knowledge of Java / Spring Boot</li>
                    <li>Experience with microservices</li>
                    <li>Remote working</li>
                  </ul>
                  <p style={{ marginTop: '10px' }}>
                    Send your resume to<br />
                    <span style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                      careers@startupx.com
                    </span>
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '16px',
                    paddingTop: '10px',
                    borderTop: '1px solid #F1F5F9',
                    fontSize: '11px',
                    color: '#64748B'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ThumbsUp size={9} color="#FFFFFF" />
                      </span>
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#EF4444', marginLeft: '-4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Heart size={9} color="#FFFFFF" />
                      </span>
                    </div>
                    <span style={{ marginLeft: '4px', fontWeight: 600 }}>120</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MessageSquare size={13} />
                    <span>24 comments</span>
                  </div>
                </div>
              </div>
            ) : (
              /* User Uploaded Screenshot Display */
              <div style={{ position: 'relative', background: '#0F172A' }}>
                <div style={{ maxHeight: '380px', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={displayUrl!}
                    alt="Job Screenshot"
                    style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: '380px' }}
                  />
                </div>

                {/* Crop button — floating top-right over the image */}
                <button
                  type="button"
                  onClick={() => setShowCropper(true)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    background: 'rgba(15,23,42,0.75)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                  }}
                >
                  <Crop size={13} />
                  Crop
                </button>

                {/* "Cropped" badge shown after crop is applied */}
                {croppedUrl && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(79,70,229,0.4)'
                    }}
                  >
                    ✂ Cropped
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Row: Replace / Remove */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary"
              type="button"
            >
              <RefreshCw size={16} />
              <span>Replace Image</span>
            </button>

            <button
              onClick={onRemoveImage}
              className="btn-danger-outline"
              type="button"
            >
              <Trash2 size={16} />
              <span>Remove</span>
            </button>
          </div>

          {/* OCR Progress Indicator */}
          {isExtracting && (
            <div
              style={{
                backgroundColor: '#EEF2FF',
                border: '1px solid #C7D2FE',
                borderRadius: '14px',
                padding: '12px 14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                  {ocrStatus}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)' }}>
                  {ocrProgress}%
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  backgroundColor: '#E0E7FF',
                  borderRadius: '9999px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${ocrProgress}%`,
                    backgroundColor: 'var(--primary)',
                    borderRadius: '9999px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div style={{ padding: '20px' }}>
        <button
          onClick={handleExtract}
          disabled={isExtracting}
          className="btn-primary"
          style={{ height: '52px', borderRadius: '16px' }}
          type="button"
        >
          {isExtracting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Extracting Details...</span>
            </>
          ) : (
            <>
              <span>Extract Job Details</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
