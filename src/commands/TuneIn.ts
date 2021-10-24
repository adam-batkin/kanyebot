import { ICommand } from "../models";
import { Client, Guild, GuildMember, Message } from "discord.js";
import { TextChannelService, VoiceService } from "../services";
import { ClientAccessor } from "../util";
import { Service } from "typedi";

@Service()
export class TuneIn
	implements ICommand {

	private readonly client: Client;

	private readonly textChannelService: TextChannelService;

	private readonly voiceService: VoiceService;

	constructor(clientAccessor: ClientAccessor, textChannelService: TextChannelService, voiceService: VoiceService) {

		this.client = clientAccessor.getClient();
		this.textChannelService = textChannelService;
		this.voiceService = voiceService;

	}

	async execute(args: string[], server: Guild, user: GuildMember, message: Message): Promise<void> {

		// If the user isn't currently in a voice channel then we can't join it. Let them know.
		if (!user.voice.channel) {
			await message.channel.send("You're not in a voice channel that KanyeBot can join");
			return;
		}

		// Is KanyeBot already in a voice channel for this server? If so then we're not going to do
		// anything.
		if (server.channels.cache.some(channel => (channel.type === "GUILD_VOICE" && channel.members.has(this.client.user!.id)))) {

			await message.channel.send("KanyeBot is already in a voice channel in this server.");
			return;

		}

		// Checks cleared, let's register the current text channel as the subscribed channel...
		this.textChannelService.setTextChannel(server.id, user.voice.channel.id);

		// And get KanyeBot to join the voice channel. If it fails, get rid of the subscribed channel
		if (!this.voiceService.joinVoiceChannel(user.voice.channel)) {

			this.textChannelService.removeTextChannel(server.id);

		}
	}

}
