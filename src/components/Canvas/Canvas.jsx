import { useRef, useEffect, useState } from 'react';
import "./Canvas.css";
import { Stage, Layer } from 'react-konva';
import GraphNodes from './GraphNodes';
import '../../services/api'
import GraphUploader from '../../services/api';

const Canvas = () => {
  const stageRef = useRef(null);
  const wrapperRef = useRef(null);
  const scrollInterval = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const updateDimensions = () => {
    if (wrapperRef.current) {
      const wrapper = wrapperRef.current;
      setDimensions({
        width: wrapper.clientWidth * 0.9,
        height: wrapper.clientHeight * 0.8,
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(updateDimensions, 0);

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }

    window.addEventListener('resize', updateDimensions);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.05;
    const handleWheel = (e) => {
      e.evt.preventDefault();
      const direction = e.evt.deltaY < 0 ? -1 : 1;
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

    return () => {
      stage.off("wheel", handleWheel);
      clearInterval(scrollInterval.current);
    };
  }, []);

  const handleDragStart = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    scrollInterval.current = setInterval(() => {
      const pos = stage.getPointerPosition();
      if (!pos) return;

      const target = e.target;
      const offset = 100;
      const delta = 2;

      if (pos.x < offset) {
        stage.x(stage.x() + delta);
        target.x(target.x() - delta);
      }
      if (pos.x > stage.width() - offset) {
        stage.x(stage.x() - delta);
        target.x(target.x() + delta);
      }
      if (pos.y < offset) {
        stage.y(stage.y() + delta);
        target.y(target.y() - delta);
      }
      if (pos.y > stage.height() - offset) {
        stage.y(stage.y() - delta);
        target.y(target.y() + delta);
      }

      stage.batchDraw();
    }, 16);
  };

  const handleDragEnd = () => {
    clearInterval(scrollInterval.current);
    scrollInterval.current = null;
  };

  return (
    <div className="canvas-wrapper" ref={wrapperRef}>
      <Stage
        ref={stageRef}
        className="stage"
        width={dimensions.width}
        height={dimensions.height}
        draggable
      >
        <Layer>
          <GraphUploader/>
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;