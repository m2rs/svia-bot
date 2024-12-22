import { ActionRowBuilder, ActivityType, ButtonBuilder, ButtonStyle, Client, Embed, EmbedBuilder, GatewayIntentBits, REST, Routes, StringSelectMenuBuilder } from "discord.js";
import { archive, history, lock, rename, reprimand, unarchive, unlock } from "./commands.js";
import { edit_data, get_all_data, get_data, get_user_by_id, get_user_by_username, getSQLDateTime, insert_data } from "./requests.js"
import cron from 'node-cron';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,]})

const commands = [archive, lock, unlock, unarchive, rename, reprimand, history]

const rest = new REST({version: '10'}).setToken(process.env.BOT_TOKEN)

try {
    console.log('Started refreshing application (/) commands')
    await rest.put(Routes.applicationCommands('1241098831006011473'), {body: []})
    await rest.put(Routes.applicationGuildCommands('1241098831006011473', '902317715690229772'), {body: commands})

    console.log('Successfully reloaded application (/) commands')
} catch (error) {
    console.error(error);
}


async function removeRole(channel) {
    try {
        const messages = await channel.messages.fetch({ limit: 1, after: '0' });
        const firstMessage = messages.first();
        const mentionedUsers = firstMessage.mentions.users;
        const mentionedUser = mentionedUsers.first();

            const member = await channel.guild.members.fetch(mentionedUser.id)
            const roles = await member.guild.roles.fetch();
            const role = roles.find(role => role.name === 'Department Authorization')

            try {
                await member.roles.remove(role);
            } catch (error) {
                console.error(error);
            }
    } catch (error) {
        return error
    }
}

