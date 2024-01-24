import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream';
import { EndBehaviorType, VoiceReceiver } from '@discordjs/voice';
import { User } from 'discord.js';
import * as prism from 'prism-media';
import util from "util";
import witClient from "node-witai-speech";
import {Readable} from "stream";

function getDisplayName(userId, user) {
    return user ? `${user.username}_${user.discriminator}` : userId;
}

async function convert_audio(input) {
    try {
        // stereo to mono channel
        const data = new Int16Array(input)
        const ndata = new Int16Array(data.length/2)
        for (let i = 0, j = 0; i < data.length; i+=4) {
            ndata[j++] = data[i]
            ndata[j++] = data[i+1]
        }
        return Buffer.from(ndata);
    } catch (e) {
        console.log(e)
        console.log('convert_audio: ' + e)
        throw e;
    }
}

let witAI_lastcallTS = null;
async function transcribe_witai(buffer) {
    try {
        // ensure we do not send more than one request per second
        if (witAI_lastcallTS != null) {
            let now = Math.floor(new Date());
            while (now - witAI_lastcallTS < 1000) {
                console.log('sleep')
                await sleep(100);
                now = Math.floor(new Date());
            }
        }
    } catch (e) {
        console.log('transcribe_witai 837:' + e)
    }

    try {
        console.log('transcribe_witai')
        const extractSpeechIntent = util.promisify(witClient.extractSpeechIntent);
        const stream = Readable.from(buffer);
        const contenttype = "audio/raw;encoding=signed-integer;bits=16;rate=48k;endian=little"
        const output = await extractSpeechIntent(process.env.WIT_TOKEN, stream, contenttype)
        witAI_lastcallTS = Math.floor(new Date());
        console.log(output)
        stream.destroy()
        if (output && '_text' in output && output._text.length)
            return output._text
        if (output && 'text' in output && output.text.length)
            return output.text
        return output;
    } catch (e) { console.log('transcribe_witai 851:' + e); console.log(e) }
}

async function transcribe(buffer) {

    return transcribe_witai(buffer)
    // return transcribe_gspeech(buffer)
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



        console.log(`👂 Starting ---`);

        /*
        Uncomment to write to file
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
        });*/

        let buffer = [];
        opusStream.on('data', async (data) => {
            buffer.push(data)
        });

        opusStream.on('end', async () => {

            const bufferConcat = Buffer.concat(buffer)
            const duration = bufferConcat.length/10000;

            if (duration < 1.0 || duration > 19) { // 20 seconds max dur
                console.log("TOO SHORT / TOO LONG; SKPPING")
                return;
            }
            try {
                let new_buffer = await convert_audio(buffer)
                let out = await transcribe(new_buffer);
                if (out != null)
                    console.log('Jeg er her');
                    console.log(out);
            } catch (e) {
                console.log('tmpraw rename: ' + e)
            }


        })
    })
}
