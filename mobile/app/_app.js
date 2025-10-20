// app/_app.js
import AppProvider from "../src/context/AppContext";

export default function AppLayout({ children }) {
  return <AppProvider>{children}</AppProvider>;
}
