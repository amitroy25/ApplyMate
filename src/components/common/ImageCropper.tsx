import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Check, CropIcon, RotateCcw } from 'lucide-react';

interface CropRect {
  x: number; // 0-1 fraction of displayed image
  y: number;
  w: number;
  h: number;
}

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

type Handle = 'tl' | 'tr' | 'bl' | 'br' | 'move' | null;

const MIN_FRAC = 0.08; // minimum crop size as fraction of image

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageUrl, onCrop, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Crop rect stored as fractions [0,1] of the displayed canvas size
  const [crop, setCrop] = useState<CropRect>({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });

  // Drag tracking
  const dragRef = useRef<{
    handle: Handle;
    startX: number;
    startY: number;
    origCrop: CropRect;
  } | null>(null);

  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  // ------------------------------------------------------------------
  // Draw helper
  // ------------------------------------------------------------------
  const draw = useCallback(
    (currentCrop: CropRect) => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img || !imgLoaded) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cw = canvas.width;
      const ch = canvas.height;

      // Draw image
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, 0, 0, cw, ch);

      // Dim outside crop
      const cx = currentCrop.x * cw;
      const cy = currentCrop.y * ch;
      const cWidth = currentCrop.w * cw;
      const cHeight = currentCrop.h * ch;

      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, cw, cy);                           // top
      ctx.fillRect(0, cy + cHeight, cw, ch - cy - cHeight); // bottom
      ctx.fillRect(0, cy, cx, cHeight);                     // left
      ctx.fillRect(cx + cWidth, cy, cw - cx - cWidth, cHeight); // right

      // Border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, cy, cWidth, cHeight);

      // Rule-of-thirds grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + (cWidth / 3) * i, cy);
        ctx.lineTo(cx + (cWidth / 3) * i, cy + cHeight);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy + (cHeight / 3) * i);
        ctx.lineTo(cx + cWidth, cy + (cHeight / 3) * i);
        ctx.stroke();
      }

      // Corner handles
      const hs = 14;
      const corners = [
        [cx, cy],
        [cx + cWidth - hs, cy],
        [cx, cy + cHeight - hs],
        [cx + cWidth - hs, cy + cHeight - hs]
      ];
      ctx.fillStyle = '#FFFFFF';
      corners.forEach(([hx, hy]) => ctx.fillRect(hx, hy, hs, hs));
    },
    [imgLoaded]
  );

  // Redraw whenever crop changes
  useEffect(() => {
    draw(crop);
  }, [crop, draw, canvasSize]);

  // ------------------------------------------------------------------
  // Load image + set canvas size
  // ------------------------------------------------------------------
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      const container = containerRef.current;
      if (!container) return;
      const maxW = container.clientWidth;
      const ratio = img.naturalHeight / img.naturalWidth;
      const displayW = maxW;
      const displayH = Math.min(maxW * ratio, 420);
      setCanvasSize({ w: displayW, h: displayH });
      setImgLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // ------------------------------------------------------------------
  // Pointer → canvas fraction helpers
  // ------------------------------------------------------------------
  function pointerFrac(e: React.PointerEvent | PointerEvent): { fx: number; fy: number } {
    const canvas = canvasRef.current;
    if (!canvas) return { fx: 0, fy: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      fx: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      fy: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    };
  }

  function hitHandle(fx: number, fy: number, c: CropRect): Handle {
    const THRESH = 0.06;
    const nearL = Math.abs(fx - c.x) < THRESH;
    const nearR = Math.abs(fx - (c.x + c.w)) < THRESH;
    const nearT = Math.abs(fy - c.y) < THRESH;
    const nearB = Math.abs(fy - (c.y + c.h)) < THRESH;

    if (nearL && nearT) return 'tl';
    if (nearR && nearT) return 'tr';
    if (nearL && nearB) return 'bl';
    if (nearR && nearB) return 'br';
    if (fx > c.x && fx < c.x + c.w && fy > c.y && fy < c.y + c.h) return 'move';
    return null;
  }

  // ------------------------------------------------------------------
  // Pointer events
  // ------------------------------------------------------------------
  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { fx, fy } = pointerFrac(e);
    const handle = hitHandle(fx, fy, crop);
    if (!handle) return;
    dragRef.current = { handle, startX: fx, startY: fy, origCrop: { ...crop } };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { handle, startX, startY, origCrop: o } = dragRef.current;
    const { fx, fy } = pointerFrac(e);
    const dx = fx - startX;
    const dy = fy - startY;

    setCrop((prev) => {
      let { x, y, w, h } = { ...prev };
      if (handle === 'move') {
        x = Math.max(0, Math.min(1 - o.w, o.x + dx));
        y = Math.max(0, Math.min(1 - o.h, o.y + dy));
        w = o.w;
        h = o.h;
      } else if (handle === 'tl') {
        x = Math.min(o.x + dx, o.x + o.w - MIN_FRAC);
        y = Math.min(o.y + dy, o.y + o.h - MIN_FRAC);
        w = o.w - (x - o.x);
        h = o.h - (y - o.y);
        x = Math.max(0, x); y = Math.max(0, y);
        w = Math.max(MIN_FRAC, w); h = Math.max(MIN_FRAC, h);
      } else if (handle === 'tr') {
        y = Math.min(o.y + dy, o.y + o.h - MIN_FRAC);
        h = o.h - (y - o.y);
        w = Math.max(MIN_FRAC, Math.min(1 - o.x, o.w + dx));
        y = Math.max(0, y); h = Math.max(MIN_FRAC, h);
      } else if (handle === 'bl') {
        x = Math.min(o.x + dx, o.x + o.w - MIN_FRAC);
        w = o.w - (x - o.x);
        h = Math.max(MIN_FRAC, Math.min(1 - o.y, o.h + dy));
        x = Math.max(0, x); w = Math.max(MIN_FRAC, w);
      } else if (handle === 'br') {
        w = Math.max(MIN_FRAC, Math.min(1 - o.x, o.w + dx));
        h = Math.max(MIN_FRAC, Math.min(1 - o.y, o.h + dy));
      }
      // Clamp to canvas bounds
      if (x + w > 1) w = 1 - x;
      if (y + h > 1) h = 1 - y;
      return { x, y, w, h };
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  // ------------------------------------------------------------------
  // Reset crop
  // ------------------------------------------------------------------
  const resetCrop = () => setCrop({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });

  // ------------------------------------------------------------------
  // Confirm — draw cropped region to a new canvas → dataURL
  // ------------------------------------------------------------------
  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const out = document.createElement('canvas');
    const srcX = crop.x * img.naturalWidth;
    const srcY = crop.y * img.naturalHeight;
    const srcW = crop.w * img.naturalWidth;
    const srcH = crop.h * img.naturalHeight;

    out.width = Math.round(srcW);
    out.height = Math.round(srcH);
    const ctx = out.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, out.width, out.height);
    onCrop(out.toDataURL('image/jpeg', 0.92));
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.88)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}
    >
      {/* Header */}
      <div
        style={{
          width: '100%', maxWidth: '412px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', color: '#FFFFFF'
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
        >
          <X size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
          <CropIcon size={17} color="#818CF8" />
          <span>Crop Screenshot</span>
        </div>
        <button
          type="button"
          onClick={resetCrop}
          title="Reset crop"
          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Tip */}
      <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '10px', textAlign: 'center' }}>
        Drag corners to resize · Drag inside to move
      </p>

      {/* Canvas */}
      <div ref={containerRef} style={{ width: '100%', maxWidth: '412px', touchAction: 'none' }}>
        {imgLoaded && canvasSize.w > 0 ? (
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            style={{ width: '100%', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        ) : (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
            Loading image...
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div
        style={{
          width: '100%', maxWidth: '412px',
          display: 'flex', gap: '14px',
          padding: '18px 20px'
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1, height: '48px', borderRadius: '14px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#CBD5E1', fontWeight: 700, fontSize: '14px', cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          style={{
            flex: 1.5, height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
            border: 'none',
            color: '#FFFFFF', fontWeight: 700, fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(124,58,237,0.45)'
          }}
        >
          <Check size={18} />
          Use Cropped Image
        </button>
      </div>
    </div>
  );
};
