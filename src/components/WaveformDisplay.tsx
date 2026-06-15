import { useEffect, useRef, useState } from "react";

interface WaveformDisplayProps {
  b64Data: string | null;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  aPoint: number | null;
  bPoint: number | null;
}

export function WaveformDisplay({ b64Data, currentTime, duration, onSeek, aPoint, bPoint }: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [peaks, setPeaks] = useState<number[]>([]);

  useEffect(() => {
    if (!b64Data) {
      setPeaks([]);
      return;
    }

    const generatePeaks = async () => {
      try {
        const binaryString = atob(b64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer);
        const channelData = audioBuffer.getChannelData(0);

        const samples = 1000; // Number of bars
        const blockSize = Math.floor(channelData.length / samples);
        const newPeaks: number[] = [];

        for (let i = 0; i < samples; i++) {
          let max = 0;
          for (let j = 0; j < blockSize; j++) {
            const val = Math.abs(channelData[i * blockSize + j]);
            if (val > max) max = val;
          }
          newPeaks.push(max);
        }
        setPeaks(newPeaks);
        await audioCtx.close();
      } catch (err) {
        console.error("Waveform generation failed:", err);
      }
    };

    generatePeaks();
  }, [b64Data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || peaks.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / peaks.length;

    ctx.clearRect(0, 0, width, height);

    // Get primary color from CSS
    const primaryColor = getComputedStyle(document.body).getPropertyValue("--primary");
    const mutedColor = "rgba(128, 128, 128, 0.2)";

    peaks.forEach((peak, i) => {
      const x = i * barWidth;
      const progress = (i / peaks.length) * duration;
      const isPlayed = progress < currentTime;
      const barHeight = peak * height * 0.8;

      // Check if in AB loop
      let isInAB = false;
      if (aPoint !== null && bPoint !== null) {
        isInAB = progress >= aPoint && progress <= bPoint;
      }

      ctx.fillStyle = isPlayed ? `hsl(${primaryColor})` : mutedColor;
      if (isInAB) {
        ctx.fillStyle = isPlayed ? `hsl(${primaryColor})` : `hsla(${primaryColor}, 0.4)`;
      }

      ctx.fillRect(x, (height - barHeight) / 2, barWidth - 1, barHeight);
    });

    // Draw A-B markers
    if (aPoint !== null) {
      const ax = (aPoint / duration) * width;
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(ax - 1, 0, 2, height);
      ctx.font = "8px sans-serif";
      ctx.fillText("A", ax + 4, 10);
    }
    if (bPoint !== null) {
      const bx = (bPoint / duration) * width;
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(bx - 1, 0, 2, height);
      ctx.font = "8px sans-serif";
      ctx.fillText("B", bx + 4, 10);
    }

  }, [peaks, currentTime, duration, aPoint, bPoint]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * duration;
    onSeek(time);
  };

  return (
    <div className="w-full h-12 relative cursor-pointer group mb-2">
      <canvas
        ref={canvasRef}
        width={1000}
        height={60}
        className="w-full h-full"
        onClick={handleClick}
      />
    </div>
  );
}
