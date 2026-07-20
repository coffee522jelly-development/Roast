import { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyserNode: AnalyserNode | null;
  theme: string;
}

export function Visualizer({ analyserNode, theme }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analyserNode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    // Buffer for frequency data
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationId = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.15; // Central circle radius

      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);

      // Extract primary color from CSS variable
      const rawPrimary = getComputedStyle(document.body).getPropertyValue('--primary').trim();
      const formattedValues = rawPrimary.split(/[\s,]+/).filter(Boolean).join(',');

      // We will draw radiating lines
      // We only use the lower ~half of the frequencies for a music visualizer usually looks better
      const activeFrequencies = Math.floor(bufferLength * 0.75);

      for (let i = 0; i < activeFrequencies; i++) {
        // frequency value between 0 and 255
        const value = dataArray[i];

        // map value to a length for the line
        const barHeight = (value / 255) * (Math.min(width, height) / 2 - radius);

        // Calculate angle for this frequency bin
        const angle = (i / activeFrequencies) * Math.PI * 2 - Math.PI / 2;

        // Start point (on the circumference of the inner circle)
        const startX = centerX + Math.cos(angle) * radius;
        const startY = centerY + Math.sin(angle) * radius;

        // End point
        const endX = centerX + Math.cos(angle) * (radius + barHeight);
        const endY = centerY + Math.sin(angle) * (radius + barHeight);

        // Calculate opacity or color based on frequency bin and value
        const opacity = Math.max(0.1, value / 255);

        // Dynamic gradient
        const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        if (rawPrimary) {
           gradient.addColorStop(0, `hsla(${formattedValues}, ${opacity})`);
           gradient.addColorStop(1, `hsla(${formattedValues}, 0)`);
        } else {
           gradient.addColorStop(0, `rgba(59, 130, 246, ${opacity})`);
           gradient.addColorStop(1, `rgba(59, 130, 246, 0)`);
        }

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = gradient;
        ctx.stroke();
      }

      // Draw inner glowing circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = rawPrimary ? `hsla(${formattedValues}, 0.05)` : 'rgba(59, 130, 246, 0.05)';
      ctx.fill();

      // Stroke the inner circle slightly
      ctx.lineWidth = 1;
      ctx.strokeStyle = rawPrimary ? `hsla(${formattedValues}, 0.3)` : 'rgba(59, 130, 246, 0.3)';
      ctx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyserNode, theme]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={800}
        height={800}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
}
