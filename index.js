const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ==========================================
// 🚨 COLOQUE SEU TOKEN ABAIXO (DENTRO DAS ASPAS)
// ==========================================
const MEU_TOKEN = "MTQ3NjU3OTA1MTEyMzc2OTQ1Ng.GyO-kW.0teszyUgbxXYCKSGe9p7WTy-q29qjJfd4ETABo"; 

// Limpeza automática de espaços para evitar erro de TokenInvalid
const tokenLimpo = MEU_TOKEN.trim();

client.once('ready', () => {
    console.log('--------------------------------------');
    console.log(`✅ SUCESSO: ${client.user.tag} ESTÁ ONLINE!`);
    console.log('--------------------------------------');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!setup') {
        const embed = new EmbedBuilder()
            .setTitle('🛒 Francisco Ikaro Store')
            .setDescription('**Selecione uma opção para atendimento:**\n\n🔹 Compras\n🔹 Suporte / Ticket')
            .setColor('#2f3136')
            .setThumbnail(client.user.displayAvatarURL());

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('comprar').setLabel('🛒 Comprar').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ticket').setLabel('📩 Abrir Ticket').setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'comprar') {
        return interaction.reply({ content: '💎 **Vendedor notificado!** Aguarde um momento.', ephemeral: true });
    }

    if (interaction.customId === 'ticket') {
        const nomeCanal = `ticket-${interaction.user.username}`;
        try {
            const canal = await interaction.guild.channels.create({
                name: nomeCanal,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                ],
            });

            const btnFechar = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('fechar').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger)
            );

            await canal.send({ content: `🎫 Olá ${interaction.user}, suporte em breve!`, components: [btnFechar] });
            await interaction.reply({ content: `✅ Ticket criado: ${canal}`, ephemeral: true });
        } catch (e) {
            await interaction.reply({ content: '❌ Erro ao criar canal. Verifique minhas permissões!', ephemeral: true });
        }
    }

    if (interaction.customId === 'fechar') {
        await interaction.reply('🔒 Fechando em 5 segundos...');
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
});

// Sistema de Força Bruta para Login
if (tokenLimpo.length < 10) {
    console.error('❌ ERRO: Você esqueceu de colocar o Token na linha 15!');
} else {
    client.login(tokenLimpo).catch(err => {
        console.error('❌ DISCORD REJEITOU O TOKEN:', err.message);
        console.log('👉 DICA: Vá no Portal do Developer e dê RESET TOKEN. O seu atual expirou.');
    });
}
