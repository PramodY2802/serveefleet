import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from './index.js';
import AuthRepository from '../modules/auth/auth.repository.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.info('[auth:google] passport callback received', {
          profileId: profile?.id,
          displayName: profile?.displayName,
          hasEmails: Boolean(profile?.emails?.length),
          emailCount: profile?.emails?.length || 0,
          hasPhotos: Boolean(profile?.photos?.length),
          accessTokenPresent: Boolean(accessToken),
        });
        const user = await AuthRepository.findOrCreateGoogleUser(profile, accessToken);
        console.info('[auth:google] passport callback completed', {
          userId: user?._id?.toString?.() || user?.id,
          email: user?.email,
        });
        return done(null, user);
      } catch (error) {
        console.error('[auth:google] passport callback failed', {
          message: error.message,
          stack: error.stack,
        });
        return done(error, false);
      }
    }
  )
);

export default passport;
