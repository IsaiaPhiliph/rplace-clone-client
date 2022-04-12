import Panzoom from "panzoom";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useLocalStorageValue } from "@mantine/hooks";

import "./App.css";

const width = 1024;
const height = 1024;
// const socketUrl = "ws://localhost:8080";
const socketUrl = "wss://isaiaphiliph.com/";
// const imageUrl = "http://localhost:8080/place.png";
const imageUrl = "https://isaiaphiliph.com/place.png";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateRandomInteger(max: number) {
  return Math.floor(Math.random() * max) + 1;
}

function App() {
  const [socket, setSocket] = useState<Socket>();

  const connectToSocket = () => {
    const socket = io(socketUrl, {
      reconnection: false,
    });

    socket.on("connect", () => {
      console.log("Socket connected", socket);
      setSocket(socket);
    });

    socket.on("disconnect", (reason) => {
      console.error("Socket disconected, reason: ", reason);
      setSocket(undefined);
      alert("Socket disconected, reason: " + reason);
    });

    socket.on("connect_error", (error) => {
      console.log("Error connecting to socket: ", error);
      setSocket(undefined);
      alert("Error connecting to socket");
    });
    return socket;
  };

  useEffect(() => {
    const socket = connectToSocket();
    return () => {
      socket.removeAllListeners("connect");
      socket.removeAllListeners("disconnect");
      socket.removeAllListeners("connect_error");
    };
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>();
  const [color, setColor] = useLocalStorageValue({
    key: "color-selected",
    defaultValue: { r: 0, g: 0, b: 0 },
  });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const ref = useRef<HTMLDivElement | null>(null);
  const canvasWrapper = useRef<HTMLDivElement>(null);

  const setPixel = useCallback(
    (
      x: number,
      y: number,
      color: { r: number; g: number; b: number },
      emit = false
    ) => {
      if (ctx && socket) {
        ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},255)`;
        ctx.fillRect(x, y, 1, 1);
        // const data = ctx.getImageData(0, 0, width, height).data;
        // setPixelArray(data);
        if (emit) {
          socket.emit("pixel", [x, y, color.r, color.g, color.b]);
        }
      }
    },
    [ctx, socket]
  );

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  function rgbToHex(r: number, g: number, b: number) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  useEffect(() => {
    if (socket) {
      socket.on("pixel", (pixel) => {
        const [x, y, r, g, b] = pixel;
        setPixel(x, y, { r, g, b });
      });
    }
  }, [socket, setPixel]);

  useEffect(() => {
    const img = new Image(width, height);
    img.src = imageUrl;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
    };
  }, [ctx, socket]);

  useEffect(() => {
    const div = ref.current;
    if (div) {
      const panzoom = Panzoom(div);
      panzoom.moveTo(
        window.innerWidth / 2 - width / 2,
        window.innerHeight / 2 - height / 2
      );

      return () => {
        panzoom.dispose();
      };
    }
  }, [socket]);

  const testLoop = async () => {
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        await sleep(100);
        const x = generateRandomInteger(1023);
        const y = generateRandomInteger(1023);
        setPixel(x, y, { r: 0, g: 0, b: 0 }, true);
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = canvasWrapper.current;
    if (canvas && wrapper) {
      const ctx = canvas.getContext("2d");

      setCtx(ctx);
      const listener = (ev: MouseEvent) => {
        ev.preventDefault();
        console.log(ev.button);

        console.log(ev.offsetX, ev.offsetY);
        const [x, y] = [ev.offsetX - 1, ev.offsetY - 1];
        setPixel(x, y, color, true);
      };
      const copyColor = (ev: MouseEvent) => {
        ev.preventDefault();

        if (ctx) {
          if (ev.button === 2) {
            const [x, y] = [ev.offsetX - 1, ev.offsetY - 1];
            const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
            setColor({ r, g, b });
          }
        }
      };
      const setCursor = (ev: MouseEvent) => {
        const [x, y] = [ev.offsetX - 1, ev.offsetY - 1];
        setCursorPos({ x, y });
      };

      wrapper.addEventListener("click", listener);
      wrapper.addEventListener("contextmenu", copyColor);
      wrapper.addEventListener("mousemove", setCursor);
      return () => {
        wrapper.removeEventListener("click", listener);
        wrapper.removeEventListener("contextmenu", copyColor);
        wrapper.removeEventListener("mousemove", setCursor);
      };
    }
  }, [color, setColor, setPixel]);

  return (
    <div className="App">
      {!socket && (
        <div>
          Not connected
          <button
            onClick={() => {
              const socket = connectToSocket();
              setSocket(socket);
            }}
          >
            Reconnect
          </button>
        </div>
      )}
      {socket && (
        <>
          <div className="min-h-screen overflow-hidden bg-gray-100">
            <div className="w-max" ref={ref}>
              <div style={{ padding: 0.5 }} ref={canvasWrapper}>
                <canvas
                  id="canvas"
                  width={width}
                  height={height}
                  className="canvas"
                  ref={canvasRef}
                >
                  Canvas not supported on your browser.
                </canvas>
              </div>
            </div>
          </div>
          <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-4 py-2 bg-gray-200">
            <label className="flex flex-col">
              <span>Color</span>

              <input
                type="color"
                className="bg-gray-200"
                value={rgbToHex(color.r, color.g, color.b)}
                onChange={(hex) => {
                  const rgb = hexToRgb(hex.target.value);
                  if (rgb) {
                    setColor(rgb);
                  }
                }}
              />
            </label>
            <button onClick={testLoop}>Test</button>
            <div className="flex flex-col">
              <div className="font-bold">Cursor position</div>
              <div>
                <span className="font-bold">X:</span> {cursorPos.x}{" "}
                <span className="font-bold">Y:</span> {cursorPos.y}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
