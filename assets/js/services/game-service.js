import { patchRecord, store, upsertRecord } from "../state.js";
import { getFirebaseServices, isFirebaseReady } from "../firebase-config.js";

let gamesUnsubscribe = null;

function replaceGames(games) {
  store.update((current) => ({
    ...current,
    games
  }));
}

export function startGamesStream() {
  if (!isFirebaseReady() || gamesUnsubscribe) {
    return;
  }
  const { db } = getFirebaseServices();
  gamesUnsubscribe = db.collection("games").onSnapshot((snapshot) => {
    const games = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    replaceGames(games);
  });
}

export function getGameBySlug(slug, source = store.getState()) {
  return source.games.find((game) => game.slug === slug) || null;
}

export function getHomeGameSlices(source = store.getState()) {
  const newest = [...source.games].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
  const hottest = [...source.games].sort((a, b) => b.views - a.views).slice(0, 3);
  return {
    newest,
    hottest
  };
}

export function filterGames(filters = {}, source = store.getState()) {
  const query = (filters.query || "").trim().toLowerCase();
  const genre = filters.genre || "all";
  const platform = filters.platform || "all";
  const access = filters.access || "all";
  const mature = filters.mature || "all";
  const sort = filters.sort || "newest";
  let list = [...source.games];
  if (query) {
    list = list.filter((game) => [game.title, game.author, game.genre, game.desc, ...(game.tags || [])].join(" ").toLowerCase().includes(query));
  }
  if (genre !== "all") {
    list = list.filter((game) => game.genre.toLowerCase().includes(genre.toLowerCase()));
  }
  if (platform !== "all") {
    list = list.filter((game) => game.platform.toLowerCase().includes(platform.toLowerCase()));
  }
  if (access === "free") {
    list = list.filter((game) => game.isFreeLink);
  }
  if (access === "vip") {
    list = list.filter((game) => !game.isFreeLink);
  }
  if (mature === "hide") {
    list = list.filter((game) => !game.is18);
  }
  if (sort === "views") {
    list.sort((a, b) => b.views - a.views);
  } else if (sort === "name") {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return list;
}

export async function incrementGameView(gameId) {
  const game = store.getState().games.find((item) => item.id === gameId);
  if (!game) {
    return;
  }
  if (isFirebaseReady()) {
    const { db } = getFirebaseServices();
    await db.collection("games").doc(gameId).set({
      views: firebase.firestore.FieldValue.increment(1),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return;
  }
  patchRecord("games", gameId, {
    views: Number(game.views || 0) + 1,
    updatedAt: new Date().toISOString()
  });
}

export function saveGameLocally(game) {
  upsertRecord("games", game);
}
