import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Camera, Loader2, Activity } from 'lucide-react';

// 🚨 [핵심 수정] 외부 링크 대신 내 프로젝트의 public/models 폴더를 사용합니다.
const MODEL_URL = '/models'; 

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
                // 모델 로딩 시작
                console.log("Loading models from:", MODEL_URL);
                
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
                    // 표정 인식 모델 추가 (뉴스 추천에 도움됨)
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL) 
                ]);
                
                console.log("Models loaded successfully");
                setModelLoaded(true);
            } catch (err) {
                console.error("Failed to load models", err);
                setStreamError(`Failed to load AI models. (Path: ${MODEL_URL})`);
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
                .withAgeAndGender()
                .withFaceExpressions(); // 표정 인식 추가

            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            // Clear canvas
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw detections (개발 중에만 켜두고 나중에 주석 처리 가능)
            // faceapi.draw.drawDetections(canvas, resizedDetections);
            // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            // Custom Drawing: Sunglasses
            resizedDetections.forEach(detection => {
                const landmarks = detection.landmarks;
                const leftEye = landmarks.getLeftEye();
                const rightEye = landmarks.getRightEye();

                if (leftEye && rightEye && sunglassesImgRef.current) {
                    // (생략된 선글라스 그리기 로직은 그대로 둡니다)
                    const leftEyeCenter = leftEye[0]; 
                    const rightEyeCenter = rightEye[3]; 

                    const centerX = (leftEye[0].x + rightEye[3].x) / 2;
                    const centerY = (leftEye[0].y + rightEye[3].y) / 2;
                    const width = Math.hypot(rightEye[3].x - leftEye[0].x, rightEye[3].y - leftEye[0].y) * 2.5; 
                    const height = width * 0.4; 

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
                const primary = resizedDetections[0]; 
                
                // 가장 확률 높은 표정 찾기
                const expressions = primary.expressions;
                const dominantExpression = Object.keys(expressions).reduce((a, b) => 
                    expressions[a] > expressions[b] ? a : b
                );

                onDemographicsChange({
                    gender: primary.gender,
                    age: Math.round(primary.age), // 나이 반올림해서 깔끔하게
                    expression: dominantExpression // 감정 정보 추가 전달
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

        }, 100); 

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
                    playsInline // 모바일 호환성 추가
                    onPlay={handleVideoPlay}
                    className="absolute top-0 left-0 w-full h-full object-cover transform scale-x-[-1]" // 거울 모드(좌우반전)
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full object-cover transform scale-x-[-1]" // 캔버스도 같이 좌우반전
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
                    <p className="text-sm text-gray-400 mt-2">Check public/models folder</p>
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