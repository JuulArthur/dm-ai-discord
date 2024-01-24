import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream';
import { EndBehaviorType, VoiceReceiver } from '@discordjs/voice';
import { User } from 'discord.js';
import * as prism from 'prism-media';

function getDisplayName(userId, user) {
    return user ? `${user.username}_${user.discriminator}` : userId;
}

export function createListeningStream({connection, interaction}) {
    const receiver = connection.receiver;
    receiver.speaking.on('start', async (user, speaking) => {
        const opusStream = receiver.subscribe(user, {
            end: {
                behavior: EndBehaviorType.AfterSilence,
                duration: 1000,
            },
        });

        const oggStream = new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 })

        const filename = `./recordings/${Date.now()}-test3.pcm`;

        const out = createWriteStream(filename);

        console.log(`👂 Started recording ${filename}`);

        pipeline(opusStream, oggStream, out, (err) => {
            if (err) {
                console.warn(`❌ Error recording file ${filename} - ${err.message}`);
            } else {
                console.log(`✅ Recorded ${filename}`);
            }
        });
    })
}
