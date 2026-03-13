'use client';

import { useState, useRef, useEffect } from 'react';

export default function SfMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  useEffect(() => {
    return () => {
      // Cleanup
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      if (audioCtxRef.current) {
        const t = audioCtxRef.current.currentTime;
        // Fade out
        oscillatorsRef.current.forEach(osc => {
          try { osc.stop(t + 1); } catch (e) {}
        });
        setTimeout(() => {
          audioCtxRef.current?.close();
          audioCtxRef.current = null;
          oscillatorsRef.current = [];
        }, 1000);
      }
      setIsPlaying(false);
    } else {
      // Create Epic SF Drone
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 3); // Slow fade in
      masterGain.connect(ctx.destination);

      // Reverb (Convolution) approximation - simple delay feedback for epicness
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.5;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.6;
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(masterGain);

      const createDrone = (freq: number, type: OscillatorType, detune: number, lfoFreq: number) => {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = detune;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = freq * 3;
        
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = lfoFreq; // Slow modulation
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = freq;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        const gain = ctx.createGain();
        gain.gain.value = 0.5;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        gain.connect(delay);
        
        osc.start();
        lfo.start();
        return [osc, lfo];
      };

      // Create a thick, dark, edgy sci-fi chord (Cm9 or similar deep drone)
      const root = 65.41; // C2
      const oscc1 = createDrone(root, 'sawtooth', 0, 0.1);
      const oscc2 = createDrone(root * 1.5, 'square', 5, 0.15); // G2
      const oscc3 = createDrone(root * 2.25, 'triangle', -5, 0.2); // D3
      const oscc4 = createDrone(root / 2, 'sine', 0, 0.05); // C1 sub
      
      oscillatorsRef.current = [...oscc1, ...oscc2, ...oscc3, ...oscc4] as OscillatorNode[];

      setIsPlaying(true);
    }
  };

  return (
    <button 
      onClick={togglePlay}
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '2rem',
        background: isPlaying ? 'var(--accent)' : 'var(--card-bg)',
        border: '1px solid var(--accent)',
        color: 'white',
        padding: '0.8rem 1.5rem',
        borderRadius: '50px',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 'bold',
        cursor: 'pointer',
        zIndex: 50,
        boxShadow: isPlaying ? '0 0 15px var(--accent-glow)' : 'none',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}
    >
       {isPlaying ? '◼ Pause Epic SF Music' : '▶ Play Epic SF Music'}
    </button>
  );
}
