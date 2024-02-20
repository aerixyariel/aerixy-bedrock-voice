const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check')
		.setDescription('Provides information about the user.')
    .addUserOption(option=> 
      option.setName('user')
      .setDescription('The member to check')
			.setRequired(true)),
	async execute({ interaction, guilds }) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
    const channel = await interaction.member?.voice.channelId
		console.log(channel)
	},
};