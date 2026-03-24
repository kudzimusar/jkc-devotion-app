const fs = require('fs');

async function scrape() {
  const res = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=UCwwGostfvdwKJdnVbNblywQ');
  const text = await res.text();
  
  // Quick regex to extract entries
  const entries = text.split('<entry>').slice(1);
  const videos = [];
  
  for (const entry of entries) {
    const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const titleMatch = entry.match(/<title>(.*?)<\/title>/);
    const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
    
    if (videoIdMatch && titleMatch && publishedMatch) {
      videos.push({
        videoId: videoIdMatch[1],
        title: titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        published: publishedMatch[1]
      });
    }
  }
  
  console.log(JSON.stringify(videos, null, 2));
}

scrape().catch(console.error);
