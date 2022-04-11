import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

interface Pixel {
  r: number;
  g: number;
  b: number;
}

const initial_width = 200;
const initial_height = 200;

const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min) + min);
};

const randomRGB = () => randomNumber(0, 256);

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(initial_width);
  const [height, setHeight] = useState(initial_height);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>();

  const getInitialArray = (width: number, height: number) => {
    const arr = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < arr.length; i += 4) {
      arr[i] = randomRGB();
      arr[i + 1] = randomRGB();
      arr[i + 2] = randomRGB();
      arr[i + 3] = 255;
    }
    return arr;
  };

  const [pixelArray, setPixelArray] = useState<Uint8ClampedArray>(
    getInitialArray(width, height)
  );

  const fillCanvasWithUInt8Array = useCallback(() => {
    if (ctx) {
      const img = new ImageData(pixelArray, width, height);
      ctx.putImageData(img, 0, 0);
    }
  }, [ctx, height, pixelArray, width]);

  useEffect(() => {
    if (ctx) {
      fillCanvasWithUInt8Array();
    }
  }, [ctx, fillCanvasWithUInt8Array]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas?.getContext("2d");
      setCtx(ctx);
      const listener = (ev: MouseEvent) => {
        const [x, y] = [ev.offsetX, ev.offsetY];
        console.log(pixelArray.length);
        console.log(x * y * 4);
        setPixelArray((prev) => {
          const next = [...prev];
          next[x * y * 4] = 255;
          next[x * y * 4 + 1] = 255;
          next[x * y * 4 + 2] = 255;
          next[x * y * 4 + 3] = 255;
          return new Uint8ClampedArray(next);
        });
      };
      canvas.addEventListener("click", listener);
    }
  }, [pixelArray]);

  const getNewPixelArray = () => {
    const newArray = getInitialArray(width, height);
    setPixelArray(newArray);
  };

  const clearCanvas = () => {
    if (ctx && canvasRef.current) {
      const { width, height } = canvasRef.current;
      ctx.clearRect(0, 0, width, height);
    }
  };

  const handleDrawRectangles = () => {
    if (ctx) {
      ctx.fillStyle = "rgb(200,0,0)";
      ctx.fillRect(10, 10, 50, 50);

      ctx.fillStyle = "rgba(0,0,200,0.5)";
      ctx.fillRect(30, 30, 50, 50);
    }
  };

  const handleDrawGrid = () => {
    if (ctx && canvasRef.current) {
      const { width, height } = canvasRef.current;
      for (let i = 0; i < width; i += 10) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(i, 0, 1, height);
      }
      for (let i = 0; i < height; i += 10) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, i, width, 1);
      }
    }
  };

  const drawTriangle = () => {
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(75, 50);
      ctx.lineTo(100, 75);
      ctx.lineTo(100, 25);
      ctx.fill();
    }
  };

  const drawFace = () => {
    if (ctx) {
      ctx.beginPath();
      ctx.arc(75, 75, 50, 0, Math.PI * 2, true); // Outer circle
      ctx.moveTo(110, 75);
      ctx.arc(75, 75, 35, 0, Math.PI, false); // Mouth (clockwise)
      ctx.moveTo(65, 65);
      ctx.arc(60, 65, 5, 0, Math.PI * 2, true); // Left eye
      ctx.moveTo(95, 65);
      ctx.arc(90, 65, 5, 0, Math.PI * 2, true); // Right eye
      ctx.stroke();
    }
  };

  const drawArcs = () => {
    if (ctx) {
      ctx.fillStyle = "rgb(0,0,0)";
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          const x = 25 + j * 50; // x coordinate
          const y = 25 + i * 50; // y coordinate
          const radius = 20; // Arc radius
          const startAngle = 0; // Starting point on circle
          const endAngle = Math.PI + (Math.PI * j) / 2; // End point on circle
          const counterclockwise = i % 2 !== 0; // clockwise or counterclockwise

          ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);

          if (i > 1) {
            ctx.fill();
          } else {
            ctx.stroke();
          }
        }
      }
    }
  };

  return (
    <div className="App">
      <div>
        <div>
          <label>
            Width
            <input
              type={"number"}
              value={width}
              onChange={(e) => setWidth(+e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Height
            <input
              type={"number"}
              value={height}
              onChange={(e) => setHeight(+e.target.value)}
            />
          </label>
        </div>
      </div>
      <div style={{ scale: 1.2 }}>
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
      <div>
        <button onClick={handleDrawRectangles}>Draw rectangles</button>
        <button onClick={handleDrawGrid}>Draw grid</button>
        <button onClick={drawTriangle}>Draw triangle</button>
        <button onClick={drawFace}>Draw face</button>
        <button onClick={drawArcs}>Draw arcs</button>
        <button onClick={clearCanvas}>Clear canvas</button>
        <button onClick={getNewPixelArray}>Get new pixel array</button>
        <button onClick={fillCanvasWithUInt8Array}>
          Fill canvas uint8 array
        </button>
      </div>
    </div>
  );
}

export default App;
