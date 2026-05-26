import { useRef, useState, useCallback, useEffect } from 'react';
import { X, Camera, Zap } from 'lucide-react';
import jsQR from 'jsqr';
import { parseBarcode, createBarcodeDetector, supportsBarcodeDetector } from '../../lib/scanner';

interface BarcodeScannerProps {
  onScan: (data: { productModel: string; workOrderNumber: string; recordDate: string }) => void;
  onClose: () => void;
}

type Phase = 'idle' | 'starting' | 'scanning' | 'capturing' | 'error';

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const frameCountRef = useRef(0);
  const stoppedRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const stopCamera = useCallback(() => {
    stoppedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setTorchOn(false);
  }, []);

  const tryScanFrame = useCallback((): boolean => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return false;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 1) jsQR for QR codes
    const qrResult = jsQR(imageData.data, imageData.width, imageData.height);
    if (qrResult) {
      const parsed = parseBarcode(qrResult.data);
      if (parsed) {
        stopCamera();
        navigator.vibrate?.(200);
        onScanRef.current(parsed);
        return true;
      }
      return false;
    }

    // 2) BarcodeDetector API for 1D barcodes
    if (supportsBarcodeDetector()) {
      const detector = createBarcodeDetector();
      if (detector) {
        // BarcodeDetector needs an ImageBitmap — create from canvas
        canvas.toBlob(async (blob) => {
          if (!blob || stoppedRef.current) return;
          try {
            const bitmap = await createImageBitmap(blob);
            if (stoppedRef.current) { bitmap.close(); return; }
            const barcodes = await detector.detect(bitmap) as Array<{ rawValue: string }>;
            bitmap.close();
            if (barcodes.length > 0 && !stoppedRef.current) {
              const parsed = parseBarcode(barcodes[0].rawValue);
              if (parsed) {
                stopCamera();
                navigator.vibrate?.(200);
                onScanRef.current(parsed);
              }
            }
          } catch { /* BarcodeDetector failed */ }
        }, 'image/png');
      }
    }

    return false;
  }, [stopCamera]);

  const scanningLoop = useCallback(() => {
    if (stoppedRef.current) return;
    frameCountRef.current++;
    // Scan every 5th frame to avoid overloading the main thread
    if (frameCountRef.current % 5 === 0) {
      tryScanFrame();
    }
    rafRef.current = requestAnimationFrame(scanningLoop);
  }, [tryScanFrame]);

  const startCamera = useCallback(async () => {
    setPhase('starting');
    setErrorMsg('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (stoppedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        setErrorMsg('内部错误：视频元素未找到');
        setPhase('error');
        return;
      }

      video.srcObject = stream;
      await video.play();

      setPhase('scanning');
      stoppedRef.current = false;
      frameCountRef.current = 0;
      rafRef.current = requestAnimationFrame(scanningLoop);
    } catch (e) {
      const msg = String(e);
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setErrorMsg('相机权限被拒绝，请在浏览器设置中允许相机访问后刷新重试');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setErrorMsg('未找到摄像头设备');
      } else if (msg.includes('NotReadable')) {
        setErrorMsg('摄像头被其他应用占用，请关闭其他使用相机的应用后重试');
      } else {
        setErrorMsg('摄像头错误: ' + msg);
      }
      setPhase('error');
    }
  }, [scanningLoop]);

  const handleCapture = useCallback(async () => {
    setPhase('capturing');
    // Small delay to show capturing state
    await new Promise((r) => setTimeout(r, 150));
    const found = tryScanFrame();
    if (!found) {
      setPhase('scanning');
    }
  }, [tryScanFrame]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    try {
      await videoTrack.applyConstraints({
        // @ts-expect-error: torch is a non-standard constraint
        advanced: [{ torch: !torchOn }],
      } as MediaTrackConstraints);
      setTorchOn(!torchOn);
    } catch {
      // Torch not supported on this device
    }
  }, [torchOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const statusText =
    phase === 'idle' ? '点击按钮启动摄像头'
    : phase === 'starting' ? '正在启动摄像头...'
    : phase === 'scanning' ? '扫描中 — 将条码对准框内'
    : phase === 'capturing' ? '正在识别...'
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video — always rendered, visible when camera is on */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Scan frame guide */}
      {(phase === 'scanning' || phase === 'capturing') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-64 h-64 border-2 border-white/60 rounded-2xl" />
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 safe-area-top">
        <span className="text-white text-[15px] font-medium">扫描条码</span>
        <button className="p-2 text-white/70 hover:text-white rounded-full" onClick={handleClose}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Idle / Starting / Error overlay */}
      {(phase === 'idle' || phase === 'starting' || phase === 'error') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/85 z-30 px-8">
          {phase === 'idle' && (
            <>
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                <Camera className="w-10 h-10 text-white/50" />
              </div>
              <p className="text-white/60 text-[14px] text-center">
                点击下方按钮启动摄像头并扫描条码
              </p>
            </>
          )}
          {phase === 'starting' && (
            <>
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              </div>
              <p className="text-white/60 text-[14px] text-center">正在启动摄像头...</p>
            </>
          )}
          {phase === 'error' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                <X className="w-10 h-10 text-red-400/70" />
              </div>
              <p className="text-white/80 text-[14px] text-center max-w-xs">{errorMsg}</p>
              <button
                className="bg-white text-slate-800 text-[15px] font-bold py-3 px-8 rounded-full active:bg-white/80"
                onClick={startCamera}
              >
                重试
              </button>
            </>
          )}
        </div>
      )}

      {/* Status text */}
      <div className="absolute top-20 left-4 right-4 pointer-events-none z-10">
        <p className="text-white/50 text-[13px] text-center">{statusText}</p>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-6 pt-4 px-4 safe-area-bottom flex items-center justify-center gap-4 z-40">
        <button
          className="text-white/60 text-[14px] py-3 px-8 hover:text-white transition-colors"
          onClick={handleClose}
        >
          取消
        </button>

        {phase === 'idle' || phase === 'error' ? (
          <button
            className="bg-white text-slate-800 text-[16px] font-bold py-4 px-10 rounded-full active:bg-white/80 transition-colors shadow-xl shadow-white/30"
            onClick={startCamera}
          >
            启动摄像头
          </button>
        ) : (
          <>
            {/* Torch toggle */}
            <button
              className="text-white/60 hover:text-white p-3 transition-colors"
              onClick={toggleTorch}
            >
              <Zap className={torchOn ? 'text-yellow-400' : 'text-white/60'} style={{ width: 20, height: 20 }} />
            </button>
            {/* Capture button */}
            <button
              className="bg-white text-slate-800 text-[16px] font-bold py-4 px-10 rounded-full active:bg-white/80 transition-colors shadow-xl shadow-white/30"
              onClick={handleCapture}
            >
              拍照识别
            </button>
          </>
        )}
      </div>

      {/* Hidden canvas for frame analysis */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
