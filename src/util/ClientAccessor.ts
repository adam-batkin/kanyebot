import { Service } from "typedi";
import { Client } from "discord.js";

@Service()
export class ClientAccessor
{
	private readonly client: Client;

	constructor(client: Client) {
		this.client = client;
	}

	public getClient(): Client {
		return this.client;
	}
}
