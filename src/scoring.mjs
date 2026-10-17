export function initialScore(doubles = true) { return { points: [0, 0], serving: 0, server: doubles ? 2 : 1, winner: null }; }
export function rally(state, team, target = 11, doubles = true) {
  if (state.winner !== null) return state;
  const next = { ...state, points: [...state.points] };
  if (team === state.serving) next.points[team]++;
  else if (doubles && state.server === 1) next.server = 2;
  else { next.serving = 1 - state.serving; next.server = 1; }
  if (next.points[team] >= target && next.points[team] - next.points[1-team] >= 2) next.winner = team;
  return next;
}
