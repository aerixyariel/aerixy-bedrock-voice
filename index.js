// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const wait = require('node:timers/promises').setTimeout;
const { Client, Events, ChannelType, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, REST, Routes } = require('discord.js');
require('dotenv').config()

const express = require('express');
const app = express()
const port = 3000

const bodyParser = require('body-parser')
const multer = require('multer')
const upload = multer()

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
const commands = [];

// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			commands.push(command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

var GUILD, PARENT, LOBBY;

/* (async () => {
	GUILD = await client.guilds.fetch(process.env.GUILDID)
	PARENT = await GUILD?.channels.fetch(process.env.LOBBYID)
	LOBBY = await GUILD?.channels.fetch(process.env.LOBBYID)
}) */


client.once(Events.VoiceStateUpdate, async (oS, nS) => {
	if(nS.channelId == process.env.LOBBYID && oS.channel?.parentId != process.env.VCID) {
		const Embeds = new EmbedBuilder()
			.setColor(0x1e1e1e)
			.setTitle('**MINECRAFT VOICE CHAT**')
			.setURL('https://discord.js.org/')
			.setDescription('Some description here')
			.addFields(
				{ name: `**NAME**`, value: "```"+nS.member.displayName+"```", inline: true },
				{ name: `**ID**`, value: "```"+nS.member.id+"```", inline: true },
			)
			.setImage('https://i.imgur.com/AfFp7pu.png')
			.setTimestamp()
			.setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });
			client.users.send(nS.id, { embeds: [Embeds] });
	}
});

client.on(Events.ClientReady, async (cready) => {
	const guild = await cready.guilds.fetch(process.env.GUILDID)
	const lobby = await guild.channels.fetch(process.env.LOBBYID)
	if (!guild) return;
	guild.channels.cache.each(async channel => {
		if (channel.parentId == process.env.VCID && channel.id != process.env.LOBBYID) {
			guild.members.cache.each(async member => {
				if (member?.voice.channelId == channel.id) {
					if (lobby?.type == ChannelType.GuildVoice) await member.voice.setChannel(lobby);
				}
			})
			await channel.delete();
		}
	})
});


client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	//console.log(interaction);
	const command = commands.find(cmd => cmd.data.name === interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	await command.execute({ interaction, guilds: client.guilds });

	/*try {
		await command.execute(interaction);
	}  catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	} */
});

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// Make command that can read by api
		const dataCommands = [];
		for(let cmd of commands) {
			dataCommands.push(cmd.data.toJSON())
		}

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENTID),
      { body: dataCommands },
    );

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

/*client.on('minecaft', async (data) => {
	
})*/

client.login(process.env.TOKEN);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

var CHANNELS = {
	lobby: process.env.LOBBYID
};

app.post('/', upload.array(), async function (req, res) {
	const data = await req.body;
	console.log(data);
	(async () => {
		var guild = await client.guilds.fetch(process.env.GUILDID);
		const parent = await guild.channels.fetch(process.env.VCID);
		const lobby = await guild.channels.fetch(process.env.LOBBYID);

		const tempNameNewCh = Object.keys(data);

		// swicth & create channel
		for (let Ch in data) {
			let lobby = guild.channels.cache.find(c=>c.id==process.env.LOBBYID);
			let channel = guild.channels.cache.find(c=>c.id==CHANNELS[Ch])
			if (!channel && Ch != 'lobby') {
				channel = await guild.channels.create({
					name: Ch,
					type: ChannelType.GuildVoice,
					parent: parent.id,
				});
			}
			CHANNELS[Ch] = channel.id;
			for (let player of data[Ch]) {
				let member = guild.members.cache.find(p=>p.id==player);
				if (channel.type == ChannelType.GuildVoice && Ch !== 'lobby') {
					await member?.voice.setChannel(channel).catch(() => {});
				} else {
					await member?.voice.setChannel(lobby).catch(() => {});
				}
			} 
		}

		// move player from delete channel
		/* for (let oldCh in CHANNELS) {
			if (!tempNameNewCh.includes(oldCh) && oldCh != 'lobby') {
				const delCh = guild.channels.fetch(CHANNELS[oldCh])
				if (delCh) {
					guild.members.cache.each(async member => {
						if (member?.voice.channelId == delCh.id) {
							if (guild.channels.cache.find(c=>c.id==process.env.LOBBYID).type == ChannelType.GuildVoice) await member?.voice.setChannel(guild.channels.cache.find(c=>c.id==process.env.LOBBYID)).catch(() => {});
						}
					})
				}
			}
		} */


		// delete channel
		for (let oldCh in CHANNELS) {
			if (!tempNameNewCh.includes(oldCh) && oldCh != 'lobby') {
				const delCh = guild.channels.cache.find(c=>c.id==CHANNELS[oldCh])
				if (delCh) await guild.channels.delete(delCh).catch(() => {});
			}
		}

		var whiteList = []
		guild.members.cache.each(member => {
			if (member?.voice) {
				if(member?.voice.channel?.parentId == process.env.VCID) whiteList.push(member.id)
			}
		})

		//console.log(whiteList)
		console.log(CHANNELS)
		res.send(JSON.stringify(whiteList))

	})();
})

app.listen(port, () => {
	console.log(`Example app listening on port http://localhost:${port}`)
})