const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('To join server voice chat!')
    .addStringOption(option =>
      option.setName('gamerstag')
        .setDescription('Gamerstag to join the server')
        .setRequired(true)
        .setAutocomplete(true)),
	async execute({ interaction, guilds }) {
    const channel = guilds.cache.find(guild => guild.id == interaction.member.guild.id).channels.cache.find(channel => channel.id == '1208528303711850538')
    /* if (channel == '1208528303711850538') {
      await interaction.reply({ content: interaction.member.id, ephemeral: true})
    } else {
      await interaction.reply({ content: 'Please join to voice channel lobby', ephemeral: true})
    } */
    //console.log(channel)
  }
};
