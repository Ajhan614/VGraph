import React, { useRef, useEffect, useState } from 'react';
import "./Canvas.css";
import { Stage, Layer, Rect, Circle } from 'react-konva';

const Canvas = () => {
  const stageRef = useRef(null);
  const scrollInterval = useRef(null);
  const [cursor, setCursor] = useState("default");
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth * 0.9,
    height: window.innerHeight * 0.7,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth *0.9,
        height: window.innerHeight * 0.7,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const setGrab = () => setCursor("grab");
    const setDefault = () => setCursor("default");
    const setGrabbing = () => setCursor("grabbing");

    stage.on("mouseenter", setGrab);
    stage.on("mouseleave", setDefault);
    stage.on("dragstart", setGrabbing);
    stage.on("dragend", setGrab);

    stage.on("mousedown", (e) => {
      if (e.evt.button === 2) setDefault();
    });

    const scaleBy = 1.05;
    const handleWheel = (e) => {
      e.evt.preventDefault();

      const direction = e.evt.deltaY < 0 ? -1 : 1;
      setCursor(direction < 0 ? "zoom-in" : "zoom-out");
      setTimeout(() => {
        const pos = stage.getPointerPosition();
        if (pos &&
            pos.x >= 0 && pos.y >= 0 &&
            pos.x <= stage.width() && pos.y <= stage.height()
        ) setGrab();
        else setDefault();
      }, 200);

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

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
      if (e.target.draggable()) {
        setCursor("grab");
      } else {
        setCursor("default");
      }
    };

    stage.on("dragstart", handleDragStart);
    stage.on("dragend", handleDragEnd);

    return () => {
      stage.off("mouseenter", setGrab);
      stage.off("mouseleave", setDefault);
      stage.off("dragstart", handleDragStart);
      stage.off("dragend", handleDragEnd);
      stage.off("mousedown");
      stage.off("wheel", handleWheel);
      clearInterval(scrollInterval.current);
    };
  }, []);

  return (
    <div className="canvas-wrapper">
      <Stage
        ref={stageRef}
        className="stage"
        width={dimensions.width}
        height={dimensions.height}
        style={{ cursor }}
        draggable
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