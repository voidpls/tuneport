import { EmbedBuilder } from 'discord.js'
import platformMapping from './platformMapping.json' with {type: 'json'}
const outputPlatforms = process.env.OUTPUT_PLATFORMS.split(',')

export async function portLink (bot, msg, streamingLinks) {
  // console.log(streamingLinks)
  // limit number of links per message (3), as it will convert all links
  if (streamingLinks.length > 3) streamingLinks.length = 3
  for (const streamingLink of streamingLinks) {
    const url = streamingLink.url

    const endpoint = `https://api.song.link/v1-alpha.1/links?url=${url}&songIfSingle=true`
    const options = { method: 'GET' }

    const res = await fetch(endpoint, options)
    // if failed to fetch, just return
    if (!res.ok) return console.log(res.status, res.statusText, streamingLink)
    const data = await res.json()
    // console.log(data)
    if (data.entitiesByUniqueId.length === 1) return // return if no other results
    const metadata = data.entitiesByUniqueId[data.entityUniqueId]

    // console.log(metadata)
    sendMessage(msg, data, metadata, streamingLink.platform)
  }
}

async function sendMessage (msg, data, metadata, originalPlatform) {
  let desc = ''
  outputPlatforms.forEach(platform => {
    if (originalPlatform === platform) return // return if same as original platform
    if (data.linksByPlatform[platform]) {
      const platformName = platformMapping[platform]
      const url = data.linksByPlatform[platform].url
      desc += `**[${platformName}](${url})**\n`
    }
  })

  const embed = new EmbedBuilder()
    .setColor(0x313338)
    .setDescription(`**${metadata.artistName} - ${metadata.title}**\n\n${desc}`)
    .setThumbnail(metadata.thumbnailUrl)
    .setFooter({text: `Powered by Songlink/Odesli`})

  msg.reply({embeds: [embed], allowedMentions: { repliedUser: false }})
}
