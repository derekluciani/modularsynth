import React, { useEffect, useRef } from 'react';
import { useAudioContext } from '../context/AudioContextProvider';
import { CardAnalyzer, CardAnalyzerContent } from './ui/card-analyzer';

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

            // Fetch styles once per frame
            const styles = getComputedStyle(document.body);

            // Helper to resolve CSS variables recursively
            const getResolvedColor = (varName: string): string => {
                let value = styles.getPropertyValue(varName).trim();
                if (value.startsWith('var(')) {
                    const match = value.match(/var\(([^)]+)\)/);
                    if (match && match[1]) {
                        return styles.getPropertyValue(match[1]).trim();
                    }
                }
                return value;
            };

            // Use the base variable names defined in CSS (:root or classes)
            const bgColor = getResolvedColor('--background') || 'rgb(9, 9, 11)';
            const analyzerColor = getResolvedColor('--analyzer') || 'rgb(24, 24, 27)';

            ctx.fillStyle = bgColor; 
            ctx.fillRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * height;

                // Gradient or solid color
                // ctx.fillStyle = `hsl(${i / bufferLength * 360}, 100%, 50%)`;
                ctx.fillStyle = analyzerColor; 

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
        <CardAnalyzer className="w-full shadow-lg shadow-black/50">
            <CardAnalyzerContent className="p-0">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={150}
                    className="w-full h-[150px] rounded-lg"
                />
            </CardAnalyzerContent>
        </CardAnalyzer>
    );
};
