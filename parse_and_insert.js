const fs = require('fs');

const xml = fs.readFileSync('feed.xml', 'utf8');

const entries = xml.split('<entry>').slice(1);
let sql = '';

for (const entry of entries) {
  const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
  let title = entry.match(/<title>(.*?)<\/title>/)?.[1];
  const publishedStr = entry.match(/<published>(.*?)<\/published>/)?.[1];

  if (videoId && title && publishedStr) {
    title = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/'/g, "''");
    const date = new Date(publishedStr).toISOString().split('T')[0];
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    // We fetch one org_id
    sql += `
      INSERT INTO public_sermons (org_id, title, speaker, youtube_url, series, date, status, is_featured)
      SELECT id, '${title}', 'Pastor Marcel Jonte', '${url}', 'Sunday Service', '${date}', 'published', false
      FROM organizations LIMIT 1
      ON CONFLICT DO NOTHING;
    `;
  }
}

// Make the most recent one featured
sql += `
  UPDATE public_sermons SET is_featured = false;
  UPDATE public_sermons SET is_featured = true WHERE id IN (
    SELECT id FROM public_sermons ORDER BY date DESC LIMIT 1
  );
`;

console.log(sql);
