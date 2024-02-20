const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { request } = require('undici')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('urban')
		.setDescription('Urban Dictionary.')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Phrase to search for')
        .setRequired(true)
        .setAutocomplete(true)),
	async execute({ interaction }) {
    const search = await interaction.options.getString('query');

    if(!search) return await interaction.reply('input some word to search')

		const dictResult = await request(`https://api.urbandictionary.com/v0/define?term=${search}`);
		const { list } = await dictResult.body.json();

    if (!list.length) {
      return await interaction.reply(`No results found for **${search}**.`);
    }

    const trim = (str, max) => (str.length > max ? `${str.slice(0, max - 3)}...` : str);

    const [answer] = list;

    const embed = new EmbedBuilder()
      .setColor(0xEFFF00)
      .setTitle(answer.word)
      .setURL(answer.permalink)
      .addFields({ name: 'Definition', value: trim(answer.definition, 1_024) }, { name: 'Example', value: trim(answer.example, 1_024) }, { name: 'Rating', value: `${answer.thumbs_up} 👍 ${answer.thumbs_down} 👎` });

    await interaction.reply({ embeds: [embed] });
	},
};