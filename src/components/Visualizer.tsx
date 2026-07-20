import { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyserNode: AnalyserNode | null;
  theme: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
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
    let particles: Particle[] = [];

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

      // Darken the background slightly each frame to create trails instead of clearRect
      ctx.clearRect(0, 0, width, height);

      const rawPrimary = getComputedStyle(document.body).getPropertyValue('--primary').trim();
      const formattedValues = rawPrimary.split(/[\s,]+/).filter(Boolean).join(',');

      // We only use the lower 50% for a cleaner look
      const activeFrequencies = Math.floor(bufferLength * 0.5);

      // Calculate coordinates for the wave
      const wavePoints: { x: number, y: number }[] = [];
      const lines: { startX: number, startY: number, endX: number, endY: number, value: number }[] = [];
      let totalEnergy = 0;

      // Map low freq -> right (0 angle), high freq -> left (PI angle)
      // Top half: 0 to -PI
      for (let i = 0; i < activeFrequencies; i++) {
        const value = dataArray[i];
        totalEnergy += value;
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
        totalEnergy += value;
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

      const avgEnergy = totalEnergy / (activeFrequencies * 2);

      // Spawn particles based on energy
      if (avgEnergy > 20 && Math.random() > 0.5) {
        const numParticles = Math.floor(avgEnergy / 10);
        for (let i = 0; i < numParticles; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * (avgEnergy / 20);
          particles.push({
            x: centerX + Math.cos(angle) * baseRadius,
            y: centerY + Math.sin(angle) * baseRadius,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0,
            maxLife: 50 + Math.random() * 100,
            size: 1 + Math.random() * 3
          });
        }
      }

      // Update and Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        const opacity = 1 - (p.life / p.maxLife);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = rawPrimary ? `hsla(${formattedValues}, ${opacity})` : `rgba(59, 130, 246, ${opacity})`;
        ctx.fill();
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

        ctx.lineWidth = 2;
        ctx.strokeStyle = rawPrimary ? `hsla(${formattedValues}, 0.9)` : 'rgba(59, 130, 246, 0.9)';
        ctx.stroke();
      }

      // Draw inner hollow ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = rawPrimary ? `hsla(${formattedValues}, 0.8)` : 'rgba(59, 130, 246, 0.8)';
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
