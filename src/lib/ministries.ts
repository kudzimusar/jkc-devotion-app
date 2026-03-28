export const MINISTRY_SLUGS = [
  'media',
  'ushers',
  'evangelism',
  'prayer',
  'hospitality',
  'fellowship',
  'finance',
  'missions',
  'pastoral',
  'worship',
  'youth',
  'childrens',
  'akiramenai',
  'food-pantry'
];

export async function generateMinistryStaticParams() {
  return MINISTRY_SLUGS.map(slug => ({ slug }));
}
