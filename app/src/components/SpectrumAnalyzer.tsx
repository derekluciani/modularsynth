import React, { useEffect, useRef } from 'react';
import { useAudioContext } from '../context/AudioContextProvider';
import { Card, CardContent } from './ui/card';

export const SpectrumAnalyzer: React.FC = () => {
    const { analyserNode } = useAudioContext();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        if (!analyserNode || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);

            analyserNode.getByteFrequencyData(dataArray);

            const width = canvas.width;
            const height = canvas.height;

            ctx.fillStyle = 'rgb(9, 9, 11)'; // zinc-900
            ctx.fillRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * height;

                // Gradient or solid color
                // Let's use the emerald color to match the theme
                // ctx.fillStyle = `hsl(${i / bufferLength * 360}, 100%, 50%)`;
                ctx.fillStyle = 'rgb(16, 185, 129)'; // emerald-500

                ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [analyserNode]);

    return (
        <Card className="w-full shadow-lg shadow-black/50">
            <CardContent className="p-0">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={150}
                    className="w-full h-[150px] bg-zinc-950 rounded-xl"
                />
            </CardContent>
        </Card>
    );
};
