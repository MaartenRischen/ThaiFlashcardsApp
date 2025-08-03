import { Phrase } from '@/app/lib/generation/types';
import { VideoLessonConfig, TextOverlay, AudioTiming } from './types';

const DEFAULT_CONFIG: VideoLessonConfig = {
  width: 1920,
  height: 1080,
  fps: 30,
  fontSize: 56,
  fontFamily: 'Noto Sans Thai, Sarabun, Arial, sans-serif',
  backgroundColor: '#1a1a1a',
  textColor: '#ffffff',
  highlightColor: '#00ff88',
  pronunciationColor: '#888888',
  mnemonicColor: '#ffcc00',
  speed: 1.0,
  loops: 1,
  phraseRepetitions: 2,
  voiceGender: 'female',
  includeMnemonics: true
};

export class VideoLessonGenerator {
  private config: VideoLessonConfig;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private overlays: TextOverlay[] = [];
  
  constructor(config: Partial<VideoLessonConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Create offscreen canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.width!;
    this.canvas.height = this.config.height!;
    
    const ctx = this.canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    
    // Set default styles
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
  }
  
  /**
   * Generate text overlay timings based on audio lesson structure
   */
  generateOverlayTimings(
    phrases: Phrase[],
    audioTimings: AudioTiming[]
  ): TextOverlay[] {
    const overlays: TextOverlay[] = [];
    
    audioTimings.forEach((timing) => {
      if (timing.type === 'pause') return;
      
      // Handle instruction text
      if (timing.instructionText) {
        overlays.push({
          text: timing.instructionText,
          startTime: timing.startTime,
          endTime: timing.endTime,
          type: 'english',
          highlight: false,
          phraseIndex: -1
        });
        return;
      }
      
      const phrase = phrases[timing.phraseIndex];
      if (!phrase) return;
      
      // Determine which Thai text to use based on gender
      const thaiText = this.getThaiText(phrase);
      
      switch (timing.type) {
        case 'english':
          overlays.push({
            text: phrase.english,
            startTime: timing.startTime,
            endTime: timing.endTime,
            type: 'english',
            highlight: timing.isActive,
            phraseIndex: timing.phraseIndex
          });
          break;
          
        case 'thai':
          // Thai text
          overlays.push({
            text: thaiText,
            startTime: timing.startTime,
            endTime: timing.endTime,
            type: 'thai',
            highlight: timing.isActive,
            phraseIndex: timing.phraseIndex
          });
          
          // Pronunciation (show with Thai)
          if (phrase.pronunciation) {
            overlays.push({
              text: phrase.pronunciation,
              startTime: timing.startTime,
              endTime: timing.endTime,
              type: 'pronunciation',
              phraseIndex: timing.phraseIndex
            });
          }
          break;
          
        case 'mnemonic':
          if (phrase.mnemonic && this.config.includeMnemonics) {
            overlays.push({
              text: phrase.mnemonic,
              startTime: timing.startTime,
              endTime: timing.endTime,
              type: 'mnemonic',
              phraseIndex: timing.phraseIndex
            });
          }
          break;
      }
    });
    
    return overlays;
  }
  
  private getThaiText(phrase: Phrase): string {
    if (this.config.voiceGender === 'male' && phrase.thaiMasculine) {
      return phrase.thaiMasculine;
    } else if (this.config.voiceGender === 'female' && phrase.thaiFeminine) {
      return phrase.thaiFeminine;
    }
    return phrase.thai;
  }
  
  /**
   * Render a single frame at a specific time
   */
  renderFrame(currentTime: number): void {
    // Clear canvas
    this.ctx.fillStyle = this.config.backgroundColor!;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Get active overlays for current time
    const activeOverlays = this.overlays.filter(
      overlay => currentTime >= overlay.startTime && currentTime < overlay.endTime
    );
    
    if (activeOverlays.length === 0) {
      // Show waiting message or logo
      this.renderWaitingScreen();
      return;
    }
    
    // Group overlays by phrase
    const groupedOverlays = this.groupOverlaysByPhrase(activeOverlays);
    
    // Render centered focus layout
    this.renderCenteredLayout(groupedOverlays);
    
    // Add progress bar
    this.renderProgressBar(currentTime);
  }
  
  private groupOverlaysByPhrase(overlays: TextOverlay[]): Map<number, TextOverlay[]> {
    const grouped = new Map<number, TextOverlay[]>();
    
    overlays.forEach(overlay => {
      const key = overlay.phraseIndex ?? -1;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(overlay);
    });
    
    return grouped;
  }
  
  private renderCenteredLayout(groupedOverlays: Map<number, TextOverlay[]>): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // We'll typically have one phrase at a time
    const [phraseOverlays] = Array.from(groupedOverlays.values());
    if (!phraseOverlays) return;
    
    // Sort overlays by type for consistent ordering
    const typeOrder = ['thai', 'pronunciation', 'english', 'mnemonic'];
    phraseOverlays.sort((a, b) => 
      typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
    );
    
    // Calculate vertical spacing
    const lineSpacing = this.config.fontSize! * 1.8;
    const totalHeight = phraseOverlays.length * lineSpacing;
    const startY = centerY - totalHeight / 2 + lineSpacing / 2;
    
