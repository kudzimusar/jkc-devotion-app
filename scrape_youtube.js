const fs = require('fs');

async function scrape() {
  const res = await fetch('https://www.youtube.com/@JapanKingdomChurch/videos');
  const html = await res.text();
  
  const ytInitialDataStr = html.split('var ytInitialData = ')[1]?.split(';</script>')[0];
  if (!ytInitialDataStr) {
    console.log("ytInitialData not found");
    return;
  }
  
  const data = JSON.parse(ytInitialDataStr);
  const tabs = data.contents.twoColumnBrowseResultsRenderer.tabs;
  const videosTab = tabs.find(t => t.tabRenderer.title === 'Videos');
  const items = videosTab.tabRenderer.content.richGridRenderer.contents;
  
  const videos = items.map(i => {
    const r = i.richItemRenderer?.content?.videoRenderer;
    if (!r) return null;
    return {
      title: r.title.runs[0].text,
      videoId: r.videoId,
      publishedTimeText: r.publishedTimeText?.simpleText
    };
  }).filter(Boolean);
  
  console.log(JSON.stringify(videos.slice(0, 20), null, 2));
}

scrape().catch(console.error);
