import React, { useCallback, useState } from "react";

const PostsContext = React.createContext({});
export default PostsContext;

export const PostsProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [noMorePosts, setNoMorePosts] = useState(false);

  const setPostsFromSSR = useCallback((postsFromSSR = []) => {
    setPosts((value) => {
      const newPosts = [...value];
      postsFromSSR.forEach((post) => {
        const exist = newPosts.find((e) => e._id === post._id);
        if (!exist) {
          newPosts.push(post);
        }
      });
      return newPosts;
    });
  }, []);

  const getPosts = useCallback(async (lastPostDate, getNewerPosts = false) => {
    const result = await fetch("/api/getPosts", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ lastPostDate, getNewerPosts }),
    });

    const json = await result.json();
    const getPostsResults = json.posts || [];
    if (getPostsResults.length < 5) {
      setNoMorePosts(true);
    }
    setPosts((value) => {
      const newPosts = [...value];
      getPostsResults.forEach((post) => {
        const exist = newPosts.find((e) => e._id === post._id);
        if (!exist) {
          newPosts.push(post);
        }
      });
      return newPosts;
    });
  }, []);

  return (
    <PostsContext.Provider
      value={{ posts, setPostsFromSSR, getPosts, noMorePosts }}>
      {children}
    </PostsContext.Provider>
  );
};
