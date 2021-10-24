/**
 * This is VoiceService.ts
 *
 * The VoiceService manages the connections and underlying audio streams to all the
 * Discord channels that are subscribed to KanyeBot.
 */
import { BaseGuildVoiceChannel } from "discord.js";
import { AudioPlayer, AudioResource, createAudioPlayer, DiscordGatewayAdapterCreator, getVoiceConnection, joinVoiceChannel as djsJoinVoiceChannel, NoSubscriberBehavior } from "@discordjs/voice";
import { TextChannelService } from "./TextChannelService";
import { Service } from "typedi";

@Service()
export class VoiceService {

	/**
	 * The TextChannelService, used to send messages to servers when issues occur
	 * @private
	 */
	private readonly textChannelService: TextChannelService;

	/**
	 * The master stream, all voice connections will obey what audio comes from here
	 * @private
	 */
	private readonly audioPlayer: AudioPlayer;

	constructor(textChannelService: TextChannelService) {

		// Assign
		this.textChannelService = textChannelService;

		// Create an AudioPlayer for the master stream
		this.audioPlayer = createAudioPlayer({
			behaviors: {
				// Keep playing even if nobody is consuming the stream
				noSubscriber: NoSubscriberBehavior.Play
			}
		});

		// When we get a problem we'll let the console know
		this.audioPlayer.on("error",
				err => console.error("[VoiceService] The master stream threw an error!", err));
	}

	/**
	 * Get the master audio player, should really just be used to initialise the events for sending
	 * new audio files through it once the current one stops but I don't know what the future holds.
	 */
	public getAudioPlayer(): AudioPlayer {

		return this.audioPlayer;

	}

	/**
	 * Plays an audio file to the master stream which all connections will broadcast
	 * @param audioResource
	 */
	public play(audioResource: AudioResource): void {

		// No special magic required, just pipe it straight there.
		this.audioPlayer.play(audioResource);

	}

	/**
	 *
	 * @param voiceChannel
	 */
	public joinVoiceChannel(voiceChannel: BaseGuildVoiceChannel): boolean {

		// First, does KanyeBot have permission to do it's job in this channel? If not we'll let
		// the user know
		if (!this.doesKanyeHavePermissionForThisChannel(voiceChannel)) {
			this.textChannelService.getTextChannelByServerId(voiceChannel.guildId)?.send(
				"KanyeBot needs to have permission to join and speak in this channel.");
			return false;
		}

		// Okay, now we'll join the voice channel...
		const voiceConnection = djsJoinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guildId,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator // https://github.com/discordjs/voice/issues/166
		});

		// ... and subscribe to the Kanye feed ...
		voiceConnection.subscribe(this.audioPlayer);

		// Done
		return true;

	}

	public leaveVoiceChannel(voiceChannel: BaseGuildVoiceChannel): void {

		const voiceConnection = getVoiceConnection(voiceChannel.guildId);

		if (!voiceConnection) return;

		voiceConnection.destroy();

	}

	public changeVoiceChannel(guildId: string, newVoiceChannel: BaseGuildVoiceChannel): void {



	}

	private doesKanyeHavePermissionForThisChannel(voiceChannel: BaseGuildVoiceChannel): boolean {

		const kanyePermissions = voiceChannel.permissionsFor(voiceChannel.guild.me!);
		return (kanyePermissions.has("CONNECT") && kanyePermissions.has("SPEAK"));

	}

}
