import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { number: string } }) {
  const num = parseInt(params.number, 10);
  const mix = await prisma.mix.findFirst({ where: { number: num } });
  if (!mix) return new Response('Not found', { status: 404 });
  return Response.json(mix);
}

export async function PATCH(req: NextRequest, { params }: { params: { number: string } }) {
  const num = parseInt(params.number, 10);
  const body = await req.json();
  const data: any = {};
  if ('bio' in body) data.bio = body.bio ?? null;
  if ('durationSeconds' in body) data.durationSeconds = body.durationSeconds ?? null;
  if ('audioPath' in body) data.audioPath = body.audioPath ?? null;
  if ('externalUrl' in body) data.externalUrl = body.externalUrl ?? null;
  if ('soundcloudUrl' in body) data.soundcloudUrl = body.soundcloudUrl ?? null;
  if ('mixcloudUrl' in body) data.mixcloudUrl = body.mixcloudUrl ?? null;
  if ('youtubeUrl' in body) data.youtubeUrl = body.youtubeUrl ?? null;
  if ('spotifyUrl' in body) data.spotifyUrl = body.spotifyUrl ?? null;
  const mix = await prisma.mix.update({ where: { number: num }, data });
  return Response.json(mix);
}
