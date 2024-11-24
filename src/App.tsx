import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Container from "./components/Container";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />}>
          <Route index element={<Navigate to="editor" replace />} />
          <Route index path="editor" element={<Container />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
