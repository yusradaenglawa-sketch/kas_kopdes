import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, AlertCircle } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setErrorMsg(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setErrorMsg(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      // Fallback try simple video
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr: any) {
        setErrorMsg('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser/perangkat Anda.');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-[#0D0D0F] text-zinc-100 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-black">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Foto Bukti Transfer / Struk</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera or Captured View */}
        <div className="relative bg-black min-h-[340px] flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center text-rose-400 flex flex-col items-center gap-2">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-1" />
              <p className="text-sm text-zinc-300">{errorMsg}</p>
              <button
                onClick={startCamera}
                className="mt-3 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-xl border border-zinc-700 cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : capturedImage ? (
            <div className="relative w-full h-full max-h-[480px]">
              <img
                src={capturedImage}
                alt="Foto Struk"
                className="w-full h-full object-contain max-h-[480px]"
              />
              <div className="absolute top-3 left-3 bg-emerald-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md">
                Foto Berhasil Diambil
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[480px]"
              />
              {/* Receipt framing guide */}
              <div className="absolute inset-8 border-2 border-dashed border-emerald-400/60 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="bg-black/75 text-emerald-300 text-xs px-3 py-1 rounded-full backdrop-blur-xs border border-emerald-500/30">
                  Posisikan struk / slip transfer di dalam kotak
                </span>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="p-4 bg-[#0D0D0F] border-t border-zinc-800 flex items-center justify-between gap-3">
          {capturedImage ? (
            <>
              <button
                onClick={handleRetake}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-zinc-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Ulangi Foto
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Gunakan Foto Ini
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleFacingMode}
                className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer"
                title="Ganti Kamera Depan/Belakang"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleTakePhoto}
                disabled={Boolean(errorMsg)}
                className="flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                Ambil Foto Struk
              </button>
              <button
                onClick={onClose}
                className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs sm:text-sm font-semibold border border-zinc-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
