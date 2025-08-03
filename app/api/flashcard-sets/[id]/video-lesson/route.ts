import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(
  request: NextRequest,
  _context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { frames, fps = 30, filename = 'video_lesson' } = body;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json({ error: 'No frames provided' }, { status: 400 });
    }

    // Create temporary directory for processing
    const tempId = crypto.randomBytes(16).toString('hex');
    const tempDir = path.join(os.tmpdir(), `video-${tempId}`);
    await fs.mkdir(tempDir, { recursive: true });

    try {
      // Save all frames as images
      console.log(`Saving ${frames.length} frames to ${tempDir}`);
      
      for (let i = 0; i < frames.length; i++) {
        const frameData = frames[i];
        // Remove data URL prefix if present
        const base64Data = frameData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Save frame with zero-padded numbering
        const framePath = path.join(tempDir, `frame_${String(i).padStart(6, '0')}.png`);
        await fs.writeFile(framePath, buffer);
      }

      // Create output path
      const outputFilename = `${filename.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.mp4`;
      const outputPath = path.join(tempDir, outputFilename);

      // Use FFmpeg to create video from frames
      const ffmpegCommand = `ffmpeg -framerate ${fps} -i "${tempDir}/frame_%06d.png" -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -movflags +faststart "${outputPath}"`;
      
      console.log('Running FFmpeg command:', ffmpegCommand);
      const { stderr } = await execAsync(ffmpegCommand);
      
      if (stderr && !stderr.includes('frame=')) {
        console.error('FFmpeg stderr:', stderr);
      }

      // Read the generated video
      const videoBuffer = await fs.readFile(outputPath);

      // Clean up temp files
      await fs.rm(tempDir, { recursive: true, force: true });

      // Return video as response
      return new NextResponse(videoBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${outputFilename}"`,
          'Content-Length': videoBuffer.length.toString(),
        },
      });

    } catch (error) {
      // Clean up on error
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }

  } catch (error) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate video' },
      { status: 500 }
    );
  }
}