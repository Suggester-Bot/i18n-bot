const { list } = require("../../strings/strings");
const fs = require("fs");
const { logs, emoji, prefix } = require("../../config");
module.exports = {
	controls: {
		name: "start",
		permission: 9,
		usage: "start",
		description: "Begins translation prompt",
		enabled: true,
		aliases: ["translate", "t"],
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
	},
	do: async (message, client, args, Discord) => {
		message.author.send("Please specify the locale code of the language you would like to translate! (You have 2 minutes to respond, or say `cancel` to cancel)").then(sent => {
			message.channel.send(":mailbox_with_mail: Check your DMs!");
			sent.channel.awaitMessages(response => response.author.id === message.author.id, {
				max: 1,
				time: 120000,
				errors: ["time"],
			})
				.then(async (collected) => {
					if (!collected.first().content.split(" ")[0]) return sent.channel.send(`<:${emoji.x}> Invalid locale! Please choose a valid locale from \`${prefix}locales\` and then start the translation prompt again.`);
					if (collected.first().content.toLowerCase() === "cancel") return sent.channel.send(`<:${emoji.check}> Translation cancelled!`);

					const locale = collected.first().content.split(" ")[0].toLowerCase();

					if (!fs.existsSync(`i18n/${locale}.json`)) return sent.channel.send(`<:${emoji.x}> That is an invalid locale!`);
					// eslint-disable-next-line no-unused-vars
					const translationFile = require(`../../i18n/${locale}.json`);

					prompt(1, sent.channel, translationFile, locale);
				})
				.catch(e => {
					console.log(e);
					return channel.send(`<:${emoji.x}> **Translation Timed Out**\nPlease restart translation prompt if you would like to continue.`);
				});
		}).catch(() => message.channel.send(`<:${emoji.x}> I could not DM you to start the translation process! Please ensure that you have your DMs enabled for this server.`));
		

		async function prompt (step, channel, translationFile, locale, forceString) {
			switch (step) {
			case 1:
				// eslint-disable-next-line no-case-declarations
				let strName;
				if (forceString) strName = forceString;
				else {
					// eslint-disable-next-line no-case-declarations
					let choices = Object.keys(list).filter(str => !translationFile.list[str]);
					if (choices.length < 1) return channel.send(":tada: All strings have been translated for this language!");
					// eslint-disable-next-line no-case-declarations
					strName = choices[Math.floor(Math.random() * choices.length)];
				}
				// eslint-disable-next-line no-case-declarations
				let str = list[strName];
				// eslint-disable-next-line no-case-declarations
				let embed = new Discord.MessageEmbed()
					.setFooter(strName)
					.setColor("#7289da")
					.addField("English String", str.string)
					.addField("Context", str.context)
					.setDescription(`Please translate the following string into ${translationFile.settings.english}. You have 5 minutes to respond, send \`cancel\` to cancel or \`skip\` to skip.\nNeed help? Check this [guide](https://discord.com/channels/566002482166104066/705521164562464890/742881648692953119)!`);

				if (str.replaced) {
					let replacedArr = [];
					Object.keys(str.replaced).forEach(r => replacedArr.push(`\`${str.replaced[r].to_replace}\`: ${str.replaced[r].description}`));
					embed.addField("Parameters", replacedArr.join("\n"));
				}
				channel.send(embed).then(sentPrompt => {
					sentPrompt.channel.awaitMessages(response => response.author.id === message.author.id, {
						max: 1,
						time: 300000,
						errors: ["time"],
					}).then(async (collected) => {
						if (!collected.first().content.split(" ")[0]) {
							sentPrompt.channel.send(`<:${emoji.x}> You must specify text! Please try again.`);
							return prompt(1, channel, translationFile, locale, strName);
						}
						if (collected.first().content.toLowerCase() === "cancel") return sentPrompt.channel.send(`<:${emoji.check}> Translation cancelled!`);
						if (collected.first().content.toLowerCase() === "skip") {
channel.send(`<:${emoji.check}> Skipped string`);
return prompt(1, channel,translationFile,locale);
}
						const translation = collected.first().content;
						if (str.replaced) {
							let missingParams = [];
							Object.keys(str.replaced).forEach(key => {
								let r = str.replaced[key];
								if (!translation.includes(r.to_replace)) missingParams.push(r.to_replace);
							});
							if (missingParams.length > 0) {
								channel.send(`<:${emoji.x}> Not all parameters were included. Make sure to include the following: \`${missingParams.join("`, `")}\``, {disableMentions: "all"});
								return prompt(1, channel, translationFile, locale, strName);
							}
						}

						let confirmEmbed = new Discord.MessageEmbed()
							.setTitle("Confirm Translation")
							.setDescription(`Please confirm that the below information is correct by reacting with <:${emoji.check}>. Reacting with <:${emoji.x}> will allow you to re-do the translation.`)
							.addField("English String", str.string)
							.addField(`${translationFile.settings.english} Translation`, translation)
							.setColor("#7289da");
						sentPrompt.channel.send(confirmEmbed).then(async confirmPrompt => {
							await confirmPrompt.react(emoji.check);
							await confirmPrompt.react(emoji.x);
							let checkMatches = emoji.check.match(/[a-z0-9~-]+:([0-9]+)/i)[1] || null;
							let xMatches = emoji.x.match(/[a-z0-9~-]+:([0-9]+)/i)[1] || null;

							const filter = (reaction, user) =>
								(reaction.emoji.id === checkMatches || reaction.emoji.id === xMatches) &&
								user.id === message.author.id;
							await confirmPrompt.awaitReactions(filter, {
								time: 60000,
								max: 1,
								errors: ["time"]
							}).then(async (collected) => {
								if (collected.first().emoji.id === xMatches) {
									return prompt(1, channel, translationFile, locale, strName);
								} else {
									confirmEmbed.setTitle("Translation Confirmed!")
										.setColor("GREEN");
									confirmPrompt.edit(confirmEmbed);
									translationFile.list[strName] = translation;
									fs.writeFile(`i18n/${locale}.json`, JSON.stringify(translationFile), function (err) {
										if (err) return channel.send(`<:${emoji.x}> An error occurred, please report this to the dev team.\n\`${err.stack}\``);
										client.channels.cache.get(logs).send(`🗣️ ${message.author.tag} updated \`${strName}\` in locale \`${locale}\`, set to:\n\`\`\`${translation}\`\`\``);
										return prompt(1, channel, translationFile, locale);
									});
								}
							});
						});
					});
				}).catch(() => channel.send(`<:${emoji.x}> Translation timed out, please restart translation prompt.`));
				break;
			}
		}
	}
};
