export function addCommentToTop(comments, comment) {
  return [comment, ...comments.filter((item) => item.id !== comment.id)];
}

export function replaceComment(comments, updatedComment) {
  return comments.map((comment) => (comment.id === updatedComment.id ? updatedComment : comment));
}

export function removeComment(comments, commentId) {
  return comments.filter((comment) => comment.id !== commentId);
}
