const SLURS: string[] = [
  'nigger', 'niggers', 'nigga', 'niggas',
  'jigaboo', 'jigaboos', 'coon', 'sambo',
  'spic', 'spics', 'spick', 'spicks', 'beaner', 'beaners', 'wetback', 'wetbacks',
  'chink', 'chinks', 'gook', 'gooks', 'zipperhead', 'zipperheads',
  'kike', 'kikes', 'hymie', 'hymies', 'heeb', 'heebs',
  'towelhead', 'towelheads', 'raghead', 'ragheads', 'sandnigger', 'sandniggers',
  'paki', 'pakis',
  'faggot', 'faggots', 'fag', 'fags',
  'dyke', 'dykes', 'tranny', 'trannies', 'shemale', 'shemales',
  'retard', 'retards', 'retarded',
  'wog', 'wogs', 'polack', 'polacks',
]

const MULTI_WORD_SLURS: RegExp[] = [
  /porch\s+monkey/i,
  /sand\s+nigger/i,
]

export function containsSlur(text: string): { blocked: boolean; message?: string } {
  for (const slur of SLURS) {
    if (new RegExp(`\\b${slur}\\b`, 'i').test(text)) {
      return { blocked: true, message: 'Your post contains language that violates our community guidelines.' }
    }
  }
  for (const pattern of MULTI_WORD_SLURS) {
    if (pattern.test(text)) {
      return { blocked: true, message: 'Your post contains language that violates our community guidelines.' }
    }
  }
  return { blocked: false }
}
