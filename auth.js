import "dotenv/config";
import {Router} from 'express';
import {Strategy as DiscordStrategy} from 'passport-discord';
import passport from 'passport';
import axios from 'axios';

console.log()

passport.use(new DiscordStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.SECRET_KEY,
    callbackURL: 'https://42e5-89-10-232-129.ngrok-free.app/auth/callback',
    redirect_uri: 'https://42e5-89-10-232-129.ngrok-free.app/auth/callback',
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
    console.log('HEHYEYERSERSLERSJ')
    console.log(accessToken);
    console.log(refreshToken);
    console.log(profile);
    done(null, {id: 1});
}))

const router = Router();

router.get('/', passport.authenticate('discord'));
router.get('/success', (req, res) => {
    res.send('Great success');
});

let user = {};

router.get('/callback', async(req, res) => {
    console.log('req', req.query);
    const code = req.query.code;
    const params = new URLSearchParams();
    params.append('client_id', process.env.APP_ID);
    params.append('client_secret', process.env.SECRET_KEY);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', "https://42e5-89-10-232-129.ngrok-free.app/auth/callback");
    try {
        const response = await axios.post(`https://discord.com/api/oauth2/token`,params)
        console.log('response.data', response.data);
        const {access_token, token_type} = response.data;
        const userDataResponse=await axios.get('https://discord.com/api/users/@me/connections',{
            headers:{
                authorization: `${token_type} ${access_token}`
            }
        })
        console.log('Data: ',userDataResponse.data)
        user={
            username:userDataResponse.data.username,
            email:userDataResponse.data.email,
            avatar:`https://cdn.discordapp.com/avatars/350284820586168321/80a993756f84e94536481f3f3c1eda16.png`

        }
        res.send('YEYE');
    } catch (e) {
        console.log('error', e);
        return res.send('BIG MISTAKE');
    }
});

export default router;


//https://discord.com/api/oauth2/authorize?client_id=1149371373303631975&permissions=8&redirect_uri=https%3A%2F%2F42e5-89-10-232-129.ngrok-free.app%2Fauth%2Fcallback&response_type=code&scope=identify%20guilds%20bot