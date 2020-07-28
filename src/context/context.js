import React, { useState, useEffect, createContext } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFoollowers] = useState(mockFollowers);
  const [requests, setRequestes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  //Error
  const [error, setError] = useState({ show: false, msg: "" });

  // Search github user
  const searchGithubUser = async (user) => {
    toggleError();
    setIsLoading(true);
    const res = await axios(`${rootUrl}/users/${user}`).catch(() => {
      toggleError(true, "There is no result with this username");
    });
    if (res) {
      setGithubUser(res.data);
      const { login, followers_url } = res.data;
      console.log(login, followers_url);

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ])
        .then((result) => {
          const [repos, followers] = result;
          setRepos(repos.value.data);
          setFoollowers(followers.value.data);
        })
        .catch((err) => console.log(err));
    }
    checkRequest();
    setIsLoading(false);
  };

  // Check rate
  const checkRequest = async () => {
    const { data } = await axios(`${rootUrl}/rate_limit`);
    let { remaining } = data.rate;
    try {
      // remaining = 0;
      setRequestes(remaining);
      if (remaining === 0) {
        //throw err
        toggleError(true, "Sorry, you have succeeded hourly requests!");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Error handelar
  const toggleError = (show = false, msg = "") => {
    setError({ show, msg });
  };

  useEffect(() => {
    checkRequest();
  }, []);
  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading,
      }}>
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
