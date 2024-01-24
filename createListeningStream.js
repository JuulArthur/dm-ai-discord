import Transcriber from 'discord-speech-to-text';
const transcriber = new Transcriber(process.env.WIT_TOKEN)

function getDisplayName(userId, user) {
    return user ? `${user.username}_${user.discriminator}` : userId;
}

export function createListeningStream({connection, interaction, client}) {
    const receiver = connection.receiver;
    receiver.speaking.on('start', async (userId, speaking) => {
        console.log(`👂 Starting ---`);

        transcriber.listen(connection.receiver, userId, client.users.cache.get(userId)).then((data) => {
            if (!data.transcript.text) return;
            let text = data.transcript.text;
            let user = data.user
            console.log('text', text);;
            console.log('user', getDisplayName(userId, user));
        });
    })
}
