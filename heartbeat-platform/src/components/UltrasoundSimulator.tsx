/**
 * Ultrasound Simulator Component
 * Generates a visual simulation of a fetal ultrasound M-mode display
 */

import React, { useEffect, useRef, useState } from 'react';

interface UltrasoundSimulatorProps {
  bpm?: number;
  isActive?: boolean;
  className?: string;
}

export default function UltrasoundSimulator({ 
  bpm = 140, 
  isActive = true, 
  className = '' 
}: UltrasoundSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    const drawUltrasound = (time: number) => {
      // Clear canvas
      ctx.fillStyle = '#000814';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw 2D fetal heart view (top section)
      drawFetalHeartView(ctx, canvas.width, canvas.height * 0.4, time);

      // Draw M-mode waveform (bottom section)
      drawMModeWaveform(ctx, canvas.width, canvas.height * 0.6, time, bpm);

      // Draw UI elements
      drawUIElements(ctx, canvas.width, canvas.height, bpm);

      if (isActive) {
        animationRef.current = requestAnimationFrame(drawUltrasound);
      }
    };

    if (isActive) {
      animationRef.current = requestAnimationFrame(drawUltrasound);
    } else {
      drawUltrasound(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [bpm, isActive]);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setCurrentTime(prev => prev + 0.1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  return (
    <div className={`ultrasound-simulator ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full border border-gray-600 rounded-lg"
        style={{ backgroundColor: '#000814' }}
      />
    </div>
  );
}

/**
 * Draw 2D fetal heart view
 */
function drawFetalHeartView(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const centerX = width / 2;
  const centerY = height / 2;

  // Draw heart chambers
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.8;

  // Left ventricle (larger)
  ctx.beginPath();
  ctx.ellipse(centerX - 30, centerY, 40, 25, 0, 0, 2 * Math.PI);
  ctx.stroke();

  // Right ventricle (smaller)
  ctx.beginPath();
  ctx.ellipse(centerX + 30, centerY, 25, 20, 0, 0, 2 * Math.PI);
  ctx.stroke();

  // Atria (top chambers)
  ctx.beginPath();
  ctx.ellipse(centerX - 20, centerY - 35, 20, 15, 0, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(centerX + 20, centerY - 35, 15, 12, 0, 0, 2 * Math.PI);
  ctx.stroke();

  // Draw heart valves
  ctx.strokeStyle = '#00cc66';
  ctx.lineWidth = 1;
  
  // Mitral valve
  ctx.beginPath();
  ctx.moveTo(centerX - 30, centerY - 10);
  ctx.lineTo(centerX - 20, centerY - 20);
  ctx.stroke();

  // Tricuspid valve
  ctx.beginPath();
  ctx.moveTo(centerX + 30, centerY - 8);
  ctx.lineTo(centerX + 20, centerY - 18);
  ctx.stroke();

  // Add pulsing effect
  const pulse = Math.sin(time * 0.02) * 0.1 + 1;
  ctx.globalAlpha = 0.3 + Math.sin(time * 0.02) * 0.2;
  
  // Draw blood flow visualization
  ctx.fillStyle = '#ff0066';
  ctx.globalAlpha = 0.4 + Math.sin(time * 0.02) * 0.3;
  
  // Left ventricle filling
  ctx.beginPath();
  ctx.ellipse(centerX - 30, centerY, 35 * pulse, 20 * pulse, 0, 0, 2 * Math.PI);
  ctx.fill();

  // Right ventricle filling
  ctx.beginPath();
  ctx.ellipse(centerX + 30, centerY, 20 * pulse, 15 * pulse, 0, 0, 2 * Math.PI);
  ctx.fill();

  ctx.globalAlpha = 1;
}

/**
 * Draw M-mode waveform
 */
function drawMModeWaveform(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, bpm: number) {
  const startY = height * 0.4;
  const endY = height;
  const centerY = (startY + endY) / 2;

  // Draw grid lines
  ctx.strokeStyle = '#1a3a1a';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;

  // Vertical grid lines (time markers)
  for (let x = 0; x < width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }

  // Horizontal grid lines (amplitude markers)
  for (let y = startY; y < endY; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;

  // Draw baseline
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();

  // Calculate heartbeat timing
  const beatInterval = 60 / bpm; // seconds per beat
  const pixelsPerSecond = width / 8; // 8 seconds displayed
  const pixelsPerBeat = beatInterval * pixelsPerSecond;

  // Draw waveform
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();

  for (let x = 0; x < width; x++) {
    const timeAtX = x / pixelsPerSecond;
    const beatPhase = (timeAtX % beatInterval) / beatInterval;
    
    let amplitude = 0;
    
    // Create heartbeat waveform
    if (beatPhase < 0.1) {
      // Rapid rise (QRS complex)
      amplitude = Math.sin(beatPhase * Math.PI * 10) * 40;
    } else if (beatPhase < 0.3) {
      // ST segment
      amplitude = 20 * Math.exp(-(beatPhase - 0.1) * 10);
    } else if (beatPhase < 0.5) {
      // T wave
      amplitude = 15 * Math.sin((beatPhase - 0.3) * Math.PI * 5) * Math.exp(-(beatPhase - 0.3) * 3);
    } else {
      // Rest period
      amplitude = 0;
    }

    // Add some noise for realism
    amplitude += (Math.random() - 0.5) * 3;

    const y = centerY - amplitude;
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();

  // Draw moving cursor
  const cursorX = (time * 0.1) % width;
  ctx.strokeStyle = '#ff0066';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(cursorX, startY);
  ctx.lineTo(cursorX, endY);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

/**
 * Draw UI elements
 */
function drawUIElements(ctx: CanvasRenderingContext2D, width: number, height: number, bpm: number) {
  // Draw BPM display
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`FHR: ${bpm} BPM`, 20, 30);

  // Draw mode indicator
  ctx.fillStyle = '#00cc66';
  ctx.font = '16px monospace';
  ctx.fillText('M-MODE', 20, 50);

  // Draw time scale
  ctx.fillStyle = '#00ff88';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 8; i++) {
    const x = (i / 8) * width;
    ctx.fillText(`${i}s`, x, height - 10);
  }

  // Draw amplitude scale
  ctx.textAlign = 'right';
  ctx.fillText('0', width - 10, height * 0.4 + 15);
  ctx.fillText('50', width - 10, height * 0.4 + 45);
  ctx.fillText('100', width - 10, height * 0.4 + 75);

  // Draw section labels
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('2D Fetal Heart View', width / 2, height * 0.4 - 10);
  ctx.fillText('M-Mode Waveform', width / 2, height * 0.4 + 20);

  // Draw ultrasound machine info
  ctx.fillStyle = '#00cc66';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ULTRASOUND SIMULATOR', 20, height - 30);
  ctx.fillText('Fetal Heart Rate Monitor', 20, height - 15);
}
