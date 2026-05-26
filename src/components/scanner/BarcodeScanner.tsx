import { useRef, useState, useCallback, useEffect } from 'react';
import { X, Camera, SwitchCamera } from 'lucide-react';
import jsQR from 'jsqr';
import { parseBarcode, createBarcodeDetector, supportsBarcodeDetector } from '../../lib/scanner';

interface BarcodeScannerProps {
  onScan: (data: { productModel: string; workOrderNumber: string; recordDate: string }) => void;
  onClose: () => void;
}

type Phase = 'idle' | 'starting' | 'scanning' | 'capturing' | 'error';

interface VideoDevice {
  deviceId: string;
  label: string;
  facing: 'environment' | 'user' | 'unknown';
}

const CAMERA_LS_KEY = 'dc-scanner-camera';

function loadSavedDeviceId(): string | null {
  try {
    return localStorage.getItem(CAMERA_LS_KEY);
  } catch { return null; }
}

function saveDeviceId(id: string) {
  try { localStorage.setItem(CAMERA_LS_KEY, id); } catch { /* ignore */ }
}

async function enumerateCameras(): Promise<VideoDevice[]> {
  // Request permission first so labels are available
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
  } catch { /* permission denied, still try enumerate */ }

  const devices = await navigator.mediaDevices.enumerateDevices();
  if (stream) stream.getTracks().forEach((t) => t.stop());

  const seen = new Set<string>();
  const result: VideoDevice[] = [];

  for (const d of devices) {
    if (d.kind !== 'videoinput') continue;
    if (seen.has(d.deviceId)) continue;
    seen.add(d.deviceId);

    let facing: VideoDevice['facing'] = 'unknown';
    // Guess facing from label keywords
    const label = (d.label || '').toLowerCase();
    if (label.includes('front') || label.includes('前置') || label.includes('user')) {
      facing = 'user';
    } else if (label.includes('back') || label.includes('后置') || label.includes('rear') || label.includes('environment')) {
      facing = 'environment';
    }

    const displayLabel = d.label
      || (facing === 'user' ? '前置摄像头' : facing === 'environment' ? '后置摄像头' : `摄像头 ${result.length + 1}`);

    result.push({ deviceId: d.deviceId, label: displayLabel, facing });
  }

  return result;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [cameras, setCameras] = useState<VideoDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(loadSavedDeviceId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stoppedRef = useRef(false);
  const rafRef = useRef(0);
  const frameCountRef = useRef(0);
  const cameraIdRef = useRef(selectedCameraId);
  cameraIdRef.current = selectedCameraId;

  // Enumerate cameras on mount
  useEffect(() => {
    enumerateCameras().then((list) => {
      setCameras(list);
      // If saved device no longer exists, clear it
      if (selectedCameraId && !list.some((c) => c.deviceId === selectedCameraId)) {
        setSelectedCameraId(null);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const startCamera = useCallback(async () => {
    setPhase('starting');
    setErrorMsg('');

    const deviceId = cameraIdRef.current;

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      if (deviceId) {
        (constraints.video as MediaTrackConstraints).deviceId = { exact: deviceId };
      } else {
        (constraints.video as MediaTrackConstraints).facingMode = 'environment';
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

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

  const selectCamera = useCallback((deviceId: string) => {
    setSelectedCameraId(deviceId);
    saveDeviceId(deviceId);
  }, []);

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
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 safe-area-top">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 z-20 px-6 overflow-y-auto">
          {phase === 'idle' && (
            <>
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Camera className="w-8 h-8 text-white/50" />
              </div>
              <p className="text-white/60 text-[13px] text-center">
                选择摄像头并启动扫描
              </p>

              {/* Camera list */}
              {cameras.length > 0 ? (
                <div className="w-full max-w-[280px] flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                  {/* Auto-select option */}
                  <button
                    className={`flex items-center gap-2 text-[13px] py-2.5 px-4 rounded-lg transition-colors text-left ${
                      !selectedCameraId
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                    onClick={() => {
                      setSelectedCameraId(null);
                      try { localStorage.removeItem(CAMERA_LS_KEY); } catch { /* ignore */ }
                    }}
                  >
                    <SwitchCamera className="w-4 h-4 shrink-0" />
                    <span>自动选择（默认后置）</span>
                  </button>
                  {cameras.map((c) => (
                    <button
                      key={c.deviceId}
                      className={`flex items-center gap-2 text-[13px] py-2.5 px-4 rounded-lg transition-colors text-left ${
                        selectedCameraId === c.deviceId
                          ? 'bg-white/20 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                      onClick={() => selectCamera(c.deviceId)}
                    >
                      <SwitchCamera className="w-4 h-4 shrink-0" />
                      <span className="truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-white/40 text-[13px] py-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  正在检测摄像头...
                </div>
              )}

              {/* Start button — inside overlay so always visible */}
              <button
                className="bg-white text-slate-800 text-[16px] font-bold py-4 px-12 rounded-full active:bg-white/80 transition-colors shadow-xl shadow-white/30 mt-2 shrink-0"
                onClick={startCamera}
              >
                启动摄像头
              </button>
            </>
          )}
          {phase === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <X className="w-8 h-8 text-red-400/70" />
              </div>
              <p className="text-white/80 text-[13px] text-center max-w-xs">{errorMsg}</p>
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

      {/* Bottom buttons — only show during scanning */}
      {(phase === 'scanning' || phase === 'capturing') && (
        <div className="absolute bottom-0 left-0 right-0 pb-6 pt-4 px-4 safe-area-bottom flex items-center justify-center gap-4 z-30">
          <button
            className="text-white/60 text-[14px] py-3 px-8 hover:text-white transition-colors"
            onClick={handleClose}
          >
            取消
          </button>
          <button
            className="bg-white text-slate-800 text-[16px] font-bold py-4 px-10 rounded-full active:bg-white/80 transition-colors shadow-xl shadow-white/30"
            onClick={handleCapture}
          >
            拍照识别
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
