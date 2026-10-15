import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, FlipHorizontal, Upload, Image as ImageIcon } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  productName?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  productName,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);

  // Stop camera stream safely
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setIsLoading(true);
    setErrorMsg(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('ອຸປະກອນ ຫຼື Browser ຂອງທ່ານບໍ່ຮອງຮັບ Camera API');
      }

      // Check available video devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      } catch (e) {
        // ignore enumeration error
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsLoading(false);
    } catch (err: any) {
      console.error('Camera error:', err);
      let message = 'ບໍ່ສາມາດເປີດກ້ອງໄດ້';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'ກະລຸນາອະນຸຍາດສິດການເຂົ້າເຖິງກ້ອງ (Camera Permission) ໃນ Browser ຂອງທ່ານ';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'ບໍ່ພົບກ້ອງໃນອຸປະກອນຂອງທ່ານ';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'ກ້ອງກຳລັງຖືກໃຊ້ໂດຍໂປຣແກຣມອື່ນ';
      } else {
        message = err.message || 'ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ກ້ອງ';
      }
      setErrorMsg(message);
      setIsLoading(false);
    }
  }, [stopStream]);

  // When modal opens/closes or facingMode changes
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      startCamera(facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, startCamera, stopStream]);

  // Switch facing mode (back / front camera)
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Capture frame from video
  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Trigger flash animation
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    const canvas = document.createElement('canvas');
    // Scale down image to optimal size (max 800px) for storage efficiency
    const MAX_DIM = 800;
    let width = video.videoWidth || 640;
    let height = video.videoHeight || 480;

    if (width > height && width > MAX_DIM) {
      height = Math.round((height * MAX_DIM) / width);
      width = MAX_DIM;
    } else if (height > MAX_DIM) {
      width = Math.round((width * MAX_DIM) / height);
      height = MAX_DIM;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If using user/selfie camera, flip horizontally for mirror preview
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    // Compress to JPEG 0.85
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopStream();
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // Confirm and use captured photo
  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      stopStream();
      onClose();
    }
  };

  // Fallback: Upload from file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      if (result) {
        // Resize and optimize uploaded image
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 800;
          let w = img.width;
          let h = img.height;
          if (w > h && w > MAX_DIM) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          } else if (h > MAX_DIM) {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          const optimized = canvas.toDataURL('image/jpeg', 0.85);
          setCapturedImage(optimized);
          stopStream();
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Flash animation element */}
        {isFlashActive && (
          <div className="absolute inset-0 bg-white z-40 pointer-events-none animate-out fade-out duration-200" />
        )}

        {/* Header */}
        <div className="p-4 px-6 flex items-center justify-between border-b border-slate-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                ຖ່າຍຮູບສິນຄ້າ (Camera API)
              </h3>
              {productName && (
                <p className="text-xs text-slate-400 truncate max-w-[240px] sm:max-w-xs">
                  {productName}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Screen */}
        <div className="relative bg-black aspect-4/3 flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            /* Freeze-frame Preview */
            <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
              <img
                src={capturedImage}
                alt="Captured product"
                className="max-h-full max-w-full object-contain"
              />
              <div className="absolute top-3 left-3 px-3 py-1 bg-emerald-500/80 backdrop-blur-xs text-white text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-sm">
                <Check className="w-3.5 h-3.5" />
                ຖ່າຍຮູບສຳເລັດ
              </div>
            </div>
          ) : errorMsg ? (
            /* Error / Permission Denied State */
            <div className="p-6 text-center text-slate-300 max-w-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm mb-1">{errorMsg}</p>
                <p className="text-xs text-slate-400">
                  ທ່ານສາມາດເລືອກອັບໂຫຼດຮູບຈາກຄັງຮູບພາບ (Gallery) ຫຼື ໄຟລ໌ໃນເຄື່ອງແທນໄດ້
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => startCamera(facingMode)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  ລອງເປີດກ້ອງໃໝ່
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  ເລືອກໄຟລ໌ຮູບພາບຈາກເຄື່ອງ
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Stream */
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Viewfinder Framing Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="relative w-full h-full max-w-[340px] max-h-[340px] border-2 border-white/40 rounded-2xl">
                  {/* Viewfinder corner accents */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-indigo-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-indigo-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-indigo-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-indigo-400 rounded-br-lg" />

                  <div className="absolute inset-x-0 bottom-3 text-center">
                    <span className="px-3 py-1 bg-black/60 backdrop-blur-xs text-white/90 text-[11px] rounded-full font-medium">
                      ວາງສິນຄ້າໃຫ້ພໍດີກອບ
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Controls Overlay */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {hasMultipleCameras && (
                  <button
                    onClick={toggleFacingMode}
                    className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 transition cursor-pointer"
                    title="ສະຫຼັບກ້ອງໜ້າ/ຫຼັງ"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          {capturedImage ? (
            /* Actions when image is captured */
            <>
              <button
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                ຖ່າຍໃໝ່
              </button>

              <button
                onClick={handleConfirm}
                className="flex-1 max-w-xs px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                ນຳໃຊ້ຮູບນີ້ (Use Photo)
              </button>
            </>
          ) : (
            /* Actions during live camera */
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                title="ເລືອກຮູບຈາກອຸປະກອນ"
              >
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">ອັບໂຫຼດຮູບ</span>
              </button>

              {/* Shutter Button */}
              <button
                onClick={handleSnap}
                disabled={isLoading || !!errorMsg}
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition cursor-pointer ${
                  isLoading || !!errorMsg
                    ? 'opacity-40 cursor-not-allowed bg-slate-700'
                    : 'bg-white hover:scale-105 active:scale-95 shadow-xl shadow-white/20 p-1'
                }`}
                title="ກົດຖ່າຍຮູບ"
              >
                <div className="w-13 h-13 rounded-full border-2 border-slate-900 bg-indigo-600 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </button>

              <button
                onClick={() => {
                  stopStream();
                  onClose();
                }}
                className="px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
              >
                ຍົກເລີກ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
