const { coreLog } = require("../../coreFunctions.js");
module.exports = {
	controls: {
		name: "reboot",
		permission: 0,
		aliases: ["refresh", "shutdown", "restart"],
		usage: "reboot",
		description: "Reboots the bot by exiting the process",
		enabled: true,
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
		dm_allowed: true
	},
	do: async message => {
		await message.channel.send("Shutting down...");
		await coreLog(`🔌 ${message.author.tag} (\`${message.author.id}\`) initiated a reboot`);
		return process.exit(0);
	}
};
