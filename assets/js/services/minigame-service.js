import { getCurrentUser, patchRecord, store } from "../state.js";
import { getFirebaseServices, isFirebaseReady } from "../firebase-config.js";
import { cryptoRandomInt } from "../utils/security.js";

function assertReadyToPlay(choice, betAmount) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error("Bạn cần đăng nhập để chơi.");
  }
  const config = store.getState().settings.global.minigameConfig;
  const bet = Number(betAmount || 0);
  if (!["tai", "xiu"].includes(choice)) {
    throw new Error("Lựa chọn chưa hợp lệ.");
  }
  if (!Number.isFinite(bet) || bet < config.minBet || bet > config.maxBet) {
    throw new Error(`Cược phải từ ${config.minBet} đến ${config.maxBet} Coin.`);
  }
  if (currentUser.coin < bet) {
    throw new Error("Coin hiện tại không đủ.");
  }
  const expiresAt = store.getState().minigame.cooldowns[currentUser.id] || 0;
  if (Date.now() < expiresAt) {
    throw new Error("Bạn đang trong cooldown, chờ một chút rồi chơi tiếp.");
  }
  return {
    currentUser,
    config,
    bet
  };
}

function rollDice() {
  return [1 + cryptoRandomInt(6), 1 + cryptoRandomInt(6), 1 + cryptoRandomInt(6)];
}

export function getMinigameHistory(source = store.getState()) {
  return source.minigame.history.slice(0, 10);
}

export async function playTaixiu({ choice, betAmount }) {
  const { currentUser, config, bet } = assertReadyToPlay(choice, betAmount);
  if (isFirebaseReady()) {
    const { functions } = getFirebaseServices();
    const callable = functions.httpsCallable("playTaixiu");
    const response = await callable({ choice, betAmount: bet });
    const result = response.data;
    patchRecord("users", currentUser.id, {
      coin: result.currentCoin,
      updatedAt: new Date().toISOString()
    });
    store.update((state) => ({
      ...state,
      minigame: {
        history: [result.play, ...state.minigame.history].slice(0, 10),
        cooldowns: {
          ...state.minigame.cooldowns,
          [currentUser.id]: Date.now() + config.cooldownMs
        }
      }
    }));
    return result;
  }
  const dice = rollDice();
  const total = dice.reduce((sum, value) => sum + value, 0);
  const outcome = total >= 11 ? "tai" : "xiu";
  const win = outcome === choice;
  const delta = win ? Math.round(bet * (config.payout - 1)) : -bet;
  const play = {
    uid: currentUser.id,
    username: currentUser.username,
    choice,
    outcome,
    dice,
    total,
    delta,
    createdAt: new Date().toISOString()
  };
  patchRecord("users", currentUser.id, {
    coin: Number(currentUser.coin || 0) + delta,
    updatedAt: new Date().toISOString()
  });
  store.update((state) => ({
    ...state,
    minigame: {
      history: [play, ...state.minigame.history].slice(0, 10),
      cooldowns: {
        ...state.minigame.cooldowns,
        [currentUser.id]: Date.now() + config.cooldownMs
      }
    }
  }));
  return {
    play,
    currentCoin: Number(currentUser.coin || 0) + delta
  };
}
