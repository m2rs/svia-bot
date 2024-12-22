import { SlashCommandBuilder, PermissionsBitField } from "discord.js";

export const archive = new SlashCommandBuilder()
    .setName('archive')
    .setDescription('Close and archives the thread the command is ran in.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    
export const lock = new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Locks the thread from any users from typing.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)

export const unlock = new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlocks the thread to allow users to type.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)

export const unarchive = new SlashCommandBuilder()
    .setName('unarchive')
    .setDescription('Opens the thread again and allows users to talk within it.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .addStringOption(option =>
        option.setName('thread')
            .setDescription('The thread to un-archive.')
            .setRequired(true)
    )

export const rename = new SlashCommandBuilder()
    .setName('rename')
    .setDescription('Re-names the thread.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .addStringOption(option =>
        option.setName('name')
            .setDescription('The name to re-name the thread to.')
            .setRequired(true)
    )

export const reprimand = new SlashCommandBuilder()
    .setName('reprimand')
    .setDescription('Reprimands the user with the selected sub-command.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .addSubcommand(subcommand =>
        subcommand.setName('warn')
            .setDescription('Verbally warn the user.')
            .addStringOption(option =>
                option.setName('roblox')
                    .setDescription('The roblox username to reprimand.')
                    .setRequired(true)
            )
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to reprimand.')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('role')
                    .setDescription('Select a role')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Director', value: 'Director' },
                        { name: 'Deputy Director', value: 'Deputy Director' },
                        { name: 'Advisor', value: 'Advisor' },
                        { name: 'Operations Supervisor', value: 'Operations Supervisor' },
                        { name: 'Executive', value: 'Executive' },
                        { name: 'Assistant Executive', value: 'Assistant Executive' },
                        { name: 'Head Agent', value: 'Head Agent' },
                        { name: 'Lead Agent', value: 'Lead Agent' },
                        { name: 'Senior Agent', value: 'Senior Agent' },
                        { name: 'Agent', value: 'Agent' },
                        { name: 'Trial Agent', value: 'Trial Agent' }
                    )
                    
            )
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('The reason to reprimand.')
                    .setRequired(true)
            )
            .addAttachmentOption(option =>
                option.setName('proof')
                    .setDescription('The proof of the punishment.')
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('strike')
            .setDescription('Strike the user.')
            .addStringOption(option =>
                option.setName('roblox')
                    .setDescription('The roblox username to reprimand.')
                    .setRequired(true)
            )
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to reprimand.')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('role')
                    .setDescription('Select a role')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Director', value: 'Director' },
                        { name: 'Deputy Director', value: 'Deputy Director' },
                        { name: 'Advisor', value: 'Advisor' },
                        { name: 'Operations Supervisor', value: 'Operations Supervisor' },
                        { name: 'Executive', value: 'Executive' },
                        { name: 'Assistant Executive', value: 'Assistant Executive' },
                        { name: 'Head Agent', value: 'Head Agent' },
                        { name: 'Lead Agent', value: 'Lead Agent' },
                        { name: 'Senior Agent', value: 'Senior Agent' },
                        { name: 'Agent', value: 'Agent' },
                        { name: 'Trial Agent', value: 'Trial Agent' }
                    )
                    
            )
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('The reason to reprimand.')
                    .setRequired(true)
            )
            .addBooleanOption(option =>
                option.setName('appealable')
                    .setDescription('If the punishment is appealable.')
                    .setRequired(true)
            )
            .addAttachmentOption(option =>
                option.setName('proof')
                    .setDescription('The proof of the punishment.')
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('kick')
            .setDescription('Kick the user.')
            .addStringOption(option =>
                option.setName('roblox')
                    .setDescription('The roblox username to reprimand.')
                    .setRequired(true)
            )
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to reprimand.')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('role')
                    .setDescription('Select a role')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Director', value: 'Director' },
                        { name: 'Deputy Director', value: 'Deputy Director' },
                        { name: 'Advisor', value: 'Advisor' },
                        { name: 'Operations Supervisor', value: 'Operations Supervisor' },
                        { name: 'Executive', value: 'Executive' },
                        { name: 'Assistant Executive', value: 'Assistant Executive' },
                        { name: 'Head Agent', value: 'Head Agent' },
                        { name: 'Lead Agent', value: 'Lead Agent' },
                        { name: 'Senior Agent', value: 'Senior Agent' },
                        { name: 'Agent', value: 'Agent' },
                        { name: 'Trial Agent', value: 'Trial Agent' }
                    )
                    
            )
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('The reason to reprimand.')
                    .setRequired(true)
            )
            .addBooleanOption(option =>
                option.setName('appealable')
                    .setDescription('If the punishment is appealable.')
                    .setRequired(true)
            )
            .addAttachmentOption(option =>
                option.setName('proof')
                    .setDescription('The proof of the punishment.')
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('demote')
            .setDescription('Demotes the user. Remember that you have to demote them via Discord manually!')
            .addStringOption(option =>
                option.setName('roblox')
                    .setDescription('The roblox username to reprimand.')
                    .setRequired(true)
            )
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to reprimand.')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('role')
                    .setDescription('Select a role')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Director', value: 'Director' },
                        { name: 'Deputy Director', value: 'Deputy Director' },
                        { name: 'Advisor', value: 'Advisor' },
                        { name: 'Operations Supervisor', value: 'Operations Supervisor' },
                        { name: 'Executive', value: 'Executive' },
                        { name: 'Assistant Executive', value: 'Assistant Executive' },
                        { name: 'Head Agent', value: 'Head Agent' },
                        { name: 'Lead Agent', value: 'Lead Agent' },
                        { name: 'Senior Agent', value: 'Senior Agent' },
                        { name: 'Agent', value: 'Agent' },
                        { name: 'Trial Agent', value: 'Trial Agent' }
                    )
                    
            )
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('The reason to reprimand.')
                    .setRequired(true)
            )
            .addBooleanOption(option =>
                option.setName('appealable')
                    .setDescription('If the punishment is appealable.')
                    .setRequired(true)
            )
            .addAttachmentOption(option =>
                option.setName('proof')
                    .setDescription('The proof of the punishment.')
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('suspend')
            .setDescription('Suspends the user. Remember that you have to suspend them via Discord manually!')
            .addStringOption(option =>
                option.setName('roblox')
                    .setDescription('The roblox username to reprimand.')
                    .setRequired(true)
            )
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to reprimand.')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('role')
                    .setDescription('Select a role')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Director', value: 'Director' },
                        { name: 'Deputy Director', value: 'Deputy Director' },
                        { name: 'Advisor', value: 'Advisor' },
                        { name: 'Operations Supervisor', value: 'Operations Supervisor' },
                        { name: 'Executive', value: 'Executive' },
                        { name: 'Assistant Executive', value: 'Assistant Executive' },
                        { name: 'Head Agent', value: 'Head Agent' },
                        { name: 'Lead Agent', value: 'Lead Agent' },
                        { name: 'Senior Agent', value: 'Senior Agent' },
                        { name: 'Agent', value: 'Agent' },
                        { name: 'Trial Agent', value: 'Trial Agent' }
                    )
                    
            )
            .addNumberOption(option =>
                option.setName('length')
                    .setDescription('The length of the suspension (Days).')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('The reason to reprimand.')
                    .setRequired(true)
            )
            .addBooleanOption(option =>
                option.setName('appealable')
                    .setDescription('If the punishment is appealable.')
                    .setRequired(true)
            )
            .addAttachmentOption(option =>
                option.setName('proof')
                    .setDescription('The proof of the punishment.')
            )
    )


export const history = new SlashCommandBuilder()
    .setName('history')
    .setDescription("Checks the user's previous history within IA. History is only collected from when the bot joined.")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .addSubcommand(subcommand =>
        subcommand.setName('check')
            .setDescription("Check the user's history.")
            .addUserOption(option =>
                option.setName('user')
                    .setDescription("The user whose history to check.")
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('revert')
            .setDescription("Revert a user's history.")
            .addUserOption(option =>
                option.setName('user')
                    .setDescription("The user whose history to revert.")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('id')
                    .setDescription("The id of the history to revert.")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('type')
                    .setDescription("The type of reprimand.")
                    .setRequired(true)
                    .addChoices(
                        { name: 'Warnings', value: 'warnings'},
                        { name: 'Strikes', value: 'strikes'},
                        { name: 'Suspensions', value: 'suspensions'},
                        { name: 'Demotions', value: 'demotions'},
                        { name: 'Removals', value: 'removals'}
                    )
            )
    )