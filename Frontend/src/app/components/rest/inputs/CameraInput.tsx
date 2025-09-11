//src\app\components\rest\inputs\CameraInput.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Loader2 } from 'lucide-react';

interface CameraInputProps {
  onCapture: (imageUrl: string) => void;
}

export default function CameraInput({ onCapture }: CameraInputProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraSupported, setIsCameraSupported] = useState(true);

  useEffect(() => {
    if (isCameraSupported) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setIsCameraSupported(false);
      setError('Camera access is not supported in your browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await new Promise((resolve) => {
          videoRef.current!.onloadedmetadata = resolve;
        });
        videoRef.current.play();
      }
      setStream(mediaStream);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please check permissions and try again.');
    } finally {
      setIsLoading(false);
    }
  };
const captureImage = () => {
  if (!videoRef.current || !stream) return;

  const canvas = document.createElement('canvas');
  canvas.width = videoRef.current.videoWidth;
  canvas.height = videoRef.current.videoHeight;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Stop camera immediately
    stream.getTracks().forEach(track => track.stop());
    setStream(null); // Clear the stream state
    
    // Then call the callback
    onCapture(imageUrl);
  }
};
  return (
    <div className="flex flex-col items-center gap-4">
      {error ? (
        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      ) : (
        <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              <p className="text-sm text-gray-600">Accessing camera...</p>
            </div>
          ) : stream ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Camera className="w-12 h-12 text-gray-400" />
              <p className="text-sm text-gray-500">Camera is off</p>
            </div>
          )}
        </div>
      )}

      {stream && (
        <button
          onClick={captureImage}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Take Photo
        </button>
      )}
    </div>
  );
}