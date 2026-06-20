import { useEffect, useRef, useState } from "react";

interface WaveformDisplayProps {
  b64Data: string | null;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  aPoint: number | null;
  bPoint: number | null;
  opacity: number;
}

export function WaveformDisplay({ b64Data, currentTime, duration, onSeek, aPoint, bPoint, opacity }: WaveformDisplayProps) {
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

    // Get primary color from CSS (Tauri/shadcn usually stores HSL values like "240 5.9% 10%")
    const rawPrimary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
    // Convert "240 5.9% 10%" to "hsl(240, 5.9%, 10%)" for Canvas
    const primaryHsl = rawPrimary ? `hsla(${rawPrimary.split(" ").join(",")}, ${opacity})` : `rgba(59, 130, 246, ${opacity})`;
    const primaryHslFull = rawPrimary ? `hsl(${rawPrimary.split(" ").join(",")})` : "#3b82f6";
    const mutedColor = `rgba(128, 128, 128, ${opacity * 0.3})`;

    peaks.forEach((peak, i) => {
      const x = i * barWidth;
      const progress = (i / peaks.length) * duration;
      const isPlayed = progress < currentTime;
      const barHeight = Math.max(2, peak * height * 0.85); // Minimum 2px height for visual consistency

      // Check if in AB loop
      let isInAB = false;
      if (aPoint !== null && bPoint !== null) {
        isInAB = progress >= aPoint && progress <= bPoint;
      }

      ctx.fillStyle = isPlayed ? primaryHslFull : mutedColor;
      if (isInAB) {
        ctx.fillStyle = isPlayed ? primaryHslFull : primaryHsl;
      }

      // Draw centered bars
      ctx.fillRect(x, (height - barHeight) / 2, Math.max(1, barWidth - 1), barHeight);
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

  }, [peaks, currentTime, duration, aPoint, bPoint, opacity]);

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
