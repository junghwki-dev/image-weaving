import React, { useEffect, useRef, useState } from "react";
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
    width: 280px;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSlices, setImageSlices] = useState<string[]>([]);
  const [editorState, setEditorState] = useState<EditorState>({
    numSplits: 1,
    scale: 1,
    horizontalRepeat: 1,
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    const numValue = parseFloat(value);
    setEditorState((prev) => ({
      ...prev,
      [id]: numValue > 0 ? numValue : 1,
    }));
  };

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

  const splitImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.src = URL.createObjectURL(imageFile);

    await new Promise<void>((resolve) => {
      img.onload = () => {
        const { scale, numSplits } = editorState;
        const scaledWidth = img.width * scale;
        const sliceWidth = Math.floor(scaledWidth / numSplits);

        const { canvas: mainCanvas, ctx } = createCanvas(
          scaledWidth,
          img.height
        );
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, scaledWidth, img.height);

        const slices = Array.from({ length: numSplits }, (_, i) => {
          const { canvas: sliceCanvas, ctx: sliceCtx } = createCanvas(
            sliceWidth,
            img.height
          );
          if (!sliceCtx) return "";

          sliceCtx.drawImage(
            mainCanvas,
            i * sliceWidth,
            0,
            sliceWidth,
            img.height,
            0,
            0,
            sliceWidth,
            img.height
          );
          return sliceCanvas.toDataURL();
        });

        setImageSlices(slices.filter(Boolean));
        resolve();
      };
    });
  };

  const mergeAndDownload = async () => {
    if (imageSlices.length === 0) return;

    const firstImage = new Image();
    firstImage.src = imageSlices[0];

    await new Promise<void>((resolve) => {
      firstImage.onload = async () => {
        const { width: sliceWidth, height: sliceHeight } = firstImage;
        const totalHeight = sliceHeight * imageSlices.length;

        // 세로 병합
        const { canvas: verticalCanvas, ctx: verticalCtx } = createCanvas(
          sliceWidth,
          totalHeight
        );
        if (!verticalCtx) return;

        await Promise.all(
          imageSlices.map(async (slice, i) => {
            const img = new Image();
            img.src = slice;
            await new Promise<void>((resolve) => {
              img.onload = () => {
                verticalCtx.save();
                if (i % 2 === 1) {
                  verticalCtx.translate(0, (i + 1) * sliceHeight);
                  verticalCtx.scale(1, -1);
                  verticalCtx.drawImage(img, 0, 0, sliceWidth, sliceHeight);
                } else {
                  verticalCtx.drawImage(
                    img,
                    0,
                    i * sliceHeight,
                    sliceWidth,
                    sliceHeight
                  );
                }
                verticalCtx.restore();
                resolve();
              };
            });
          })
        );

        // 가로 반복
        const { canvas: finalCanvas, ctx: finalCtx } = createCanvas(
          sliceWidth * editorState.horizontalRepeat,
          totalHeight
        );
        if (!finalCtx) return;

        Array.from({ length: editorState.horizontalRepeat }).forEach((_, i) => {
          finalCtx.drawImage(verticalCanvas, i * sliceWidth, 0);
        });

        const link = document.createElement("a");
        link.href = finalCanvas.toDataURL("image/png");
        link.download = "merged_repeated_image.png";
        link.click();
        resolve();
      };
    });
  };

  useEffect(() => {
    splitImage();
  }, [imageFile, editorState.scale, editorState.numSplits]);

  const inputFields = [
    { id: "scale", label: "Scale (Multiplier)" },
    { id: "numSplits", label: "Number of Splits" },
    { id: "horizontalRepeat", label: "Horizontal Repeat Count" },
  ];

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} />
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
              placeholder={`Enter ${id}`}
            />
          </InputContainer>
        ))}
      </Container>
      <DownloadButton onClick={mergeAndDownload}>Download</DownloadButton>
      {/* 
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {imageSlices.map((slice, index) => (
          <div key={index} style={{ textAlign: "center" }}>
            <img src={slice} alt={`Slice ${index + 1}`} />
            <p>Slice {index + 1}</p>
          </div>
        ))}
      </div> */}
    </>
  );
};

export default ImageEditor;
