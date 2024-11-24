import React, { useState } from "react";
import styled from "styled-components";

interface ImageEditorProps {
  imageFile: File;
}

interface EditorState {
  numSplits: number;
  scale: number;
  horizontalRepeat: number;
}

const Container = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 12px;
  border-top: 2px solid black;
  border-bottom: 2px solid black;
  padding-top: 32px;
  padding-bottom: 32px;
  margin: 24px auto;
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  > label {
    font-size: 20px;
    margin-top: 4px;
    width: 260px;
  }
  > input {
    width: 96px;
    font-size: 20px;
    padding: 12px;
    border: transparent;
    text-align: center;
    border-bottom: 2px solid black;
  }
`;

const DownloadButton = styled.button`
  width: 320px;
  height: 64px;
  margin: 24px auto 0;
  font-size: 16px;
  border: 2px solid black;
  border-radius: 2px;
  color: black;
  background-color: white;
  &:hover {
    cursor: pointer;
    background-color: black;
    color: white;
  }
`;

const ImageEditor = ({ imageFile }: ImageEditorProps) => {
  const [editorState, setEditorState] = useState<EditorState>({
    scale: 6,
    numSplits: 1,
    horizontalRepeat: 1,
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    const numValue = parseFloat(value);
    setEditorState((prev) => ({
      ...prev,
      // [id]: numValue,
      [id]: numValue > 0 ? numValue : 1,
    }));
  };

  // 캔버스 생성 유틸리티
  const createCanvas = (width: number, height: number) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    if (ctx) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
    }
    return { canvas, ctx };
  };

  const processAndDownload = async () => {
    try {
      // 원본 이미지 로드
      const img = new Image();
      img.src = URL.createObjectURL(imageFile);

      await new Promise<void>((resolve) => {
        img.onload = async () => {
          const { scale, numSplits } = editorState;
          const scaledWidth = img.width * scale;
          const sliceWidth = Math.floor(scaledWidth / numSplits);

          // 1. 스케일링된 이미지 생성
          const { canvas: scaledCanvas, ctx: scaledCtx } = createCanvas(
            scaledWidth,
            img.height
          );
          if (!scaledCtx) return;
          scaledCtx.drawImage(img, 0, 0, scaledWidth, img.height);

          // 2. 이미지 분할
          const slices: string[] = [];
          for (let i = 0; i < numSplits; i++) {
            const { canvas: sliceCanvas, ctx: sliceCtx } = createCanvas(
              sliceWidth,
              img.height
            );
            if (!sliceCtx) continue;

            sliceCtx.drawImage(
              scaledCanvas,
              i * sliceWidth,
              0,
              sliceWidth,
              img.height,
              0,
              0,
              sliceWidth,
              img.height
            );
            slices.push(sliceCanvas.toDataURL());
          }

          // 3. 세로 병합
          const totalHeight = img.height * slices.length;
          const { canvas: verticalCanvas, ctx: verticalCtx } = createCanvas(
            sliceWidth,
            totalHeight
          );
          if (!verticalCtx) return;

          // 각 슬라이스를 세로로 병합
          await Promise.all(
            slices.map(async (slice, i) => {
              const sliceImg = new Image();
              sliceImg.src = slice;
              await new Promise<void>((resolve) => {
                sliceImg.onload = () => {
                  verticalCtx.save();
                  if (i % 2 === 1) {
                    // 짝수 번째 이미지 반전
                    verticalCtx.translate(0, (i + 1) * img.height);
                    verticalCtx.scale(1, -1);
                    verticalCtx.drawImage(sliceImg, 0, 0);
                  } else {
                    verticalCtx.drawImage(sliceImg, 0, i * img.height);
                  }
                  verticalCtx.restore();
                  resolve();
                };
              });
            })
          );

          // 4. 가로 반복
          const { canvas: finalCanvas, ctx: finalCtx } = createCanvas(
            sliceWidth * editorState.horizontalRepeat,
            totalHeight
          );
          if (!finalCtx) return;

          // 병합된 이미지를 가로로 반복
          for (let i = 0; i < editorState.horizontalRepeat; i++) {
            finalCtx.drawImage(verticalCanvas, i * sliceWidth, 0);
          }

          // 5. 다운로드
          const link = document.createElement("a");
          link.href = finalCanvas.toDataURL("image/png");
          link.download = "image.png";
          link.click();

          resolve();
        };
      });
    } catch (error) {
      console.error("Error processing image:", error);
    }
  };

  const inputFields = [
    { id: "scale", label: "Scale (Multiplier)" },
    { id: "numSplits", label: "Number of Splits" },
    { id: "horizontalRepeat", label: "Horizontal Repeat Count" },
  ];

  return (
    <>
      <Container>
        {inputFields.map(({ id, label }) => (
          <InputContainer key={id}>
            <label htmlFor={id}>{label}:</label>
            <input
              id={id}
              type="number"
              value={editorState[id as keyof EditorState]}
              onChange={handleInputChange}
              min="1"
              placeholder={`${id}`}
            />
          </InputContainer>
        ))}
      </Container>
      <DownloadButton onClick={processAndDownload}>Download</DownloadButton>
    </>
  );
};

export default ImageEditor;
