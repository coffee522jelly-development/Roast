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

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationId = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.15;

      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);

      const rawPrimary = getComputedStyle(document.body).getPropertyValue('--primary').trim();
      const formattedValues = rawPrimary.split(/[\s,]+/).filter(Boolean).join(',');

      // We only use the lower 50% for a cleaner look
      const activeFrequencies = Math.floor(bufferLength * 0.5);

      // Calculate coordinates for the wave
      const wavePoints: { x: number, y: number }[] = [];
      const lines: { startX: number, startY: number, endX: number, endY: number, value: number }[] = [];

      // Map low freq -> right (0 angle), high freq -> left (PI angle)
      // Top half: 0 to -PI
      for (let i = 0; i < activeFrequencies; i++) {
        const value = dataArray[i];
        const normalizedValue = value / 255;
        const barHeight = normalizedValue * (Math.min(width, height) / 2.5 - baseRadius);

        // Map i=0 to angle=0 (right), i=activeFrequencies to angle=-PI (left)
        const angle = - (i / (activeFrequencies - 1)) * Math.PI;

        const currentRadius = baseRadius + (normalizedValue * 30); // Wave pulse radius
        const waveX = centerX + Math.cos(angle) * currentRadius;
        const waveY = centerY + Math.sin(angle) * currentRadius;
        wavePoints.push({ x: waveX, y: waveY });

        const startX = centerX + Math.cos(angle) * baseRadius;
        const startY = centerY + Math.sin(angle) * baseRadius;
        const endX = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const endY = centerY + Math.sin(angle) * (baseRadius + barHeight);

        lines.push({ startX, startY, endX, endY, value });
      }

      // Bottom half: mirror the top half (0 to PI)
      for (let i = activeFrequencies - 1; i >= 0; i--) {
        const value = dataArray[i];
        const normalizedValue = value / 255;
        const barHeight = normalizedValue * (Math.min(width, height) / 2.5 - baseRadius);

        // Map i=activeFrequencies to angle=PI (left), i=0 to angle=0 (right)
        const angle = (i / (activeFrequencies - 1)) * Math.PI;

        const currentRadius = baseRadius + (normalizedValue * 30); // Wave pulse radius
        const waveX = centerX + Math.cos(angle) * currentRadius;
        const waveY = centerY + Math.sin(angle) * currentRadius;
        wavePoints.push({ x: waveX, y: waveY });

        const startX = centerX + Math.cos(angle) * baseRadius;
        const startY = centerY + Math.sin(angle) * baseRadius;
        const endX = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const endY = centerY + Math.sin(angle) * (baseRadius + barHeight);

        lines.push({ startX, startY, endX, endY, value });
      }

      // Draw Radiating Lines
      lines.forEach((line) => {
        const opacity = Math.max(0.1, line.value / 255);

        // Dynamic gradient for lines
        const lineGrad = ctx.createLinearGradient(line.startX, line.startY, line.endX, line.endY);
        if (rawPrimary) {
           lineGrad.addColorStop(0, `hsla(${formattedValues}, ${opacity * 0.8})`);
           lineGrad.addColorStop(0.5, `hsla(${formattedValues}, ${opacity * 0.5})`);
           lineGrad.addColorStop(1, `hsla(${formattedValues}, 0)`);
        } else {
           lineGrad.addColorStop(0, `rgba(59, 130, 246, ${opacity * 0.8})`);
           lineGrad.addColorStop(0.5, `rgba(59, 130, 246, ${opacity * 0.5})`);
           lineGrad.addColorStop(1, `rgba(59, 130, 246, 0)`);
        }

        ctx.beginPath();
        ctx.moveTo(line.startX, line.startY);
        ctx.lineTo(line.endX, line.endY);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = lineGrad;
        ctx.stroke();
      });

      // Draw the Wave around the circumference
      if (wavePoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(wavePoints[0].x, wavePoints[0].y);
        for (let i = 1; i < wavePoints.length; i++) {
          ctx.lineTo(wavePoints[i].x, wavePoints[i].y);
        }
        ctx.closePath();

        const waveGrad = ctx.createRadialGradient(centerX, centerY, baseRadius, centerX, centerY, width/2);
        if (rawPrimary) {
           waveGrad.addColorStop(0, `hsla(${formattedValues}, 0.8)`);
           waveGrad.addColorStop(0.2, `hsla(${formattedValues}, 0.3)`);
           waveGrad.addColorStop(1, `hsla(${formattedValues}, 0)`);
        } else {
           waveGrad.addColorStop(0, `rgba(59, 130, 246, 0.8)`);
           waveGrad.addColorStop(0.2, `rgba(59, 130, 246, 0.3)`);
           waveGrad.addColorStop(1, `rgba(59, 130, 246, 0)`);
        }

        ctx.lineWidth = 2;
        ctx.strokeStyle = rawPrimary ? `hsla(${formattedValues}, 0.9)` : 'rgba(59, 130, 246, 0.9)';
        ctx.stroke();

        // Fill wave with gradient
        ctx.fillStyle = waveGrad;
        ctx.fill();
      }

      // Draw inner glowing circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = rawPrimary ? `hsla(${formattedValues}, 0.1)` : 'rgba(59, 130, 246, 0.1)';
      ctx.fill();

      // Stroke the inner circle slightly
      ctx.lineWidth = 1;
      ctx.strokeStyle = rawPrimary ? `hsla(${formattedValues}, 0.5)` : 'rgba(59, 130, 246, 0.5)';
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
        width={1200}
        height={1200}
        className="max-w-full max-h-full object-contain drop-shadow-2xl"
      />
    </div>
  );
}
