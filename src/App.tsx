import { useLocalStorageValue } from "@mantine/hooks";
import Panzoom from "panzoom";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { height, imageUrl, width } from "./config";
import useSocket from "./hooks/useSocket";
import { hexToRgb, rgbToHex } from "./utils";

//Used to fix scroll when pressing auxclick
document.body.onmousedown = (e) => {
  if (e.button === 1) {
    e.preventDefault();
    return false;
  }
};

function App() {
  const { socket, setSocket, connectToSocket } = useSocket();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const ref = useRef<HTMLDivElement | null>(null);

  const canvasWrapper = useRef<HTMLDivElement>(null);

  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>();

  const [color, setColor] = useLocalStorageValue({
    key: "color-selected",
    defaultValue: { r: 0, g: 0, b: 0 },
  });

  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

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
        if (emit) {
          socket.emit("pixel", [x, y, color.r, color.g, color.b]);
        }
      }
    },
    [ctx, socket]
  );

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
    const initialZoom = 2;
    if (div) {
      const panzoom = Panzoom(div, {
        zoomDoubleClickSpeed: 1,
        initialZoom: initialZoom,
      });
      panzoom.moveTo(
        window.innerWidth / 2 - (width / 2) * initialZoom,
        window.innerHeight / 2 - (height / 2) * initialZoom
      );

      return () => {
        panzoom.dispose();
      };
    }
  }, [socket]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = canvasWrapper.current;
    if (canvas && wrapper) {
      const ctx = canvas.getContext("2d");
      setCtx(ctx);

      const putPixel = (ev: MouseEvent) => {
        ev.preventDefault();
        if (ev.ctrlKey && ctx) {
          const [x, y] = [ev.offsetX - 1, ev.offsetY - 1];
          const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
          setColor({ r, g, b });
        } else {
          console.log(ev.offsetX, ev.offsetY);
          const [x, y] = [ev.offsetX - 1, ev.offsetY - 1];
          setPixel(x, y, color, true);
        }
      };

      const copyColor = (ev: MouseEvent) => {
        ev.preventDefault();
        if (ctx) {
          if (ev.button === 1) {
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

      wrapper.addEventListener("contextmenu", putPixel);
      wrapper.addEventListener("auxclick", copyColor);
      wrapper.addEventListener("mousemove", setCursor);
      return () => {
        wrapper.removeEventListener("contextmenu", putPixel);
        wrapper.removeEventListener("auxclick", copyColor);
        wrapper.removeEventListener("mousemove", setCursor);
      };
    }
  }, [color, setColor, setPixel]);

  return (
    <div className="App">
      {!socket && (
        <div className="flex flex-col items-center justify-center gap-2">
          <span>Not connected</span>
          <button
            className="px-8 py-2 border"
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
          <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-4 py-2 bg-gray-200 bg-opacity-50 backdrop-blur-sm ">
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
            <div className="flex items-center gap-4">
              <span className="text-lg font-medium">Controls</span>
              <div className="flex items-center gap-2">
                <svg
                  width="23"
                  height="42"
                  viewBox="0 0 23 42"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.4999 41C8.00642 41 1.01944 38.5238 1.01944 28.6191C1.01944 16.2381 0.0666756 10.5238 11.4999 10.5238"
                    stroke="black"
                  />
                  <path
                    d="M21.9805 22.9048C17.9293 24.3124 14.7539 24.9972 11.5 24.9685M1.01953 22.9048C5.15525 24.2501 8.36405 24.9407 11.5 24.9685M11.5 10.5238V24.9685"
                    stroke="black"
                  />
                  <path
                    d="M11.5001 10.5238C10.5473 5.7619 18.1694 6.71429 11.5001 1"
                    stroke="black"
                    strokeLinecap="round"
                  />
                  <path
                    d="M11.5001 41C14.9936 41 21.9806 38.5238 21.9806 28.6191C21.9806 16.2381 22.9333 10.5238 11.5001 10.5238"
                    stroke="black"
                  />
                  <rect
                    x="9"
                    y="14"
                    width="5"
                    height="8"
                    rx="2.5"
                    fill="black"
                  />
                </svg>
                Copy color
              </div>
              <div className="flex items-center gap-2">
                <svg
                  width="23"
                  height="42"
                  viewBox="0 0 23 42"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.4999 41C8.00642 41 1.01944 38.5238 1.01944 28.6191C1.01944 16.2381 0.0666756 10.5238 11.4999 10.5238"
                    stroke="black"
                  />
                  <path
                    d="M21.9805 22.9048C17.9293 24.3124 14.7539 24.9972 11.5 24.9685M1.01953 22.9048C5.15525 24.2501 8.36405 24.9407 11.5 24.9685M11.5 10.5238V24.9685"
                    stroke="black"
                  />
                  <path
                    d="M11.5001 10.5238C10.5473 5.7619 18.1694 6.71429 11.5001 1"
                    stroke="black"
                    strokeLinecap="round"
                  />
                  <path
                    d="M11.5001 41C14.9936 41 21.9806 38.5238 21.9806 28.6191C21.9806 16.2381 22.9333 10.5238 11.5001 10.5238"
                    stroke="black"
                  />
                  <path
                    d="M13.4055 21.9524V12.4286C20.0749 14.3333 19.1221 20.0476 19.1221 21L13.4055 21.9524Z"
                    fill="black"
                  />
                </svg>
                Place pixel
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-lg font-medium">Cursor position</div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold">X:</span>
                  <span className="text-sm font-light">{cursorPos.x}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold">Y:</span>
                  <span className="text-sm font-light">{cursorPos.y}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
