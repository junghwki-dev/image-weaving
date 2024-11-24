import React, { useState } from "react";
import styled from "styled-components";

const Preview = styled.img`
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  background-color: lightgray;
`;

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
}

const ImageUpload = ({ onImageUpload }: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  return (
    <div>
      {preview && <Preview src={preview} alt="uploaded-image" />}
      <input type="file" accept="image/*" onChange={handleFileChange} />
    </div>
  );
};

export default ImageUpload;
