import React, { useRef, useEffect, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors } from '@mediapipe/drawing_utils';

const FaceMeshComponent = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [fps, setFps] = useState(0);
    const lastTimeRef = useRef(Date.now());
    const frameCountRef = useRef(0);

    const onResults = (results) => {
        // FPS Calculation
        frameCountRef.current++;
        const now = Date.now();
        if (now - lastTimeRef.current >= 1000) {
            setFps(frameCountRef.current);
            frameCountRef.current = 0;
            lastTimeRef.current = now;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions to match video
        if (results.image.width && results.image.height) { // Check if valid
            canvas.width = results.image.width;
            canvas.height = results.image.height;
        }

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Video Feed (Mirrored)
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (results.multiFaceLandmarks) {
            for (const landmarks of results.multiFaceLandmarks) {
                // Draw Filter: Sunglasses
                // Eyes indices: Left (33), Right (263) roughly, or specific geometric centers.
                // Let's use specific landmarks for eyes to draw simple sunglasses.
                // Left Eye: 33 (inner), 133 (outer), 159 (top), 145 (bottom) is approx area. Center roughly around 468 (iris).
                // Right Eye: 362 (inner), 263 (outer), 386 (top), 374 (bottom). Center roughly 473.

                // Simple approach: Draw black circles on eyes and a line.

                const leftEye = landmarks[468]; // Left Iris
                const rightEye = landmarks[473]; // Right Iris
                const center = landmarks[6]; // Nose bridge center

                if (!leftEye || !rightEye) continue;

                const leftX = leftEye.x * canvas.width;
                const leftY = leftEye.y * canvas.height;
                const rightX = rightEye.x * canvas.width;
                const rightY = rightEye.y * canvas.height;

                // Size based on distance between eyes
                const dx = rightX - leftX;
                const dy = rightY - leftY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const radius = dist * 0.6; // Large lenses

                // Draw Sunglasses
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;

                // Left Lens
                ctx.beginPath();
                ctx.arc(leftX, leftY, radius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();

                // Right Lens
                ctx.beginPath();
                ctx.arc(rightX, rightY, radius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();

                // Bridge
                ctx.beginPath();
                ctx.moveTo(leftX + radius * 0.8, leftY - radius * 0.2);
                ctx.lineTo(rightX - radius * 0.8, rightY - radius * 0.2);
                ctx.lineWidth = 5;
                ctx.stroke();
            }
        }
        ctx.restore();
    };

    useEffect(() => {
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

        faceMesh.onResults(onResults);

        if (videoRef.current) {
            const camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    await faceMesh.send({ image: videoRef.current });
                },
                width: 640,
                height: 480
            });
            camera.start();
        }

        return () => {
            // Cleanup if needed? Camera stop usually recommended but Camera utils doesn't expose easy stop
            // faceMesh.close();
        };
    }, []);

    return (
        <div className="overlay-container">
            <video
                ref={videoRef}
                style={{ display: 'none' }}
            />
            <canvas
                ref={canvasRef}
                className="glass-panel"
                style={{ width: '640px', height: '480px', maxWidth: '100%' }} // Responsive
            />
            <div style={{
                position: 'absolute',
                top: 10,
                left: 10,
                background: 'rgba(0,0,0,0.6)',
                padding: '4px 8px',
                borderRadius: 8,
                color: '#0f0'
            }}>
                FPS: {fps}
            </div>
        </div>
    );
};

export default FaceMeshComponent;
