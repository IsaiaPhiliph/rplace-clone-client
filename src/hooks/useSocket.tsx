import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { socketUrl } from "../config";

const useSocket = () => {
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
  return { socket, setSocket, connectToSocket };
};

export default useSocket;
