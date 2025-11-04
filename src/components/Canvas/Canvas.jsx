import React, { useRef, useEffect, useState } from 'react';
import "./Canvas.css";
import { Stage, Layer, Rect, Circle } from 'react-konva';

const Canvas = () => {
  const width = window.innerWidth * 0.9;
  const height = window.innerHeight * 0.7;
  const stageRef = useRef(null);
  const scrollInterval = useRef(null);
  const [cursor, setCursor] = useState("default");

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // ===== Cursor Handling =====
    stage.on("mousedown", (e) => {
      if (e.evt.button === 2) {
        setCursor("move");
      } else if (e.target.draggable()) {
        setCursor("grabbing");
      }
    });

    stage.on("mouseup", (e) => {
      const shape = stage.getIntersection(stage.getPointerPosition());
      if (shape && shape.draggable()) {
        setCursor("grab"); 
      } else {
        setCursor("default");
      }
    });

    stage.on("mouseover", (e) => {
      if (e.target.draggable()) {
        setCursor("grab");
      }
    });

    stage.on("mouseout", () => {
      setCursor("default");
    });

    const scaleBy = 1.05;
    const handleWheel = (e) => {
      e.evt.preventDefault();
      setCursor(e.evt.deltaY < 0 ? "zoom-in" : "zoom-out");
      setTimeout(() => setCursor("default"), 200);

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? 1 : -1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

      stage.scale({ x: newScale, y: newScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      stage.position(newPos);
      stage.batchDraw();
    };
    stage.on("wheel", handleWheel);

    const handleDragStart = (e) => {
      scrollInterval.current = setInterval(() => {
        const pos = stage.getPointerPosition();
        if (!pos) return;

        const target = e.target;
        const offset = 100;

        if (pos.x < offset) {
          stage.x(stage.x() + 2);
          target.x(target.x() - 2);
        }
        if (pos.x > stage.width() - offset) {
          stage.x(stage.x() - 2);
          target.x(target.x() + 2);
        }
        if (pos.y < offset) {
          stage.y(stage.y() + 2);
          target.y(target.y() - 2);
        }
        if (pos.y > stage.height() - offset) {
          stage.y(stage.y() - 2);
          target.y(target.y() + 2);
        }

        stage.batchDraw();
      }, 16);
    };

    const handleDragEnd = (e) => {
      clearInterval(scrollInterval.current);
      const shape = stage.getIntersection(stage.getPointerPosition());
      if (shape && shape.draggable()) {
        setCursor("grab");
      } else {
        setCursor("default");
      }
    };

    stage.on("dragstart", handleDragStart);
    stage.on("dragend", handleDragEnd);

    // ===== Cleanup =====
    return () => {
      stage.off("mousedown");
      stage.off("mouseup");
      stage.off("mouseover");
      stage.off("mouseout");
      stage.off("wheel", handleWheel);
      stage.off("dragstart", handleDragStart);
      stage.off("dragend", handleDragEnd);
      clearInterval(scrollInterval.current);
    };
  }, []);

  return (
    <div className="canvas-wrapper">
      <Stage
        ref={stageRef}
        className="stage"
        width={width}
        height={height}
        style={{ cursor }}
      >
        <Layer>
          <Rect
            x={20}
            y={50}
            width={100}
            height={100}
            fill="red"
            draggable
          />
          <Circle
            x={200}
            y={100}
            radius={50}
            fill="green"
            draggable
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;
