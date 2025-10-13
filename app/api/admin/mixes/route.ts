import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.user?.isAdmin) return NextResponse.json({ error: 'Admin required' }, { status: 403 });
  try {
    const body = await req.json();
    const {
      number, artist, releaseDate, bio, durationSeconds, audioPath,
      genre, bpmLow, bpmHigh, location, heroImageUrl, artworkUrl,
      externalUrl, soundcloudUrl, mixcloudUrl, youtubeUrl, spotifyUrl
    } = body;

    if (!number || !artist || !releaseDate) {
      return NextResponse.json({ error: 'number, artist, releaseDate required' }, { status: 400 });
    }

    const mixNumber = Number(number);
    if (!Number.isInteger(mixNumber) || mixNumber <= 0) {
      return NextResponse.json({ error: 'number must be a positive integer' }, { status: 400 });
    }

    const existing = await prisma.mix.findUnique({ where: { number: mixNumber } });
    if (existing) {
      return NextResponse.json({ error: 'Mix number already exists' }, { status: 409 });
    }
    const mix = await prisma.mix.create({
      data: {
        number: mixNumber, artist,
        releaseDate: new Date(releaseDate), bio: bio || null,
        durationSeconds: durationSeconds ? Number(durationSeconds) : null,
        audioPath: audioPath || null, genre: genre || null,
        bpmLow: bpmLow ? Number(bpmLow) : null,
        bpmHigh: bpmHigh ? Number(bpmHigh) : null,
        location: location || null,
        // @ts-ignore
        heroImageUrl: heroImageUrl || null,
        artworkUrl: artworkUrl || null,
        externalUrl: externalUrl || null,
        soundcloudUrl: soundcloudUrl || null,
        mixcloudUrl: mixcloudUrl || null,
        youtubeUrl: youtubeUrl || null,
        spotifyUrl: spotifyUrl || null
      }
    });
    return NextResponse.json({ mix });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

