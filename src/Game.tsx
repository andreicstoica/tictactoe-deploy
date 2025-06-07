import { useEffect, useRef, useState, type JSX } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { io } from "socket.io-client";

import { Howl, Howler } from "howler";
import { useSpring, animated } from "@react-spring/web";
import clsx from "clsx";

import type { Game, Player, CellCoord, EndState } from "./gameEngine";
import { findBestMove } from "./gameEngine";

import { ClientTicTacToe } from "./api";
import { SERVER_URL } from "./constants";

const centerStyle = "flex flex-col items-center justify-center";
const hoverStyle =
  "hover:bg-gray-200 hover:shadow-[inset_1px_1px_10px_0px_#ffa1ad,inset_-1px_-1px_10px_0px_#ffa1ad]";

Howler.volume(0.75);
const clickSound = new Howl({
  src: ["/assets/click.wav"],
  html5: true,
  preload: true,
});
const victorySound = new Howl({
  src: ["/assets/victory.mp3"],
  html5: true,
  preload: true,
});

const api = new ClientTicTacToe();
const cellStyle =
  "outline outline-3 outline-zinc-500 bg-zinc-100 active:bg-zinc-300 font-[amarante] w-40 h-40 text-7xl";
const cardStyle =
  "p-4 border border-2 shadow-lg/100 shadow-black text-xl font-bold bg-zinc-100";
const buttonStyle =
  "py-3 px-4 text-xl font-medium shadow-md/100 shadow-zinc-500 bg-white border-2 border-r-5 border-b-5 border-zinc-black hover:cursor-pointer hover:border-r-2 hover:border-b-2 hover:bg-zinc-100 focus:text-amber-600 focus:bg-zinc-300";

export function Game() {
  const { foundGame: foundGame } = useLoaderData<{ foundGame: Game }>();
  const [game, setGame] = useState<Game>(foundGame);
  const [aiAllowed, setAiAllowed] = useState<boolean>(false);
  const navigate = useNavigate();
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const socket = io(SERVER_URL);

    // tell the server connection listener that we've connected, and emitted a game.id to join a room at
    socket.on("connect", () => {
      socket.emit("join-game", game.id);
    });

    // listener for server telling us the game has updated
    socket.on("game-updated", (updatedGame) => setGame(updatedGame));

    // play win sound iff endState = x || o
    if (game.endState === "x" || game.endState === "o") victorySound.play();

    intervalId.current = setInterval(() => setAiAllowed(true), 5000);

    // useEffect cleaner function
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }

      // leave the game.id room and disconnect from socket
      socket.off("game-updated", () => setGame(game));
      socket.disconnect();
    };
  }, [game, game.id, game.endState]); // if game.id or endState somehow changes, update useEffect

  async function handleClick(coords: CellCoord) {
    clickSound.play();
    setAiAllowed(false);
    if (!game.endState) {
      const newGame = await api.makeMove(game!.id, coords);
      setGame(newGame);
    }
  }

  if (!game) {
    return (
      <div className={clsx(centerStyle, "text-[amarante] text-6xl")}>
        Loading...
      </div>
    );
  }

  return (
    <div className={clsx(centerStyle, "gap-6")}>
      <div className={clsx(cardStyle, "flex flex-col items-center mt-4 mb-4")}>
        <div className="text-2xl font-bold">Game: {game.name}</div>
        <Turn currentPlayer={game.currentPlayer} endState={game.endState} />
        <br></br>
      </div>

      <div className={clsx("flex justify-center shadow-md")}>
        {game.board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-col">
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                className={clsx(
                  centerStyle,
                  hoverStyle,
                  cellStyle,
                  { "text-emerald-500": cell === "x" },
                  { "text-red-500": cell === "o" },
                  { "hover:cursor-not-allowed": cell || game.endState },
                  { "hover:cursor-pointer": cell === null }
                )}
                onClick={() => {
                  handleClick({ row: rowIndex, col: colIndex });
                }}
              >
                <TicTacToeCell cell={cell} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <AiButton aiAllowed={aiAllowed} game={game} handleClick={handleClick} />
      <GameOver endState={game.endState} onRestart={() => navigate(`/`)} />
    </div>
  );
}

interface AiButtonProp {
  aiAllowed: boolean;
  game: Game;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  handleClick: Function;
}

function AiButton({ aiAllowed, game, handleClick }: AiButtonProp) {
  const bestMove: CellCoord = findBestMove(game);

  return (
    <button
      onClick={() => handleClick(bestMove)}
      className={clsx(buttonStyle, {
        invisible: aiAllowed === false,
        hidden: game.endState,
      })}
    >
      Let computer make the next move?
    </button>
  );
}

interface CellProp {
  cell: "x" | "o" | null;
}

function TicTacToeCell({ cell }: CellProp) {
  const slamSprings = useSpring(
    cell
      ? {
          from: { scale: 1.5 },
          to: { scale: 1 },
          config: { mass: 3, friction: 20, tension: 500 },
        }
      : {}
  );

  return (
    <animated.div style={slamSprings}>
      {cell ? cell.toUpperCase() : ""}
    </animated.div>
  );
}

interface TurnProps {
  currentPlayer: Player;
  endState: EndState;
}

function Turn({ currentPlayer, endState }: TurnProps) {
  const turnStyle = clsx(
    { "text-emerald-500": currentPlayer === "x" },
    { "text-red-500": currentPlayer === "o" },
    "font-[amarante]"
  );
  if (!endState)
    return (
      <div className="text-xl font-semibold">
        Player turn:{" "}
        <span className={turnStyle}>{currentPlayer.toUpperCase()}</span>
      </div>
    );
}

interface GameOverProps {
  endState: EndState;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  onRestart: Function;
}

function GameOver({ endState, onRestart }: GameOverProps) {
  let message: JSX.Element | null = null;
  const winnerStyle = clsx(
    { "text-emerald-500": endState === "x" },
    { "text-red-500": endState === "o" },
    "font-[amarante] text-xl"
  );

  if (!endState) return null;
  if (endState === "tie") {
    message = <div>Wow, what an exciting matchup! The game ends in a tie.</div>;
  } else {
    // If endState is 'x' or 'o', construct JSX for the winner message
    message = (
      <div>
        Congrats player{" "}
        <span className={winnerStyle}>{endState.toUpperCase()}</span>! Player{" "}
        <span className={winnerStyle}>{endState.toUpperCase()}</span> wins!
      </div>
    );
  }

  const winnerElement = <div className="text-2xl font-bold">{message}</div>;

  return (
    <div className="flex flex-col items-center">
      {winnerElement}
      <button
        onClick={() => onRestart()}
        className={clsx(buttonStyle, "hover:cursor-pointer m-4 -rotate-8")}
      >
        <span className="animate-pulse">Play Again?</span>
      </button>
    </div>
  );
}
