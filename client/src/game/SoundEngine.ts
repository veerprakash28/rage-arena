export class SoundEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private isMuted: boolean = false;

    public init() {
        if (this.ctx) return;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            this.ctx = new AudioContextClass();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);
        }
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 0.5;
        }
    }

    private playNoiseBurst(duration: number, bandPassFreq: number, gainValue: number = 1.0) {
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const bandpass = this.ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = bandPassFreq;

        const env = this.ctx.createGain();
        env.gain.setValueAtTime(gainValue, this.ctx.currentTime);
        env.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(bandpass);
        bandpass.connect(env);
        env.connect(this.masterGain);

        noise.start();
    }

    private playTone(freq: number, type: OscillatorType, duration: number, dropOff: number = 0) {
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (dropOff > 0) {
            osc.frequency.exponentialRampToValueAtTime(dropOff, this.ctx.currentTime + duration);
        }

        const env = this.ctx.createGain();
        env.gain.setValueAtTime(1, this.ctx.currentTime);
        env.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(env);
        env.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    public playPunch() {
        this.playNoiseBurst(0.1, 1000);
    }

    public playKick() {
        this.playNoiseBurst(0.15, 600);
        this.playTone(100, 'sine', 0.15, 20);
    }

    public playSmash() {
        this.playNoiseBurst(0.3, 300, 1.5);
        this.playTone(60, 'square', 0.3, 10);
    }

    public playBlock() {
        this.playTone(800, 'triangle', 0.1);
    }

    public playKO() {
        this.playNoiseBurst(1.0, 100, 2.0);
        this.playTone(150, 'sawtooth', 1.5, 20);
    }
}

export const soundEngine = new SoundEngine();
