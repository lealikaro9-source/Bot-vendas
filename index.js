const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log('--------------------------------------');
    console.log(`✅ SUCESSO: ${client.user.tag} ESTÁ ONLINE!`);
    console.log('--------------------------------------');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content === '!setup') {
        const embed = new EmbedBuilder()
            .setTitle('🛒 Ikaro Store')
            .setDescription('Selecione uma opção para atendimento:')
            .setColor('#2f3136');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('comprar').setLabel('🛒 Comprar').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ticket').setLabel('📩 Abrir Ticket').setStyle(ButtonStyle.Primary)
        );
        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// Lógica de Tickets e Vendas
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'comprar') return interaction.reply({ content: '💎 Vendedor notificado!', ephemeral: true });
    if (interaction.customId === 'ticket') {
        const canal = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });
        await canal.send({ content: `🎫 Olá ${interaction.user}, suporte em breve!` });
        await interaction.reply({ content: `✅ Ticket criado: ${canal}`, ephemeral: true });
    }
});

// AQUI ESTÁ O SEGREDO: Ele vai ler o Token da aba "Variables" do Railway
client.login(process.env.TOKEN);
