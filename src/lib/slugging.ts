import slugify from 'slugify';

export default function slugify_tag(tag: string): string {
  return slugify(tag, { lower: true });
}
