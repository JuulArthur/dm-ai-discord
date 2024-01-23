import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream';
import { EndBehaviorType, VoiceReceiver } from '@discordjs/voice';
import { User } from 'discord.js';
import * as prism from 'prism-media';
import { Readable } from 'stream';
import util from 'util';
import witClient from 'node-witai-speech';
import "dotenv/config";

//TODO: https://github.com/inevolin/DiscordSpeechBot/blob/master/index.js
//TODO: https://github.com/discordjs/voice-examples/blob/main/recorder/src/createListeningStream.ts
//TODO: https://cloud.google.com/speech-to-text/docs/before-you-begin
function getDisplayName(userId, user) {
    return user ? `${user.username}_${user.discriminator}` : userId;
}

async function transcribe(buffer) {

    return transcribe_witai(buffer)
    // return transcribe_gspeech(buffer)
}

// WitAI
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

// Google Speech API
// https://cloud.google.com/docs/authentication/production
import gspeech from '@google-cloud/speech';
const gspeechclient = new gspeech.SpeechClient({
    projectId: 'discordbot',
    keyFilename: 'gspeech_key.json'
});

async function transcribe_gspeech(buffer) {
    try {
        console.log('transcribe_gspeech')
        const bytes = buffer.toString('base64');
        const audio = {
            content: bytes,
        };
        const config = {
            encoding: 'LINEAR16',
            sampleRateHertz: 48000,
            languageCode: 'en-US',  // https://cloud.google.com/speech-to-text/docs/languages
        };
        const request = {
            audio: audio,
            config: config,
        };

        const [response] = await gspeechclient.recognize(request);
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');
        console.log(`gspeech: ${transcription}`);
        return transcription;

    } catch (e) { console.log('transcribe_gspeech 368:' + e) }
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

export async function createListeningStream({connection, interaction}) {
    console.log('Jeg er tidligerse');
    const receiver = connection.receiver;
    receiver.speaking.on('start', async (user, speaking) => {
        console.log('Heisann', user, speaking);
        console.log(`I'm listening to ${user}`)
        // this creates a 16-bit signed PCM, stereo 48KHz stream
        const audioStream = receiver.subscribe(user, {
            end: {
                behavior: EndBehaviorType.AfterSilence,
                duration: 2000,
            },
        });

        audioStream.on('error',  (e) => {
            console.log('audioStream: ' + e)
        });

        let buffer = [];
        audioStream.on('data', (data) => {
            console.log('Dette er data');
            buffer.push(data)
        })
        audioStream.on('end', async () => {
            buffer = Buffer.concat(buffer)
            const duration = buffer.length/10000;
            console.log("duration: " + duration)

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