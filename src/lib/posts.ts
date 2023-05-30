import { CollectionEntry, getCollection } from "astro:content";

type DateOrdering = "asc" | "desc";
type Post = CollectionEntry<"blog">;

function orderByDateAscending(left: Post, right: Post): number {
  return left.data.date.valueOf() - right.data.date.valueOf();
}

function orderByDateDescending(left: Post, right: Post): number {
  return right.data.date.valueOf() - left.data.date.valueOf();
}

function addPostDateToSlug(post: Post) {
  const match = post.id.match(/^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})-(?<slug>.*)\.mdx?/);
  if (match && match.groups) {
    const { year, month, slug } = match.groups;
    // @ts-ignore: The `slug` type is an enum of literals taken from the files,
    // but we want to dynamically override it here to make the slug consistent
    // everywhere.
    post.slug = `${year}/${month}/${slug}`;
  } else {
    throw new Error(`Post ID ${post.id} does not have expected format.`);
  }
}

export default async function getPosts(dateOrdering: DateOrdering = "asc"): Promise<Post[]> {
  const sorter = dateOrdering == "asc" ? orderByDateAscending : orderByDateDescending;
  const posts = await getCollection("blog");
  posts.forEach(addPostDateToSlug);
  return posts.sort(sorter);
}
