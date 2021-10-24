/**
 * This is Config.ts
 *
 * Config is the structure of the config file located
 */
import { Track } from "./";
import { ActivityTypes } from "discord.js/typings/enums";

/**
 * Plucked straight out of discord.js, don't ask me about it other than it's needed for
 * ActivityOptions
 */
type ExcludeEnum<T, K extends keyof T> = Exclude<keyof T | T[keyof T], K | T[K]>;

interface NowPlayingConfig {

	richPresence: NowPlayingRichPresenceConfig;

	subscribedChannels: SubscribedChannelsConfig;

}

interface NowPlayingRichPresenceConfig {

	/**
	 * Should a message be shown through Rich Presence?
	 *
	 * Note that if this is set to false then the rest of the configuration options
	 * in this section are ignored, you can remove them if you feel like it.
	 */
	showAsRichPresence: boolean;

	/**
	 * What should the activity type be? This is the status next to a rich presence
	 * message (i.e. Playing, Streaming, etc). Check out the options under
	 * ActivityTypes to see what you can use, or visit the Discord.JS documentation
	 * at: https://discord.js.org/#/docs/main/stable/typedef/ActivityType
	 */
	richPresenceActivity?: ExcludeEnum<typeof ActivityTypes, 'CUSTOM'>;

	/**
	 * What message should be shown under Rich Presence? The track parameter contains
	 * all the information about the current selected track from the track's entry in
	 * tracks.json. You can do anything inside this function, just make sure to return
	 * a string containing the text that should be shown as the rich presence.
	 */
	richPresenceMessage?: (track: Track) => string;

}

interface SubscribedChannelsConfig {

	/**
	 * Should messages be sent to subscribed channels when the current track changes?
	 *
	 * Note that if this is set to false then the rest of the configuration options
	 * in this section are ignored, you can remove them if you feel like it.
	 */
	sendTrackChangeMessages: boolean;

	/**
	 * What message should be sent to subscribed channels when the current track changes?
	 * The track parameter contains all the information about the current selected track
	 * from the track's entry in tracks.json. You can do anything inside this function,
	 * just make sure to return a string containing the text that should be shown as the
	 * rich presence.
	 */
	trackChangeMessage?: (track: Track) => string;

}

export interface Config {

	/**
	 * What is the prefix that KanyeBot will listen for. In a future update this will be
	 * changed to the default prefix as KanyeBot will allow individual servers to set their
	 * own prefix (to prevent bot clashing). Leaving prefix as an empty string will disable
	 * it, however the bot can still be interacted with by mentioning it.
	 */
	prefix: string;

	/**
	 * The discord token used to login, can be found by navigating to your Discord Developer
	 * applications (https://discord.com/developers/applications), selecting your application,
	 * going to the Bot tab and copying the token.
	 */
	token: string;

	nowPlaying: NowPlayingConfig;

}
