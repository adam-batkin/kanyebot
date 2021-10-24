import { Guild, GuildMember, Message } from "discord.js";

export interface ICommand
{
	execute(args: string[], server: Guild, user: GuildMember, message: Message): Promise<void>
}
