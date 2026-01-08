
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { FaceMesh } from '@mediapipe/face_mesh';
import * as Cam from '@mediapipe/camera_utils';

function FaceFilter() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [fps, setFps] = useState(0);
    const [landmarkData, setLandmarkData] = useState(null);
    const [activeFilter, setActiveFilter] = useState('sunglasses');

    // OPTIMIZATION: Use Ref to track active filter inside closures
    // This allows us to NOT include activeFilter in the main useEffect dependency array
    const activeFilterRef = useRef(activeFilter);

    const previousTimeRef = useRef();
    const requestRef = useRef();

    // Update ref whenever state changes
    useEffect(() => {
        activeFilterRef.current = activeFilter;
    }, [activeFilter]);

    // Mobile support constraints
    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "user"
    };

    useEffect(() => {
        const faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            },
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        faceMesh.onResults(onResults);

        if (
            typeof webcamRef.current !== "undefined" &&
            webcamRef.current !== null
        ) {
            const camera = new Cam.Camera(webcamRef.current.video, {
                onFrame: async () => {
                    if (webcamRef.current && webcamRef.current.video) {
                        await faceMesh.send({ image: webcamRef.current.video });
                    }
                },
                width: 1280,
                height: 720,
            });
            camera.start();
        }

        // FPS Monitor
        const animate = (time) => {
            if (previousTimeRef.current != undefined) {
                const deltaTime = time - previousTimeRef.current;
                const currentFps = 1000 / deltaTime;
                setFps(prev => (prev * 0.9 + currentFps * 0.1));
            }
            previousTimeRef.current = time;
            requestRef.current = requestAnimationFrame(animate);
        }
        requestRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(requestRef.current);
        }
    }, []); // OPTIMIZATION: Run only once!

    const onResults = (results) => {
        if (!canvasRef.current || !webcamRef.current || !webcamRef.current.video) return;

        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        const ctx = canvasRef.current.getContext("2d");

        // Clear & Draw Video
        ctx.save();
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

        if (results.multiFaceLandmarks) {
            for (const landmarks of results.multiFaceLandmarks) {
                setLandmarkData(landmarks);

                // OPTIMIZATION: Read from Ref
                switch (activeFilterRef.current) {
                    case 'sunglasses':
                        drawSunglasses(ctx, landmarks);
                        break;
                    case 'mask':
                        drawMask(ctx, landmarks);
                        break;
                    case 'sticker':
                        drawSticker(ctx, landmarks);
                        break;
                    case 'contour':
                        drawContour(ctx, landmarks);
                        break;
                    default:
                        drawSunglasses(ctx, landmarks);
                }
            }
        }
        ctx.restore();
    };

    const drawSunglasses = (ctx, landmarks) => {
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        if (!leftEye || !rightEye) return;

        const w = canvasRef.current.width;
        const h = canvasRef.current.height;
        const leftX = leftEye.x * w;
        const leftY = leftEye.y * h;
        const rightX = rightEye.x * w;
        const rightY = rightEye.y * h;

        const centerX = (leftX + rightX) / 2;
        const centerY = (leftY + rightY) / 2;
        const dx = rightX - leftX;
        const dy = rightY - leftY;
        const angle = Math.atan2(dy, dx);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scale = distance * 2.8;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.fillStyle = "rgba(10, 10, 10, 0.85)";
        ctx.strokeStyle = "#00f3ff";
        ctx.lineWidth = 4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00f3ff";
        ctx.beginPath();
        ctx.roundRect(-scale * 0.55, -scale * 0.25, scale * 0.5, scale * 0.45, 8);
        ctx.roundRect(scale * 0.05, -scale * 0.25, scale * 0.5, scale * 0.45, 8);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-scale * 0.05, -scale * 0.15);
        ctx.lineTo(scale * 0.05, -scale * 0.15);
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    };

    const drawMask = (ctx, landmarks) => {
        // 152 is Chin, 234 is Left Cheek, 454 is Right Cheek, 1 is Nose Tip
        const chin = landmarks[152];
        const leftCheek = landmarks[234];
        const rightCheek = landmarks[454];
        const noseTip = landmarks[1];

        if (!chin || !leftCheek || !rightCheek || !noseTip) return;

        const w = canvasRef.current.width;
        const h = canvasRef.current.height;

        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.strokeStyle = "#ddd";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(leftCheek.x * w, leftCheek.y * h);
        ctx.quadraticCurveTo(leftCheek.x * w, chin.y * h, chin.x * w, chin.y * h);
        ctx.quadraticCurveTo(rightCheek.x * w, chin.y * h, rightCheek.x * w, rightCheek.y * h);
        ctx.quadraticCurveTo(noseTip.x * w, noseTip.y * h, leftCheek.x * w, leftCheek.y * h);

        ctx.fill();
        ctx.stroke();
        ctx.restore();
    };

    const drawSticker = (ctx, landmarks) => {
        const forehead = landmarks[10];
        if (!forehead) return;

        const w = canvasRef.current.width;
        const h = canvasRef.current.height;

        const x = forehead.x * w;
        const y = forehead.y * h;

        ctx.save();
        ctx.translate(x, y - (h * 0.1));

        // Draw Star
        ctx.fillStyle = "#FFD700";
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * 20, -Math.sin((18 + i * 72) / 180 * Math.PI) * 20);
            ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * 10, -Math.sin((54 + i * 72) / 180 * Math.PI) * 10);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    };

    const drawContour = (ctx, landmarks) => {
        const silhouette = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

        ctx.save();
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.beginPath();

        const w = canvasRef.current.width;
        const h = canvasRef.current.height;

        silhouette.forEach((index, i) => {
            const pt = landmarks[index];
            if (i === 0) ctx.moveTo(pt.x * w, pt.y * h);
            else ctx.lineTo(pt.x * w, pt.y * h);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    return (
        <div className="face-filter-container">
            <Webcam
                ref={webcamRef}
                style={{ display: "none" }}
                videoConstraints={videoConstraints}
            />
            <canvas
                ref={canvasRef}
                className="output-canvas"
            />

            <div className="filter-controls">
                {['sunglasses', 'mask', 'sticker', 'contour'].map(f => (
                    <button
                        key={f}
                        className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
                        onClick={() => setActiveFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            <div className="stats-panel">
                <div className="stat-item">
                    <span className="label">FPS</span>
                    <span className="value">{Math.round(fps)}</span>
                </div>
                <div className="stat-item">
                    <span className="label">Status</span>
                    <span className="value" style={{ color: landmarkData ? '#00f3ff' : '#ff4444' }}>
                        {landmarkData ? 'Active' : 'Search'}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default FaceFilter;
