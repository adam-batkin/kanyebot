/**
 * This is KanyeBot.ts
 *
 * We're at the entry point of the main bot here. The purpose here is to get everything initialised
 * and ready and then we can start singing the lord.
 */
import "reflect-metadata";

import { ChannelManager, Client, Guild, GuildMember, Intents, Message } from "discord.js";
import { Container } from "typedi";
import { AudioPlayerStatus, createAudioResource } from "@discordjs/voice";
import { join } from "path";

import { Config, ICommand, Track } from "./models";
import { TextChannelService, VoiceService } from "./services";
import { ClientAccessor } from "./util";
import { TuneIn } from "./commands/TuneIn";

class KanyeBot {

	/**
	 * The Discord.JS Client that handles the communication between KanyeBot and Discord
	 * @private
	 */
	private readonly client: Client;

	/**
	 * The user defined config file for KanyeBot
	 * @private
	 */
	private readonly config: Config;

	/**
	 * A loaded list of every track available for KanyeBot to play
	 * @private
	 */
	private readonly kanyeTracks: Track[];

	/**
	 * The track that is currently being played by KanyeBot
	 * @private
	 */
	private currentTrack: Track | undefined;

	/**
	 * The VoiceService will handle all the voice channel connection work. The only thing we need
	 * to do is to tell it what songs to play and when
	 * @private
	 */
	private readonly voiceService: VoiceService;

	/**
	 * The TextChatService will handle sending messages to text channels in Discord
	 * @private
	 */
	private readonly textChannelService: TextChannelService;

	/**
	 * new KanyeBot()
	 */
	constructor() {

		console.log("This is KanyeBot 2!");

		// Create a new Discord.JS Client, only interesting thing to configure here is the "intents"
		// which I have no clue about but these ones seem to do the job.
		this.client = new Client({
			intents: [
				Intents.FLAGS.GUILDS,
				Intents.FLAGS.GUILD_MESSAGES,
				Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
				Intents.FLAGS.GUILD_VOICE_STATES
			]
		});

		// Now we've created a client, lets allow the instance to be accessed from Dependency Injection if required,
		// however the discord.js client doesn't have a @Service() attribute so we can't exactly just provide it.
		// Therefore, we'll create an accessor that has a method which will return the instance we give it.
		Container.set(ClientAccessor, new ClientAccessor(this.client));

		// Get the configuration file for KanyeBot, because users will get their grubby hands all over this file
		// then I think we should treat this with caution (hence the try catch)
		try {

			console.log("Loading config...");

			// Try and load the config file, heaven forbid we get a require failure or something because that won't
			// fly.
			this.config = require("./config");

			// Make sure the config file is actually valid. If not, then we'll
			// go no further.
			if (!KanyeBot.validateConfiguration(this.config)) {

				// The validateConfiguration method would have already told the meaningful information in the console
				// so we can just die right here
				process.exit();

			}

		} catch (x) {

			// This will probably mean the require failed, so I could guess that config.ts actually doesn't exist, or there's
			// a syntax error somewhere.
			console.error("Failed to load KanyeBot configuration, make sure that config.ts exists and is a valid typescript file.", x);
			process.exit();

		}

		// Create a new instance of the TextChannelService. This will look after sending updates to all subscribed text channels
		this.textChannelService = Container.get<TextChannelService>(TextChannelService);

		// Create a new instance of the VoiceService. This will handle all our voice connections as well as the process of
		// broadcasting Kanye through all connections. What it won't handle, however, is the queueing of new tracks, so once
		// we've created this we'll need to listen for when the master stream stops playing and then queue up a new track
		this.voiceService = Container.get<VoiceService>(VoiceService);

		// But before we do that we need to initialise all our Kanye tracks, courtesy of tracks.json. Once again, this is another
		// file that users will be touching so you know what's about to happen...
		try {

			const tracks: Track[] = require("../tracks/tracks.json").tracks;

			let loadedTracks: Track[] = [];
			tracks.forEach((track: Track) => loadedTracks.push(track));
			this.kanyeTracks = loadedTracks;
			console.log(`Loaded ${ loadedTracks.length } tracks!`);

		} catch (x) {

			// This will probably mean the require failed, so I could guess that tracks.json actually doesn't exist, or there's
			// a syntax error somewhere.
			console.error("Failed to load the tracks available, make sure that tracks.json exists and is a valid json file.", x);
			process.exit();

		}

		// Okay, now we have some tracks, let's sort out getting the audio player to actually play them. When the player becomes
		// idle (nothing playing) let's queue up a new track

		this.voiceService.getAudioPlayer().on(AudioPlayerStatus.Idle, () => this.playKanyeSong());

		// When the bot receives a message and it begins with the configured prefix (default: %) then it's a command
		this.client.on("messageCreate", async (message: Message) => {

			// Message sent from a bot? Don't care.
			if (message.author.bot) return;

			// Message doesn't start with the prefix? Don't care.
			if (!message.content.startsWith(this.config.prefix)) return;

			// Okay, this is a command we can be interested in. Let's get the arguments of the command, and by that
			// I mean let's split the command up into a string array
			let args: string[] = message.content.split(" ");

			// The command name should be the first argument but this will also contain the prefix so let's strip it
			// at the same time.
			let commandName = args[0].substr(this.config.prefix.length);

			// And let's also remove the command name from the list of arguments
			args = args.splice(0, 1);

			// Next thing to check is if we have valid server (guild) information as a part of the message. If we don't,
			// then we can't really proceed safely so we'll just die here.
			let server = message.guild;
			if (!server) return;

			// Next, the user themself. Again like the server if we can't get their information then we can't proceed
			// safely so we'll die again.
			let user = message.member;
			if (!user) return;

			// Finally, let's push this to the command handler.
			await this.onCommand(
				commandName,
				args,
				server,
				user,
				message
			);

		});

		// And now everything's done. Let's login, queue the first song and start the show.
		this.client.login(this.config.token).then(_ => {
			console.log("Logged In");
			this.playKanyeSong();
		});
	}

