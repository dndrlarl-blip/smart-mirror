import React, { useEffect, useRef, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import type { Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export const FaceMeshContainer: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fps, setFps] = useState(0);
    const [landmarks, setLandmarks] = useState<{ x: number, y: number } | null>(null);
    const lastTimeRef = useRef<number>(performance.now());
    const frameCountRef = useRef<number>(0);

    useEffect(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const videoElement = videoRef.current;
        const canvasElement = canvasRef.current;
        const canvasCtx = canvasElement.getContext('2d');

        if (!canvasCtx) return;

        const faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        faceMesh.onResults((results: Results) => {
            // FPS Calculation
            const now = performance.now();
            frameCountRef.current++;
            if (now - lastTimeRef.current >= 1000) {
                setFps(frameCountRef.current);
                frameCountRef.current = 0;
                lastTimeRef.current = now;
            }

            // Draw
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

            // Mirror effect
            canvasCtx.translate(canvasElement.width, 0);
            canvasCtx.scale(-1, 1);

            canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const mesh = results.multiFaceLandmarks[0];

                // Update debug info (Nose tip)
                if (mesh[4]) {
                    setLandmarks({ x: mesh[4].x, y: mesh[4].y });
                }

                // --- FILTER: Neon Cyberpunk Contours ---
                canvasCtx.lineWidth = 2;
                canvasCtx.lineJoin = 'round';

                // Helper to draw connections
                const drawPath = (indices: number[], color: string, width = 2) => {
                    canvasCtx.beginPath();
                    const first = mesh[indices[0]];
                    canvasCtx.moveTo(first.x * canvasElement.width, first.y * canvasElement.height);
                    for (let i = 1; i < indices.length; i++) {
                        const pt = mesh[indices[i]];
                        canvasCtx.lineTo(pt.x * canvasElement.width, pt.y * canvasElement.height);
                    }
                    canvasCtx.strokeStyle = color;
                    canvasCtx.lineWidth = width;
                    canvasCtx.shadowColor = color;
                    canvasCtx.shadowBlur = 10;
                    canvasCtx.stroke();
                    canvasCtx.shadowBlur = 0; // Reset
                };

                // Lips (Outer)
                const lipsUpperOuter = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
                const lipsLowerOuter = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
                drawPath([...lipsUpperOuter, ...lipsLowerOuter], '#bd00ff', 3);

                // Left Eye

                drawPath([33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7], '#00f2ff', 2);

                // Right Eye
                drawPath([362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382], '#00f2ff', 2);

                // Face Contour (Jawline)
                const faceOval = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
                drawPath(faceOval, 'rgba(0, 242, 255, 0.5)', 1);

                // Connecting Lines (Tech effect)
                // Nose to cheeks
                drawPath([4, 111, 117, 118], 'rgba(189, 0, 255, 0.3)', 1);
                drawPath([4, 340, 346, 347], 'rgba(189, 0, 255, 0.3)', 1);

            }
            canvasCtx.restore();
        });

        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await faceMesh.send({ image: videoElement });
            },
            width: 1280,
            height: 720
        });
        camera.start();

        return () => {
            // Cleanup if possible, though Camera class doesn't have easy stop in older versions, 
            // usually just unmounting video element stops it eventually.
            // Actually faceMesh.close() is good.
            faceMesh.close();
        };
    }, []);

    return (
        <div className="glass-panel p-4 flex-col flex-center" style={{ width: '100%', position: 'relative' }}>
            <h2 style={{ margin: '0 0 1rem 0' }}>Cyberpunk Face Filter</h2>

            {/* Hidden video element for source */}
            <video
                ref={videoRef}
                style={{ display: 'none' }}
                autoPlay
                playsInline
            />

            {/* Canvas for rendering */}
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    style={{ maxWidth: '100%', display: 'block' }}
                />

                {/* Overlay Info */}
                <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', padding: '5px 10px', borderRadius: '4px', fontSize: '0.8rem', color: '#00f2ff' }}>
                    FPS: {fps}
                </div>

                <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.6)', padding: '5px 10px', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {landmarks
                        ? `Nose Tip: X:${landmarks.x.toFixed(2)} Y:${landmarks.y.toFixed(2)}`
                        : 'No Face Detected'}
                </div>
            </div>

            <div style={{ marginTop: '1rem', color: '#888', fontSize: '0.9rem' }}>
                Looking for face... Light environments work best.
            </div>
        </div>
    );
};