    phraseOverlays.forEach((overlay, index) => {
      const y = startY + index * lineSpacing;
      
      // Set text style based on type
      this.setTextStyle(overlay.type, overlay.highlight);
      
      // Add animation for highlighted text
      if (overlay.highlight) {
        // Subtle scale animation
        const scale = 1 + Math.sin(Date.now() * 0.003) * 0.02;
        this.ctx.save();
        this.ctx.translate(centerX, y);
        this.ctx.scale(scale, scale);
        this.ctx.translate(-centerX, -y);
      }
      
      // Draw text with shadow for better readability
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      this.ctx.shadowBlur = 8;
      this.ctx.shadowOffsetX = 2;
      this.ctx.shadowOffsetY = 2;
      
      // Word wrap for long text
      const maxWidth = this.canvas.width * 0.85;
      this.wrapText(overlay.text, centerX, y, maxWidth);
      
      if (overlay.highlight) {
        this.ctx.restore();
      }
      
      // Reset shadow
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
    });
  }
  
  private setTextStyle(type: string, highlight?: boolean): void {
    switch (type) {
      case 'thai':
        this.ctx.font = `bold ${this.config.fontSize! * 1.3}px ${this.config.fontFamily}`;
        this.ctx.fillStyle = highlight ? this.config.highlightColor! : this.config.textColor!;
        break;
        
      case 'english':
        this.ctx.font = `${this.config.fontSize}px ${this.config.fontFamily}`;
        this.ctx.fillStyle = highlight ? this.config.highlightColor! : this.config.textColor!;
        break;
        
      case 'pronunciation':
        this.ctx.font = `${this.config.fontSize! * 0.8}px ${this.config.fontFamily}`;
        this.ctx.fillStyle = this.config.pronunciationColor!;
        break;
        
      case 'mnemonic':
        this.ctx.font = `italic ${this.config.fontSize! * 0.7}px ${this.config.fontFamily}`;
        this.ctx.fillStyle = this.config.mnemonicColor!;
        break;
    }
  }
  
  private wrapText(text: string, x: number, y: number, maxWidth: number): void {
    const words = text.split(' ');
    let line = '';
    const lineHeight = this.config.fontSize! * 1.2;
    let offsetY = 0;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = this.ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        this.ctx.fillText(line, x, y + offsetY);
        line = words[n] + ' ';
        offsetY += lineHeight;
      } else {
        line = testLine;
      }
    }
    
    this.ctx.fillText(line, x, y + offsetY);
  }
  
  private renderWaitingScreen(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.ctx.font = `${this.config.fontSize! * 0.8}px ${this.config.fontFamily}`;
    this.ctx.fillStyle = this.config.textColor!;
    this.ctx.globalAlpha = 0.5;
    
    this.ctx.fillText('Thai Language Lesson', centerX, centerY - 40);
    this.ctx.fillText('Get ready...', centerX, centerY + 40);
    
    this.ctx.globalAlpha = 1;
  }
  
  private renderProgressBar(currentTime: number): void {
    const totalDuration = Math.max(...this.overlays.map(o => o.endTime));
    if (totalDuration === 0) return;
    
    const progress = Math.min(currentTime / totalDuration, 1);
    
    const barHeight = 6;
    const barY = this.canvas.height - 60;
    const barWidth = this.canvas.width * 0.8;
    const barX = (this.canvas.width - barWidth) / 2;
    
    // Background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.beginPath();
    this.ctx.roundRect ? 
      this.ctx.roundRect(barX, barY, barWidth, barHeight, barHeight / 2) :
      this.ctx.rect(barX, barY, barWidth, barHeight);
    this.ctx.fill();
    
    // Progress
    if (progress > 0) {
      this.ctx.fillStyle = this.config.highlightColor!;
      this.ctx.beginPath();
      this.ctx.roundRect ?
        this.ctx.roundRect(barX, barY, barWidth * progress, barHeight, barHeight / 2) :
        this.ctx.rect(barX, barY, barWidth * progress, barHeight);
      this.ctx.fill();
    }
    
    // Time display
    const currentMinutes = Math.floor(currentTime / 60);
    const currentSeconds = Math.floor(currentTime % 60);
    const totalMinutes = Math.floor(totalDuration / 60);
    const totalSeconds = Math.floor(totalDuration % 60);
    
    this.ctx.font = `${this.config.fontSize! * 0.4}px ${this.config.fontFamily}`;
    this.ctx.fillStyle = this.config.textColor!;
    this.ctx.globalAlpha = 0.7;
    
    const timeText = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')} / ${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
    this.ctx.fillText(timeText, this.canvas.width / 2, barY + 25);
    
    this.ctx.globalAlpha = 1;
  }
  
  /**
   * Get canvas for video encoding
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  
  /**
   * Set overlays for rendering
   */
  setOverlays(overlays: TextOverlay[]): void {
    this.overlays = overlays;
  }
  
  /**
   * Get total duration based on overlays
   */
  getTotalDuration(): number {
    if (this.overlays.length === 0) return 0;
    return Math.max(...this.overlays.map(o => o.endTime));
  }
  
  /**
   * Cleanup resources
   */
  dispose(): void {
    // Canvas will be garbage collected
    this.overlays = [];
  }
}