import React, { useState } from "react";
import ImageUpload from "./ImageUpload";
import ImageEditor from "./ImageEditor";
import styled from "styled-components";

const ContainerStyle = styled.div`
  width: 640px;
  padding: 40px;
  margin: 120px auto;
  border-radius: 4px;
  text-align: center;
  border: 2px solid black;
  overflow: hidden;
`;

const Container = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);

  return (
    <ContainerStyle>
      <ImageUpload onImageUpload={setImageFile} />
      {imageFile && <ImageEditor imageFile={imageFile} />}
    </ContainerStyle>
  );
};

export default Container;
