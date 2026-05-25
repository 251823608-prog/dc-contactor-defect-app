import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { parseBarcode, createBarcodeDetector, supportsBarcodeDetector } from '../../lib/scanner';

interface BarcodeScannerProps {
  onScan: (data: { productModel: string; workOrderNumber: string; recordDate: string }) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const html5Ref = useRef<Html5Qrcode | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (supportsBarcodeDetector()) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
          const detector = createBarcodeDetector();
          if (!detector) throw new Error('No detector');

          const tick = async () => {
            if (cancelled || stoppedRef.current || !videoRef.current) return;
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0 && !stoppedRef.current) {
                stoppedRef.current = true;
                const parsed = parseBarcode(barcodes[0].rawValue);
                if (parsed) {
                  navigator.vibrate?.(200);
                  stream.getTracks().forEach((t) => t.stop());
                  onScan(parsed);
                } else {
                  setError('无法识别码内容，请重试');
                }
                return;
              }
            } catch {
              // detection can fail on empty frames
            }
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          return;
        } catch {
          // Fall through to html5-qrcode
        }
      }

      // Fallback: html5-qrcode
      try {
        const readerId = 'barcode-reader';
        const existing = document.getElementById(readerId);
        if (!existing) return;

        const reader = new Html5Qrcode(readerId);
        html5Ref.current = reader;

        await reader.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (stoppedRef.current) return;
            stoppedRef.current = true;
            const parsed = parseBarcode(decodedText);
            if (parsed) {
              navigator.vibrate?.(200);
              reader.stop().catch(() => {});
              onScan(parsed);
            } else {
              setError('无法识别码内容，请重试');
            }
          },
          () => {
            // ignore scan failures
          }
        );
      } catch {
        if (!cancelled) {
          setError('无法打开摄像头，请检查权限设置');
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      if (html5Ref.current) {
        html5Ref.current.stop().catch(() => {});
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-white text-[15px] font-medium">扫描产品底部二维码</span>
        <button className="p-2 text-white/70 hover:text-white rounded-full" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <div id="barcode-reader" className="w-full h-full" />
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-white/60 rounded-2xl" />
        </div>
        <p className="absolute bottom-24 text-white/50 text-[13px]">将二维码对准框内</p>
      </div>

      <div className="p-4 flex justify-center">
        <button className="text-white/60 text-[14px] py-2 px-8 hover:text-white transition-colors" onClick={onClose}>
          取消
        </button>
      </div>

      {error && (
        <div className="absolute bottom-32 left-4 right-4 bg-red-500 text-white text-[13px] px-4 py-2.5 rounded-xl text-center">
          {error}
          <button
            className="ml-3 underline font-medium"
            onClick={() => {
              setError(null);
              stoppedRef.current = false;
            }}
          >
            重试
          </button>
        </div>
      )}
    </div>
  );
}
