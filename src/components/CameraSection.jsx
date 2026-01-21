import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Camera, Loader2, Activity } from 'lucide-react';

// Use original models or a reliable CDN
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
// Simple Sunglasses SVG Data URI
const SUNGLASSES_URI = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgNDAiPgogIDxnIGZpbGw9ImJsYWNrIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPgogICAgPHBhdGggZD0iTTEwLDEwIEg1MCBBMTAsMTAgMCAwIDAgNTAsMzAgSDEwIEExMCwxMCAwIDAgMCAxMCwxMCBaIiAvPgogICAgPHBhdGggZD0iTTcwLDEwIEgxMTAgQTEwLDEwIDAgMCAwIDExMCwzMCBINzAgQTEwLDEwIDAgMCAwIDcwLDEwIFoiIC8+CiAgICA8bGluZSB4MT0iNTAiIHkxPSIxNSIgeDI9IjcwIiB5Mj0iMTUiIC8+CiAgPC9nPgo8L3N2Zz4=`;

export default function CameraSection({ onDemographicsChange }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [initializing, setInitializing] = useState(true);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [streamError, setStreamError] = useState(null);
    const [metrics, setMetrics] = useState({ fps: 0, latency: 0 });

    const sunglassesImgRef = useRef(null);

    useEffect(() => {
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
                ]);
                setModelLoaded(true);
            } catch (err) {
                console.error("Failed to load models", err);
                setStreamError("Failed to load AI models.");
            }
        };

        // Preload image
        const img = new Image();
        img.src = SUNGLASSES_URI;
        img.onload = () => { sunglassesImgRef.current = img; };

        loadModels();
    }, []);

    useEffect(() => {
        if (modelLoaded) {
            startVideo();
        }
    }, [modelLoaded]);

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => {
                console.error(err);
                setStreamError("Camera access denied or not available.");
            });
    };

    const handleVideoPlay = () => {
        setInitializing(false);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);

        let lastTime = Date.now();
        let frameCount = 0;
        let lastDemographicsCheck = 0;

        const interval = setInterval(async () => {
            const now = Date.now();
            const startTime = performance.now();

            if (video.paused || video.ended) return;

            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withAgeAndGender();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            // Clear canvas
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw detections
            // faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            // Custom Drawing: Sunglasses
            resizedDetections.forEach(detection => {
                const landmarks = detection.landmarks;
                const leftEye = landmarks.getLeftEye();
                const rightEye = landmarks.getRightEye();

                if (leftEye && rightEye && sunglassesImgRef.current) {
                    const leftEyeCenter = leftEye[0]; // Simplified
                    const rightEyeCenter = rightEye[3]; // Simplified

                    // Calculate center and width
                    const centerX = (leftEye[0].x + rightEye[3].x) / 2;
                    const centerY = (leftEye[0].y + rightEye[3].y) / 2;
                    const width = Math.hypot(rightEye[3].x - leftEye[0].x, rightEye[3].y - leftEye[0].y) * 2.5; // Scale up
                    const height = width * 0.4; // Aspect ratio of SVG approx

                    // Rotation (optional, simple version)
                    const angle = Math.atan2(rightEye[3].y - leftEye[0].y, rightEye[3].x - leftEye[0].x);

                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate(angle);
                    ctx.drawImage(sunglassesImgRef.current, -width / 2, -height / 2, width, height);
                    ctx.restore();
                }
            });

            // Throttle Age/Gender Update (Every 2s)
            if (now - lastDemographicsCheck > 2000 && resizedDetections.length > 0) {
                const primary = resizedDetections[0]; // Just take first face
                onDemographicsChange({
                    gender: primary.gender,
                    age: primary.age
                });
                lastDemographicsCheck = now;
            }

            // Metrics
            const endTime = performance.now();
            frameCount++;
            if (now - lastTime >= 1000) {
                setMetrics({ fps: frameCount, latency: Math.round(endTime - startTime) });
                frameCount = 0;
                lastTime = now;
            }

        }, 100); // 10 FPS roughly for processing loops, painting is dependent. 
        // Actually requestAnimationFrame is better for painting but setInterval is okay for logic here to not block UI too much if on main thread.
        // FaceAPI is heavy.

        return () => clearInterval(interval);
    };

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
            {/* Video & Canvas Overlay */}
            <div className="relative w-full h-full">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    onPlay={handleVideoPlay}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                />
            </div>

            {/* Loading State */}
            {(initializing || !modelLoaded) && !streamError && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 text-white">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
                    <p>{!modelLoaded ? 'Loading AI Models...' : 'Initializing Camera...'}</p>
                </div>
            )}

            {/* Error State */}
            {streamError && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900 text-red-500 p-4 text-center">
                    <Camera className="w-12 h-12 mb-4" />
                    <p>{streamError}</p>
                </div>
            )}

            {/* Metrics Overlay */}
            <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-50 px-3 py-1 rounded text-green-400 text-xs font-mono flex items-center gap-2">
                <Activity size={12} />
                <span>FPS: {metrics.fps}</span>
                <span className="text-gray-400">|</span>
                <span>Lat: {metrics.latency}ms</span>
            </div>
        </div>
    );
}
