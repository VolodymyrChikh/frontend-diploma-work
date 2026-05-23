export function removePostFromFeed(posts, postId) {
  return posts.filter((post) => post.id !== postId);
}

export function updatePostInFeed(posts, updatedPost) {
  return posts.map((post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post));
}
