import { app } from "@/firebase/config";
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from "firebase/functions";

const functions = getFunctions(app);

// run mode

const mode = import.meta.env.VITE_MODE as "dev" | "prod";

if (mode === "dev") {
  console.log("dev mode: connecting function emulator");
  connectFunctionsEmulator(functions, "localhost", 8881);
}

export const addMessage = httpsCallable(functions, "addMessage");
console.log(functions);
