import React, { useEffect, useRef, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

const FaceMeshFilter = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [fps, setFps] = useState(0);
    const lastFrameTime = useRef(performance.now());
    const sunglassesImg = useRef(new Image());

    useEffect(() => {
        sunglassesImg.current.src = '/sunglasses.png';

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

        if (typeof videoRef.current !== "undefined" && videoRef.current !== null) {
            const camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    await faceMesh.send({ image: videoRef.current });
                },
                width: 1280,
                height: 720
            });
            camera.start();
        }
    }, []);

    const onResults = (results) => {
        // Calculate FPS
        const now = performance.now();
        const delta = now - lastFrameTime.current;
        if (delta > 0) {
            setFps(Math.round(1000 / delta));
        }
        lastFrameTime.current = now;

        // Draw
        const canvasElement = canvasRef.current;
        if (!canvasElement) return;

        const canvasCtx = canvasElement.getContext('2d');
        const { width, height } = canvasElement;

        // Clear
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, width, height);
        canvasCtx.drawImage(results.image, 0, 0, width, height);

        if (results.multiFaceLandmarks) {
            for (const landmarks of results.multiFaceLandmarks) {
                // Draw Overlay (Sunglasses)
                // Key landmarks: 33 (left eye inner), 263 (right eye inner), 133 (left eye outer), 362 (right eye outer), 168 (nose bridge high)
                // Let's use 33 and 263 to determine angle and width.
                const leftEye = landmarks[33];
                const rightEye = landmarks[263];

                const eyeDistance = Math.sqrt(
                    Math.pow((rightEye.x - leftEye.x) * width, 2) +
                    Math.pow((rightEye.y - leftEye.y) * height, 2)
                );

                const cx = ((leftEye.x + rightEye.x) / 2) * width;
                const cy = ((leftEye.y + rightEye.y) / 2) * height;

                const angle = Math.atan2(
                    (rightEye.y - leftEye.y) * height,
                    (rightEye.x - leftEye.x) * width
                );

                // Adjust size and position manually based on feel
                const imgWidth = eyeDistance * 2.5;
                const imgHeight = imgWidth * (sunglassesImg.current.height / sunglassesImg.current.width);

                canvasCtx.translate(cx, cy);
                canvasCtx.rotate(angle);
                canvasCtx.drawImage(sunglassesImg.current, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
                canvasCtx.restore();

                // Optional: Draw Landmarks for requirements
                canvasCtx.fillStyle = '#00FF00';
                for (let i = 0; i < landmarks.length; i += 10) { // sparse
                    const x = landmarks[i].x * width;
                    const y = landmarks[i].y * height;
                    canvasCtx.fillRect(x, y, 1, 1);
                }
            }
        }
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
            <video
                ref={videoRef}
                className="hidden"
                style={{ width: 1280, height: 720 }}
            />
            <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="max-w-full max-h-full"
            />
            <div className="absolute top-4 left-4 bg-black/50 text-green-400 p-2 rounded font-mono z-10">
                FPS: {fps}
            </div>
        </div>
    );
};

export default FaceMeshFilter;
