import { SubscribedTextChannel } from "../models";
import { ChannelManager, Client, TextChannel } from "discord.js";
import { Service } from "typedi";
import { ClientAccessor } from "../util";

@Service()
export class TextChannelService {

	private readonly channelManager: ChannelManager;

	private subscribedServers: SubscribedTextChannel[];

	constructor(clientAccessor: ClientAccessor) {

		this.subscribedServers = [];

		this.channelManager = clientAccessor.getClient().channels;

	}

	/**
	 * Get the
	 * @param serverId
	 */
	public getTextChannelByServerId(serverId: string): TextChannel | null {

		let subscribedTextChannel = this.subscribedServers.find(index => index.serverId === serverId);
		if (subscribedTextChannel === undefined) return null;

		let textChannel = this.channelManager.cache.find(channel =>
			channel.type === "GUILD_TEXT" &&
			channel.id === subscribedTextChannel!.textChannelId);

		if (!textChannel) return null;

		return <TextChannel> textChannel;

	}

	/**
	 * Gets a discord text channel by the specified id.
	 * @param channelId
	 */
	public getTextChannelByChannelId(channelId: string): TextChannel | null {

		let textChannel = this.channelManager.cache.find(channel =>
			channel.type === "GUILD_TEXT" &&
			channel.id === channelId);

		if (!textChannel) return null;

		return <TextChannel> textChannel;

	}

	public setTextChannel(serverId: string, textChannelId: string): void {

		let currentSubscribedTextChannel = this.subscribedServers.find(index => index.serverId === serverId);
		if (currentSubscribedTextChannel !== undefined) {

			currentSubscribedTextChannel.textChannelId = textChannelId;

		} else {

			this.subscribedServers.push({
				serverId: serverId,
				textChannelId: textChannelId
			});

		}

	}

	public removeTextChannel(serverId: string): void {

		let subscribedTextChannel = this.subscribedServers.find(index => index.serverId === serverId);
		if (subscribedTextChannel === undefined) return;

		this.subscribedServers.splice(this.subscribedServers.indexOf(subscribedTextChannel), 1);

	}

	public broadcastToAll(message: string): void {

		this.subscribedServers.forEach(server => {
			let channel = this.getTextChannelByChannelId(server.serverId);
			if (!channel) return;

			channel.send(message);
		});

	}

}
