import { useRef, useState, useCallback } from 'react';
import { X, Camera } from 'lucide-react';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stoppedRef = useRef(false);
  const rafRef = useRef(0);
  const frameCountRef = useRef(0);

  const stopCamera = useCallback(() => {
    stoppedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const doScan = useCallback(async (imageData: ImageData, rawCanvas: HTMLCanvasElement): Promise<boolean> => {
    const qrResult = jsQR(imageData.data, imageData.width, imageData.height);
    if (qrResult) {
      const parsed = parseBarcode(qrResult.data);
      if (parsed) {
        stopCamera();
        navigator.vibrate?.(200);
        onScan(parsed);
        return true;
      }
      setPhase('scanning');
      return false;
    }

    if (supportsBarcodeDetector()) {
      try {
        const detector = createBarcodeDetector();
        if (detector) {
          const bitmap = await createImageBitmap(rawCanvas);
          const barcodes = await detector.detect(bitmap) as Array<{ rawValue: string }>;
          bitmap.close();
          if (barcodes.length > 0 && !stoppedRef.current) {
            const parsed = parseBarcode(barcodes[0].rawValue);
            if (parsed) {
              stopCamera();
              navigator.vibrate?.(200);
              onScan(parsed);
              return true;
            }
          }
        }
      } catch { /* BarcodeDetector not supported or failed */ }
    }

    return false;
  }, [onScan, stopCamera]);

  /** Called only from a direct user tap — satisfies mobile gesture requirement */
  const startCamera = useCallback(async () => {
    setPhase('starting');
    setErrorMsg('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (stoppedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      // Attach to visible video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Off-screen video for frame capture
      const offVideo = document.createElement('video');
      offVideo.setAttribute('playsinline', '');
      offVideo.muted = true;
      offVideo.srcObject = stream;
      await offVideo.play();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      setPhase('scanning');

      const tick = () => {
        if (stoppedRef.current) return;

        frameCountRef.current++;
        if (frameCountRef.current % 3 === 0 && offVideo.videoWidth > 0) {
          canvas.width = offVideo.videoWidth;
          canvas.height = offVideo.videoHeight;
          ctx.drawImage(offVideo, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          doScan(imageData, canvas);
        }

        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
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
  }, [doScan]);

  // Manual capture button
  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    setPhase('capturing');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const found = await doScan(imageData, canvas);
    if (!found) {
      setPhase('scanning');
    }
  }, [doScan]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  const statusText =
    phase === 'idle' ? '点击按钮启动摄像头'
    : phase === 'starting' ? '正在启动摄像头...'
    : phase === 'scanning' ? '扫描中...'
    : phase === 'capturing' ? '正在识别...'
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 safe-area-top">
        <span className="text-white text-[15px] font-medium">扫描条码</span>
        <button className="p-2 text-white/70 hover:text-white rounded-full" onClick={handleClose}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video area */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
      </div>

      {/* Idle / error overlay */}
      {(phase === 'idle' || phase === 'error') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/80 z-20 px-8">
          {phase === 'idle' && (
            <>
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                <Camera className="w-10 h-10 text-white/50" />
              </div>
              <p className="text-white/60 text-[14px] text-center">
                点击下方按钮启动摄像头并开始扫描
              </p>
            </>
          )}
          {phase === 'error' && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                <X className="w-10 h-10 text-red-400/70" />
              </div>
              <p className="text-white/80 text-[14px] text-center">{errorMsg}</p>
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

      {/* Frame guide */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 border-2 border-white/60 rounded-2xl" />
      </div>

      {/* Status text */}
      <div className="absolute bottom-36 left-4 right-4 pointer-events-none">
        <p className="text-white/60 text-[13px] text-center">{statusText}</p>
      </div>

      {/* Bottom buttons */}
      <div className="absolute bottom-0 left-0 right-0 pb-6 pt-4 px-4 safe-area-bottom flex items-center justify-center gap-4 z-10">
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
          <button
            className="bg-white text-slate-800 text-[16px] font-bold py-4 px-10 rounded-full active:bg-white/80 transition-colors shadow-xl shadow-white/30"
            onClick={handleCapture}
          >
            拍照识别
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