	/**
	 * When a command is issued (either slash command, prefix command or mention command) then do
	 * what needs to be done.
	 * @param command
	 * @param args
	 * @param server
	 * @param user
	 * @param message
	 * @private
	 */
	private async onCommand(
		command: string,
		args: string[],
		server: Guild,
		user: GuildMember,
		message: Message): Promise<void> {

		switch (command) {

			case "tunein":
				let tuneInCommand: ICommand = Container.get(TuneIn);
				await tuneInCommand.execute(args, server, user, message);
				break;

		}

		return;

	}

	/**
	 * Let's pick a random Kanye song from the list, get it sent off to all voice channels and update everywhere that needs to
	 * know that a new track is playing
	 * @private
	 */
	private playKanyeSong(): void {

		// Pick the next Kanye song, is Lady Luck on your side?
		this.currentTrack = this.kanyeTracks[Math.floor(Math.random() * this.kanyeTracks.length)];

		// Got our track, let's load (or at least try to load) the file from the filePath field
		let audioResource = createAudioResource(join(__dirname, "../tracks/", this.currentTrack.filePath));

		// Let's console log what we're streaming
		console.log(`Now Streaming: ${this.currentTrack.title}`);

		// Send it to the servers
		this.voiceService.play(audioResource);

		// Tell all the servers about it (if that's allowed per the config of course)
		if (this.config.nowPlaying.subscribedChannels.sendTrackChangeMessages)
			this.textChannelService.broadcastToAll(this.config.nowPlaying.subscribedChannels.trackChangeMessage!(this.currentTrack!));

		// Update rich presence (if that's allowed per the config of course)
		if (this.config.nowPlaying.richPresence.showAsRichPresence)
			this.client.user?.setActivity({
				type: this.config.nowPlaying.richPresence.richPresenceActivity!,
				name: this.config.nowPlaying.richPresence.richPresenceMessage!(this.currentTrack!)
			});
	}

	/**
	 * When KanyeBot starts we check the config to make sure that all sections that are enabled
	 * have their values set properly, otherwise we can't continue.
	 * @param config
	 * @private
	 */
	private static validateConfiguration(config: Config): boolean {

		// We should have a bot token, if we don't then the config is invalid
		if (config.token === "") {

			console.error("Configuration Error: token is empty, this should contain your bot token from the Discord Developer site.");
			return false;

		}

		// If showAsRichPresence is enabled then richPresenceActivity should be defined.
		if (
			config.nowPlaying.richPresence.showAsRichPresence &&
			config.nowPlaying.richPresence.richPresenceActivity === undefined) {

			console.error("Configuration Error: Rich Presence is enabled but an activity type has not been specified.");
			return false;

		}

		// If showAsRichPresence is enabled then richPresenceMessage should be defined.
		if (
			config.nowPlaying.richPresence.showAsRichPresence &&
			config.nowPlaying.richPresence.richPresenceMessage === undefined) {

			console.error("Configuration Error: Rich Presence is enabled but a rich presence message has not been specified.");
			return false;

		}

		// If sendTrackChangeMessages is enabled then trackChangeMessage should be defined.
		if (
			config.nowPlaying.subscribedChannels.sendTrackChangeMessages &&
			config.nowPlaying.subscribedChannels.trackChangeMessage === undefined) {

			console.error("Configuration Error: Track Change Messages are enabled but a track change message has not been specified.");
			return false;

		}

		// Configuration is valid

		return true;

	}

}

/**
 * Okay, here we go. Let's cross our fingers and hope this all works.
 */
new KanyeBot();
