import 'dotenv/config'
import { Client, Events, GatewayIntentBits } from 'discord.js'
import { default as urlRegex } from 'url-regex-safe'
import { portLink } from './porter.js'
import strict from 'node:assert/strict'
const { BOT_TOKEN } = process.env

// minimal regex for detecting music service links
const musicUrlRegex = {
  spotify: /(open\.spotify|spotify\.link)/i,
  youtubeMusic: /music\.youtube\.com/i,
  youtube: /(youtube\.com|youtu\.be)/i,
  apple: /music\.apple\.com/i,
  soundcloud: /soundcloud\.com/i,
  tidal: /tidal\.com/i,
  deezer: /(deezer\.com|deezer\.page\.link)/i,
  bandcamp: /bandcamp\.com/i
}
// should update names to match songlink docs

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

bot.once(Events.ClientReady, readyClient => {
  console.log(`Logged in as ${readyClient.user.username}`)
})

bot.on(Events.MessageCreate, async msg => {
  if (msg.author.bot || msg.author.id === bot.user.id) return

  const links = msg.content.match(urlRegex({ strict: true }))
  if (!links) return
  const streamingLinks = matchSongLinks(links)
  await portLink(bot, msg, streamingLinks)
})

// function: match all links against specified streaming platforms
// return: matched links without duplicates
function matchSongLinks (links) {
  const streamingLinks = links
    .map(url => {
      const platformsToMatch = Object.keys(musicUrlRegex)
      // .find on keys to get streaming service name as return argument
      const found = platformsToMatch.find(k => url.match(musicUrlRegex[k]))
      if (found) return { platform: found, url }
      return null
    })
    .filter(obj => obj) // remove nulls
  // use Map to remove duplicate values
  const uniqStreamingLinks = [
    ...new Map(streamingLinks.map(item => [item.platform, item])).values()
  ]
  return uniqStreamingLinks
}

bot.login(BOT_TOKEN)
