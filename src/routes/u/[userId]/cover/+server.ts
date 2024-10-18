import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { hashCode } from '$lib/intUtil.js';
import { env } from '$env/dynamic/private';
import { fdir } from 'fdir';

const defaultCovers: { [key: string]: Buffer } = {};
const coversFolder =
	env.COVERS_DIRECTORY && env.COVERS_DIRECTORY.length > 0
		? env.COVERS_DIRECTORY
		: path.join(process.cwd(), 'covers');
if (!existsSync(coversFolder)) mkdirSync(coversFolder);

export async function GET({ params, setHeaders }) {
	const userId = params.userId;

	const cover = await new fdir().glob(`${userId}.*`).crawl(coversFolder).withPromise();
	if (cover.length > 0) {
		const firstCoverMatch = Bun.file(path.join(coversFolder, cover[0]));
		const coverStream = await firstCoverMatch.arrayBuffer();
		setHeaders({
			'Content-Type': firstCoverMatch.type
		});
		return new Response(coverStream, {
			status: 200
		});
	}
  
	for (let i = 1; i < 9; i++) {
		const defaultCoverPath = path.join(coversFolder, `default${i}.jpg`);
		if (!existsSync(defaultCoverPath)) {
			console.log(`Downloading default cover ${i}...`);
			const response = await fetch(`https://osu.ppy.sh/images/headers/profile-covers/c${i}.jpg`, {
				method: 'GET'
			});
			const arrayBuffer = await response.arrayBuffer();
			const buffer: Buffer = Buffer.from(arrayBuffer);
			const uint8Array = new Uint8Array(buffer);
			await writeFile(defaultCoverPath, uint8Array);
			defaultCovers[i] = Buffer.from(arrayBuffer);
		} else {
			if (!defaultCovers[i]) {
				const cover = await readFile(defaultCoverPath);
				defaultCovers[i] = cover;
			}
		}
	}

	const userIDHash = hashCode(parseInt(userId));
	const usersRandomDefaultCover = defaultCovers[(userIDHash % 8) + 1];

	return new Response(usersRandomDefaultCover, {
		status: 200
	});
}