const reprimand_queue = new Map()

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`)

    const guild = await client.guilds.fetch('902317715690229772')
    await guild.channels.fetch()
    await guild.roles.fetch()
    await guild.members.fetch()

    try {
        client.user.setActivity('the Intelligence Agency', { type: ActivityType.Listening });
    } catch (error) {
        console.error('Error setting activity:', error);
    }

    cron.schedule('0 15 * * 0', async () => {
        const guild = client.guilds.cache.get('902317715690229772')
        const channel1 = guild.channels.cache.get('1179522577685815387')
        const channel2 = guild.channels.cache.get('905975796043243560')
        const startRole = guild.roles.cache.get('902317716038365227');
        const endRole = guild.roles.cache.get('902317716038365230');
        const members = await guild.members.fetch();
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
        const filteredMembers = members.filter(member => {
          const roles = member.roles.cache;
          let inRange = false;
    
          roles.forEach(role => {
            if (
              (role.position >= startRole.position) &&
              (role.position <= endRole.position)
            ) {
              inRange = true;
            }
          });
    
          return inRange;
        });
    
        const appealCount = new Map()
        const threads1 = await channel1.threads.fetch({ withArchived: true });
        for (const thread of threads1.threads.values()) {
            let lastThreadMessageId = null;
            let hasMoreThreadMessages = true;
        
            while (hasMoreThreadMessages) {
                const options = { limit: 100 };
                if (lastThreadMessageId) options.before = lastThreadMessageId;
        
                const threadMessages = await thread.messages.fetch(options);
        
                if (threadMessages.size === 0) {
                    hasMoreThreadMessages = false;
                } else {
                    threadMessages.forEach(message => {
                        if (message.createdTimestamp >= sevenDaysAgo) {
                            appealCount.set(message.author.id, (appealCount.get(message.author.id) || 0) + 1);
                        }
                    });
                    lastThreadMessageId = threadMessages.last().id;
                }
            }
        }
    
        const caseCount = new Map()
        const threads2 = await channel2.threads.fetch({ withArchived: true });
        for (const thread of threads2.threads.values()) {
            let lastThreadMessageId = null;
            let hasMoreThreadMessages = true;
        
            while (hasMoreThreadMessages) {
                const options = { limit: 100 };
                if (lastThreadMessageId) options.before = lastThreadMessageId;
        
                const threadMessages = await thread.messages.fetch(options);
        
                if (threadMessages.size === 0) {
                    hasMoreThreadMessages = false;
                } else {
                    threadMessages.forEach(message => {
                        if (message.createdTimestamp >= sevenDaysAgo) {
                            caseCount.set(message.author.id, (caseCount.get(message.author.id) || 0) + 1);
                        }
                    });
                    lastThreadMessageId = threadMessages.last().id;
                }
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Intelligence Agency Department AOTW')
            .setDescription("Select this week's AOTW.")
            .setColor(0x42c96d)
    
        if (filteredMembers.size > 0) {
            const memberList = filteredMembers.map(member => member.user.tag).join(', ');
        } else {
            console.log('No members found between the specified roles.');
        }
    
        const aotwData = []
    
        filteredMembers.forEach(member => {
            const memberId = member.id;
            const username = member.user.username;
            
            const caseC = caseCount.get(memberId) || 0;
            
            const appealC = appealCount.get(memberId) || 0;
            
            const totalScore = caseC + appealC;
            const splitScore = `${caseC}, ${appealC}`;
          
            aotwData.push({
                id: memberId,
                username: username,
                score: `${totalScore} (${splitScore})`,
                totalScore: totalScore,
            });
        });

        aotwData.sort((a, b) => b.totalScore - a.totalScore);
        const top3 = aotwData.slice(0, 3);
        
        aotwData.forEach((entry) => {
            embed.addFields({ name: entry.username, value: `Score: ${entry.score}`, inline: true });
        });

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`select_aotw`)
                    .setPlaceholder('Choose a member for AOTW')
                    .addOptions(
                        top3.map((entry, index) => ({
                            label: `${index + 1}. ${entry.username}`,
                            value: entry.id,
                            description: `Score: ${entry.score}`,
                        }))
                    )
            )
        const channel = await guild.channels.fetch('902317717179219972')
        await channel.send({content: '<@&902317716038365231>', embeds: [embed], components: [row]})
    }, {
        timezone: 'GMT'
    })

});

client.on('channelCreate', async (channel) => {
    if (channel.name.startsWith('ticket')) {
        await removeRole(channel)
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'archive') {
        await interaction.deferReply({ ephemeral: false });
        const thread = interaction.channel
            if (!thread.isThread()) {
                await interaction.reply({ content: 'This command can only be used in a thread.', ephemeral: true });
                return;
            }
            try {
                await thread.setLocked(true)
                await thread.setArchived(true)
                await interaction.editReply(`**${thread.name}** has been archived.`)
            } catch (error) {
                await interaction.editReply(`Unexpected error. Please DM m2r.s if this occurs again.\n${error.message}`)
            }
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'lock') {
        await interaction.deferReply({ ephemeral: false });
        const thread = interaction.channel
            if (!thread.isThread()) {
                await interaction.reply({ content: 'This command can only be used in a thread.', ephemeral: true });
                return;
            }
            try {
                await thread.setLocked(true)
                await interaction.editReply(`**${thread.name}** has been locked. Use the /unlock command to unlock this thread.`)
            } catch (error) {
                await interaction.editReply(`Unexpected error. Please DM m2r.s if this occurs again.\n${error.message}`)
            }
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'unlock') {
        await interaction.deferReply({ ephemeral: false });
        const thread = interaction.channel
            if (!thread.isThread()) {
                await interaction.reply({ content: 'This command can only be used in a thread.', ephemeral: true });
                return;
            }
            try {
                await thread.setLocked(false)
                await interaction.editReply(`**${thread.name}** has been unlocked.`)
            } catch (error) {
                await interaction.editReply(`Unexpected error. Please DM m2r.s if this occurs again.\n${error.message}`)
            }
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'unarchive') {
        await interaction.deferReply({ ephemeral: false });
        const threadOption = interaction.options.getString('thread');
        const channelIds = ['905975796043243560', '1179522577685815387'];

        let targetThread = null;

        try {
            for (const channelId of channelIds) {
                const channel = await client.channels.fetch(channelId);
                if (!channel) {
                    continue;
                }

                const threads = await channel.threads.fetchArchived({ type: 'public' });
                const collection = threads.threads;
                targetThread = collection.get(threadOption);

                if (targetThread) break;
            }
        } catch (error) {
            console.error('Error fetching channels or threads:', error);
            await interaction.editReply('An error occurred while trying to fetch channels or threads.');
            return;
        }

        if (!targetThread) {
            await interaction.editReply('No thread found with that ID.');
            return;
        }

        try {
            const freshThread = await targetThread.fetch();

            if (freshThread.archived) {
                await freshThread.setArchived(false);
                await freshThread.setLocked(false);
                await interaction.editReply(`**${freshThread.name}** has been un-archived.`);
            } else {
                await interaction.editReply(`**${freshThread.name}** is already active.`);
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply(`Unexpected error. Please DM m2r.s if this occurs again.\n${error.message}`);
        }
    }
});


client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'rename') {
        const name = interaction.options.getString('name')
        const channel = interaction.channel

        try {
            await interaction.reply(`**${channel.name}** has been changed to **${name}**.`)
            await channel.setName(name)
        } catch (error) {
            console.error(error);
            await interaction.reply(`Unexpected error. Please DM m2r.s if this occurs again.\n${error.message}`)
        }
    }
})

function formatDaysToWeeks(days) {
    if (days < 7) {
        return `${days} day(s)`;
    }

    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;

    return remainingDays === 0
        ? `${weeks} week(s)`
        : `${weeks} week(s) and ${remainingDays} day(s)`;
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand) return;

    if (interaction.commandName === 'reprimand') {
        await interaction.deferReply({ephemeral: false})
        const subcommand = interaction.options.getSubcommand()

        if (subcommand === 'warn') {
            const user = interaction.options.getUser('user')
            const username = interaction.options.getString('roblox')
            const reason = interaction.options.getString('reason')
            const proof = interaction.options.getAttachment('proof')
            const role = interaction.options.getString('role')

            const duser = await client.users.fetch(user.id)
            const useravatar = duser.avatarURL()

            const reprimander = await interaction.guild.members.fetch(interaction.user.id);
            const punished = await interaction.guild.members.fetch(user.id);
            
            if (reprimander.roles.highest.position >= punished.roles.highest.position) {
                try {
                    const usere = await get_user_by_username(username)
                    const userInfo = await get_user_by_id(usere.data[0].id)
    
                    const embed = new EmbedBuilder()
                        .setTitle('Is this information correct?')
                        .setDescription('Check the following information:')
                        .setColor(0xe04136)
                        .setFields(
                            {name: 'Roblox Information', value: `Username: ${userInfo.name}\nUser ID: ${userInfo.id}\nDescription: ${userInfo.description || 'No description available'}`, inline: false},
                            {name: 'Discord Information', value: `Username: ${duser.username}\nDisplay Name: ${duser.displayName}`, inline: false},
                            {name: 'Reprimand Information', value: `Punishment: Verbal Warning\nReason: ${reason}\nAppealable: No`}
                        )
                        .setThumbnail(useravatar)
                        .setFooter({ text: `Reprimand executed by ${interaction.user.username}` });
                    
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('Yes')
                                .setCustomId(`wyes_reprimand_${user.id}_${userInfo.id}`)
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setLabel('No')
                                .setCustomId('no_reprimand')
                                .setStyle(ButtonStyle.Danger)
                        )
                    
                    if (!proof) {
                        reprimand_queue.set(user.id, {
                            discordUser: user,
                            robloxUsername: username,
                            robloxId: userInfo.id,
                            reason: reason,
                            appealable: 'Unappealable',
                            reprimand: 'Verbally Warned',
                            punishment: 'Verbal Warning',
                            database: 'warnings',
                            role: role,
                        });
                    } else {
                        reprimand_queue.set(user.id, {
                            discordUser: user,
                            robloxUsername: username,
                            robloxId: userInfo.id,
                            reason: reason,
                            appealable: appealable,
                            proof: proof.attachment,
                            reprimand: 'Verbally Warned',
                            punishment: 'Verbal Warning',
                            database: 'warnings',
                            role: role,
                            
                        });
                    }
                    await interaction.editReply({embeds: [embed], components: [row]})
                } catch (error) {
                    await interaction.editReply(`Unexpected error:`, error)
                }
            } else {
                await interaction.editReply('This user has a higher role then you. You are not permitted to reprimand this user.')
            }
            
        }

        if (subcommand === 'strike') {
            const user = interaction.options.getUser('user')
            const username = interaction.options.getString('roblox')
            const reason = interaction.options.getString('reason')
            const boolean = interaction.options.getBoolean('appealable')
            const proof = interaction.options.getAttachment('proof')
            const role = interaction.options.getString('role')

            const duser = await client.users.fetch(user.id)
            const useravatar = duser.avatarURL()

            const reprimander = await interaction.guild.members.fetch(interaction.user.id);
            const punished = await interaction.guild.members.fetch(user.id);
            
            if (reprimander.roles.highest.position >= punished.roles.highest.position) {
                try {
                    const usere = await get_user_by_username(username)
                    const userInfo = await get_user_by_id(usere.data[0].id)
    
                    let appealable;
                    if (boolean === true) {
                        appealable = 'Appealable'
                    } else {
                        appealable = 'Unappealable'
                    }
    
                    let appealable2;
                    if (boolean === true) {
                        appealable2 = 'Yes'
                    } else {
                        appealable2 = 'No'
                    }
    
                    const embed = new EmbedBuilder()
                        .setTitle('Is this information correct?')
                        .setDescription('Check the following information:')
                        .setColor(0xe04136)
                        .setFields(
                            {name: 'Roblox Information', value: `Username: ${userInfo.name}\nUser ID: ${userInfo.id}\nDescription: ${userInfo.description || 'No description available'}`, inline: false},
                            {name: 'Discord Information', value: `Username: ${duser.username}\nDisplay Name: ${duser.displayName}`, inline: false},
                            {name: 'Reprimand Information', value: `Punishment: Strike\nReason: ${reason}\nAppealable: ${appealable2}`}
                        )
                        .setThumbnail(useravatar)
                        .setFooter({ text: `Reprimand executed by ${interaction.user.username}` });
                    
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('Yes')
                                .setCustomId(`syes_reprimand_${user.id}_${userInfo.id}`)
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setLabel('No')
                                .setCustomId('no_reprimand')
                                .setStyle(ButtonStyle.Danger)
                        )
                    
                    if (!proof) {
                        reprimand_queue.set(user.id, {
                            discordUser: user,
                            robloxUsername: username,
                            robloxId: userInfo.id,
                            reason: reason,
                            appealable: appealable,
                            reprimand: 'Striked',
                            punishment: 'Strike',
                            role: role
                        });
                    } else {
                        reprimand_queue.set(user.id, {
                            discordUser: user,
                            robloxUsername: username,
                            robloxId: userInfo.id,
                            reason: reason,
                            appealable: appealable,
                            proof: proof.attachment,
                            reprimand: 'Striked',
                            punishment: 'Strike',
                            role: role
                        });
                    }
                    await interaction.editReply({embeds: [embed], components: [row]})
                } catch (error) {
                    await interaction.editReply(`Unexpected error:`, error)
                }
            } else {
                await interaction.editReply('This user has a higher role then you. You are not permitted to reprimand this user.')
            }
            
        }

        if (subcommand === 'kick') {
            const user = interaction.options.getUser('user')
            const username = interaction.options.getString('roblox')
            const reason = interaction.options.getString('reason')
            const boolean = interaction.options.getBoolean('appealable')
            const proof = interaction.options.getAttachment('proof')
            const role = interaction.options.getString('role')

            const duser = await client.users.fetch(user.id)
            const useravatar = duser.avatarURL()

            const reprimander = await interaction.guild.members.fetch(interaction.user.id);
            const punished = await interaction.guild.members.fetch(user.id);
            
            if (reprimander.roles.highest.position >= punished.roles.highest.position) {
                try {
                    const usere = await get_user_by_username(username)
                    const userInfo = await get_user_by_id(usere.data[0].id)
    
                    let appealable;
                    if (boolean === true) {
                        appealable = 'Appealable'
                    } else {
                        appealable = 'Unappealable'
                    }
    
                    let appealable2;
                    if (boolean === true) {
                        appealable2 = 'Yes'
                    } else {
                        appealable2 = 'No'
                    }
    
                    const embed = new EmbedBuilder()
                        .setTitle('Is this information correct?')
                        .setDescription('Check the following information:')
                        .setColor(0xe04136)
                        .setFields(
                            {name: 'Roblox Information', value: `Username: ${userInfo.name}\nUser ID: ${userInfo.id}\nDescription: ${userInfo.description || 'No description available'}`, inline: false},
                            {name: 'Discord Information', value: `Username: ${duser.username}\nDisplay Name: ${duser.displayName}`, inline: false},
                            {name: 'Reprimand Information', value: `Punishment: Kick\nReason: ${reason}\nAppealable: ${appealable2}`}
                        )
                        .setThumbnail(useravatar)
                        .setFooter({ text: `Reprimand executed by ${interaction.user.username}` });
                    
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('Yes')
                                .setCustomId(`kyes_reprimand_${user.id}_${userInfo.id}`)
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setLabel('No')
                                .setCustomId('no_reprimand')
                                .setStyle(ButtonStyle.Danger)
                        )
                    
                    if (!proof) {
                        reprimand_queue.set(user.id, {
                            discordUser: user,
                            robloxUsername: username,
                            robloxId: userInfo.id,
                            reason: reason,
                            appealable: appealable,
                            reprimand: 'Kicked',
                            punishment: 'Kick',
                            role: role
                        });
                    } else {
                        reprimand_queue.set(user.id, {
                            discordUser: user,
                            robloxUsername: username,
                            robloxId: userInfo.id,
                            reason: reason,
                            appealable: appealable,
                            proof: proof.attachment,
                            reprimand: 'Kicked',
                            punishment: 'Kick',
                            role: role
                        });
                    }
                    await interaction.editReply({embeds: [embed], components: [row]})
                } catch (error) {
                    await interaction.editReply(`Unexpected error:`, error)
                }
            } else {
                await interaction.editReply('This user has a higher role then you. You are not permitted to reprimand this user.')
            }
            
        }

        if (subcommand === 'demote') {
            const user = interaction.options.getUser('user')
            const username = interaction.options.getString('roblox')
            const reason = interaction.options.getString('reason')
            const boolean = interaction.options.getBoolean('appealable')
            const proof = interaction.options.getAttachment('proof')
            const role = interaction.options.getString('role')

            const duser = await client.users.fetch(user.id)
            const useravatar = duser.avatarURL()

            const reprimander = await interaction.guild.members.fetch(interaction.user.id);
            const punished = await interaction.guild.members.fetch(user.id);
            
            if (reprimander.roles.highest.position >= punished.roles.highest.position) {
                try {
                    const usere = await get_user_by_username(username)
                    const userInfo = await get_user_by_id(usere.data[0].id)
    
                    let appealable;
                    if (boolean === true) {
                        appealable = 'Appealable'
                    } else {
                        appealable = 'Unappealable'
                    }
    
                    let appealable2;
                    if (boolean === true) {
                        appealable2 = 'Yes'
                    } else {
                        appealable2 = 'No'
                    }
    
                    const embed = new EmbedBuilder()
                        .setTitle('Is this information correct?')
                        .setDescription('Check the following information:')
                        .setColor(0xe04136)
                        .setFields(
                            {name: 'Roblox Information', value: `Username: ${userInfo.name}\nUser ID: ${userInfo.id}\nDescription: ${userInfo.description || 'No description available'}`, inline: false},
                            {name: 'Discord Information', value: `Username: ${duser.username}\nDisplay Name: ${duser.displayName}`, inline: false},
                            {name: 'Reprimand Information', value: `Punishment: Demotion to ${role}\nReason: ${reason}\nAppealable: ${appealable2}`}
                        )
                        .setThumbnail(useravatar)
                        .setFooter({ text: `Reprimand executed by ${interaction.user.username}` });
                    
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('Yes')
                                .setCustomId(`dyes_reprimand_${user.id}_${userInfo.id}`)
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setLabel('No')
                                .setCustomId('no_reprimand')
                                .setStyle(ButtonStyle.Danger)
                        )
                    
                    if (!proof) {
                        reprimand_queue.set(user.id, {
                            discordUser: user,
                            robloxUsername: username,
                            reason: reason,
                            appealable: appealable,
                            reprimand: 'Demoted',
                            punishment: 'Demotion',
                            role: role
                        });
                    } else {
                        reprimand_queue.set(user.id, {
                            discordUser: user,
                            robloxUsername: username,
                            reason: reason,
                            appealable: appealable,
                            proof: proof.attachment,
                            reprimand: 'Demoted',
                            punishment: 'Demotion',
                            role: role
                        });
                    }
                    await interaction.editReply({embeds: [embed], components: [row]})
                } catch (error) {
                    await interaction.editReply(`Unexpected error:`, error)
                }
            } else {
                await interaction.editReply('This user has a higher role then you. You are not permitted to reprimand this user.')
            }
            
        }

        if (subcommand === 'suspend') {
            const user = interaction.options.getUser('user')
            const username = interaction.options.getString('roblox')
            const length = interaction.options.getNumber('length')
            const reason = interaction.options.getString('reason')
            const boolean = interaction.options.getBoolean('appealable')
            const proof = interaction.options.getAttachment('proof')
            const formattedLength = formatDaysToWeeks(length)
            const role = interaction.options.getString('role')

            const duser = await client.users.fetch(user.id)
            const useravatar = duser.avatarURL()

            const reprimander = await interaction.guild.members.fetch(interaction.user.id);
            const punished = await interaction.guild.members.fetch(user.id);
            
            if (reprimander.roles.highest.position >= punished.roles.highest.position) {
                try {
                    const usere = await get_user_by_username(username)
                    const userInfo = await get_user_by_id(usere.data[0].id)
    
                    let appealable;
                    if (boolean === true) {
                        appealable = 'Appealable'
                    } else {
                        appealable = 'Unappealable'
                    }
    
                    let appealable2;
                    if (boolean === true) {
                        appealable2 = 'Yes'
                    } else {
                        appealable2 = 'No'
                    }
    
                    const embed = new EmbedBuilder()
                        .setTitle('Is this information correct?')
                        .setDescription('Check the following information:')
                        .setColor(0xe04136)
                        .setFields(
                            {name: 'Roblox Information', value: `Username: ${userInfo.name}\nUser ID: ${userInfo.id}\nDescription: ${userInfo.description || 'No description available'}`, inline: false},
                            {name: 'Discord Information', value: `Username: ${duser.username}\nDisplay Name: ${duser.displayName}`, inline: false},
                            {name: 'Reprimand Information', value: `Punishment: Suspension (${formattedLength})\nReason: ${reason}\nAppealable: ${appealable2}`}
                        )
                        .setThumbnail(useravatar)
                        .setFooter({ text: `Reprimand executed by ${interaction.user.username}` });
                    
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('Yes')
                                .setCustomId(`suyes_reprimand_${user.id}_${userInfo.id}_${length}`)
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setLabel('No')
                                .setCustomId('no_reprimand')
                                .setStyle(ButtonStyle.Danger)
                        )
                    
                    if (!proof) {
                        reprimand_queue.set(user.id, {
                            discordUser: user,
                            robloxUsername: username,
                            robloxId: userInfo.id,
                            reason: reason,
                            appealable: appealable,
                            reprimand: `Suspended for ${formattedLength}`,
                            punishment: 'Suspension',
                            role: role
                        });
                    } else {
                        reprimand_queue.set(user.id, {
                            discordUser: user,
                            robloxUsername: username,
                            robloxId: userInfo.id,
                            reason: reason,
                            appealable: appealable,
                            proof: proof.attachment,
                            reprimand: `Suspended for ${formattedLength}`,
                            punishment: 'Suspension',
                            role: role
                        });
                    }
                    await interaction.editReply({embeds: [embed], components: [row]})
                } catch (error) {
                    await interaction.editReply(`Unexpected error:`, error)
                }
            } else {
                await interaction.editReply('This user has a higher role then you. You are not permitted to reprimand this user.')
            }
            
        }
    }
    
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'history') {
        const subcommand = interaction.options.getSubcommand()
        if (subcommand === 'check') {
            await interaction.deferReply();
            const user = interaction.options.getUser('user')
            try {
                const embed = new EmbedBuilder()
                    .setTitle(`${user.username}'s Reprimand History`)
                    .setColor(0xe04136)

                const warnings = await get_data('warnings', 'reprimands', ['discord', user.id])
                const warningsObject = JSON.parse(warnings.warnings);
                const strikes = await get_data('strikes', 'reprimands', ['discord', user.id])
                const strikesObject = JSON.parse(strikes.strikes);
                const suspensions = await get_data('suspensions', 'reprimands', ['discord', user.id])
                const suspensionsObject = JSON.parse(suspensions.suspensions);
                const demotions = await get_data('demotions', 'reprimands', ['discord', user.id])
                const demotionsObject = JSON.parse(demotions.demotions);
                const removals = await get_data('removals', 'reprimands', ['discord', user.id])
                const removalsObject = JSON.parse(removals.removals);

                const formattedWarnings = warningsObject.warnings
                    .map((warn, index) => {
                        let revertedStatus;
                        if (warn.reverted) {
                            revertedStatus = 'Reverted'
                        } else {
                            revertedStatus = ''
                        }
                        return `**Warning ${index + 1} ${revertedStatus}:**\nReason: ${warn.reason}\nID: ${warn.id}\nReprimander: ${warn.reprimander}`;
                    })
                    .join('\n\n');
                const formattedStrikes = strikesObject.strikes
                    .map((warn, index) => {
                        let revertedStatus;
                        if (warn.reverted) {
                            revertedStatus = '**Reverted**'
                        } else {
                            revertedStatus = ''
                        }
                        return `**Strike ${index + 1} ${revertedStatus}:**\nReason: ${warn.reason}\nID: ${warn.id}\nReprimander: ${warn.reprimander}`;
                    })
                    .join('\n\n');
                const formattedSuspensions = suspensionsObject.suspensions
                    .map((warn, index) => {
                        let revertedStatus;
                        if (warn.reverted) {
                            revertedStatus = '**Reverted**'
                        } else {
                            revertedStatus = ''
                        }
                        return `**Suspension ${index + 1} ${revertedStatus}:**\nReason: ${warn.reason}\nID: ${warn.id}\nReprimander: ${warn.reprimander}`;
                    })
                    .join('\n\n');
                const formattedDemotions = demotionsObject.demotions
                    .map((warn, index) => {
                        let revertedStatus;
                        if (warn.reverted) {
                            revertedStatus = '**Reverted**'
                        } else {
                            revertedStatus = ''
                        }
                        return `**Demotion ${index + 1} ${revertedStatus}:**\nReason: ${warn.reason}\nID: ${warn.id}\nReprimander: ${warn.reprimander}`;
                    })
                    .join('\n\n');
                const formattedRemovals = removalsObject.removals
                    .map((warn, index) => {
                        let revertedStatus;
                        if (warn.reverted) {
                            revertedStatus = '**Reverted**'
                        } else {
                            revertedStatus = ''
                        }
                        return `**Removal ${index + 1} ${revertedStatus}:**\nReason: ${warn.reason}\nID: ${warn.id}\nReprimander: ${warn.reprimander}`;
                    })
                    .join('\n\n');
                
                embed.addFields(
                    { name: 'Warnings', value: formattedWarnings || 'No warnings found.', inline: false },
                    { name: 'Strikes', value: formattedStrikes || 'No strikes found.', inline: false },
                    { name: 'Suspensions', value: formattedSuspensions || 'No suspensions found.', inline: false },
                    { name: 'Demotions', value: formattedDemotions || 'No demotions found.', inline: false },
                    { name: 'Removals', value: formattedRemovals || 'No removals found.', inline: false },
                )
                await interaction.editReply({embeds: [embed]})
            } catch (error) {
                await interaction.editReply('An error occured.\n', error)
                console.log(error)
            }
        }

        if (subcommand === 'revert') {
            const id = interaction.options.getString('id')
            const user = interaction.options.getUser('user')
            const type = interaction.options.getString('type')

            function findArrayValue(obj) {
                for (const key in obj) {
                  if (Array.isArray(obj[key])) {
                    return obj[key];
                  }
                  if (typeof obj[key] === 'object') {
                    const nestedArray = findArrayValue(obj[key]);
                    if (nestedArray) return nestedArray;
                  }
                }
                return null;
              }
            
            try {
                const data = await get_data(type, 'reprimands', ['discord', user.id])
                const roblox = await get_data('roblox', 'reprimands', ['discord', user.id])
                const channel = await interaction.guild.channels.fetch('902317717179219973')
                const msg = await channel.messages.fetch(id)
                const firstKey = Object.keys(data)[0];
                const innerJson = JSON.parse(data[firstKey]);

                let array = findArrayValue(innerJson)
                array = array.map(item => {
                    if (item.id === id) {
                    return { ...item, reverted: true };
                    }
                    return item;
                });
                const finalJson = JSON.stringify({[type]: array})
                const result = await edit_data([type, 'discord'], 'reprimands', [finalJson, user.id])
                await interaction.reply(`The reprimand (${id}) has been reverted by ${interaction.user.username}.`)
                await msg.reply(`${roblox.roblox}'s reprimand (${id}) has been reverted by ${interaction.user.username}.`)
            } catch (error) {
                console.log(error)
            }
        }
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('wyes_reprimand_')) {
        const userId = interaction.customId.split('_')[2];
        const roblox = interaction.customId.split('_')[3];
        const repInfo = reprimand_queue.get(userId)
        const userInfo = await get_user_by_id(roblox)
        const user = repInfo.discordUser
        const role = repInfo.role
        let message;
        if (repInfo.proof) {
            message = `Hello ${repInfo.robloxUsername}, you have been **${repInfo.reprimand}** in the Stateview's Intelligence Agency Department due to **${repInfo.reason}**.\n\n> In accordance to our bylaws, our team has decided to make this action **${repInfo.appealable}**.\n\nWe ask that this message is not leaked to anyone within **Stateview**. If you believe this is unfair you may contact **Intelligence Agency Administration**.\n\n*Sincerely,*\n**Intelligence Agency High Command**.\n${repInfo.proof}`
        } else {
            message = `Hello ${repInfo.robloxUsername}, you have been **${repInfo.reprimand}** in the Stateview's Intelligence Agency Department due to **${repInfo.reason}**.\n\nIn accordance to our bylaws, our team has decided to make this action **${repInfo.appealable}**.\n\nWe ask that this message is not leaked to anyone within **Stateview**. If you believe this is unfair you may contact **Intelligence Agency Administration**.\n\n*Sincerely,*\n**Intelligence Agency High Command**.`
        }

        const embedM = new EmbedBuilder()
            .setDescription(message)
            .setColor(0xe04136)

        try {
            let appealable;
            if (repInfo.appealable === 'Appealable') {
                appealable = 'Yes'
            } else {
                appealable = 'No'
            }

            const useravatar = user.avatarURL()

            await user.send({embeds: [embedM]})
            const embed = new EmbedBuilder()
                .setTitle('Reprimand Successful')
                .setDescription('Reprimand Information:')
                .setColor(0xe04136)
                .setFields(
                    {name: 'Roblox Information', value: `Username: ${userInfo.name}\nUser ID: ${userInfo.id}\nDescription: ${userInfo.description || 'No description available'}`, inline: false},
                    {name: 'Discord Information', value: `Username: ${user.username}\nDisplay Name: ${user.displayName}`, inline: false},
                    {name: 'Reprimand Information', value: `Punishment: ${repInfo.punishment}\nReason: ${repInfo.reason}\nAppealable: ${appealable}`}
                )
                .setThumbnail(useravatar)
            await interaction.update({embeds: [embed], components: []})
            const channel = await client.channels.fetch('902317717179219973')
            const duser = await interaction.guild.members.fetch(user)
            const msg = await channel.send(`${userInfo.name} (${role}/${user.id}) has been **${repInfo.reprimand}** due to **${repInfo.reason}**. They were reprimanded by ${interaction.user.username}.\n${repInfo.proof || ''}`)
            
            const has_row = await get_data(repInfo.database, 'reprimands', ['discord', duser.id])
            if (has_row) {
                const jsonRow = JSON.parse(has_row.warnings)
                jsonRow.warnings.push({
                    reason: repInfo.reason,
                    id: msg.id,
                    reprimander: interaction.user.username,
                    reverted: false
                  },);
                const updatedWarnings = JSON.stringify(jsonRow);

                const result = await edit_data(['warnings', 'discord'], 'reprimands', [updatedWarnings, duser.id])
            } else {
                const json = {
                    warnings: [
                        {
                            reason: repInfo.reason,
                            id: msg.id,
                            reprimander: interaction.user.username,
                            reverted: false
                        },
                    ],
                };
                const jsonString = JSON.stringify(json)
                const result = await insert_data('created_at, discord, warnings, strikes, suspensions, demotions, removals, roblox', 'reprimands',  [
                    getSQLDateTime(),
                    duser.id,
                    jsonString,
                    `{"strikes": []}`,
                    `{"suspensions": []}`,
                    `{"demotions": []}`,
                    `{"removals": []}`,
                    userInfo.name
                ])
            }

            reprimand_queue.delete(userId)

        } catch (error) {
            await interaction.editReply('There was an error reprimanding this user.', error)
        }
    }

    if (interaction.customId.startsWith('syes_reprimand_')) {
        const userId = interaction.customId.split('_')[2];
        const roblox = interaction.customId.split('_')[3];
        const repInfo = reprimand_queue.get(userId)
        const userInfo = await get_user_by_id(roblox)
        const user = repInfo.discordUser
        const role = repInfo.role
        let message;
        if (repInfo.proof) {
            message = `Hello ${repInfo.robloxUsername}, you have been **${repInfo.reprimand}** in the Stateview's Intelligence Agency Department due to **${repInfo.reason}**.\n\n> In accordance to our bylaws, our team has decided to make this action **${repInfo.appealable}**.\n\nWe ask that this message is not leaked to anyone within **Stateview**. If you believe this is unfair you may contact **Intelligence Agency Administration**.\n\n*Sincerely,*\n**Intelligence Agency High Command**.\n${repInfo.proof}`
        } else {
            message = `Hello ${repInfo.robloxUsername}, you have been **${repInfo.reprimand}** in the Stateview's Intelligence Agency Department due to **${repInfo.reason}**.\n\nIn accordance to our bylaws, our team has decided to make this action **${repInfo.appealable}**.\n\nWe ask that this message is not leaked to anyone within **Stateview**. If you believe this is unfair you may contact **Intelligence Agency Administration**.\n\n*Sincerely,*\n**Intelligence Agency High Command**.`
        }

        const embedM = new EmbedBuilder()
            .setDescription(message)
            .setColor(0xe04136)

        try {
            let appealable;
            if (repInfo.appealable === 'Appealable') {
                appealable = 'Yes'
            } else {
                appealable = 'No'
            }

            const useravatar = user.avatarURL()

            await user.send({embeds: [embedM]})
            const embed = new EmbedBuilder()
                .setTitle('Reprimand Successful')
                .setDescription('Reprimand Information:')
                .setColor(0xe04136)
                .setFields(
                    {name: 'Roblox Information', value: `Username: ${userInfo.name}\nUser ID: ${userInfo.id}\nDescription: ${userInfo.description || 'No description available'}`, inline: false},
                    {name: 'Discord Information', value: `Username: ${user.username}\nDisplay Name: ${user.displayName}`, inline: false},
                    {name: 'Reprimand Information', value: `Punishment: ${repInfo.punishment}\nReason: ${repInfo.reason}\nAppealable: ${appealable}`}
                )
                .setThumbnail(useravatar)
            await interaction.update({embeds: [embed], components: []})
            const channel = await client.channels.fetch('902317717179219973')
            const duser = await interaction.guild.members.fetch(user)
            const userRole = duser.roles.highest.name
            const msg = await channel.send(`${userInfo.name} (${role}/${user.id}) has been **${repInfo.reprimand}** due to **${repInfo.reason}**. They were reprimanded by ${interaction.user.username}.\n${repInfo.proof || ''}`)
            
            const has_row = await get_data('strikes', 'reprimands', ['discord', duser.id])
            if (has_row) {
                const jsonRow = JSON.parse(has_row.strikes)
                jsonRow.strikes.push({
                    reason: repInfo.reason,
                    id: msg.id,
                    reprimander: interaction.user.username,
                    reverted: false
                  },);
                const updatedWarnings = JSON.stringify(jsonRow);

                const result = await edit_data(['strikes', 'discord'], 'reprimands', [updatedWarnings, duser.id])
            } else {
                const json = {
                    strikes: [
                        {
                            reason: repInfo.reason,
                            id: msg.id,
                            reprimander: interaction.user.username,
                            reverted: false
                        },
                    ],
                };
                const jsonString = JSON.stringify(json)
                const result = await insert_data('created_at, discord, warnings, strikes, suspensions, demotions, removals, roblox', 'reprimands', [
                    getSQLDateTime(),
                    duser.id,
                    `{"warnings": []}`,
                    jsonString,
                    `{"suspensions": []}`,
                    `{"demotions": []}`,
                    `{"removals": []}`,
                    userInfo.name
                ])
            }

            reprimand_queue.delete(userId)

        } catch (error) {
            await interaction.editReply('There was an error reprimanding this user.', error)
        }
    }

    if (interaction.customId.startsWith('suyes_reprimand_')) {
        const userId = interaction.customId.split('_')[2];
        const roblox = interaction.customId.split('_')[3];
        const repInfo = reprimand_queue.get(userId)
        const userInfo = await get_user_by_id(roblox)
        const user = repInfo.discordUser
        const role = repInfo.role
        let message;
        if (repInfo.proof) {
            message = `Hello ${repInfo.robloxUsername}, you have been **${repInfo.reprimand}** in the Stateview's Intelligence Agency Department due to **${repInfo.reason}**.\n\n> In accordance to our bylaws, our team has decided to make this action **${repInfo.appealable}**.\n\nWe ask that this message is not leaked to anyone within **Stateview**. If you believe this is unfair you may contact **Intelligence Agency Administration**.\n\n*Sincerely,*\n**Intelligence Agency High Command**.\n${repInfo.proof}`
        } else {
            message = `Hello ${repInfo.robloxUsername}, you have been **${repInfo.reprimand}** in the Stateview's Intelligence Agency Department due to **${repInfo.reason}**.\n\nIn accordance to our bylaws, our team has decided to make this action **${repInfo.appealable}**.\n\nWe ask that this message is not leaked to anyone within **Stateview**. If you believe this is unfair you may contact **Intelligence Agency Administration**.\n\n*Sincerely,*\n**Intelligence Agency High Command**.`
        }

        const embedM = new EmbedBuilder()
            .setDescription(message)
            .setColor(0xe04136)

        try {
            let appealable;
            if (repInfo.appealable === 'Appealable') {
                appealable = 'Yes'
            } else {
                appealable = 'No'
            }

            const useravatar = user.avatarURL()

            await user.send({embeds: [embedM]})
            const embed = new EmbedBuilder()
                .setTitle('Reprimand Successful')
                .setDescription('Reprimand Information:')
                .setColor(0xe04136)
                .setFields(
                    {name: 'Roblox Information', value: `Username: ${userInfo.name}\nUser ID: ${userInfo.id}\nDescription: ${userInfo.description || 'No description available'}`, inline: false},
                    {name: 'Discord Information', value: `Username: ${user.username}\nDisplay Name: ${user.displayName}`, inline: false},
                    {name: 'Reprimand Information', value: `Punishment: ${repInfo.punishment}\nReason: ${repInfo.reason}\nAppealable: ${appealable}`}
                )
                .setThumbnail(useravatar)
            await interaction.update({embeds: [embed], components: []})
            const channel = await client.channels.fetch('902317717179219973')
            const duser = await interaction.guild.members.fetch(user)
            const msg = await channel.send(`${userInfo.name} (${role}/${user.id}) has been **${repInfo.reprimand}** due to **${repInfo.reason}**. They were reprimanded by ${interaction.user.username}.\n${repInfo.proof || ''}`)
            
            const has_row = await get_data('suspensions', 'reprimands', ['discord', duser.id])
            if (has_row) {
                const jsonRow = JSON.parse(has_row.suspensions)
                jsonRow.suspensions.push({
                    reason: repInfo.reason,
                    id: msg.id,
                    reprimander: interaction.user.username,
                    reverted: false
                  },);
                const updatedWarnings = JSON.stringify(jsonRow);

                const result = await edit_data(['suspensions', 'discord'], 'reprimands', [updatedWarnings, duser.id])
            } else {
                const json = {
                    suspensions: [
                        {
                            reason: repInfo.reason,
                            id: msg.id,
                            reprimander: interaction.user.username,
                            reverted: false
                        },
                    ],
                };
                const jsonString = JSON.stringify(json)
                const result = await insert_data('created_at, discord, warnings, strikes, suspensions, demotions, removals, roblox', 'reprimands', [
                    getSQLDateTime(),
                    duser.id,
                    `{"warnings": []}`,
                    `{"strikes": []}`,
                    jsonString,
                    `{"demotions": []}`,
                    `{"removals": []}`,
                    userInfo.name
                ])
            }

            reprimand_queue.delete(userId)

        } catch (error) {
            await interaction.editReply('There was an error reprimanding this user.', error)
        }
    }

    if (interaction.customId.startsWith('dyes_reprimand_')) {
        const userId = interaction.customId.split('_')[2];
        const roblox = interaction.customId.split('_')[3];
        const repInfo = reprimand_queue.get(userId)
        const userInfo = await get_user_by_id(roblox)
        const user = repInfo.discordUser
        const role = repInfo.role
        let message;
        if (repInfo.proof) {
            message = `Hello ${repInfo.robloxUsername}, you have been **${repInfo.reprimand} to ${role}** in the Stateview's Intelligence Agency Department due to **${repInfo.reason}**.\n\n> In accordance to our bylaws, our team has decided to make this action **${repInfo.appealable}**.\n\nWe ask that this message is not leaked to anyone within **Stateview**. If you believe this is unfair you may contact **Intelligence Agency Administration**.\n\n*Sincerely,*\n**Intelligence Agency High Command**.\n${repInfo.proof}`
        } else {
            message = `Hello ${repInfo.robloxUsername}, you have been **${repInfo.reprimand} to ${role}** in the Stateview's Intelligence Agency Department due to **${repInfo.reason}**.\n\nIn accordance to our bylaws, our team has decided to make this action **${repInfo.appealable}**.\n\nWe ask that this message is not leaked to anyone within **Stateview**. If you believe this is unfair you may contact **Intelligence Agency Administration**.\n\n*Sincerely,*\n**Intelligence Agency High Command**.`
        }

        const embedM = new EmbedBuilder()
            .setDescription(message)
            .setColor(0xe04136)

        try {
            let appealable;
            if (repInfo.appealable === 'Appealable') {
                appealable = 'Yes'
            } else {
                appealable = 'No'
            }

            const useravatar = user.avatarURL()

            await user.send({embeds: [embedM]})
            const embed = new EmbedBuilder()
                .setTitle('Reprimand Successful')
                .setDescription('Reprimand Information:')
                .setColor(0xe04136)
                .setFields(
                    {name: 'Roblox Information', value: `Username: ${userInfo.name}\nUser ID: ${userInfo.id}\nDescription: ${userInfo.description || 'No description available'}`, inline: false},
                    {name: 'Discord Information', value: `Username: ${user.username}\nDisplay Name: ${user.displayName}`, inline: false},
                    {name: 'Reprimand Information', value: `Punishment: ${repInfo.punishment} to ${role}\nReason: ${repInfo.reason}\nAppealable: ${appealable}`}
                )
                .setThumbnail(useravatar)
            await interaction.update({embeds: [embed], components: []})
            const channel = await client.channels.fetch('902317717179219973')
            const duser = await interaction.guild.members.fetch(user)
            const msg = await channel.send(`${userInfo.name} (${role}/${user.id}) has been **${repInfo.reprimand} to ${role}** due to **${repInfo.reason}**. They were reprimanded by ${interaction.user.username}.\n${repInfo.proof || ''}`)

            const has_row = await get_data('demotions', 'reprimands', ['discord', duser.id])
            if (has_row) {
                const jsonRow = JSON.parse(has_row.demotions)
                jsonRow.demotions.push({
                    reason: repInfo.reason,
                    id: msg.id,
                    reprimander: interaction.user.username,
                    reverted: false
                  },);
                const updatedWarnings = JSON.stringify(jsonRow);

                const result = await edit_data(['demotions', 'discord'], 'reprimands', [updatedWarnings, duser.id])
            } else {
                const json = {
                    demotions: [
                        {
                            reason: repInfo.reason,
                            id: msg.id,
                            reprimander: interaction.user.username,
                            reverted: false
                        },
                    ],
                };
                const jsonString = JSON.stringify(json)
                const result = await insert_data('created_at, discord, warnings, strikes, suspensions, demotions, removals, roblox', 'reprimands', [
                    getSQLDateTime(),
                    duser.id,
                    `{"warnings": []}`,
                    `{"strikes": []}`,
                    `{"suspensions": []}`,
                    jsonString,
                    `{"removals": []}`,
                    userInfo.name
                ])
            }

            reprimand_queue.delete(userId)

        } catch (error) {
            await interaction.editReply('There was an error reprimanding this user.', error)
        }
    }

    if (interaction.customId.startsWith('kyes_reprimand_')) {
        const userId = interaction.customId.split('_')[2];
        const roblox = interaction.customId.split('_')[3];
        const repInfo = reprimand_queue.get(userId)
        const userInfo = await get_user_by_id(roblox)
        const user = repInfo.discordUser
        const role = repInfo.role
        let message;
        if (repInfo.proof) {
            message = `Hello ${repInfo.robloxUsername}, you have been **${repInfo.reprimand}** in the Stateview's Intelligence Agency Department due to **${repInfo.reason}**.\n\n> In accordance to our bylaws, our team has decided to make this action **${repInfo.appealable}**.\n\nWe ask that this message is not leaked to anyone within **Stateview**. If you believe this is unfair you may contact **Intelligence Agency Administration**.\n\n*Sincerely,*\n**Intelligence Agency High Command**.\n${repInfo.proof}`
        } else {
            message = `Hello ${repInfo.robloxUsername}, you have been **${repInfo.reprimand}** in the Stateview's Intelligence Agency Department due to **${repInfo.reason}**.\n\nIn accordance to our bylaws, our team has decided to make this action **${repInfo.appealable}**.\n\nWe ask that this message is not leaked to anyone within **Stateview**. If you believe this is unfair you may contact **Intelligence Agency Administration**.\n\n*Sincerely,*\n**Intelligence Agency High Command**.`
        }

        const embedM = new EmbedBuilder()
            .setDescription(message)
            .setColor(0xe04136)

        try {
            let appealable;
            if (repInfo.appealable === 'Appealable') {
                appealable = 'Yes'
            } else {
                appealable = 'No'
            }

            const useravatar = user.avatarURL()

            await user.send({embeds: [embedM]})
            const embed = new EmbedBuilder()
                .setTitle('Reprimand Successful')
                .setDescription('Reprimand Information:')
                .setColor(0xe04136)
                .setFields(
                    {name: 'Roblox Information', value: `Username: ${userInfo.name}\nUser ID: ${userInfo.id}\nDescription: ${userInfo.description || 'No description available'}`, inline: false},
                    {name: 'Discord Information', value: `Username: ${user.username}\nDisplay Name: ${user.displayName}`, inline: false},
                    {name: 'Reprimand Information', value: `Punishment: ${repInfo.punishment}\nReason: ${repInfo.reason}\nAppealable: ${appealable}`}
                )
                .setThumbnail(useravatar)
            await interaction.update({embeds: [embed], components: []})
            const channel = await client.channels.fetch('902317717179219973')
            const duser = await interaction.guild.members.fetch(user.id)
            const msg = await channel.send(`${userInfo.name} (${role}/${duser.id}) has been **${repInfo.reprimand}** due to **${repInfo.reason}**. They were reprimanded by ${interaction.user.username}.\n${repInfo.proof || ''}`)

            const has_row = await get_data('removals', 'reprimands', ['discord', duser.id])
            if (has_row) {
                const jsonRow = JSON.parse(has_row.removals)
                jsonRow.removals.push({
                    reason: repInfo.reason,
                    id: msg.id,
                    reprimander: interaction.user.username,
                    reverted: false
                  },);
                const updatedWarnings = JSON.stringify(jsonRow);

                const result = await edit_data(['removals', 'discord'], 'reprimands', [updatedWarnings, duser.id])
            } else {
                const json = {
                    removals: [
                        {
                            reason: repInfo.reason,
                            id: msg.id,
                            reprimander: interaction.user.username,
                            reverted: false
                        },
                    ],
                };
                const jsonString = JSON.stringify(json)
                const result = await insert_data('created_at, discord, warnings, strikes, suspensions, demotions, removals, roblox', 'reprimands', [
                    getSQLDateTime(),
                    duser.id,
                    `{"warnings": []}`,
                    `{"strikes": []}`,
                    `{"demotions": []}`,
                    `{"demotions": []}`,
                    jsonString,
                    userInfo.name
                ])
            }

            reprimand_queue.delete(userId)
            await duser.kick(`Kicked due to ${repInfo.reason}`)

        } catch (error) {
            await interaction.editReply('There was an error reprimanding this user.', error)
        }
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'select_aotw') {
        const now = new Date();
        const months = [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const day = now.getDate();
        const month = months[now.getMonth()];

        const formattedDate = `${day} ${month}`;

        const id = interaction.values[0];
        const member = await interaction.guild.members.fetch(id);
        const role = interaction.guild.roles.cache.get('1060906825815441439');
        const channel = await interaction.guild.channels.fetch('909304027735539772')
        try {
            const msg = `**__Stateview Intelligence Agency Department__**\n**${formattedDate} | Agent of The Week Appointment**\n\nHello, Intelligence Agency Agents!\n\nDue to the hard work, dedication, and extreme contribution to the Stateview Intelligence Agency, we have decided to select <@${id}> as Staff of the week. This user will receive a quota reduction in Stateview, along with being able to choose their role color.\n\nRegards,\n** <:SVIntelligence:936601099098533948> | Intelligence Agency High Command**`
            await member.roles.add(role)
            await channel.send(msg)
            await interaction.update({content: `**${member.user.username}** has been appointed AOTW.`, components: []})
        } catch (error) {
            await interaction.reply('There was an error appointing the AOTW.')
        }
    }
})



client.login(process.env.BOT_TOKEN)