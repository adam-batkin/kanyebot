/**
 * This is SubscribedTextChannel.ts
 *
 * SubscribedTextChannel is a model that holds a server (guild) id and a text channel id that
 * KanyeBot is currently active in. The text channel id is where KanyeBot is announcing all
 * the new tracks that are currently playing.
 */

export interface SubscribedTextChannel
{
	serverId: string;
	textChannelId: string;
}
