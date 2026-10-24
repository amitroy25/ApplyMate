import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Check, CropIcon, Minus, Plus, RotateCcw, RotateCw } from 'lucide-react';

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
  fileName?: string;
  fileSize?: number;
}

type Handle = 'tl' | 'tm' | 'tr' | 'ml' | 'mr' | 'bl' | 'bm' | 'br' | 'move' | null;

const MIN_FRAC = 0.08; // minimum crop size as fraction of image

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageUrl, onCrop, onCancel, fileName, fileSize }) => {
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
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const rotatedDimensions = (img: HTMLImageElement) => (
    rotation % 180 === 0
      ? { w: img.naturalWidth, h: img.naturalHeight }
      : { w: img.naturalHeight, h: img.naturalWidth }
  );

  const drawTransformedImage = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    width: number,
    height: number,
    scale: number
  ) => {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
  };

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

      // Draw the rotated and zoomed image inside the fixed crop viewport.
      ctx.clearRect(0, 0, cw, ch);
      const dimensions = rotatedDimensions(img);
      const scale = Math.min(cw / dimensions.w, ch / dimensions.h) * zoom;
      drawTransformedImage(ctx, img, cw, ch, scale);

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

      const markers = [
        [cx, cy], [cx + cWidth / 2, cy], [cx + cWidth, cy],
        [cx, cy + cHeight / 2], [cx + cWidth, cy + cHeight / 2],
        [cx, cy + cHeight], [cx + cWidth / 2, cy + cHeight], [cx + cWidth, cy + cHeight]
      ];
      markers.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#4F46E5';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 4, y);
        ctx.lineTo(x + 4, y);
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x, y + 4);
        ctx.strokeStyle = '#4F46E5';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      });
    },
    [imgLoaded, rotation, zoom]
  );

  // Redraw whenever crop changes
  useEffect(() => {
    draw(crop);
  }, [crop, draw, canvasSize]);

  // ------------------------------------------------------------------
  // Load image + set canvas size
  // ------------------------------------------------------------------
  useEffect(() => {
    let active = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!active) return;
      imgRef.current = img;
      const container = containerRef.current;
      if (!container) return;
      const maxW = container.clientWidth;
      const naturalW = rotation % 180 === 0 ? img.naturalWidth : img.naturalHeight;
      const naturalH = rotation % 180 === 0 ? img.naturalHeight : img.naturalWidth;
      const scale = Math.min(maxW / naturalW, 420 / naturalH);
      const displayW = Math.round(naturalW * scale);
      const displayH = Math.round(naturalH * scale);
      setCanvasSize({ w: displayW, h: displayH });
      setImgLoaded(true);
    };
    img.src = imageUrl;
    return () => {
      active = false;
    };
  }, [imageUrl, rotation]);

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
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    const thresholdX = rect ? 22 / rect.width : 0.06;
    const thresholdY = rect ? 22 / rect.height : 0.06;
    const nearL = Math.abs(fx - c.x) < thresholdX;
    const nearR = Math.abs(fx - (c.x + c.w)) < thresholdX;
    const nearT = Math.abs(fy - c.y) < thresholdY;
    const nearB = Math.abs(fy - (c.y + c.h)) < thresholdY;

    if (nearL && nearT) return 'tl';
    if (nearR && nearT) return 'tr';
    if (nearL && nearB) return 'bl';
    if (nearR && nearB) return 'br';
    if (nearT && fx > c.x + thresholdX && fx < c.x + c.w - thresholdX) return 'tm';
    if (nearB && fx > c.x + thresholdX && fx < c.x + c.w - thresholdX) return 'bm';
    if (nearL && fy > c.y + thresholdY && fy < c.y + c.h - thresholdY) return 'ml';
    if (nearR && fy > c.y + thresholdY && fy < c.y + c.h - thresholdY) return 'mr';
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
      } else {
        let left = o.x;
        let top = o.y;
        let right = o.x + o.w;
        let bottom = o.y + o.h;
        if (handle === 'tl' || handle === 'ml' || handle === 'bl') {
          left = Math.max(0, Math.min(right - MIN_FRAC, o.x + dx));
        }
        if (handle === 'tr' || handle === 'mr' || handle === 'br') {
          right = Math.min(1, Math.max(left + MIN_FRAC, o.x + o.w + dx));
        }
        if (handle === 'tl' || handle === 'tm' || handle === 'tr') {
          top = Math.max(0, Math.min(bottom - MIN_FRAC, o.y + dy));
        }
        if (handle === 'bl' || handle === 'bm' || handle === 'br') {
          bottom = Math.min(1, Math.max(top + MIN_FRAC, o.y + o.h + dy));
        }
        x = left;
        y = top;
        w = right - left;
        h = bottom - top;
      }
      return { x, y, w, h };
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  // ------------------------------------------------------------------
  // Reset crop
  // ------------------------------------------------------------------
  const resetCrop = () => {
    setZoom(1);
    setRotation(0);
    setCrop({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
  };

  const rotateImage = () => {
    setRotation((current) => (current + 90) % 360);
    setCrop({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
  };

  const updateZoom = (amount: number) => {
    setZoom((current) => Math.max(1, Math.min(3, Math.round((current + amount) * 10) / 10)));
  };

  // ------------------------------------------------------------------
  // Confirm — draw cropped region to a new canvas → dataURL
  // ------------------------------------------------------------------
  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const out = document.createElement('canvas');
    const dimensions = rotatedDimensions(img);
    const srcX = crop.x * dimensions.w;
    const srcY = crop.y * dimensions.h;
    const srcW = crop.w * dimensions.w;
    const srcH = crop.h * dimensions.h;

    out.width = Math.round(srcW);
    out.height = Math.round(srcH);
    const ctx = out.getContext('2d');
    if (!ctx) return;
    const transformed = document.createElement('canvas');
    transformed.width = dimensions.w;
    transformed.height = dimensions.h;
    const transformedContext = transformed.getContext('2d');
    if (!transformedContext) return;
    drawTransformedImage(transformedContext, img, dimensions.w, dimensions.h, zoom);
    ctx.drawImage(transformed, srcX, srcY, srcW, srcH, 0, 0, out.width, out.height);
    onCrop(out.toDataURL('image/jpeg', 0.92));
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        height: '100dvh',
        boxSizing: 'border-box',
        backgroundColor: '#090D16',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        overflowY: 'auto',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* Header */}
      <div
        style={{
          width: '100%', maxWidth: '412px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', color: '#FFFFFF', flexShrink: 0
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{ background: 'none', border: 'none', color: '#A5B4FC', cursor: 'pointer', padding: '8px 0', fontSize: '14px', fontWeight: 600 }}
        >
          Cancel
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '16px' }}>
          <CropIcon size={17} color="#A5B4FC" />
          <span>Crop image</span>
        </div>
        <button
          type="button"
          onClick={resetCrop}
          title="Reset crop and image adjustments"
          aria-label="Reset crop and image adjustments"
          style={{ background: 'transparent', border: '1px solid #30394A', color: '#E2E8F0', cursor: 'pointer', width: '38px', height: '38px', borderRadius: '12px', display: 'grid', placeItems: 'center' }}
        >
          <RotateCcw size={17} />
        </button>
      </div>

      {/* Image stage */}
      <div
        ref={containerRef}
        style={{
          width: 'calc(100% - 32px)', maxWidth: '460px', touchAction: 'none',
          maxHeight: '48dvh', minHeight: '180px', display: 'flex', justifyContent: 'center', alignItems: 'center',
          overflow: 'hidden', flexShrink: 1, margin: '8px 16px 0',
          background: '#111827', border: '1px solid #293244', borderRadius: '18px', padding: '10px'
        }}
      >
        {imgLoaded && canvasSize.w > 0 ? (
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '46dvh', objectFit: 'contain', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        ) : (
          <div style={{ height: 'min(46dvh, 380px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
            Loading image...
          </div>
        )}
      </div>

      <p style={{ fontSize: '12px', color: '#94A3B8', margin: '10px 16px 4px', textAlign: 'center', flexShrink: 0 }}>
        Drag the corners to adjust the crop
        {fileName && <span style={{ display: 'block', marginTop: '3px', color: '#64748B' }}>{fileName}{fileSize ? ` · ${(fileSize / (1024 * 1024)).toFixed(1)} MB` : ''}</span>}
      </p>

      {/* Editing tools */}
      <div
        style={{
          width: 'calc(100% - 32px)', maxWidth: '460px',
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '12px 14px', marginTop: '12px',
          boxSizing: 'border-box',
          flexShrink: 0, border: '1px solid #293244', borderRadius: '16px',
          background: '#111827'
        }}
      >
        <button
          type="button"
          onClick={rotateImage}
          title="Rotate 90 degrees"
          aria-label="Rotate screenshot 90 degrees"
          style={{
            width: '44px', height: '44px', flexShrink: 0, borderRadius: '12px',
            background: '#1D2737', border: '1px solid #354156',
            color: '#E2E8F0', cursor: 'pointer', display: 'grid', placeItems: 'center'
          }}
        >
          <RotateCw size={19} />
        </button>
        <button
          type="button"
          onClick={() => updateZoom(-0.1)}
          title="Zoom out"
          aria-label="Zoom out"
          disabled={zoom <= 1}
          style={{
            width: '34px', height: '38px', flexShrink: 0, borderRadius: '10px',
            background: '#1D2737', border: '1px solid #354156',
            color: zoom <= 1 ? '#64748B' : '#E2E8F0', cursor: zoom <= 1 ? 'default' : 'pointer',
            display: 'grid', placeItems: 'center'
          }}
        >
          <Minus size={17} />
        </button>
        <label style={{ minWidth: 0, flex: 1, color: '#E2E8F0', fontSize: '12px', fontWeight: 600 }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span>Zoom</span>
            <span style={{ color: '#A5B4FC', fontVariantNumeric: 'tabular-nums' }}>{Math.round(zoom * 100)}%</span>
          </span>
          <input
            type="range"
            aria-label="Zoom screenshot"
            min="1"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            style={{ display: 'block', width: '100%', margin: 0, accentColor: '#818CF8' }}
          />
        </label>
        <button
          type="button"
          onClick={() => updateZoom(0.1)}
          title="Zoom in"
          aria-label="Zoom in"
          disabled={zoom >= 3}
          style={{
            width: '34px', height: '38px', flexShrink: 0, borderRadius: '10px',
            background: '#1D2737', border: '1px solid #354156',
            color: zoom >= 3 ? '#64748B' : '#E2E8F0', cursor: zoom >= 3 ? 'default' : 'pointer',
            display: 'grid', placeItems: 'center'
          }}
        >
          <Plus size={17} />
        </button>
      </div>

      {/* Primary action */}
      <div
        style={{
          width: '100%', maxWidth: '492px', marginTop: 'auto',
          padding: '16px 16px 12px', boxSizing: 'border-box', flexShrink: 0
        }}
      >
        <button
          type="button"
          onClick={handleConfirm}
          style={{
            width: '100%', height: '54px', borderRadius: '16px',
            background: '#4F46E5', border: 'none',
            color: '#FFFFFF', fontWeight: 700, fontSize: '15px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
            cursor: 'pointer', boxShadow: '0 8px 22px rgba(79,70,229,0.28)'
          }}
        >
          <Check size={19} />
          Use cropped image
        </button>
      </div>
    </div>
  );
};
