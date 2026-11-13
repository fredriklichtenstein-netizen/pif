import { createContext, useContext } from "react";

/**
 * True for a completed/archived post: its comments stay readable, but no new
 * comments, replies or comment likes (RLS rejects them too). Set once at the
 * card instead of threaded through every comment component.
 */
export const CommentsReadOnlyContext = createContext(false);

export const useCommentsReadOnly = () => useContext(CommentsReadOnlyContext);
